import type { Subject } from './lessons';

const HEALTH_THRESHOLDS = {
  maxJitterPct: 1.0,
  maxShimmerPct: 5.0,
  minHnrDb: 15.0,
  cppsTracked: true,
};

const PITCH_THRESHOLDS = {
  maxAbsDeviationCents: 50,
  rhythmAlignment: 'dtw',
};

const PASSAGGIO_THRESHOLDS = {
  maxVoiceBreaks: 0,
  malePassaggio: ['E4', 'F#4'],
  femalePassaggio: ['F5', 'G5'],
};

const VIBRATO_THRESHOLDS = {
  minRateHz: 5,
  maxRateHz: 7,
  minExtentCents: 30,
  maxExtentCents: 50,
  wobbleBelowHz: 4,
  tremoloAboveHz: 8,
};

const SINGER_FORMANT_THRESHOLDS = {
  minPeakHz: 2400,
  maxPeakHz: 3000,
  minPeakDbfs: -20,
  sprFormula: 'powerHigh2To4kHzMinusPowerLow0To2kHz',
};

export const eduxSubject: Subject = {
  id: 'edux-vocal-coach',
  name: 'EduX AI Vocal Coach',
  summary: 'A 24-week virtual vocal coach program from diaphragmatic support to graduation performance.',
  lectures: [
    {
      id: 'edux-basic-month-1',
      title: 'Month 1: Diaphragmatic Breathing and Warm-up',
      summary: 'Build low breath support, steady airflow, lip trills, humming, and acoustic health baselines.',
      lessons: [
        {
          id: 'edux-week-01-diaphragmatic-breathing',
          title: 'Week 1: Diaphragmatic breathing setup',
          durationMin: 20,
          weekNumber: 1,
          targetMetrics: { exercise: 'diaphragmatic_breathing', targetBreathLocation: 'low_ribs_belly' },
        },
        {
          id: 'edux-week-02-ssst-exhalation',
          title: 'Week 2: Ssst exhalation 20-30 seconds',
          durationMin: 20,
          weekNumber: 2,
          targetMetrics: { exercise: 'ssst', targetDurationSeconds: [20, 30], amplitudeStability: 'low_fluctuation' },
        },
        {
          id: 'edux-week-03-lip-trill-hum-siren',
          title: 'Week 3: Lip trills, humming, and sirens',
          durationMin: 22,
          weekNumber: 3,
          targetMetrics: { exercise: 'lip_trill_humming_siren', ...HEALTH_THRESHOLDS },
        },
        {
          id: 'edux-week-04-warmup-health-checkpoint',
          title: 'Week 4: Warm-up health checkpoint',
          durationMin: 24,
          weekNumber: 4,
          targetMetrics: { exercise: 'humming_health_check', ...HEALTH_THRESHOLDS, statusRequired: 'PASS' },
        },
      ],
    },
    {
      id: 'edux-basic-month-2',
      title: 'Month 2: Pitch and Sight-Singing',
      summary: 'Train five-tone scales, prima-vista reading, pitch accuracy, and rhythm alignment.',
      lessons: [
        {
          id: 'edux-week-05-five-tone-scale',
          title: 'Week 5: Five-tone scale accuracy',
          durationMin: 22,
          weekNumber: 5,
          targetMetrics: { exercise: 'do_re_mi_fa_sol_scale', ...PITCH_THRESHOLDS },
        },
        {
          id: 'edux-week-06-solfege-stepwise-reading',
          title: 'Week 6: Stepwise solfege sight-singing',
          durationMin: 24,
          weekNumber: 6,
          targetMetrics: { exercise: 'stepwise_sight_singing', clef: 'treble', ...PITCH_THRESHOLDS },
        },
        {
          id: 'edux-week-07-ai-generated-sheet-reading',
          title: 'Week 7: AI-generated sheet reading',
          durationMin: 25,
          weekNumber: 7,
          targetMetrics: { exercise: 'prima_vista_sheet_music', generatedSheetMusic: true, ...PITCH_THRESHOLDS },
        },
        {
          id: 'edux-week-08-pitch-rhythm-checkpoint',
          title: 'Week 8: Pitch and rhythm checkpoint',
          durationMin: 25,
          weekNumber: 8,
          targetMetrics: { task: 'sight_singing', ...PITCH_THRESHOLDS, statusRequired: 'PASS' },
        },
      ],
    },
    {
      id: 'edux-basic-month-3',
      title: 'Month 3: Vocal Registers',
      summary: 'Identify chest and head voice, forward placement, HNR clarity, and register energy shifts.',
      lessons: [
        {
          id: 'edux-week-09-chest-voice-gug',
          title: 'Week 9: Chest voice with Gug',
          durationMin: 22,
          weekNumber: 9,
          targetMetrics: { exercise: 'gug_chest_voice', minHnrDb: 15, registerFocus: 'chest' },
        },
        {
          id: 'edux-week-10-head-voice-hoo',
          title: 'Week 10: Head voice with Hoo',
          durationMin: 22,
          weekNumber: 10,
          targetMetrics: { exercise: 'hoo_head_voice', minHnrDb: 15, registerFocus: 'head' },
        },
        {
          id: 'edux-week-11-forward-nay-placement',
          title: 'Week 11: Nay Nay Nay forward placement',
          durationMin: 24,
          weekNumber: 11,
          targetMetrics: { exercise: 'nay_forward_placement', minHnrDb: 15, resonanceFocus: 'nasal_forward' },
        },
        {
          id: 'edux-week-12-register-checkpoint',
          title: 'Week 12: Chest and head register checkpoint',
          durationMin: 25,
          weekNumber: 12,
          targetMetrics: { exercise: 'register_transition_check', minHnrDb: 15, preferredHnrDb: 20, spectrogramEnergyShiftTracked: true },
        },
      ],
    },
    {
      id: 'edux-advanced-month-4',
      title: 'Month 4: Passaggio and Mix Voice',
      summary: 'Smooth the passaggio with siren glissando, cry/sob setup, and zero voice-break validation.',
      lessons: [
        {
          id: 'edux-week-13-passaggio-map',
          title: 'Week 13: Passaggio mapping',
          durationMin: 24,
          weekNumber: 13,
          targetMetrics: { exercise: 'passaggio_map', ...PASSAGGIO_THRESHOLDS },
        },
        {
          id: 'edux-week-14-siren-glissando',
          title: 'Week 14: Siren glissando through the passaggio',
          durationMin: 25,
          weekNumber: 14,
          targetMetrics: { exercise: 'siren_glissando', continuousF0Tracked: true, ...PASSAGGIO_THRESHOLDS },
        },
        {
          id: 'edux-week-15-cry-sob-mix-setup',
          title: 'Week 15: Cry and sob mix setup',
          durationMin: 25,
          weekNumber: 15,
          targetMetrics: { exercise: 'cry_sob_laryngeal_tilt', setup: 'mix_voice', ...PASSAGGIO_THRESHOLDS },
        },
        {
          id: 'edux-week-16-zero-break-checkpoint',
          title: 'Week 16: Zero-break passaggio checkpoint',
          durationMin: 26,
          weekNumber: 16,
          targetMetrics: { exercise: 'passaggio_checkpoint', firstDerivativeF0BreakDetection: true, ...PASSAGGIO_THRESHOLDS, statusRequired: 'PASS' },
        },
      ],
    },
    {
      id: 'edux-advanced-month-5',
      title: 'Month 5: Formant Tuning and Vibrato',
      summary: 'Tune vowels and measure vibrato rate, extent, and formants with LPC-style targets.',
      lessons: [
        {
          id: 'edux-week-17-vowel-modification',
          title: 'Week 17: Vowel modification on high notes',
          durationMin: 25,
          weekNumber: 17,
          targetMetrics: { exercise: 'vowel_modification', formantsTracked: ['F1', 'F2'], method: 'lpc' },
        },
        {
          id: 'edux-week-18-active-vibrato',
          title: 'Week 18: Active vibrato control',
          durationMin: 24,
          weekNumber: 18,
          targetMetrics: { exercise: 'active_vibrato', ...VIBRATO_THRESHOLDS },
        },
        {
          id: 'edux-week-19-messa-di-voce',
          title: 'Week 19: Messa di voce',
          durationMin: 25,
          weekNumber: 19,
          targetMetrics: { exercise: 'messa_di_voce', dynamicShape: 'piano_forte_piano', ...VIBRATO_THRESHOLDS },
        },
        {
          id: 'edux-week-20-formant-vibrato-checkpoint',
          title: 'Week 20: Formant and vibrato checkpoint',
          durationMin: 26,
          weekNumber: 20,
          targetMetrics: { exercise: 'formant_vibrato_checkpoint', formantsTracked: ['F1', 'F2'], ...VIBRATO_THRESHOLDS, statusRequired: 'PASS' },
        },
      ],
    },
    {
      id: 'edux-advanced-month-6',
      title: "Month 6: Singer's Formant and Graduation",
      summary: "Develop squillo, track LTAS and SPR, then complete a full graduation performance.",
      lessons: [
        {
          id: 'edux-week-21-singers-formant-setup',
          title: "Week 21: Singer's formant setup",
          durationMin: 25,
          weekNumber: 21,
          targetMetrics: { exercise: 'singers_formant_setup', setup: ['low_larynx', 'wide_pharynx'], ...SINGER_FORMANT_THRESHOLDS },
        },
        {
          id: 'edux-week-22-ltas-spr-ring',
          title: 'Week 22: LTAS and SPR ring validation',
          durationMin: 26,
          weekNumber: 22,
          targetMetrics: { exercise: 'ltas_spr_ring', analysis: ['welch_ltas', 'spr'], ...SINGER_FORMANT_THRESHOLDS },
        },
        {
          id: 'edux-week-23-graduation-song-rehearsal',
          title: 'Week 23: Graduation song rehearsal',
          durationMin: 30,
          weekNumber: 23,
          targetMetrics: { exercise: 'graduation_song_rehearsal', fullPerformanceTracked: true, ...PITCH_THRESHOLDS, ...SINGER_FORMANT_THRESHOLDS },
        },
        {
          id: 'edux-week-24-full-performance-graduation',
          title: 'Week 24: Full performance graduation',
          durationMin: 35,
          weekNumber: 24,
          targetMetrics: { exercise: 'graduation_performance', fullPerformanceTracked: true, statusRequired: 'PASS', ...PITCH_THRESHOLDS, ...HEALTH_THRESHOLDS, ...SINGER_FORMANT_THRESHOLDS },
        },
      ],
    },
  ],
  lessons: [],
};

eduxSubject.lessons = eduxSubject.lectures.flatMap((lecture) => lecture.lessons);
