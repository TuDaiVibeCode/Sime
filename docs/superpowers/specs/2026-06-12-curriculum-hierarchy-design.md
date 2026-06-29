# Curriculum Hierarchy Design

## Goal

Add a real curriculum hierarchy for Vietnamese product language: `Subject` (`mon hoc`) contains `Lecture` (`bai giang`) contains `Lesson` (`bai hoc`).

## Approach

Keep the existing `lesson_tracks` table as the durable subject table to avoid a destructive rename and preserve existing lesson progress. Add a new `lesson_lectures` table between subjects and lessons. Each lesson gains a required `lecture_id`, while keeping the current `track_id`/subject relation for compatibility and simple queries.

The public lesson API returns `subjects`, each with nested `lectures` and `lessons`. For existing frontend and API consumers, the response also includes `tracks` as a compatibility alias. Lesson detail responses include `subjectId`, `subjectName`, `lectureId`, `lectureTitle`, and the existing `trackId` alias.

## Frontend Behavior

The `/lessons` page groups curriculum cards by subject and lecture. The `/lessons/[id]` page shows subject and lecture context above the title. Dashboard and voice pages use the nested subject model but flatten it where they need a simple ordered lesson list.

## Data Migration

Seed assigns all existing lessons into stable lecture ids. Existing lesson ids do not change, so saved `progress_logs.lesson_id` values remain valid.

## Validation

Backend smoke tests verify the nested curriculum payload and lesson detail metadata. Package typechecks and builds must pass before handoff.
