ALTER TABLE "lessons" ADD COLUMN "week_number" INTEGER;
ALTER TABLE "lessons" ADD COLUMN "target_metrics" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX "lessons_week_number_idx" ON "lessons"("week_number");

ALTER TABLE "lessons" ADD CONSTRAINT "lessons_week_number_check"
CHECK ("week_number" IS NULL OR ("week_number" >= 1 AND "week_number" <= 24));
