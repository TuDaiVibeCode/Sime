# Sime AI worker

Python service that consumes vocal-analysis jobs from Redis, runs the analysis,
and reports results back to the Express backend. This is the worker referenced in
`PLANS.md` and `TASKS.md`.

It is built to run on a normal GPU box (tested target: RTX 5060 8GB, i9-13900KF,
32GB). Out of the box it uses **librosa pYIN** (CPU, no extra setup). CREPE on the
GPU is an optional upgrade.

## What it does

- Moves batch jobs from `sime:analysis:jobs` into
  `sime:analysis:jobs:processing`, reports results to
  `PATCH /api/workers/analysis-jobs/:id` (authenticated with the shared secret),
  then acknowledges the Redis item only after the backend accepts the callback.
- Pops live mic frames from `sime:live-analysis:frames`, runs fast pitch, and
  publishes results to `sime:live-analysis:results` (see "Live results" below).

Job types and what they return:

| jobType         | needs in `requestPayload`                       | returns |
| --------------- | ----------------------------------------------- | ------- |
| `range`         | `{ singerGroup, notes:[{note,durationMs,confidence}] }` | range, voice type, Kim/Tho colour, passaggio, roadmap |
| `transposition` | `{ voiceRange:{low,high}, songRange:{low,high}, maxShiftSemitones?, includesGuideVocal? }` | recommended key shift |
| `coach_payload` | `{ voiceType, voiceColor, range:[low,high], songKeyShift, metrics, errorLog }` | the LLM-ready coaching payload |
| `swiftf0` / `rmvpe` / `crepe` | `{ audioBase64, sampleRate }` (base64 PCM16) | detected pitch + approximate metrics |

`range`, `transposition`, and `coach_payload` use the exact logic ported from
`backend/src/services/vocalAnalysis.ts`, so worker and backend agree.

## Setup

From the repo root:

```bash
cd worker
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # then edit .env
```

Edit `worker/.env`:

- `REDIS_URL` and `WORKER_SHARED_SECRET` must match `backend/.env`.
- `WORKER_SHARED_SECRET` must be at least 32 characters (the backend enforces this).
- `CALLBACK_RETRY_SLEEP` optionally controls the delay before retrying a job
  whose backend callback could not be accepted.

If the backend does not have one yet, add to `backend/.env`:

```
WORKER_SHARED_SECRET=<the same 32+ char secret you put in worker/.env>
```

Redis must be running (the backend uses it too). Then restart the backend so it
picks up the secret. The worker exits immediately if `WORKER_SHARED_SECRET` is
empty because batch results could not be reported safely.

## Run

From the repo root (so `python -m worker` finds the package):

```bash
python -m worker
```

You should see `Sime worker starting...`. Leave it running.

## Try it end to end

1. Start Redis, the backend, and the frontend.
2. Sign in, open **Studio**, and queue a job. The no-audio jobs give an instant,
   satisfying result:

   - Model `Vocal range`, payload:
     ```json
     { "singerGroup": "male",
       "notes": [
         { "note": "A2", "durationMs": 900, "confidence": 1 },
         { "note": "E4", "durationMs": 900, "confidence": 1 } ] }
     ```
   - Model `Transposition`, payload:
     ```json
     { "voiceRange": { "low": "A2", "high": "E4" },
       "songRange": { "low": "C3", "high": "A4" } }
     ```

   The job moves `queued -> running -> succeeded` and the worker's result JSON
   appears in the dashboard.

3. Pitch jobs (`swiftf0` / `rmvpe` / `crepe`) need audio in the payload:
   `{ "audioBase64": "<base64 PCM16>", "sampleRate": 16000 }`.


## HTTP analysis API

The worker also exposes the blueprint's internal HTTP analysis endpoints through
FastAPI. This uses the same `pipeline.py` handlers as the Redis worker, so queue
and HTTP results stay aligned.

Run from the repo root:

```bash
uvicorn worker.api:app --host 127.0.0.1 --port 8000
```

Endpoints:

- `GET /health`
- `POST /analyze-pitch`
- `POST /analyze-health`
- `POST /analyze-technique`
- `POST /analyze-range`
- `POST /analyze-transposition`
- `POST /analyze-job`

If `WORKER_SHARED_SECRET` is configured, these endpoints require
`Authorization: Bearer <WORKER_SHARED_SECRET>`. Audio payloads are bounded and
validated as base64 PCM16 before analysis.

## Pitch models

Set `PITCH_MODEL` in `worker/.env` (or rely on per-job/per-frame `model`).

- **pYIN** (`auto` / `pyin`, default): librosa, CPU, always available.
- **SwiftF0** (`swiftf0`): real neural F0 via the `swift-f0` package (ONNX, CPU,
  ~95k params, ~40x faster than CREPE), installed by `requirements.txt`. This is
  the model the live Practice frames request. Tune `SWIFTF0_CONFIDENCE`.
- **CREPE** (`crepe`): GPU. Install a CUDA torch build (https://pytorch.org), then
  `pip install torchcrepe`, and set `PITCH_MODEL=crepe`.
- **RMVPE** (`rmvpe`): robust polyphonic vocal pitch. Needs torch + the `rmvpe`
  package and a downloaded `rmvpe.pt`; point `RMVPE_MODEL_PATH` at the weights.

Any model that is missing or errors degrades to pYIN, so the worker always runs.

## Live results

The worker decodes live mic frames and publishes pitch to the
`sime:live-analysis:results` Redis channel. The backend subscribes to that channel
(`subscribeLiveAnalysisResults` in `backend/src/lib/redis.ts`) and forwards each
result to its browser by `sessionId` over the `/ws/live-analysis` socket; the
Practice page reads the `live_result` message and shows a secondary "Server pitch"
readout (note / cents / model) alongside its own browser autocorrelation pitch.

To see it end to end you need: Redis running, this worker running, and the frontend
built with `NEXT_PUBLIC_BACKEND_WS_URL` pointing at the backend (e.g.
`ws://localhost:4000`). With Redis down the backend degrades safely and the Practice
page just shows the local browser pitch.

## Layout

```
worker/
  __main__.py    entrypoint and Redis loop
  config.py      env config + Redis keys (match the backend)
  io.py          Redis client + authenticated backend callback
  audio.py       base64 PCM16 decoding
  theory.py      note <-> midi helpers (match the backend)
  pitch.py       pitch model registry (pYIN default, CREPE optional)
  analysis.py    range / transposition / coaching ports + approximate metrics
  pipeline.py    routes a job to its handler
```

