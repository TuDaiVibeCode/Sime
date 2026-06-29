"""Smoke tests for the FastAPI worker analysis surface.

Run from the repo root:
    python -m unittest worker.test_api_smoke
"""
from __future__ import annotations

import base64
import os
import unittest

import numpy as np
from fastapi.testclient import TestClient

os.environ["WORKER_SHARED_SECRET"] = "test-worker-secret-that-is-long-enough"

from .api import app  # noqa: E402  (env must be set before worker.config import)


class WorkerApiSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)
        cls.headers = {"Authorization": "Bearer test-worker-secret-that-is-long-enough"}

    @staticmethod
    def pcm_sine(freq: float = 220.0, sr: int = 16_000, seconds: float = 0.6) -> str:
        t = np.arange(int(sr * seconds)) / sr
        y = (0.25 * np.sin(2 * np.pi * freq * t)).astype(np.float32)
        pcm = np.clip(y * 32767, -32768, 32767).astype("<i2")
        return base64.b64encode(pcm.tobytes()).decode("ascii")

    def test_health_and_openapi(self) -> None:
        self.assertEqual(self.client.get("/health").status_code, 200)
        schema = self.client.get("/openapi.json")
        self.assertEqual(schema.status_code, 200)
        paths = schema.json()["paths"]
        for path in ["/analyze-pitch", "/analyze-health", "/analyze-technique", "/analyze-job"]:
            self.assertIn(path, paths)

    def test_auth_required_when_secret_configured(self) -> None:
        response = self.client.post(
            "/analyze-health",
            json={"exerciseName": "Ssst", "metrics": {"jitterPct": 0.5}},
        )
        self.assertEqual(response.status_code, 401)

    def test_audio_pitch_and_health(self) -> None:
        audio = self.pcm_sine()
        pitch = self.client.post(
            "/analyze-pitch",
            headers=self.headers,
            json={"sampleRate": 16_000, "audioBase64": audio, "model": "swiftf0"},
        )
        self.assertEqual(pitch.status_code, 200, pitch.text)
        body = pitch.json()
        self.assertIn(body["metrics"]["pitch"]["modelUsed"], {"swiftf0", "pyin", "autocorrelation"})
        self.assertIn("health", body["metrics"])

        health = self.client.post(
            "/analyze-health",
            headers=self.headers,
            json={"sampleRate": 16_000, "audioBase64": audio, "exerciseName": "Ssst"},
        )
        self.assertEqual(health.status_code, 200, health.text)
        self.assertIn(health.json()["health"]["status"], {"PASS", "WARN", "FAIL"})

    def test_f0_technique_and_oversized_audio_rejection(self) -> None:
        technique = self.client.post(
            "/analyze-technique",
            headers=self.headers,
            json={
                "exerciseName": "Vibrato",
                "f0Array": [220, 222, 220, 218] * 20,
                "f0FrameRateHz": 50,
            },
        )
        self.assertEqual(technique.status_code, 200, technique.text)
        self.assertIn(technique.json()["technique"]["status"], {"PASS", "WARN", "FAIL"})

        bad = self.client.post(
            "/analyze-pitch",
            headers=self.headers,
            json={"sampleRate": 16_000, "audioBase64": "A" * (769 * 1024)},
        )
        self.assertEqual(bad.status_code, 422)


if __name__ == "__main__":
    unittest.main()

