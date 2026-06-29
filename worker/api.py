"""FastAPI surface for the Sime acoustic analysis engine.

This exposes the HTTP endpoints described in lession.md while reusing the same
pipeline as the Redis worker. Run from the repo root with:

    uvicorn worker.api:app --host 127.0.0.1 --port 8000
"""
from __future__ import annotations

import base64
import binascii
import hmac
from typing import Annotated, Any, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from . import config
from .pipeline import process_job

MAX_AUDIO_BASE64_CHARS = 768 * 1024
MAX_F0_POINTS = 12_000
NOTE_PATTERN = r"^[A-G](#|b)?-?\d$"

app = FastAPI(
    title="Sime Acoustic Analysis Worker",
    version="0.1.0",
    description="Internal DSP analysis API for pitch, health, technique, and EduX validation jobs.",
)


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AudioPayload(StrictModel):
    lessonId: str | None = Field(default=None, min_length=1, max_length=64)
    audioFileUrl: str | None = Field(default=None, max_length=2048)
    exerciseName: str | None = Field(default=None, min_length=1, max_length=120)
    sampleRate: int = Field(ge=8_000, le=48_000)
    audioBase64: str = Field(min_length=1, max_length=MAX_AUDIO_BASE64_CHARS)
    model: Literal["swiftf0", "rmvpe", "crepe", "pyin", "auto"] = "swiftf0"

    @field_validator("audioBase64")
    @classmethod
    def validate_audio_base64(cls, value: str) -> str:
        try:
            base64.b64decode(value, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("audioBase64 must be valid base64 PCM16 audio") from exc
        return value


class MetricThresholds(StrictModel):
    maxJitterPct: float | None = Field(default=None, ge=0, le=20)
    maxShimmerPct: float | None = Field(default=None, ge=0, le=50)
    minHnrDb: float | None = Field(default=None, ge=-20, le=80)
    minCppsDb: float | None = Field(default=None, ge=0, le=40)
    minPitchStability: float | None = Field(default=None, ge=0, le=100)
    minLevelStability: float | None = Field(default=None, ge=0, le=100)

    def compact(self) -> dict[str, float]:
        return {key: value for key, value in self.model_dump().items() if value is not None}


class HealthMetrics(StrictModel):
    approximate: bool = False
    jitterPct: float | None = Field(default=None, ge=0, le=100)
    shimmerPct: float | None = Field(default=None, ge=0, le=100)
    hnrDb: float | None = Field(default=None, ge=-20, le=80)
    cppsDb: float | None = Field(default=None, ge=0, le=40)
    pitchStability: float | None = Field(default=None, ge=0, le=100)
    levelStability: float | None = Field(default=None, ge=0, le=100)


class HealthPayload(StrictModel):
    exerciseName: str = Field(default="Warm-up health check", min_length=1, max_length=120)
    metrics: HealthMetrics
    thresholds: MetricThresholds = Field(default_factory=MetricThresholds)


class AudioHealthPayload(AudioPayload):
    thresholds: MetricThresholds = Field(default_factory=MetricThresholds)


class PitchMetric(StrictModel):
    deviationCents: float = Field(ge=-1200, le=1200)
    thresholdCents: float = Field(default=50, ge=1, le=100)


class RhythmMetric(StrictModel):
    dtwDistance: float = Field(ge=0, le=100_000)
    maxDtwDistance: float = Field(ge=0, le=100_000)


class PassaggioMetric(StrictModel):
    voiceBreaks: int = Field(ge=0, le=100)
    breakNote: str | None = Field(default=None, pattern=NOTE_PATTERN)


class VibratoMetric(StrictModel):
    rateHz: float = Field(ge=0, le=20)
    extentCents: float = Field(ge=0, le=300)


class SingerFormantMetric(StrictModel):
    peakFreqHz: float = Field(ge=20, le=12_000)
    peakDbfs: float = Field(ge=-120, le=20)
    sprDb: float | None = Field(default=None, ge=-80, le=80)


class FormantMetric(StrictModel):
    f1Hz: float | None = Field(default=None, ge=100, le=1500)
    f2Hz: float | None = Field(default=None, ge=300, le=4000)


class TechniquePayload(StrictModel):
    exerciseName: str = Field(default="Technique validation", min_length=1, max_length=120)
    lessonId: str | None = Field(default=None, min_length=1, max_length=64)
    pitch: PitchMetric | None = None
    rhythm: RhythmMetric | None = None
    passaggio: PassaggioMetric | None = None
    vibrato: VibratoMetric | None = None
    singerFormant: SingerFormantMetric | None = None
    formants: FormantMetric | None = None


class F0TechniquePayload(TechniquePayload):
    f0Array: list[float | None] = Field(min_length=1, max_length=MAX_F0_POINTS)
    f0FrameRateHz: float | None = Field(default=None, ge=1, le=500)

    @field_validator("f0Array")
    @classmethod
    def validate_f0(cls, value: list[float | None]) -> list[float | None]:
        for item in value:
            if item is not None and not 20 <= item <= 5000:
                raise ValueError("f0Array values must be null or between 20 and 5000 Hz")
        return value


class RangeNote(StrictModel):
    note: str = Field(pattern=NOTE_PATTERN)
    durationMs: int = Field(ge=1, le=60_000)
    confidence: float = Field(default=1, ge=0, le=1)


class RangePayload(StrictModel):
    singerGroup: Literal["male", "female", "unknown"] = "unknown"
    minDurationMs: int = Field(default=300, ge=100, le=5000)
    minConfidence: float = Field(default=0.6, ge=0, le=1)
    notes: list[RangeNote] = Field(min_length=2, max_length=256)


class NoteRange(StrictModel):
    low: str = Field(pattern=NOTE_PATTERN)
    high: str = Field(pattern=NOTE_PATTERN)


class SongRange(NoteRange):
    tessituraLow: str | None = Field(default=None, pattern=NOTE_PATTERN)
    tessituraHigh: str | None = Field(default=None, pattern=NOTE_PATTERN)


class TranspositionPayload(StrictModel):
    voiceRange: NoteRange
    songRange: SongRange
    maxShiftSemitones: int = Field(default=4, ge=0, le=4)
    includesGuideVocal: bool = False


class JobPayload(StrictModel):
    jobType: Literal["swiftf0", "rmvpe", "crepe", "range", "transposition", "health", "technique"]
    requestPayload: dict[str, Any]

    @model_validator(mode="after")
    def validate_request_payload(self) -> "JobPayload":
        schema_map = {
            "swiftf0": AudioPayload,
            "rmvpe": AudioPayload,
            "crepe": AudioPayload,
            "range": RangePayload,
            "transposition": TranspositionPayload,
            "health": HealthPayload,
            "technique": TechniquePayload,
        }
        schema = schema_map[self.jobType]
        self.requestPayload = schema.model_validate(self.requestPayload).model_dump(exclude_none=True)
        return self


def _as_payload(model: BaseModel) -> dict[str, Any]:
    return model.model_dump(exclude_none=True)


def require_worker_api_token(authorization: Annotated[str | None, Header()] = None) -> None:
    expected = config.WORKER_SHARED_SECRET
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Worker API shared secret is not configured",
        )
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token or not hmac.compare_digest(token, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Worker API authentication required",
        )


WorkerAuth = Annotated[None, Depends(require_worker_api_token)]


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze-pitch", tags=["analysis"])
async def analyze_pitch(payload: AudioPayload, _auth: WorkerAuth) -> dict[str, Any]:
    result = process_job(payload.model, _as_payload(payload))
    return {"metrics": result}


@app.post("/analyze-health", tags=["analysis"])
async def analyze_health(payload: AudioHealthPayload | HealthPayload, _auth: WorkerAuth) -> dict[str, Any]:
    result = process_job("health", _as_payload(payload))
    return {"metrics": result.get("metrics"), "health": result.get("health"), "pitch": result.get("pitch")}


@app.post("/analyze-technique", tags=["analysis"])
async def analyze_technique(payload: AudioPayload | F0TechniquePayload | TechniquePayload, _auth: WorkerAuth) -> dict[str, Any]:
    result = process_job("technique", _as_payload(payload))
    return {
        "techniqueMetrics": result.get("techniqueMetrics"),
        "technique": result.get("technique"),
        "pitch": result.get("pitch"),
    }


@app.post("/analyze-range", tags=["analysis"])
async def analyze_range(payload: RangePayload, _auth: WorkerAuth) -> dict[str, Any]:
    return process_job("range", _as_payload(payload))


@app.post("/analyze-transposition", tags=["analysis"])
async def analyze_transposition(payload: TranspositionPayload, _auth: WorkerAuth) -> dict[str, Any]:
    return process_job("transposition", _as_payload(payload))


@app.post("/analyze-job", tags=["analysis"])
async def analyze_job(payload: JobPayload, _auth: WorkerAuth) -> dict[str, Any]:
    return process_job(payload.jobType, payload.requestPayload)

