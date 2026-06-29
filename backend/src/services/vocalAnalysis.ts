import type {
  CoachingPayloadInput,
  HealthAnalysisInput,
  RangeAnalysisInput,
  TechniqueAnalysisInput,
  TranspositionInput,
} from '../schemas/vocal';

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

const SEMITONE_TO_NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteToMidi(note: string) {
  const match = /^([A-G])(#|b)?(-?\d)$/.exec(note);
  if (!match) throw new Error(`Invalid note: ${note}`);
  const pitchClass = `${match[1]}${match[2] ?? ''}`;
  const octave = Number(match[3]);
  return (octave + 1) * 12 + NOTE_TO_SEMITONE[pitchClass];
}

function midiToNote(midi: number) {
  const pitchClass = SEMITONE_TO_NOTE[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${pitchClass}${octave}`;
}

function classifyVoice(low: number, high: number, singerGroup: RangeAnalysisInput['singerGroup']) {
  if (singerGroup === 'female') {
    if (high >= noteToMidi('C6')) return 'Coloratura Soprano';
    if (high >= noteToMidi('A5')) return 'Soprano';
    if (low <= noteToMidi('F3') && high <= noteToMidi('F5')) return 'Contralto / Alto';
    return 'Mezzo-Soprano';
  }

  if (singerGroup === 'male') {
    if (high >= noteToMidi('B4')) return 'Lyric Tenor';
    if (high >= noteToMidi('G4')) return 'Tenor';
    if (low <= noteToMidi('E2')) return 'Bass';
    return 'Baritone';
  }

  const center = (low + high) / 2;
  if (center < noteToMidi('C4')) return low <= noteToMidi('E2') ? 'Bass' : 'Baritone';
  if (center > noteToMidi('G4')) return high >= noteToMidi('C6') ? 'Coloratura Soprano' : 'Soprano';
  return 'Mezzo-Soprano / Tenor';
}

function voiceColorFor(low: number, high: number) {
  const center = (low + high) / 2;
  return center < noteToMidi('C4')
    ? 'Tho - warm, grounded, powerful'
    : 'Kim - bright, clear, agile';
}

function passaggioHintFor(voiceType: string) {
  if (voiceType.includes('Bass')) return 'Likely passaggio focus around A3-C4';
  if (voiceType.includes('Baritone')) return 'Likely passaggio focus around B3-E4';
  if (voiceType.includes('Tenor')) return 'Likely passaggio focus around E4-G4';
  if (voiceType.includes('Contralto')) return 'Likely passaggio focus around E4-G4';
  if (voiceType.includes('Mezzo')) return 'Likely passaggio focus around F4-A4';
  return 'Likely passaggio focus around A4-C5';
}

export function analyzeRange(input: RangeAnalysisInput) {
  const stable = input.notes.filter(
    (note) => note.durationMs >= input.minDurationMs && note.confidence >= input.minConfidence
  );

  if (stable.length < 2) {
    return null;
  }

  const midiNotes = stable.map((note) => noteToMidi(note.note));
  const low = Math.min(...midiNotes);
  const high = Math.max(...midiNotes);
  const voiceType = classifyVoice(low, high, input.singerGroup);

  return {
    lowestStableNote: midiToNote(low),
    highestStableNote: midiToNote(high),
    rangeSemitones: high - low,
    voiceType,
    voiceColor: voiceColorFor(low, high),
    passaggioHint: passaggioHintFor(voiceType),
    roadmapStage: high - low < 18 ? 'beginner' : high - low < 28 ? 'intermediate' : 'advanced',
    acceptedSamples: stable.length,
    rejectedSamples: input.notes.length - stable.length,
  };
}

export function calculateTransposition(input: TranspositionInput) {
  const voiceLow = noteToMidi(input.voiceRange.low);
  const voiceHigh = noteToMidi(input.voiceRange.high);
  const songLow = noteToMidi(input.songRange.low);
  const songHigh = noteToMidi(input.songRange.high);
  const tessituraLow = noteToMidi(input.songRange.tessituraLow ?? input.songRange.low);
  const tessituraHigh = noteToMidi(input.songRange.tessituraHigh ?? input.songRange.high);
  const voiceCenter = (voiceLow + voiceHigh) / 2;

  let best = { shift: 0, score: Number.POSITIVE_INFINITY, outOfRange: 0 };
  for (let shift = -input.maxShiftSemitones; shift <= input.maxShiftSemitones; shift++) {
    const shiftedLow = songLow + shift;
    const shiftedHigh = songHigh + shift;
    const shiftedTessituraCenter = (tessituraLow + tessituraHigh) / 2 + shift;
    const outOfRange =
      Math.max(0, voiceLow - shiftedLow) + Math.max(0, shiftedHigh - voiceHigh);
    const score = outOfRange * 10 + Math.abs(shift) * 0.8 + Math.abs(shiftedTessituraCenter - voiceCenter) * 0.15;
    if (score < best.score) best = { shift, score, outOfRange };
  }

  return {
    shiftSemitones: best.shift,
    shiftLabel: best.shift === 0 ? 'no shift' : `${best.shift > 0 ? '+' : ''}${best.shift} semitones`,
    shiftedSongRange: {
      low: midiToNote(songLow + best.shift),
      high: midiToNote(songHigh + best.shift),
    },
    fitsAfterShift: best.outOfRange === 0,
    formantPreservationRecommended: input.includesGuideVocal || Math.abs(best.shift) >= 3,
    reason:
      best.outOfRange === 0
        ? 'Selected the smallest comfortable key shift that keeps the song inside the current safe range.'
        : 'No shift within the configured limit fully fits; selected the least risky option.',
  };
}


const DEFAULT_HEALTH_THRESHOLDS = {
  maxJitterPct: 1.0,
  maxShimmerPct: 5.0,
  minHnrDb: 15.0,
  minCppsDb: 14.0,
  minPitchStability: 70,
  minLevelStability: 65,
};

type HealthMetricStatus = 'pass' | 'warn' | 'fail' | 'unknown';
type HealthStatus = 'PASS' | 'WARN' | 'FAIL';

function assessMaxMetric(value: number | null | undefined, threshold: number, warnMultiplier = 1.5): HealthMetricStatus {
  if (value == null) return 'unknown';
  if (value <= threshold) return 'pass';
  if (value <= threshold * warnMultiplier) return 'warn';
  return 'fail';
}

function assessMinMetric(value: number | null | undefined, threshold: number, warnMargin = 3): HealthMetricStatus {
  if (value == null) return 'unknown';
  if (value >= threshold) return 'pass';
  if (value >= threshold - warnMargin) return 'warn';
  return 'fail';
}

function summarizeHealthStatus(statuses: HealthMetricStatus[]): HealthStatus {
  if (statuses.includes('fail')) return 'FAIL';
  if (statuses.includes('warn') || statuses.includes('unknown')) return 'WARN';
  return 'PASS';
}

export function analyzeVocalHealth(input: HealthAnalysisInput) {
  const thresholds = { ...DEFAULT_HEALTH_THRESHOLDS, ...input.thresholds };
  const metrics = input.metrics;
  const checks = {
    jitter: {
      value: metrics.jitterPct ?? null,
      unit: '%',
      threshold: `<= ${thresholds.maxJitterPct}%`,
      status: assessMaxMetric(metrics.jitterPct, thresholds.maxJitterPct),
      meaning: 'Frequency stability; high values can suggest tension or unstable onset.',
    },
    shimmer: {
      value: metrics.shimmerPct ?? null,
      unit: '%',
      threshold: `<= ${thresholds.maxShimmerPct}%`,
      status: assessMaxMetric(metrics.shimmerPct, thresholds.maxShimmerPct),
      meaning: 'Amplitude stability; high values often point to inconsistent breath support.',
    },
    hnr: {
      value: metrics.hnrDb ?? null,
      unit: 'dB',
      threshold: `>= ${thresholds.minHnrDb} dB`,
      status: assessMinMetric(metrics.hnrDb, thresholds.minHnrDb),
      meaning: 'Harmonic clarity; low values can sound breathy or noisy.',
    },
    cpps: {
      value: metrics.cppsDb ?? null,
      unit: 'dB',
      threshold: `>= ${thresholds.minCppsDb} dB`,
      status: assessMinMetric(metrics.cppsDb, thresholds.minCppsDb),
      meaning: 'Cepstral peak strength; low values can indicate weak vocal fold closure.',
    },
    pitchStability: {
      value: metrics.pitchStability ?? null,
      unit: '/100',
      threshold: `>= ${thresholds.minPitchStability}`,
      status: assessMinMetric(metrics.pitchStability, thresholds.minPitchStability, 10),
      meaning: 'How steadily the tone holds its target pitch.',
    },
    levelStability: {
      value: metrics.levelStability ?? null,
      unit: '/100',
      threshold: `>= ${thresholds.minLevelStability}`,
      status: assessMinMetric(metrics.levelStability, thresholds.minLevelStability, 10),
      meaning: 'How evenly the airflow and loudness are maintained.',
    },
  };

  const statuses = Object.values(checks).map((check) => check.status);
  const status = summarizeHealthStatus(statuses);
  const recommendations: string[] = [];

  if (checks.jitter.status === 'fail' || checks.pitchStability.status === 'fail') {
    recommendations.push('Release jaw and tongue tension, then retry on a gentler hum or lip trill.');
  }
  if (checks.shimmer.status === 'fail' || checks.levelStability.status === 'fail') {
    recommendations.push('Reset with a low diaphragmatic inhale and let the air flow evenly instead of pushing volume.');
  }
  if (checks.hnr.status === 'fail' || checks.cpps.status === 'fail') {
    recommendations.push('Use straw phonation for 30 seconds to encourage cleaner vocal fold closure without squeezing.');
  }
  if (!recommendations.length && status === 'PASS') {
    recommendations.push('The tone is stable enough for this drill. Keep the same easy breath setup and avoid adding force.');
  }
  if (!recommendations.length) {
    recommendations.push('Some metrics are missing or borderline. Repeat the take in a quiet room with a steady comfortable pitch.');
  }

  return {
    exerciseName: input.exerciseName,
    status,
    approximate: metrics.approximate,
    thresholds,
    checks,
    recommendations,
    safetyNote:
      'This is acoustic training feedback, not a medical diagnosis. Stop and rest if you feel pain, burning, or persistent hoarseness.',
  };
}

type TechniqueMetricStatus = 'pass' | 'warn' | 'fail' | 'unknown';
type TechniqueStatus = 'PASS' | 'WARN' | 'FAIL';

function summarizeTechniqueStatus(statuses: TechniqueMetricStatus[]): TechniqueStatus {
  if (statuses.includes('fail')) return 'FAIL';
  if (statuses.includes('warn') || statuses.includes('unknown')) return 'WARN';
  return 'PASS';
}

export function analyzeTechnique(input: TechniqueAnalysisInput) {
  const checks: Record<string, { status: TechniqueMetricStatus; meaning: string; value: unknown; threshold: string }> = {};
  const recommendations: string[] = [];

  if (input.pitch) {
    const error = Math.abs(input.pitch.deviationCents);
    const status: TechniqueMetricStatus = error <= input.pitch.thresholdCents ? 'pass' : error <= input.pitch.thresholdCents * 1.5 ? 'warn' : 'fail';
    checks.pitchAccuracy = {
      value: input.pitch.deviationCents,
      threshold: `within +/- ${input.pitch.thresholdCents} cents`,
      status,
      meaning: 'Detects flat or sharp singing against the target note.',
    };
    if (status === 'fail') {
      recommendations.push('Slow the phrase down and match the target pitch on a neutral vowel before singing the full line.');
    }
  }

  if (input.rhythm) {
    const status: TechniqueMetricStatus = input.rhythm.dtwDistance <= input.rhythm.maxDtwDistance ? 'pass' : input.rhythm.dtwDistance <= input.rhythm.maxDtwDistance * 1.25 ? 'warn' : 'fail';
    checks.rhythmAlignment = {
      value: input.rhythm.dtwDistance,
      threshold: `DTW distance <= ${input.rhythm.maxDtwDistance}`,
      status,
      meaning: 'Checks timing against the target beat or sheet phrase.',
    };
    if (status === 'fail') {
      recommendations.push('Tap the pulse first, then sing the phrase on one syllable before restoring the lyrics.');
    }
  }

  if (input.passaggio) {
    const status: TechniqueMetricStatus = input.passaggio.voiceBreaks === 0 ? 'pass' : input.passaggio.voiceBreaks === 1 ? 'warn' : 'fail';
    checks.voiceBreaks = {
      value: input.passaggio.voiceBreaks,
      threshold: '0 voice breaks on sustained vowels or sirens',
      status,
      meaning: 'Evaluates smooth transition through the passaggio.',
    };
    if (status !== 'pass') {
      const note = input.passaggio.breakNote ? ` near ${input.passaggio.breakNote}` : '';
      recommendations.push(`Use a lighter siren and narrow the vowel toward oo/oh${note} instead of pushing chest voice upward.`);
    }
  }

  if (input.vibrato) {
    const rate = input.vibrato.rateHz;
    const extent = input.vibrato.extentCents;
    let status: TechniqueMetricStatus = 'pass';
    if (rate < 4 || rate > 8 || extent < 20 || extent > 80) status = 'fail';
    else if (rate < 5 || rate > 7 || extent < 30 || extent > 50) status = 'warn';
    checks.vibrato = {
      value: { rateHz: rate, extentCents: extent },
      threshold: 'rate 5-7 Hz, extent +/- 30-50 cents; warn below 4 Hz or above 8 Hz',
      status,
      meaning: 'Detects healthy vibrato versus wobble or tremolo.',
    };
    if (status === 'fail') {
      recommendations.push('Return to a straight, easy tone, then let vibrato emerge from steady airflow instead of shaking the jaw.');
    }
  }

  if (input.singerFormant) {
    const inBand = input.singerFormant.peakFreqHz >= 2400 && input.singerFormant.peakFreqHz <= 3000;
    const strongEnough = input.singerFormant.peakDbfs >= -20;
    const status: TechniqueMetricStatus = inBand && strongEnough ? 'pass' : inBand || strongEnough ? 'warn' : 'fail';
    checks.singersFormant = {
      value: input.singerFormant,
      threshold: 'LTAS peak 2.4-3.0 kHz and >= -20 dBFS',
      status,
      meaning: 'Assesses professional vocal ring and carrying power.',
    };
    if (status !== 'pass') {
      recommendations.push('Keep the throat spacious, avoid tongue root tension, and seek ring through resonance rather than loudness.');
    }
  }

  if (input.formants) {
    checks.formants = {
      value: input.formants,
      threshold: 'tracked F1/F2 for vowel modification decisions',
      status: 'pass',
      meaning: 'Tracks vowel shaping for resonance tuning and passaggio coverage.',
    };
  }

  if (!Object.keys(checks).length) {
    checks.input = {
      value: null,
      threshold: 'at least one technique metric group is required',
      status: 'unknown',
      meaning: 'No technique metrics were supplied.',
    };
    recommendations.push('Run a pitch, passaggio, vibrato, or singer formant analysis before requesting validation.');
  }

  if (!recommendations.length) {
    recommendations.push('Technique metrics are inside the configured training thresholds. Keep the same setup and repeat for consistency.');
  }

  const status = summarizeTechniqueStatus(Object.values(checks).map((check) => check.status));

  return {
    exerciseName: input.exerciseName,
    status,
    checks,
    recommendations,
    safetyNote: 'If high notes cause pain, stop the drill and return to a lower, easier siren or lip trill.',
  };
}
export function buildCoachingPayload(input: CoachingPayloadInput) {
  const systemPrompt = `You are Sime, an expert clinical vocal pedagogy AI. Your goal is to guide the user through their current lesson context. 
Be encouraging, precise, and prioritize vocal health.
CRITICAL RULES:
1. Do not quote raw technical metrics (like semitone deviations, CPPS, or Hz values) to the user. Instead, translate them into actionable, physical sensations (e.g., 'relax your jaw', 'breathe lower').
2. Provide short, focused advice strictly related to the current drill and the user's reported issue. Keep your response under 3 paragraphs.
3. If the user mentions strain or pain, immediately advise them to stop and rest.
4. Adapt your advice to their specific voice profile (Voice Type and Range).`;

  return {
    systemPrompt,
    payload: {
      lesson_context: input.context || 'General practice session',
      u_id: input.userId,
      v_type: input.voiceType,
      v_color: input.voiceColor,
      rng: input.range,
      song_key_shift: input.songKeyShift,
      metrics: {
        rpa: input.metrics.rpa,
        v_stab: input.metrics.vStab,
        avqi: input.metrics.avqi,
        cpps: input.metrics.cpps,
      },
      err_log: input.errorLog.map((entry) => ({
        ts: entry.ts,
        err: entry.err,
        dev_st: entry.devSt,
        hnr_drop: entry.hnrDrop ? 1 : undefined,
        tech: entry.tech,
      })),
    },
    guardrails: [
      'Do not diagnose disease.',
      'Tell the learner to stop and rest when strain risk is present.',
      'Prefer breath, siren, lip trill, staccato, and vowel modification drills.',
      'Do not expose raw model internals in user-facing coaching.',
    ],
  };
}


