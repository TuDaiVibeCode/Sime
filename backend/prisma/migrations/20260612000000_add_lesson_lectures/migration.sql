-- Add an explicit lecture layer between lesson_tracks (public subjects) and lessons.

CREATE TABLE "lesson_lectures" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_lectures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lesson_lectures_track_id_sort_order_idx" ON "lesson_lectures"("track_id", "sort_order");

ALTER TABLE "lesson_lectures"
  ADD CONSTRAINT "lesson_lectures_track_id_fkey"
  FOREIGN KEY ("track_id") REFERENCES "lesson_tracks"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

WITH "lecture_seed" ("id", "track_id", "title", "summary", "sort_order") AS (
VALUES
  ('foundations-setup', 'foundations', 'Set up the voice', 'Breath, posture, and body setup before harder singing.', 10),
  ('foundations-pitch-tone', 'foundations', 'Pitch and tone fundamentals', 'Train accurate notes, resonance, and clean note starts.', 20),
  ('technique-bridge', 'technique', 'Bridge the registers', 'Connect chest, mix, head voice, and passaggio without a break.', 10),
  ('technique-power-color', 'technique', 'Power, color, and control', 'Build belt, vibrato, agility, and vowel tuning safely.', 20),
  ('performance-expression', 'performance', 'Expression and interpretation', 'Shape phrases and make song choices that move a listener.', 10),
  ('performance-stage', 'performance', 'Stage and microphone craft', 'Bring the voice into performance conditions with confidence.', 20),
  ('performance-runs', 'performance', 'Runs and riffs', 'Make fast melodic decoration clean, musical, and in tune.', 30),
  ('health-care', 'health', 'Vocal care and recovery', 'Protect the voice, manage strain, and recover after singing.', 10)
)
INSERT INTO "lesson_lectures" ("id", "track_id", "title", "summary", "sort_order")
SELECT
  "lecture_seed"."id",
  "lecture_seed"."track_id",
  "lecture_seed"."title",
  "lecture_seed"."summary",
  "lecture_seed"."sort_order"
FROM "lecture_seed"
JOIN "lesson_tracks" ON "lesson_tracks"."id" = "lecture_seed"."track_id"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lesson_lectures" ("id", "track_id", "title", "summary", "sort_order")
SELECT
  "lesson_tracks"."id" || '-core',
  "lesson_tracks"."id",
  "lesson_tracks"."name" || ' Core',
  "lesson_tracks"."summary",
  999
FROM "lesson_tracks"
WHERE NOT EXISTS (
  SELECT 1
  FROM "lesson_lectures"
  WHERE "lesson_lectures"."track_id" = "lesson_tracks"."id"
);

ALTER TABLE "lessons" ADD COLUMN "lecture_id" TEXT;

UPDATE "lessons"
SET "lecture_id" = CASE "id"
  WHEN 'breath-support' THEN 'foundations-setup'
  WHEN 'posture' THEN 'foundations-setup'
  WHEN 'pitch-matching' THEN 'foundations-pitch-tone'
  WHEN 'resonance-basics' THEN 'foundations-pitch-tone'
  WHEN 'onset-control' THEN 'foundations-pitch-tone'
  WHEN 'mixed-voice' THEN 'technique-bridge'
  WHEN 'passaggio-bridging' THEN 'technique-bridge'
  WHEN 'belting' THEN 'technique-power-color'
  WHEN 'vibrato' THEN 'technique-power-color'
  WHEN 'agility' THEN 'technique-power-color'
  WHEN 'vowels-formants' THEN 'technique-power-color'
  WHEN 'phrasing' THEN 'performance-expression'
  WHEN 'interpretation' THEN 'performance-expression'
  WHEN 'stage-presence' THEN 'performance-stage'
  WHEN 'mic-technique' THEN 'performance-stage'
  WHEN 'runs-riffs' THEN 'performance-runs'
  WHEN 'vocal-health' THEN 'health-care'
  WHEN 'avoid-strain' THEN 'health-care'
  ELSE "track_id" || '-core'
END;

ALTER TABLE "lessons" ALTER COLUMN "lecture_id" SET NOT NULL;

CREATE INDEX "lessons_lecture_id_sort_order_idx" ON "lessons"("lecture_id", "sort_order");

ALTER TABLE "lessons"
  ADD CONSTRAINT "lessons_lecture_id_fkey"
  FOREIGN KEY ("lecture_id") REFERENCES "lesson_lectures"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
