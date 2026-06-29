"""Worker configuration, loaded from environment (worker/.env)."""
import os

from dotenv import load_dotenv

load_dotenv()

# Connections. REDIS_URL and WORKER_SHARED_SECRET must match the backend's.
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000").rstrip("/")
WORKER_SHARED_SECRET = os.getenv("WORKER_SHARED_SECRET", "")

# Pitch model preference: auto | pyin | crepe | swiftf0 | rmvpe.
# "auto" uses librosa pYIN (CPU, always available). The others are optional and
# fall back to pYIN if their package is not installed.
PITCH_MODEL = os.getenv("PITCH_MODEL", "auto").lower()
DEVICE = os.getenv("DEVICE", "auto").lower()  # auto | cuda | cpu

# Seconds to block on the Redis queue before looping again.
POLL_TIMEOUT = int(os.getenv("POLL_TIMEOUT", "5"))
# Delay before retrying a batch job whose backend callback could not be accepted.
CALLBACK_RETRY_SLEEP = float(os.getenv("CALLBACK_RETRY_SLEEP", "5"))

# Vocal frequency search bounds (Bass low to Coloratura Soprano high), per docs.
F0_MIN_HZ = float(os.getenv("F0_MIN_HZ", "65.0"))
F0_MAX_HZ = float(os.getenv("F0_MAX_HZ", "2093.0"))

# SwiftF0 voicing confidence cutoff (0..1, higher = stricter).
SWIFTF0_CONFIDENCE = float(os.getenv("SWIFTF0_CONFIDENCE", "0.9"))
# RMVPE needs a downloaded rmvpe.pt; empty path -> RMVPE falls back to pYIN.
RMVPE_MODEL_PATH = os.getenv("RMVPE_MODEL_PATH", "")
RMVPE_THRESHOLD = float(os.getenv("RMVPE_THRESHOLD", "0.03"))

# Redis keys, kept identical to backend/src/lib/redis.ts.
ANALYSIS_QUEUE_KEY = "sime:analysis:jobs"
ANALYSIS_PROCESSING_KEY = "sime:analysis:jobs:processing"
LIVE_ANALYSIS_QUEUE_KEY = "sime:live-analysis:frames"
LIVE_RESULTS_CHANNEL = "sime:live-analysis:results"
