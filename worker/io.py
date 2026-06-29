"""Redis connection and the authenticated callback to the backend."""
import logging

import redis
import requests

from . import config

log = logging.getLogger("worker.io")


def get_redis() -> redis.Redis:
    return redis.from_url(config.REDIS_URL, decode_responses=True)


def report_job(job_id: str, status: str, result_payload=None, error_message=None) -> bool:
    """PATCH the backend worker callback. Returns True on success."""
    if not config.WORKER_SHARED_SECRET:
        log.error("WORKER_SHARED_SECRET is not set; cannot report job %s", job_id)
        return False

    body = {"status": status}
    if result_payload is not None:
        body["resultPayload"] = result_payload
    if error_message is not None:
        body["errorMessage"] = error_message[:1000]

    url = f"{config.BACKEND_URL}/api/workers/analysis-jobs/{job_id}"
    try:
        res = requests.patch(
            url,
            json=body,
            headers={"Authorization": f"Bearer {config.WORKER_SHARED_SECRET}"},
            timeout=10,
        )
        if res.status_code >= 400:
            log.error("Callback for %s -> %s: %s", job_id, res.status_code, res.text[:200])
            return False
        return True
    except requests.RequestException as err:
        log.error("Callback for %s failed: %s", job_id, err)
        return False
