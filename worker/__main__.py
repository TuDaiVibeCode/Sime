"""Sime AI worker entrypoint.

Consumes analysis jobs and live frames from Redis, runs the analysis, and reports
results back to the backend. Run from the repo root:

    python -m worker
"""
import json
import logging
import time

import redis as redis_lib

from . import config
from .io import get_redis, report_job
from .pipeline import process_job, process_live_frame

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("worker")


def ack_analysis_job(client: redis_lib.Redis, raw: str) -> None:
    client.lrem(config.ANALYSIS_PROCESSING_KEY, 1, raw)


def requeue_analysis_job(client: redis_lib.Redis, raw: str, reason: str) -> None:
    ack_analysis_job(client, raw)
    client.lpush(config.ANALYSIS_QUEUE_KEY, raw)
    log.warning("Requeued analysis job: %s", reason)
    time.sleep(config.CALLBACK_RETRY_SLEEP)


def restore_processing_queue(client: redis_lib.Redis) -> int:
    restored = 0
    while True:
        raw = client.rpoplpush(config.ANALYSIS_PROCESSING_KEY, config.ANALYSIS_QUEUE_KEY)
        if raw is None:
            return restored
        restored += 1


def handle_analysis_job(client: redis_lib.Redis, raw: str) -> None:
    try:
        msg = json.loads(raw)
        job_id = msg["id"]
        job_type = msg["jobType"]
        payload = msg.get("requestPayload") or {}
    except (ValueError, KeyError) as err:
        log.error("Dropping malformed analysis job: %s", err)
        ack_analysis_job(client, raw)
        return

    log.info("Job %s (%s) started", job_id, job_type)
    if not report_job(job_id, "running"):
        requeue_analysis_job(client, raw, f"backend did not accept running status for {job_id}")
        return

    try:
        result = process_job(job_type, payload)
        if not report_job(job_id, "succeeded", result_payload=result):
            requeue_analysis_job(client, raw, f"backend did not accept succeeded status for {job_id}")
            return
        log.info("Job %s succeeded", job_id)
    except Exception as err:  # noqa: BLE001 - report any failure to the backend
        if not report_job(job_id, "failed", error_message=str(err)):
            requeue_analysis_job(client, raw, f"backend did not accept failed status for {job_id}")
            return
        log.warning("Job %s failed: %s", job_id, err)
    ack_analysis_job(client, raw)


def handle_live_frame(client: redis_lib.Redis, raw: str) -> None:
    try:
        frame = json.loads(raw)
        result = process_live_frame(frame)
        client.publish(config.LIVE_RESULTS_CHANNEL, json.dumps(result))
    except Exception as err:  # noqa: BLE001 - one bad frame must not stop the loop
        log.warning("Live frame skipped: %s", err)


def run() -> None:
    if not config.WORKER_SHARED_SECRET:
        raise SystemExit(
            "WORKER_SHARED_SECRET is empty. Set it in worker/.env to match the backend."
        )
    log.info("Sime worker starting. Redis=%s backend=%s pitch=%s",
             config.REDIS_URL, config.BACKEND_URL, config.PITCH_MODEL)

    client = get_redis()
    restored = restore_processing_queue(client)
    if restored:
        log.warning("Restored %s analysis job(s) from the processing queue", restored)

    while True:
        try:
            raw_job = client.brpoplpush(
                config.ANALYSIS_QUEUE_KEY,
                config.ANALYSIS_PROCESSING_KEY,
                timeout=1,
            )
            if raw_job is not None:
                handle_analysis_job(client, raw_job)
                continue

            item = client.blpop([config.LIVE_ANALYSIS_QUEUE_KEY], timeout=config.POLL_TIMEOUT)
            if item is not None:
                _key, raw = item
                handle_live_frame(client, raw)
        except redis_lib.exceptions.ConnectionError as err:
            log.error("Redis connection lost (%s). Retrying in 3s...", err)
            time.sleep(3)
            client = get_redis()
        except KeyboardInterrupt:
            log.info("Worker stopped.")
            break


if __name__ == "__main__":
    run()
