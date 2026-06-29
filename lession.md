# Comprehensive AI Vocal Coach Blueprint (3-6 Months) - EduX System

This document outlines the blueprint for the EduX system, functioning as a 1-on-1 "Virtual Vocal Coach." The 24-week curriculum is split into Basic (Months 1-3) and Advanced (Months 4-6) phases.

## Dual-AI Architecture

1. Acoustic Validation AI (DSP/Python): extracts physical data including Pitch, Jitter, Shimmer, HNR, CPPS, Formants, Vibrato, and Singer's Formant in real time or near real time.
2. Pedagogical AI Tutor (Gemini API): processes JSON data from the Acoustic AI and produces supportive coaching feedback.

## Part I: Basic Program (Months 1-3)

Objective: establish diaphragmatic support, fix posture, ensure pitch accuracy, and identify vocal registers.

### Month 1: Diaphragmatic Breathing and Warm-up

Repertoire and exercises:
- Diaphragmatic breathing.
- "Ssst..." exhalation for 20-30 seconds continuously.
- Lip trills and humming siren exercises.

Acoustic AI validation:
- Measure Jitter, Shimmer, and Smoothed Cepstral Peak Prominence (CPPS) during humming.
- Pass thresholds: Jitter < 1.0%, Shimmer <= 5.0%.

Gemini prompt context example:
```json
{"exercise":"Ssst","duration":15,"amplitude_stability":"low_fluctuation"}
```

### Month 2: Pitch and Sight-Singing

Repertoire and exercises:
- Five-tone scale: Do-Re-Mi-Fa-Sol-Fa-Mi-Re-Do.
- Prima-vista sight-singing with AI-generated sheet music.

Acoustic AI validation:
- Pitch tracking with CREPE or client-side pitch tracking for immediate feedback. Target deep model latency: 20-30 ms where available.
- Pass threshold: pitch deviation <= +/-50 cents from the target written note.
- Rhythm: Dynamic Time Warping (DTW) aligns vocal input with target sheet music.

Gemini prompt context example:
```json
{"task":"sight_singing","notes_missed":["E4 flat"],"avg_deviation":"-40 cents"}
```

### Month 3: Vocal Registers (Chest vs. Head Voice)

Repertoire and exercises:
- "Nay Nay Nay" for nasal/forward placement.
- Chest voice with "Gug" and head voice with "Hoo".

Acoustic AI validation:
- Harmonic-to-Noise Ratio (HNR) validates vocal fold closure.
- Pass threshold: HNR >= 15 dB, preferred 15-20 dB or higher depending on task.
- Spectrogram: detect energy shift from f0-dominant chest coordination to higher harmonic energy in head voice.

## Part II: Advanced Program (Months 4-6)

Objective: master the passaggio, mix voice, vibrato, and formant tuning.

### Month 4: Passaggio and Mix Voice

Repertoire and exercises:
- Siren glissando through the passaggio: E4-F#4 for many male voices, F5-G5 for many female voices.
- Cry/sob vocal setup for laryngeal tilt.

Acoustic AI validation:
- Track f0 continuously.
- Voice break detection: use the first-order derivative on the f0 array to find sudden pitch jumps.
- Pass threshold: voice breaks = 0.

### Month 5: Formant Tuning and Vibrato

Repertoire and exercises:
- Vowel modification on high notes.
- Active vibrato and messa di voce: piano to forte to piano.

Acoustic AI validation:
- Formants: measure F1 and F2 via LPC-style analysis.
- Vibrato: measure rate and extent.
- Pass thresholds: rate 5-7 Hz, extent +/-30 to +/-50 cents.
- Warn if rate < 4 Hz (wobble) or > 8 Hz (tremolo).

### Month 6: Singer's Formant and Graduation

Repertoire and exercises:
- Optimize Singer's Formant with low-larynx and wide-pharynx setup.
- Graduation song as a full performance.

Acoustic AI validation:
- Singer's Formant: compute Long-Term Average Spectrum (LTAS) and look for an energy peak between 2.4-3.0 kHz.
- Pass threshold: peak >= -20 dBFS in the 2.4-3.0 kHz band.
- Singing Power Ratio (SPR): SPR (dB) = PowerHigh(2-4 kHz) - PowerLow(0-2 kHz).

## System Architecture and Tech Stack

### 1. Frontend (Next.js and Web Audio API)

- Audio capture: use AudioWorkletProcessor or Web Audio analyser paths to capture microphone data in non-blocking chunks such as 2048/4096 samples.
- Client-side processing: use lightweight low-latency pitch tracking for UI color feedback; aubiojs/WebAssembly or current autocorrelation paths can provide immediate practice feedback.
- Visualization: waveform display can use Wavesurfer.js where full audio review is needed.
- Transport: send audio chunks or base64 frames via WebSocket to the backend.

### 2. API Gateway and Business Logic (Express.js)

Workflow routing:
1. Receive audio or metric payloads from Next.js.
2. Forward jobs to the Python analysis worker where applicable.
3. Receive standardized JSON metrics from Python.
4. Inject JSON into the Gemini prompt template.
5. Send to Gemini API when configured.
6. Return `{ "metrics": {...}, "ai_feedback": "..." }` or equivalent coaching payload to Next.js.

### 3. Audio Analysis Engine (Python)

Expected endpoints or job types:
- `/analyze-pitch`
- `/analyze-health`
- health jobs
- technique jobs

Libraries and methods:
- librosa or CREPE for pitch tracking.
- DTW for rhythm alignment.
- parselmouth/Praat-style methods for Jitter, Shimmer, HNR, CPPS, and Formants where available.
- scipy for signal processing, peak detection, LTAS, and SPR.

Standard output example:
```json
{"f0_array":[220.0,221.2],"jitter":0.5,"shimmer":3.2,"hnr":18.5,"voice_breaks":0,"status":"PASS"}
```

### 4. Database Schema (PostgreSQL)

- Users: id (UUID), name/email fields, vocal type/profile data, current level/role.
- Lessons: id, title, week_number, target_metrics JSON.
- Practice sessions: id, user_id, lesson_id, audio_file_url, score, gemini_feedback, created_at.
- Vocal health metrics: id, session_id, avg_pitch_hz, jitter_pct, shimmer_pct, hnr_db, cpps_db, vibrato fields, singer-formant fields, raw_metrics.

## Gemini API Prompt Engineering

### 1. System Prompt

Role: You are an elite Virtual Vocal Coach at EduX Academy, specializing in vocal anatomy, Bel Canto, and contemporary techniques.

Task: Translate raw acoustic JSON metrics into supportive, pedagogical feedback.

Rules:
- Do not mechanically list raw numbers such as Jitter or HNR.
- Use analogies: low HNR means breathy/leaking air; high Jitter can imply unstable tension.
- End with an actionable physical adjustment such as posture, breathing, jaw, tongue, or mouth shape.

Tone: warm, professional, encouraging, and safety-first.

### 2. Prompt Template: Warm-up and Health (Months 1 and 3)

Payload:
```text
User completed: {exercise_name}. Goal: Stable airflow.
Data: Jitter {jitter_value}% (Threshold: < 1.0%), Shimmer {shimmer_value}% (Threshold: <= 5%), HNR {hnr_value} dB (Threshold: >= 15 dB).
Provide feedback under 100 words to correct breathing/posture.
```

### 3. Prompt Template: Passaggio and Pitch (Months 2 and 4)

Payload:
```text
User completed: {exercise_name}.
Data: Pitch deviation {pitch_deviation} cents. Voice Breaks: {voice_breaks_count} at note {break_note}.
Explain the error and guide the user on Mix Voice or Vowel Modification to safely pass {break_note}.
```

## Codex Validation Rules and Thresholds

| Metric | Python Library / Method | Pass Threshold | Pedagogical Meaning |
| --- | --- | --- | --- |
| Pitch Accuracy | librosa.pyin / CREPE / browser pitch tracker | Error <= +/-50 cents | Detects flat or sharp singing against a written note. |
| Rhythm Alignment | librosa.sequence.dtw | Min DTW distance / closest alignment | Checks timing against target beat or sheet rhythm. |
| Jitter | parselmouth / Praat-style | < 1.0% | Measures frequency noise, tension, or hoarseness. |
| Shimmer | parselmouth / Praat-style | <= 5.0% | Measures amplitude noise and breath support stability. |
| HNR | parselmouth / Praat-style | >= 15.0 dB | Quantifies vocal clarity and fold closure. |
| Voice Breaks | scipy.signal.find_peaks or derivative on f0 | 0 on sustained vowels or passaggio tasks | Evaluates smooth passaggio transition. |
| Vibrato | f0 modulation analysis | 5-7 Hz, +/-30 to +/-50 cents | Detects healthy vibrato versus wobble or tremolo. |
| Singer's Formant | scipy.signal.welch / LTAS | Peak >= -20 dBFS between 2.4-3.0 kHz | Assesses professional vocal ring (squillo). |
| SPR | spectral band power | PowerHigh(2-4 kHz) - PowerLow(0-2 kHz) | Compares ring energy to low-frequency power. |
