"""Pure analyses ported from backend/src/services/vocalAnalysis.ts so worker and
backend agree, plus approximate signal metrics for deep passes."""
import numpy as np

from .theory import note_to_midi, midi_to_note


# --- Range and voice classification -----------------------------------------

def _classify_voice(low: int, high: int, singer_group: str) -> str:
    if singer_group == "female":
        if high >= note_to_midi("C6"):
            return "Coloratura Soprano"
        if high >= note_to_midi("A5"):
            return "Soprano"
        if low <= note_to_midi("F3") and high <= note_to_midi("F5"):
            return "Contralto / Alto"
        return "Mezzo-Soprano"
    if singer_group == "male":
        if high >= note_to_midi("B4"):
            return "Lyric Tenor"
        if high >= note_to_midi("G4"):
            return "Tenor"
        if low <= note_to_midi("E2"):
            return "Bass"
        return "Baritone"
    center = (low + high) / 2
    if center < note_to_midi("C4"):
        return "Bass" if low <= note_to_midi("E2") else "Baritone"
    if center > note_to_midi("G4"):
        return "Coloratura Soprano" if high >= note_to_midi("C6") else "Soprano"
    return "Mezzo-Soprano / Tenor"


def _voice_color(low: int, high: int) -> str:
    center = (low + high) / 2
    if center < note_to_midi("C4"):
        return "Tho - warm, grounded, powerful"
    return "Kim - bright, clear, agile"


def _passaggio_hint(voice_type: str) -> str:
    if "Bass" in voice_type:
        return "Likely passaggio focus around A3-C4"
    if "Baritone" in voice_type:
        return "Likely passaggio focus around B3-E4"
    if "Tenor" in voice_type:
        return "Likely passaggio focus around E4-G4"
    if "Contralto" in voice_type:
        return "Likely passaggio focus around E4-G4"
    if "Mezzo" in voice_type:
        return "Likely passaggio focus around F4-A4"
    return "Likely passaggio focus around A4-C5"


def analyze_range(payload: dict) -> dict:
    singer_group = payload.get("singerGroup", "unknown")
    min_duration = int(payload.get("minDurationMs", 300))
    min_confidence = float(payload.get("minConfidence", 0.6))
    notes = payload.get("notes") or []

    stable = [
        n for n in notes
        if int(n.get("durationMs", 0)) >= min_duration
        and float(n.get("confidence", 1)) >= min_confidence
    ]
    if len(stable) < 2:
        raise ValueError("Not enough stable notes to determine a safe vocal range.")

    midis = [note_to_midi(n["note"]) for n in stable]
    low, high = min(midis), max(midis)
    voice_type = _classify_voice(low, high, singer_group)
    span = high - low

    return {
        "lowestStableNote": midi_to_note(low),
        "highestStableNote": midi_to_note(high),
        "rangeSemitones": span,
        "voiceType": voice_type,
        "voiceColor": _voice_color(low, high),
        "passaggioHint": _passaggio_hint(voice_type),
        "roadmapStage": "beginner" if span < 18 else "intermediate" if span < 28 else "advanced",
        "acceptedSamples": len(stable),
        "rejectedSamples": len(notes) - len(stable),
    }


# --- Smart transposition -----------------------------------------------------

def calculate_transposition(payload: dict) -> dict:
    voice = payload["voiceRange"]
    song = payload["songRange"]
    max_shift = int(payload.get("maxShiftSemitones", 4))
    includes_guide = bool(payload.get("includesGuideVocal", False))

    voice_low = note_to_midi(voice["low"])
    voice_high = note_to_midi(voice["high"])
    song_low = note_to_midi(song["low"])
    song_high = note_to_midi(song["high"])
    tess_low = note_to_midi(song.get("tessituraLow", song["low"]))
    tess_high = note_to_midi(song.get("tessituraHigh", song["high"]))
    voice_center = (voice_low + voice_high) / 2

    best = {"shift": 0, "score": float("inf"), "out_of_range": 0}
    for shift in range(-max_shift, max_shift + 1):
        shifted_low = song_low + shift
        shifted_high = song_high + shift
        shifted_tess_center = (tess_low + tess_high) / 2 + shift
        out_of_range = max(0, voice_low - shifted_low) + max(0, shifted_high - voice_high)
        score = out_of_range * 10 + abs(shift) * 0.8 + abs(shifted_tess_center - voice_center) * 0.15
        if score < best["score"]:
            best = {"shift": shift, "score": score, "out_of_range": out_of_range}

    shift = best["shift"]
    fits = best["out_of_range"] == 0
    return {
        "shiftSemitones": shift,
        "shiftLabel": "no shift" if shift == 0 else f"{'+' if shift > 0 else ''}{shift} semitones",
        "shiftedSongRange": {
            "low": midi_to_note(song_low + shift),
            "high": midi_to_note(song_high + shift),
        },
        "fitsAfterShift": fits,
        "formantPreservationRecommended": includes_guide or abs(shift) >= 3,
        "reason": (
            "Selected the smallest comfortable key shift that keeps the song inside the current safe range."
            if fits
            else "No shift within the configured limit fully fits; selected the least risky option."
        ),
    }


# --- Coaching payload --------------------------------------------------------

def build_coaching_payload(payload: dict) -> dict:
    metrics = payload.get("metrics", {})
    error_log = payload.get("errorLog", []) or []
    return {
        "systemPrompt": (
            "You are a clinical vocal pedagogy coach. Be warm, precise, and safety-first. "
            "Translate technical metrics into plain practice guidance. Never quote raw semitone "
            "deviations to the learner."
        ),
        "payload": {
            "u_id": payload.get("userId"),
            "v_type": payload.get("voiceType"),
            "v_color": payload.get("voiceColor"),
            "rng": payload.get("range"),
            "song_key_shift": payload.get("songKeyShift"),
            "metrics": {
                "rpa": metrics.get("rpa"),
                "v_stab": metrics.get("vStab"),
                "avqi": metrics.get("avqi"),
                "cpps": metrics.get("cpps"),
            },
            "err_log": [
                {
                    "ts": e.get("ts"),
                    "err": e.get("err"),
                    "dev_st": e.get("devSt"),
                    "hnr_drop": 1 if e.get("hnrDrop") else None,
                    "tech": e.get("tech", "unknown"),
                }
                for e in error_log
            ],
        },
        "guardrails": [
            "Do not diagnose disease.",
            "Tell the learner to stop and rest when strain risk is present.",
            "Prefer breath, siren, lip trill, staccato, and vowel modification drills.",
            "Do not expose raw model internals in user-facing coaching.",
        ],
    }



# --- Vocal health validation -------------------------------------------------

DEFAULT_HEALTH_THRESHOLDS = {
    "maxJitterPct": 1.0,
    "maxShimmerPct": 5.0,
    "minHnrDb": 15.0,
    "minCppsDb": 14.0,
    "minPitchStability": 70.0,
    "minLevelStability": 65.0,
}


def _assess_max(value, threshold: float, warn_multiplier: float = 1.5) -> str:
    if value is None:
        return "unknown"
    value = float(value)
    if value <= threshold:
        return "pass"
    if value <= threshold * warn_multiplier:
        return "warn"
    return "fail"


def _assess_min(value, threshold: float, warn_margin: float = 3.0) -> str:
    if value is None:
        return "unknown"
    value = float(value)
    if value >= threshold:
        return "pass"
    if value >= threshold - warn_margin:
        return "warn"
    return "fail"


def _health_status(statuses: list[str]) -> str:
    if "fail" in statuses:
        return "FAIL"
    if "warn" in statuses or "unknown" in statuses:
        return "WARN"
    return "PASS"


def analyze_health(payload: dict) -> dict:
    metrics = payload.get("metrics", payload) or {}
    thresholds = {**DEFAULT_HEALTH_THRESHOLDS, **(payload.get("thresholds") or {})}
    checks = {
        "jitter": {
            "value": metrics.get("jitterPct"),
            "unit": "%",
            "threshold": f"<= {thresholds['maxJitterPct']}%",
            "status": _assess_max(metrics.get("jitterPct"), thresholds["maxJitterPct"]),
            "meaning": "Frequency stability; high values can suggest tension or unstable onset.",
        },
        "shimmer": {
            "value": metrics.get("shimmerPct"),
            "unit": "%",
            "threshold": f"<= {thresholds['maxShimmerPct']}%",
            "status": _assess_max(metrics.get("shimmerPct"), thresholds["maxShimmerPct"]),
            "meaning": "Amplitude stability; high values often point to inconsistent breath support.",
        },
        "hnr": {
            "value": metrics.get("hnrDb"),
            "unit": "dB",
            "threshold": f">= {thresholds['minHnrDb']} dB",
            "status": _assess_min(metrics.get("hnrDb"), thresholds["minHnrDb"]),
            "meaning": "Harmonic clarity; low values can sound breathy or noisy.",
        },
        "cpps": {
            "value": metrics.get("cppsDb"),
            "unit": "dB",
            "threshold": f">= {thresholds['minCppsDb']} dB",
            "status": _assess_min(metrics.get("cppsDb"), thresholds["minCppsDb"]),
            "meaning": "Cepstral peak strength; low values can indicate weak vocal fold closure.",
        },
        "pitchStability": {
            "value": metrics.get("pitchStability"),
            "unit": "/100",
            "threshold": f">= {thresholds['minPitchStability']}",
            "status": _assess_min(metrics.get("pitchStability"), thresholds["minPitchStability"], 10.0),
            "meaning": "How steadily the tone holds its target pitch.",
        },
        "levelStability": {
            "value": metrics.get("levelStability"),
            "unit": "/100",
            "threshold": f">= {thresholds['minLevelStability']}",
            "status": _assess_min(metrics.get("levelStability"), thresholds["minLevelStability"], 10.0),
            "meaning": "How evenly the airflow and loudness are maintained.",
        },
    }
    status = _health_status([check["status"] for check in checks.values()])
    recommendations = []
    if checks["jitter"]["status"] == "fail" or checks["pitchStability"]["status"] == "fail":
        recommendations.append("Release jaw and tongue tension, then retry on a gentler hum or lip trill.")
    if checks["shimmer"]["status"] == "fail" or checks["levelStability"]["status"] == "fail":
        recommendations.append("Reset with a low diaphragmatic inhale and let the air flow evenly instead of pushing volume.")
    if checks["hnr"]["status"] == "fail" or checks["cpps"]["status"] == "fail":
        recommendations.append("Use straw phonation for 30 seconds to encourage cleaner vocal fold closure without squeezing.")
    if not recommendations and status == "PASS":
        recommendations.append("The tone is stable enough for this drill. Keep the same easy breath setup and avoid adding force.")
    if not recommendations:
        recommendations.append("Some metrics are missing or borderline. Repeat the take in a quiet room with a steady comfortable pitch.")
    return {
        "exerciseName": payload.get("exerciseName", "Warm-up health check"),
        "status": status,
        "approximate": bool(metrics.get("approximate", False)),
        "thresholds": thresholds,
        "checks": checks,
        "recommendations": recommendations,
        "safetyNote": "This is acoustic training feedback, not a medical diagnosis. Stop and rest if you feel pain, burning, or persistent hoarseness.",
    }


# --- Technique threshold validation -----------------------------------------

def _technique_status(statuses: list[str]) -> str:
    if "fail" in statuses:
        return "FAIL"
    if "warn" in statuses or "unknown" in statuses:
        return "WARN"
    return "PASS"


def analyze_technique(payload: dict) -> dict:
    checks = {}
    recommendations = []

    pitch = payload.get("pitch")
    if pitch:
        error = abs(float(pitch["deviationCents"]))
        threshold = float(pitch.get("thresholdCents", 50))
        status = "pass" if error <= threshold else "warn" if error <= threshold * 1.5 else "fail"
        checks["pitchAccuracy"] = {
            "value": pitch["deviationCents"],
            "threshold": f"within +/- {threshold} cents",
            "status": status,
            "meaning": "Detects flat or sharp singing against the target note.",
        }
        if status == "fail":
            recommendations.append("Slow the phrase down and match the target pitch on a neutral vowel before singing the full line.")

    rhythm = payload.get("rhythm")
    if rhythm:
        distance = float(rhythm["dtwDistance"])
        threshold = float(rhythm["maxDtwDistance"])
        status = "pass" if distance <= threshold else "warn" if distance <= threshold * 1.25 else "fail"
        checks["rhythmAlignment"] = {
            "value": distance,
            "threshold": f"DTW distance <= {threshold}",
            "status": status,
            "meaning": "Checks timing against the target beat or sheet phrase.",
        }
        if status == "fail":
            recommendations.append("Tap the pulse first, then sing the phrase on one syllable before restoring the lyrics.")

    passaggio = payload.get("passaggio")
    if passaggio:
        breaks = int(passaggio["voiceBreaks"])
        status = "pass" if breaks == 0 else "warn" if breaks == 1 else "fail"
        checks["voiceBreaks"] = {
            "value": breaks,
            "threshold": "0 voice breaks on sustained vowels or sirens",
            "status": status,
            "meaning": "Evaluates smooth transition through the passaggio.",
        }
        if status != "pass":
            note = f" near {passaggio.get('breakNote')}" if passaggio.get("breakNote") else ""
            recommendations.append(f"Use a lighter siren and narrow the vowel toward oo/oh{note} instead of pushing chest voice upward.")

    vibrato = payload.get("vibrato")
    if vibrato:
        rate = float(vibrato["rateHz"])
        extent = float(vibrato["extentCents"])
        status = "pass"
        if rate < 4 or rate > 8 or extent < 20 or extent > 80:
            status = "fail"
        elif rate < 5 or rate > 7 or extent < 30 or extent > 50:
            status = "warn"
        checks["vibrato"] = {
            "value": {"rateHz": rate, "extentCents": extent},
            "threshold": "rate 5-7 Hz, extent +/- 30-50 cents; warn below 4 Hz or above 8 Hz",
            "status": status,
            "meaning": "Detects healthy vibrato versus wobble or tremolo.",
        }
        if status == "fail":
            recommendations.append("Return to a straight, easy tone, then let vibrato emerge from steady airflow instead of shaking the jaw.")

    singer_formant = payload.get("singerFormant")
    if singer_formant:
        peak_freq = float(singer_formant["peakFreqHz"])
        peak_dbfs = float(singer_formant["peakDbfs"])
        in_band = 2400 <= peak_freq <= 3000
        strong = peak_dbfs >= -20
        status = "pass" if in_band and strong else "warn" if in_band or strong else "fail"
        checks["singersFormant"] = {
            "value": singer_formant,
            "threshold": "LTAS peak 2.4-3.0 kHz and >= -20 dBFS",
            "status": status,
            "meaning": "Assesses professional vocal ring and carrying power.",
        }
        if status != "pass":
            recommendations.append("Keep the throat spacious, avoid tongue root tension, and seek ring through resonance rather than loudness.")

    formants = payload.get("formants")
    if formants:
        checks["formants"] = {
            "value": formants,
            "threshold": "tracked F1/F2 for vowel modification decisions",
            "status": "pass",
            "meaning": "Tracks vowel shaping for resonance tuning and passaggio coverage.",
        }

    if not checks:
        checks["input"] = {
            "value": None,
            "threshold": "at least one technique metric group is required",
            "status": "unknown",
            "meaning": "No technique metrics were supplied.",
        }
        recommendations.append("Run a pitch, passaggio, vibrato, or singer formant analysis before requesting validation.")

    if not recommendations:
        recommendations.append("Technique metrics are inside the configured training thresholds. Keep the same setup and repeat for consistency.")

    return {
        "exerciseName": payload.get("exerciseName", "Technique validation"),
        "status": _technique_status([check["status"] for check in checks.values()]),
        "checks": checks,
        "recommendations": recommendations,
        "safetyNote": "If high notes cause pain, stop the drill and return to a lower, easier siren or lip trill.",
    }

# --- Approximate signal metrics ---------------------------------------------

def _frame_rms(y: np.ndarray, frame_length: int = 2048, hop: int = 512) -> np.ndarray:
    if y.size < frame_length:
        y = np.pad(y, (0, frame_length - y.size))
    values = []
    for start in range(0, max(1, y.size - frame_length + 1), hop):
        frame = y[start:start + frame_length]
        if frame.size < frame_length:
            frame = np.pad(frame, (0, frame_length - frame.size))
        values.append(float(np.sqrt(np.mean(np.square(frame)))))
    return np.asarray(values, dtype=np.float64)


def _spectral_flatness_np(y: np.ndarray, frame_length: int = 2048, hop: int = 512) -> float:
    if y.size < frame_length:
        y = np.pad(y, (0, frame_length - y.size))
    flatness_values = []
    window = np.hanning(frame_length)
    for start in range(0, max(1, y.size - frame_length + 1), hop):
        frame = y[start:start + frame_length]
        if frame.size < frame_length:
            frame = np.pad(frame, (0, frame_length - frame.size))
        spectrum = np.abs(np.fft.rfft(frame * window)) ** 2 + 1e-12
        geometric = float(np.exp(np.mean(np.log(spectrum))))
        arithmetic = float(np.mean(spectrum))
        flatness_values.append(geometric / (arithmetic + 1e-12))
    return float(np.mean(flatness_values)) if flatness_values else 1.0


def approximate_metrics(f0_hz_track, y: np.ndarray, sr: int) -> dict:
    """Rough stability metrics from an f0 track and the waveform.

    These are approximate proxies for teaching, not clinical jitter/shimmer/HNR.
    They intentionally avoid librosa at runtime so the worker still runs when
    librosa's optional numba stack is unavailable.
    """
    f0 = np.asarray([np.nan if v is None else float(v) for v in f0_hz_track], dtype=np.float64)
    f0 = f0[~np.isnan(f0)]
    f0 = f0[f0 > 0]
    out = {"approximate": True}

    if f0.size >= 3:
        midi = 69 + 12 * np.log2(f0 / 440.0)
        cents_dev = (midi - np.round(midi)) * 100
        out["pitchStability"] = round(float(np.clip(100 - np.std(cents_dev) * 3, 0, 100)), 1)
        out["jitterPct"] = round(float(np.mean(np.abs(np.diff(f0))) / np.mean(f0) * 100), 3)
    else:
        out["pitchStability"] = 0.0
        out["jitterPct"] = None

    rms = _frame_rms(np.asarray(y, dtype=np.float64))
    if rms.size >= 3 and np.mean(rms) > 1e-6:
        out["shimmerPct"] = round(float(np.mean(np.abs(np.diff(rms))) / (np.mean(rms) + 1e-9) * 100), 3)
        out["levelStability"] = round(float(np.clip(100 - np.std(rms) / (np.mean(rms) + 1e-9) * 100, 0, 100)), 1)
        noise_ratio = float(np.clip(_spectral_flatness_np(np.asarray(y, dtype=np.float64)), 1e-6, 0.999999))
        out["hnrDb"] = round(float(np.clip(10 * np.log10((1 - noise_ratio) / noise_ratio), -20, 40)), 2)
        out["cppsDb"] = round(float(np.clip(8 + out.get("pitchStability", 0) * 0.07 + out.get("levelStability", 0) * 0.02, 0, 40)), 2)
    else:
        out["shimmerPct"] = None
        out["levelStability"] = 0.0
        out["hnrDb"] = None
        out["cppsDb"] = None

    return out

# --- EduX acoustic feature estimates ----------------------------------------

def _valid_f0_array(f0_track) -> np.ndarray:
    values = []
    for value in f0_track or []:
        if value is None:
            values.append(np.nan)
            continue
        try:
            hz = float(value)
        except (TypeError, ValueError):
            hz = np.nan
        values.append(hz if hz > 0 else np.nan)
    return np.asarray(values, dtype=np.float64)


def _hz_to_cents_relative(f0: np.ndarray) -> np.ndarray:
    voiced = f0[~np.isnan(f0)]
    voiced = voiced[voiced > 0]
    if voiced.size == 0:
        return np.asarray([], dtype=np.float64)
    center = float(np.median(voiced))
    return 1200.0 * np.log2(voiced / center)


def detect_voice_breaks(f0_track, jump_threshold_cents: float = 250.0) -> dict:
    """Detect sudden f0 jumps using first-order cents derivative."""
    f0 = _valid_f0_array(f0_track)
    voiced = f0[~np.isnan(f0)]
    voiced = voiced[voiced > 0]
    if voiced.size < 3:
        return {"voiceBreaks": 0, "breakIndices": [], "maxJumpCents": 0.0}

    cents = 1200.0 * np.log2(voiced[1:] / voiced[:-1])
    jumps = np.abs(cents)
    break_indices = np.flatnonzero(jumps >= jump_threshold_cents).astype(int).tolist()
    return {
        "voiceBreaks": len(break_indices),
        "breakIndices": break_indices[:20],
        "maxJumpCents": round(float(np.max(jumps)), 2) if jumps.size else 0.0,
    }


def estimate_vibrato(f0_track, frame_rate_hz: float | None = None) -> dict | None:
    """Estimate vibrato rate and extent from a sustained f0 track."""
    try:
        from scipy import signal
    except Exception:
        signal = None

    f0 = _valid_f0_array(f0_track)
    cents = _hz_to_cents_relative(f0)
    if cents.size < 12:
        return None

    frame_rate = float(frame_rate_hz or 50.0)
    cents = cents - np.mean(cents)
    extent = float((np.percentile(cents, 95) - np.percentile(cents, 5)) / 2.0)
    if signal is None:
        crossings = np.flatnonzero(np.diff(np.signbit(cents)))
        duration = max(cents.size / frame_rate, 1e-6)
        rate = float((len(crossings) / 2.0) / duration)
    else:
        freqs, power = signal.periodogram(cents, fs=frame_rate)
        band = (freqs >= 3.0) & (freqs <= 9.0)
        if not np.any(band):
            return None
        rate = float(freqs[band][np.argmax(power[band])])

    return {
        "rateHz": round(rate, 2),
        "extentCents": round(extent, 2),
    }


def estimate_singers_formant(y: np.ndarray, sr: int) -> dict | None:
    """Estimate LTAS singer-formant peak and SPR from a waveform."""
    try:
        from scipy import signal
    except Exception:
        return None

    if y.size < max(512, sr // 20):
        return None
    freqs, power = signal.welch(np.asarray(y, dtype=np.float64), fs=sr, nperseg=min(4096, y.size))
    power = np.maximum(power, 1e-12)

    singer_band = (freqs >= 2400) & (freqs <= 3000)
    low_band = (freqs >= 0) & (freqs < 2000)
    high_band = (freqs >= 2000) & (freqs <= 4000)
    if not np.any(singer_band) or not np.any(low_band) or not np.any(high_band):
        return None

    band_power = power[singer_band]
    band_freqs = freqs[singer_band]
    peak_index = int(np.argmax(band_power))
    peak_power = float(band_power[peak_index])
    high_power = float(np.mean(power[high_band]))
    low_power = float(np.mean(power[low_band]))
    return {
        "peakFreqHz": round(float(band_freqs[peak_index]), 2),
        "peakDbfs": round(float(10.0 * np.log10(peak_power)), 2),
        "sprDb": round(float(10.0 * np.log10((high_power + 1e-12) / (low_power + 1e-12))), 2),
    }


def estimate_formants_lpc(y: np.ndarray, sr: int, order: int = 12) -> dict | None:
    """Estimate F1/F2 with LPC roots for vowel-tuning feedback."""
    try:
        import librosa
    except Exception:
        return None

    if y.size < max(order * 8, sr // 20):
        return None
    segment = np.asarray(y, dtype=np.float64)
    if np.max(np.abs(segment)) > 0:
        segment = segment / np.max(np.abs(segment))
    segment = segment * np.hamming(segment.size)
    try:
        coeffs = librosa.lpc(segment, order=order)
    except Exception:
        return None
    roots = np.roots(coeffs)
    roots = roots[np.imag(roots) >= 0.01]
    angles = np.arctan2(np.imag(roots), np.real(roots))
    freqs = np.sort(angles * (sr / (2 * np.pi)))
    formants = [float(freq) for freq in freqs if 90 <= freq <= 5000]
    if len(formants) < 2:
        return None
    return {"f1Hz": round(formants[0], 2), "f2Hz": round(formants[1], 2), "method": "lpc"}


def estimate_technique_metrics(f0_track, y: np.ndarray | None = None, sr: int | None = None, frame_rate_hz: float | None = None) -> dict:
    """Build a technique payload compatible with analyze_technique from audio/f0."""
    result: dict = {}
    f0 = _valid_f0_array(f0_track)
    voiced = f0[~np.isnan(f0)]
    voiced = voiced[voiced > 0]
    if voiced.size:
        median_hz = float(np.median(voiced))
        nearest_midi = np.round(69 + 12 * np.log2(median_hz / 440.0))
        target_hz = 440.0 * (2 ** ((nearest_midi - 69) / 12.0))
        result["pitch"] = {"deviationCents": round(float(1200 * np.log2(median_hz / target_hz)), 2)}
        result["passaggio"] = detect_voice_breaks(f0_track)
        vibrato = estimate_vibrato(f0_track, frame_rate_hz)
        if vibrato:
            result["vibrato"] = vibrato

    if y is not None and sr is not None:
        singer_formant = estimate_singers_formant(y, int(sr))
        if singer_formant:
            result["singerFormant"] = singer_formant
        formants = estimate_formants_lpc(y, int(sr))
        if formants:
            result["formants"] = formants
    return result

