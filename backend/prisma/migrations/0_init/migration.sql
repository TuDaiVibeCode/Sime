-- Sime initial schema (baseline). Reproduces the original db/migrations/*.sql
-- under Prisma. On a database that already has these tables, mark this migration
-- as applied instead of running it:
--     npx prisma migrate resolve --applied 0_init
-- On a fresh database, `prisma migrate deploy` runs it.

-- Extensions: pgcrypto for gen_random_uuid(), pgvector for the embedding vector.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "app_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "display_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'learner',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "app_users_role_check" CHECK ("role" IN ('learner', 'admin')),
    CONSTRAINT "app_users_email_format" CHECK ("email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- CreateTable
CREATE TABLE "lesson_tracks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lesson_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lessons_duration_check" CHECK ("duration_min" > 0 AND "duration_min" <= 180)
);

-- CreateTable
CREATE TABLE "voice_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "voice_type" TEXT NOT NULL,
    "voice_color" TEXT NOT NULL,
    "lowest_note" TEXT NOT NULL,
    "highest_note" TEXT NOT NULL,
    "range_semitones" INTEGER NOT NULL,
    "passaggio_hint" TEXT,
    "roadmap_stage" TEXT NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "voice_profiles_range_check" CHECK ("range_semitones" >= 0),
    CONSTRAINT "voice_profiles_stage_check" CHECK ("roadmap_stage" IN ('beginner', 'intermediate', 'advanced'))
);

-- CreateTable
CREATE TABLE "voice_embeddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "embedding" REAL[],
    "embedding_kind" TEXT NOT NULL DEFAULT 'voice_profile',
    "source" TEXT NOT NULL DEFAULT 'python_ai_worker',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "embedding_vector" vector(1536),

    CONSTRAINT "voice_embeddings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "voice_embeddings_1536_dims" CHECK (array_length("embedding", 1) = 1536)
);

-- CreateTable
CREATE TABLE "progress_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "lesson_id" TEXT,
    "status" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "analysis_summary" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "progress_logs_status_check" CHECK ("status" IN ('started', 'completed', 'skipped')),
    CONSTRAINT "progress_logs_score_check" CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100))
);

-- CreateTable
CREATE TABLE "analysis_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "request_payload" JSONB NOT NULL,
    "result_payload" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "analysis_jobs_type_check" CHECK ("job_type" IN ('swiftf0', 'rmvpe', 'crepe', 'range', 'transposition', 'coach_payload')),
    CONSTRAINT "analysis_jobs_status_check" CHECK ("status" IN ('queued', 'running', 'succeeded', 'failed'))
);

-- CreateIndex (unique on lower(email), matching the original schema)
CREATE UNIQUE INDEX "app_users_email_lower_idx" ON "app_users" (lower("email"));

-- CreateIndex
CREATE INDEX "lessons_track_id_sort_order_idx" ON "lessons"("track_id", "sort_order");

-- CreateIndex
CREATE INDEX "voice_profiles_user_id_created_at_idx" ON "voice_profiles"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "progress_logs_user_id_created_at_idx" ON "progress_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "progress_logs_lesson_id_idx" ON "progress_logs"("lesson_id");

-- CreateIndex
CREATE INDEX "analysis_jobs_status_created_at_idx" ON "analysis_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "analysis_jobs_user_id_created_at_idx" ON "analysis_jobs"("user_id", "created_at" DESC);

-- CreateIndex (pgvector HNSW for cosine similarity search)
CREATE INDEX "voice_embeddings_vector_hnsw_idx" ON "voice_embeddings" USING hnsw ("embedding_vector" vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "lesson_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_profiles" ADD CONSTRAINT "voice_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_embeddings" ADD CONSTRAINT "voice_embeddings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "voice_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
