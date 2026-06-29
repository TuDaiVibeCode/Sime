"""Audio decoding helpers."""
import base64

import numpy as np


def decode_pcm16_base64(audio_base64: str) -> np.ndarray:
    """Decode base64 little-endian 16-bit PCM into float32 samples in [-1, 1].

    Matches the browser encoder in frontend/components/PracticePanel.tsx.
    """
    raw = base64.b64decode(audio_base64)
    samples = np.frombuffer(raw, dtype="<i2").astype(np.float32)
    return samples / 32768.0


def ensure_float_mono(y: np.ndarray) -> np.ndarray:
    y = np.asarray(y, dtype=np.float32)
    if y.ndim > 1:
        y = y.mean(axis=0)
    return y
