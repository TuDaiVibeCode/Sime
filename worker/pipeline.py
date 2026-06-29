"""Route an analysis job to the right handler and build its result payload."""
import logging

from . import analysis, config
from .audio import decode_pcm16_base64, ensure_float_mono
from .pitch import detect_pitch

log = logging.getLogger("worker.pipeline")

PITCH_JOBS = {"swiftf0", "rmvpe", "crepe"}


def _decode_audio_payload(payload: dict):
    audio_b64 = payload.get("audioBase64")
    sample_rate = payload.get("sampleRate")
    if not audio_b64 or not sample_rate:
        raise ValueError(
            "Audio analysis jobs need 'audioBase64' (base64 PCM16) and 'sampleRate' in requestPayload."
        )
    return ensure_float_mono(decode_pcm16_base64(audio_b64)), int(sample_rate)


def _run_pitch(job_type: str, payload: dict) -> dict:
    y, sr = _decode_audio_payload(payload)
    model = job_type if config.PITCH_MODEL == "auto" else config.PITCH_MODEL
    pitch = detect_pitch(y, sr, model=model)
    metrics = analysis.approximate_metrics(pitch.get("f0Track", []), y, sr)
    technique_metrics = analysis.estimate_technique_metrics(
        pitch.get("f0Track", []), y, sr, pitch.get("f0FrameRateHz")
    )
    return {
        "jobType": job_type,
        "pitch": pitch,
        "metrics": metrics,
        "health": analysis.analyze_health({"metrics": metrics}),
        "techniqueMetrics": technique_metrics,
        "technique": analysis.analyze_technique({"exerciseName": payload.get("exerciseName", "Pitch job technique estimate"), **technique_metrics}),
    }


def process_job(job_type: str, payload: dict) -> dict:
    """Return a result payload for a batch analysis job. Raises on bad input."""
    payload = payload if isinstance(payload, dict) else {}

    if job_type in PITCH_JOBS:
        return _run_pitch(job_type, payload)
    if job_type == "range":
        return {"jobType": "range", "range": analysis.analyze_range(payload)}
    if job_type == "transposition":
        return {"jobType": "transposition", "transposition": analysis.calculate_transposition(payload)}
    if job_type == "coach_payload":
        return {"jobType": "coach_payload", "coaching": analysis.build_coaching_payload(payload)}
    if job_type == "health":
        if payload.get("audioBase64") and payload.get("sampleRate"):
            y, sr = _decode_audio_payload(payload)
            model = payload.get("model", "swiftf0")
            if config.PITCH_MODEL != "auto":
                model = config.PITCH_MODEL
            pitch = detect_pitch(y, sr, model=model)
            metrics = analysis.approximate_metrics(pitch.get("f0Track", []), y, sr)
            health_payload = {"exerciseName": payload.get("exerciseName", "Audio health analysis"), "metrics": metrics, "thresholds": payload.get("thresholds") or {}}
            return {"jobType": "health", "pitch": pitch, "metrics": metrics, "health": analysis.analyze_health(health_payload)}
        return {"jobType": "health", "health": analysis.analyze_health(payload)}
    if job_type == "technique":
        if payload.get("audioBase64") and payload.get("sampleRate"):
            y, sr = _decode_audio_payload(payload)
            model = payload.get("model", "swiftf0")
            if config.PITCH_MODEL != "auto":
                model = config.PITCH_MODEL
            pitch = detect_pitch(y, sr, model=model)
            technique_metrics = analysis.estimate_technique_metrics(
                pitch.get("f0Track", []), y, sr, pitch.get("f0FrameRateHz")
            )
            technique_payload = {"exerciseName": payload.get("exerciseName", "Audio technique analysis"), **technique_metrics}
            return {"jobType": "technique", "pitch": pitch, "techniqueMetrics": technique_metrics, "technique": analysis.analyze_technique(technique_payload)}
        if payload.get("f0Array"):
            technique_metrics = analysis.estimate_technique_metrics(payload.get("f0Array"), frame_rate_hz=payload.get("f0FrameRateHz"))
            technique_payload = {"exerciseName": payload.get("exerciseName", "F0 technique analysis"), **technique_metrics}
            return {"jobType": "technique", "techniqueMetrics": technique_metrics, "technique": analysis.analyze_technique(technique_payload)}
        return {"jobType": "technique", "technique": analysis.analyze_technique(payload)}

    raise ValueError(f"Unknown jobType: {job_type}")


def process_live_frame(frame: dict) -> dict:
    """Fast pitch for a single live frame, published to the live results channel."""
    y = ensure_float_mono(decode_pcm16_base64(frame["audioBase64"]))
    sr = int(frame["sampleRate"])
    model = frame.get("model", "swiftf0")
    if config.PITCH_MODEL != "auto":
        model = config.PITCH_MODEL
    pitch = detect_pitch(y, sr, model=model)
    return {
        "type": "live_result",
        "sessionId": frame.get("sessionId"),
        "userId": frame.get("userId"),
        "sequence": frame.get("sequence"),
        "note": pitch.get("note"),
        "cents": pitch.get("cents"),
        "hz": pitch.get("medianHz"),
        "voiced": pitch.get("voiced"),
        "modelUsed": pitch.get("modelUsed"),
    }




