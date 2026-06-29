# University Curriculum Expansion Design

## Goal

Expand Sime from a short vocal lesson set into a conservatory-style curriculum. The curriculum should feel like a serious university voice program: vocal technique, musicianship, diction, repertoire, performance, and vocal health all have visible course structure and detailed practice guidance.

## Scope

Keep the existing `Subject -> Lecture -> Lesson` model. Add new subjects, lectures, and lessons through seed data and fallback data only. Do not change saved progress semantics: existing lesson ids stay stable and new lesson ids are additive.

## Curriculum Shape

The expanded curriculum contains 48 lessons across:

- Foundations: anatomy, alignment, breath, onset, pitch, resonance, legato.
- Technique: registration, SOVT, passaggio, mix, belt, vibrato, agility, dynamics, stamina.
- Musicianship: solfege, intervals, rhythm, sight singing, harmony, melodic memory.
- Diction: IPA, Italian diction, English diction, consonants, vowel unification.
- Repertoire: song analysis, text/subtext, style, audition package.
- Performance: phrasing, interpretation, stagecraft, microphone, nerves, practice planning.
- Vocal Health: warm-down, strain prevention, load management, recovery.

## Content Model

Every new lesson receives a full `LessonGuide`: objective, science/pedagogy principle, steps, repeatable drills, listening/feeling targets, common mistakes, Sime pitch checks, self-checks, progression ladder, and pro tips. Content remains honest that Sime currently checks pitch, not visual posture, tone quality, medical health, or artistic intent.

## Data Flow

Backend `src/data/lessons.ts` becomes the canonical curriculum data source for the fallback API and for Prisma seeding. `prisma/seed.ts` imports that data instead of duplicating lesson lists. The API response shape remains `{ subjects, tracks }` for compatibility.

## Validation

Smoke tests verify the curriculum has the expected subject and lesson counts and that a new lesson has subject/lecture detail. Frontend typecheck/build and backend build/tests must pass after reseeding.
