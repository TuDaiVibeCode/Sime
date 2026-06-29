-- Store the blueprint's practice session and vocal health metric records.

ALTER TABLE "analysis_jobs" DROP CONSTRAINT IF EXISTS "analysis_jobs_type_check";
ALTER TABLE "analysis_jobs"
  ADD CONSTRAINT "analysis_jobs_type_check"
  CHECK ("job_type" IN ('swiftf0', 'rmvpe', 'crepe', 'range', 'transposition', 'coach_payload', 'health', 'technique'));

CREATE TABLE "practice_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "lesson_id" TEXT,
  "analysis_job_id" UUID,
  "audio_file_url" TEXT,
  "score" DECIMAL(5,2),
  "gemini_feedback" TEXT,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "practice_sessions_score_check" CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100)),
  CONSTRAINT "practice_sessions_status_check" CHECK ("status" IN ('started', 'completed', 'needs_retry'))
);

CREATE TABLE "vocal_health_metrics" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL,
  "avg_pitch_hz" DECIMAL(9,3),
  "jitter_pct" DECIMAL(7,4),
  "shimmer_pct" DECIMAL(7,4),
  "hnr_db" DECIMAL(7,3),
  "cpps_db" DECIMAL(7,3),
  "pitch_stability" DECIMAL(5,2),
  "level_stability" DECIMAL(5,2),
  "voice_breaks" INTEGER,
  "vibrato_rate_hz" DECIMAL(6,3),
  "vibrato_extent_cents" DECIMAL(7,3),
  "singer_formant_peak_hz" DECIMAL(9,3),
  "singer_formant_peak_dbfs" DECIMAL(7,3),
  "spr_db" DECIMAL(7,3),
  "raw_metrics" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "vocal_health_metrics_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vocal_health_metrics_pct_check" CHECK (
    ("jitter_pct" IS NULL OR ("jitter_pct" >= 0 AND "jitter_pct" <= 100)) AND
    ("shimmer_pct" IS NULL OR ("shimmer_pct" >= 0 AND "shimmer_pct" <= 100))
  ),
  CONSTRAINT "vocal_health_metrics_stability_check" CHECK (
    ("pitch_stability" IS NULL OR ("pitch_stability" >= 0 AND "pitch_stability" <= 100)) AND
    ("level_stability" IS NULL OR ("level_stability" >= 0 AND "level_stability" <= 100))
  ),
  CONSTRAINT "vocal_health_metrics_voice_breaks_check" CHECK ("voice_breaks" IS NULL OR "voice_breaks" >= 0),
  CONSTRAINT "vocal_health_metrics_hnr_check" CHECK ("hnr_db" IS NULL OR ("hnr_db" >= -20 AND "hnr_db" <= 80)),
  CONSTRAINT "vocal_health_metrics_cpps_check" CHECK ("cpps_db" IS NULL OR ("cpps_db" >= 0 AND "cpps_db" <= 40)),
  CONSTRAINT "vocal_health_metrics_vibrato_check" CHECK (
    ("vibrato_rate_hz" IS NULL OR ("vibrato_rate_hz" >= 0 AND "vibrato_rate_hz" <= 20)) AND
    ("vibrato_extent_cents" IS NULL OR ("vibrato_extent_cents" >= 0 AND "vibrato_extent_cents" <= 300))
  ),
  CONSTRAINT "vocal_health_metrics_formant_check" CHECK (
    ("singer_formant_peak_hz" IS NULL OR ("singer_formant_peak_hz" >= 20 AND "singer_formant_peak_hz" <= 12000)) AND
    ("singer_formant_peak_dbfs" IS NULL OR ("singer_formant_peak_dbfs" >= -120 AND "singer_formant_peak_dbfs" <= 20)) AND
    ("spr_db" IS NULL OR ("spr_db" >= -80 AND "spr_db" <= 80))
  )
);

CREATE UNIQUE INDEX "practice_sessions_analysis_job_id_key" ON "practice_sessions"("analysis_job_id");
CREATE INDEX "practice_sessions_user_id_created_at_idx" ON "practice_sessions"("user_id", "created_at" DESC);
CREATE INDEX "practice_sessions_lesson_id_idx" ON "practice_sessions"("lesson_id");
CREATE INDEX "vocal_health_metrics_session_id_created_at_idx" ON "vocal_health_metrics"("session_id", "created_at" DESC);

ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_analysis_job_id_fkey" FOREIGN KEY ("analysis_job_id") REFERENCES "analysis_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vocal_health_metrics" ADD CONSTRAINT "vocal_health_metrics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
