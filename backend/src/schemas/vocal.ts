import { z } from 'zod';

export const noteNameSchema = z
  .string()
  .trim()
  .regex(/^[A-G](#|b)?-?\d$/, 'Use scientific pitch notation, e.g. C4 or Bb3');

export const singerGroupSchema = z
  .enum(['male', 'female', 'unknown'])
  .default('unknown');

export const rangeAnalysisSchema = z.object({
  singerGroup: singerGroupSchema,
  minDurationMs: z.number().int().min(100).max(5000).default(300),
  minConfidence: z.number().min(0).max(1).default(0.6),
  notes: z
    .array(
      z.object({
        note: noteNameSchema,
        durationMs: z.number().int().min(1).max(60_000),
        confidence: z.number().min(0).max(1).default(1),
      })
    )
    .min(2)
    .max(256),
});

const rangeSchema = z.object({
  low: noteNameSchema,
  high: noteNameSchema,
});

export const transpositionSchema = z.object({
  voiceRange: rangeSchema,
  songRange: rangeSchema.extend({
    tessituraLow: noteNameSchema.optional(),
    tessituraHigh: noteNameSchema.optional(),
  }),
  maxShiftSemitones: z.number().int().min(0).max(4).default(4),
  includesGuideVocal: z.boolean().default(false),
});


const nullableMetric = z.number().finite().nullable().optional();

export const healthAnalysisSchema = z.object({
  exerciseName: z.string().trim().min(1).max(120).default('Warm-up health check'),
  metrics: z.object({
    approximate: z.boolean().default(false),
    jitterPct: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 100), {
      message: 'jitterPct must be between 0 and 100',
    }),
    shimmerPct: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 100), {
      message: 'shimmerPct must be between 0 and 100',
    }),
    hnrDb: nullableMetric.refine((value) => value == null || (value >= -20 && value <= 80), {
      message: 'hnrDb must be between -20 and 80',
    }),
    cppsDb: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 40), {
      message: 'cppsDb must be between 0 and 40',
    }),
    pitchStability: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 100), {
      message: 'pitchStability must be between 0 and 100',
    }),
    levelStability: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 100), {
      message: 'levelStability must be between 0 and 100',
    }),
  }),
  thresholds: z
    .object({
      maxJitterPct: z.number().finite().min(0).max(20).optional(),
      maxShimmerPct: z.number().finite().min(0).max(50).optional(),
      minHnrDb: z.number().finite().min(-20).max(80).optional(),
      minCppsDb: z.number().finite().min(0).max(40).optional(),
      minPitchStability: z.number().finite().min(0).max(100).optional(),
      minLevelStability: z.number().finite().min(0).max(100).optional(),
    })
    .default({}),
});

export const techniqueAnalysisSchema = z.object({
  exerciseName: z.string().trim().min(1).max(120).default('Technique validation'),
  pitch: z
    .object({
      deviationCents: z.number().finite().min(-1200).max(1200),
      thresholdCents: z.number().finite().min(1).max(100).default(50),
    })
    .optional(),
  rhythm: z
    .object({
      dtwDistance: z.number().finite().min(0).max(100000),
      maxDtwDistance: z.number().finite().min(0).max(100000),
    })
    .optional(),
  passaggio: z
    .object({
      voiceBreaks: z.number().int().min(0).max(100),
      breakNote: noteNameSchema.optional(),
    })
    .optional(),
  vibrato: z
    .object({
      rateHz: z.number().finite().min(0).max(20),
      extentCents: z.number().finite().min(0).max(300),
    })
    .optional(),
  singerFormant: z
    .object({
      peakFreqHz: z.number().finite().min(20).max(12000),
      peakDbfs: z.number().finite().min(-120).max(20),
      sprDb: z.number().finite().min(-80).max(80).optional(),
    })
    .optional(),
  formants: z
    .object({
      f1Hz: z.number().finite().min(100).max(1500).optional(),
      f2Hz: z.number().finite().min(300).max(4000).optional(),
    })
    .optional(),
});
export const coachingPayloadSchema = z.object({
  userId: z.string().trim().min(1).max(64).optional(),
  voiceType: z.string().trim().min(1).max(80),
  voiceColor: z.string().trim().min(1).max(80),
  range: z.tuple([noteNameSchema, noteNameSchema]),
  songKeyShift: z.string().trim().min(1).max(40),
  metrics: z.object({
    rpa: z.number().min(0).max(100),
    vStab: z.number().min(0).max(1),
    avqi: z.number().min(0).max(10),
    cpps: z.number().min(0).max(40),
  }),
  errorLog: z
    .array(
      z.object({
        ts: z.tuple([z.number().min(0), z.number().min(0)]),
        err: z.enum(['flat', 'sharp', 'strain', 'breathy', 'nasal', 'timing']),
        devSt: z.number().min(-12).max(12).optional(),
        hnrDrop: z.boolean().optional(),
        tech: z.enum(['chest', 'head', 'mix', 'belt', 'breath', 'unknown']).default('unknown'),
      })
    )
    .max(20)
    .default([]),
  context: z.string().trim().max(1000).optional(),
});

export type RangeAnalysisInput = z.infer<typeof rangeAnalysisSchema>;
export type TranspositionInput = z.infer<typeof transpositionSchema>;
export type HealthAnalysisInput = z.infer<typeof healthAnalysisSchema>;
export type TechniqueAnalysisInput = z.infer<typeof techniqueAnalysisSchema>;
export type CoachingPayloadInput = z.infer<typeof coachingPayloadSchema>;


