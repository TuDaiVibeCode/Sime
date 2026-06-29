# Note Reading Practice Design

## Goal

Make the `reading-notes` lesson a complete note-reading flow: learners must pass the quiz before practice unlocks, and practice must verify that the learner performs the exact notes shown in the lesson sheet/exercise with correct pitch.

This first implementation focuses on `reading-notes` as the reference lesson. Other music theory lessons can reuse the same structured practice engine after this flow is stable.

## Approach

Use a frontend-first structured exercise model. Extend `LessonGuide` with optional note-reading practice data: exercise title, instructions, pass criteria, clef, and ordered target notes such as `C4`, `D4`, `E4`, `F4`, and `G4`.

Add a dedicated client component for note-reading practice. It uses the existing browser pitch detection helpers in `frontend/lib/pitchClient.ts` and Web Audio microphone capture to compare the detected pitch against the current target note. A target is accepted only when the detected pitch is within the configured cents tolerance for a short hold duration. This avoids adding Whisper/STT dependency for the first version; pitch is the primary source of truth for musical correctness.

## Lesson Flow

`LessonClientView` keeps theory, quiz, and practice as the main phases. If a lesson has a quiz, practice remains locked until the quiz reports completion. The practice tab and the theory "continue" action both route learners through the quiz first.

`QuizPanel` changes from "answer and continue" to mastery gating. A wrong answer shows feedback and requires retrying the same question. The quiz calls `onComplete` only after all questions have been answered correctly.

## Practice Behavior

The `reading-notes` practice panel shows one sheet target at a time with the written note name and a staff-style visual. The learner starts the microphone, performs the note, and sees live feedback: detected note, cents offset, target note, and pass/fail progress.

When the learner holds the correct pitch long enough, the panel marks that target complete and advances to the next target. The exercise is complete only when all configured notes pass. The existing generic `PracticePanel` remains available for lessons without structured note-reading exercises.

## Components And Data Flow

`lessonGuides.ts` owns the static exercise configuration. It remains serializable so it can pass from the server-rendered lesson page into the client lesson view.

`LessonClientView` decides whether to render `NoteReadingPracticePanel` or the existing generic `PracticePanel` based on the lesson guide data. It also owns the in-session quiz gate state.

`NoteReadingPracticePanel` owns browser-only mic state, audio context lifecycle, pitch sampling, target scoring, and local completion state. It does not send audio to the backend in this version.

## Error Handling

If microphone permission is denied or unavailable, the panel shows a clear inline error and keeps the learner on the practice step. If pitch is too quiet or unstable, the panel shows a neutral "listening" state instead of failing the learner.

Pitch matching uses a cents tolerance rather than note-name-only matching, so the learner must hit the correct octave and stay close to the written note. The target tolerance and hold duration are configurable per exercise with conservative defaults.

## Testing And Verification

Run `npm run typecheck` and `npm run build` in `frontend` before handoff. Manual verification should cover:

- Practice is locked before quiz completion.
- Wrong quiz answers cannot advance the quiz.
- Correct quiz completion unlocks practice.
- `reading-notes` shows structured sheet targets instead of only the generic pitch monitor.
- Microphone errors do not crash the page.

