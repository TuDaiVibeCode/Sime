"""Pitch detection with a small model registry.

Default is librosa pYIN (CPU, always available). CREPE, SwiftF0, and RMVPE are
optional: if their package is not installed, the worker logs a note and falls
back to pYIN, so the worker always runs.
"""
import logging

import numpy as np

from . import config
from .theory import hz_to_note_cents

log = logging.getLogger("worker.pitch")

# Cached model instances. Loading weights on every frame would be far too slow
# for the live path, so the first successful call populates these.
_swiftf0_detector = None
_rmvpe_model = None

# SwiftF0 only supports G1..C7; clamp our configured bounds into that window.
_SWIFTF0_MIN_HZ = 46.875
_SWIFTF0_MAX_HZ = 2093.75


def _resolve_device() -> str:
    if config.DEVICE in ("cuda", "cpu"):
        return config.DEVICE
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"



def _autocorrelation_f0(y: np.ndarray, sr: int) -> np.ndarray:
    """Small NumPy fallback when librosa/numba or optional models are unavailable."""
    frame_length = 2048
    hop = 512
    if y.size < frame_length:
        y = np.pad(y, (0, frame_length - y.size))
    min_lag = max(1, int(sr / config.F0_MAX_HZ))
    max_lag = min(frame_length - 1, int(sr / config.F0_MIN_HZ))
    values = []
    for start in range(0, max(1, y.size - frame_length + 1), hop):
        frame = np.asarray(y[start:start + frame_length], dtype=np.float64)
        if frame.size < frame_length:
            frame = np.pad(frame, (0, frame_length - frame.size))
        frame = frame - np.mean(frame)
        energy = float(np.dot(frame, frame))
        if energy < 1e-8:
            values.append(np.nan)
            continue
        corr = np.correlate(frame, frame, mode="full")[frame_length - 1:]
        search = corr[min_lag:max_lag]
        if search.size == 0:
            values.append(np.nan)
            continue
        lag = int(np.argmax(search) + min_lag)
        confidence = float(corr[lag] / (corr[0] + 1e-12))
        values.append(float(sr / lag) if confidence >= 0.25 else np.nan)
    return np.asarray(values, dtype=np.float64)
def _pyin(y: np.ndarray, sr: int) -> np.ndarray:
    import librosa

    f0, _voiced_flag, _voiced_prob = librosa.pyin(
        y, fmin=config.F0_MIN_HZ, fmax=config.F0_MAX_HZ, sr=sr
    )
    return f0


def _crepe(y: np.ndarray, sr: int) -> np.ndarray:
    import torch
    import torchcrepe

    device = _resolve_device()
    audio = torch.tensor(y, dtype=torch.float32).unsqueeze(0)
    hop = max(1, sr // 100)  # ~10 ms
    f0 = torchcrepe.predict(
        audio,
        sr,
        hop_length=hop,
        fmin=config.F0_MIN_HZ,
        fmax=config.F0_MAX_HZ,
        model="full",
        device=device,
        batch_size=512,
    )
    return f0.squeeze(0).cpu().numpy()


def _swiftf0(y: np.ndarray, sr: int) -> np.ndarray:
    global _swiftf0_detector
    if _swiftf0_detector is None:
        from swift_f0 import SwiftF0  # optional dep: pip install swift-f0

        _swiftf0_detector = SwiftF0(
            fmin=max(config.F0_MIN_HZ, _SWIFTF0_MIN_HZ),
            fmax=min(config.F0_MAX_HZ, _SWIFTF0_MAX_HZ),
            confidence_threshold=config.SWIFTF0_CONFIDENCE,
        )
    # SwiftF0 resamples to 16 kHz and downmixes internally.
    result = _swiftf0_detector.detect_from_array(np.asarray(y, dtype=np.float32), int(sr))
    f0 = np.asarray(result.pitch_hz, dtype=np.float64).copy()
    voicing = np.asarray(result.voicing, dtype=bool)
    f0[~voicing] = np.nan  # unvoiced -> NaN so the median ignores it
    return f0


def _rmvpe(y: np.ndarray, sr: int) -> np.ndarray:
    global _rmvpe_model
    if not config.RMVPE_MODEL_PATH:
        raise RuntimeError("RMVPE_MODEL_PATH is not set (download rmvpe.pt first).")
    if _rmvpe_model is None:
        from rmvpe import RMVPE  # optional dep; needs torch + the rmvpe.pt weights

        _rmvpe_model = RMVPE(
            config.RMVPE_MODEL_PATH, is_half=False, device=_resolve_device()
        )
    import librosa

    # RMVPE expects 16 kHz mono.
    x = y if sr == 16_000 else librosa.resample(y, orig_sr=sr, target_sr=16_000)
    f0 = _rmvpe_model.infer_from_audio(
        np.asarray(x, dtype=np.float32), thred=config.RMVPE_THRESHOLD
    )
    f0 = np.asarray(f0, dtype=np.float64)
    f0[f0 <= 0] = np.nan  # RMVPE marks unvoiced frames as 0 -> NaN for the median
    return f0


def _try(model_fn, name, y, sr):
    try:
        return model_fn(y, sr), name
    except ImportError:
        log.warning("%s not installed, falling back to pYIN", name)
    except Exception as err:  # noqa: BLE001 - any model error should degrade, not crash
        log.warning("%s failed (%s), falling back to pYIN", name, err)
    try:
        return _pyin(y, sr), "pyin"
    except Exception as err:  # noqa: BLE001 - environment fallback
        log.warning("pYIN failed (%s), falling back to autocorrelation", err)
        return _autocorrelation_f0(y, sr), "autocorrelation"


def detect_pitch(y: np.ndarray, sr: int, model: str = "auto") -> dict:
    """Return a pitch summary plus a downsampled f0 track."""
    model = (model or "auto").lower()
    if model == "crepe":
        f0, used = _try(_crepe, "crepe", y, sr)
    elif model == "swiftf0":
        f0, used = _try(_swiftf0, "swiftf0", y, sr)
    elif model == "rmvpe":
        f0, used = _try(_rmvpe, "rmvpe", y, sr)
    else:
        f0, used = _try(_pyin, "pyin", y, sr)

    f0 = np.asarray(f0, dtype=np.float64)
    voiced = f0[~np.isnan(f0)]
    voiced = voiced[voiced > 0]

    if voiced.size == 0:
        return {
            "modelRequested": model,
            "modelUsed": used,
            "voiced": False,
            "medianHz": None,
            "note": None,
            "cents": None,
            "voicedRatio": 0.0,
            "f0Track": [],
        }

    median_hz = float(np.median(voiced))
    note, cents = hz_to_note_cents(median_hz)

    # Downsample the track for a compact payload (<= 200 points).
    step = max(1, len(f0) // 200)
    track = [None if np.isnan(v) else round(float(v), 2) for v in f0[::step]]
    duration_sec = max(len(y) / float(sr), 1e-6)
    native_frame_rate = len(f0) / duration_sec

    return {
        "modelRequested": model,
        "modelUsed": used,
        "voiced": True,
        "medianHz": round(median_hz, 2),
        "note": note,
        "cents": cents,
        "voicedRatio": round(float(voiced.size) / float(f0.size), 3),
        "f0Track": track,
        "f0FrameRateHz": round(float(native_frame_rate / step), 3),
    }



