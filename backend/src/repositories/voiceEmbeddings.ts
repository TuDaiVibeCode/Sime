import { Prisma } from '@prisma/client';
import { prisma, databaseSchema } from '../lib/prisma';

export interface VoiceEmbeddingInput {
  userId: string;
  profileId: string;
  embedding: number[];
  embeddingKind: string;
  source: string;
}

interface VoiceEmbeddingRow {
  id: string;
  profile_id: string;
  embedding_kind: string;
  source: string;
  created_at: Date;
}

interface VoiceEmbeddingSearchRow extends VoiceEmbeddingRow {
  similarity: number;
  voice_type: string;
  voice_color: string;
  lowest_note: string;
  highest_note: string;
  roadmap_stage: 'beginner' | 'intermediate' | 'advanced';
}

// pgvector literal, e.g. [0.1,0.2,...]. Built from a number[] only, never user text.
const toVectorLiteral = (embedding: number[]) => `[${embedding.join(',')}]`;

const toEmbedding = (row: VoiceEmbeddingRow) => ({
  id: row.id,
  profileId: row.profile_id,
  embeddingKind: row.embedding_kind,
  source: row.source,
  createdAt: row.created_at,
});

export async function checkPgvectorReady() {
  const rows = await prisma.$queryRaw<{ ok: boolean }[]>`
    select (
      exists (select 1 from pg_extension where extname = 'vector')
      and exists (
        select 1 from information_schema.columns
        where table_schema = ${databaseSchema}
          and table_name = 'voice_embeddings'
          and column_name = 'embedding_vector'
      )
    ) as ok`;
  return Boolean(rows[0]?.ok);
}

export async function createVoiceEmbedding(input: VoiceEmbeddingInput) {
  // Insert ... select enforces ownership: the row is only written if the target
  // voice profile belongs to the requesting user.
  const rows = await prisma.$queryRaw<VoiceEmbeddingRow[]>`
    insert into voice_embeddings (
      profile_id, embedding, embedding_kind, source, embedding_vector
    )
    select vp.id, ${input.embedding}::real[], ${input.embeddingKind}, ${input.source},
           ${toVectorLiteral(input.embedding)}::vector
    from voice_profiles vp
    where vp.id = ${input.profileId}::uuid and vp.user_id = ${input.userId}::uuid
    returning id, profile_id, embedding_kind, source, created_at`;
  return rows[0] ? toEmbedding(rows[0]) : null;
}

export async function searchVoiceEmbeddings(input: {
  userId: string;
  embedding: number[];
  limit: number;
}) {
  const vector = toVectorLiteral(input.embedding);
  const rows = await prisma.$queryRaw<VoiceEmbeddingSearchRow[]>`
    select
      ve.id,
      ve.profile_id,
      ve.embedding_kind,
      ve.source,
      ve.created_at,
      1 - (ve.embedding_vector <=> ${vector}::vector) as similarity,
      vp.voice_type,
      vp.voice_color,
      vp.lowest_note,
      vp.highest_note,
      vp.roadmap_stage
    from voice_embeddings ve
    join voice_profiles vp on vp.id = ve.profile_id
    where vp.user_id = ${input.userId}::uuid and ve.embedding_vector is not null
    order by ve.embedding_vector <=> ${vector}::vector
    limit ${input.limit}`;

  return rows.map((row) => ({
    ...toEmbedding(row),
    similarity: Number(row.similarity),
    profile: {
      id: row.profile_id,
      voiceType: row.voice_type,
      voiceColor: row.voice_color,
      lowestNote: row.lowest_note,
      highestNote: row.highest_note,
      roadmapStage: row.roadmap_stage,
    },
  }));
}
