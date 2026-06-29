-- Keep legacy and Prisma-created databases aligned on supported analysis job types.

ALTER TABLE "analysis_jobs" DROP CONSTRAINT IF EXISTS "analysis_jobs_job_type_check";
ALTER TABLE "analysis_jobs" DROP CONSTRAINT IF EXISTS "analysis_jobs_type_check";

ALTER TABLE "analysis_jobs"
  ADD CONSTRAINT "analysis_jobs_type_check"
  CHECK ("job_type" IN ('swiftf0', 'rmvpe', 'crepe', 'range', 'transposition', 'coach_payload', 'health', 'technique'));
