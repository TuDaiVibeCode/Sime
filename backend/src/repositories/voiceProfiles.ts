import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface VoiceProfileInput {
  userId: string;
  voiceType: string;
  voiceColor: string;
  lowestNote: string;
  highestNote: string;
  rangeSemitones: number;
  passaggioHint?: string;
  roadmapStage: 'beginner' | 'intermediate' | 'advanced';
  metrics?: unknown;
}

type VoiceProfileRow = {
  id: string;
  userId: string;
  voiceType: string;
  voiceColor: string;
  lowestNote: string;
  highestNote: string;
  rangeSemitones: number;
  passaggioHint: string | null;
  roadmapStage: string;
  metrics: Prisma.JsonValue;
  createdAt: Date;
};

const toProfile = (row: VoiceProfileRow) => ({
  id: row.id,
  userId: row.userId,
  voiceType: row.voiceType,
  voiceColor: row.voiceColor,
  lowestNote: row.lowestNote,
  highestNote: row.highestNote,
  rangeSemitones: row.rangeSemitones,
  passaggioHint: row.passaggioHint,
  roadmapStage: row.roadmapStage as 'beginner' | 'intermediate' | 'advanced',
  metrics: row.metrics,
  createdAt: row.createdAt,
});

export async function createVoiceProfile(input: VoiceProfileInput) {
  const row = await prisma.voiceProfile.create({
    data: {
      userId: input.userId,
      voiceType: input.voiceType,
      voiceColor: input.voiceColor,
      lowestNote: input.lowestNote,
      highestNote: input.highestNote,
      rangeSemitones: input.rangeSemitones,
      passaggioHint: input.passaggioHint ?? null,
      roadmapStage: input.roadmapStage,
      metrics: (input.metrics ?? {}) as Prisma.InputJsonValue,
    },
  });
  return toProfile(row);
}

export async function listVoiceProfiles(userId: string) {
  const rows = await prisma.voiceProfile.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });
  return rows.map(toProfile);
}

export async function getLatestVoiceProfile(userId: string) {
  const row = await prisma.voiceProfile.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return row ? toProfile(row) : null;
}
