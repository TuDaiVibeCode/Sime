/**
 * Seed the curriculum (subjects + lectures + lessons). Idempotent: upserts by
 * id, so it is safe to run repeatedly. Run with `npm run db:seed`.
 *
 * The existing lesson_tracks table is the durable subject table. Lesson ids are
 * stable because progress logs point at them.
 */
import { prisma, closeDb } from '../src/lib/prisma';
import { subjects } from '../src/data/lessons';

type SeedLesson = {
  id: string;
  title: string;
  durationMin: number;
  sortOrder: number;
  weekNumber?: number | null;
  targetMetrics?: Record<string, unknown>;
};
type SeedLecture = {
  id: string;
  title: string;
  summary: string;
  sortOrder: number;
  lessons: SeedLesson[];
};
type SeedSubject = {
  id: string;
  name: string;
  summary: string;
  sortOrder: number;
  lectures: SeedLecture[];
};

const curriculum: SeedSubject[] = subjects.map((subject, subjectIndex) => ({
  id: subject.id,
  name: subject.name,
  summary: subject.summary,
  sortOrder: (subjectIndex + 1) * 10,
  lectures: subject.lectures.map((lecture, lectureIndex) => ({
    id: lecture.id,
    title: lecture.title,
    summary: lecture.summary,
    sortOrder: (lectureIndex + 1) * 10,
    lessons: lecture.lessons.map((lesson, lessonIndex) => ({
      id: lesson.id,
      title: lesson.title,
      durationMin: lesson.durationMin,
      sortOrder: (lessonIndex + 1) * 10,
      weekNumber: lesson.weekNumber ?? null,
      targetMetrics: lesson.targetMetrics ?? {},
    })),
  })),
}));
async function main() {
  for (const subject of curriculum) {
    await prisma.lessonTrack.upsert({
      where: { id: subject.id },
      update: { name: subject.name, summary: subject.summary, sortOrder: subject.sortOrder },
      create: { id: subject.id, name: subject.name, summary: subject.summary, sortOrder: subject.sortOrder },
    });

    for (const lecture of subject.lectures) {
      await prisma.lessonLecture.upsert({
        where: { id: lecture.id },
        update: {
          trackId: subject.id,
          title: lecture.title,
          summary: lecture.summary,
          sortOrder: lecture.sortOrder,
        },
        create: {
          id: lecture.id,
          trackId: subject.id,
          title: lecture.title,
          summary: lecture.summary,
          sortOrder: lecture.sortOrder,
        },
      });

      for (const lesson of lecture.lessons) {
        await prisma.lesson.upsert({
          where: { id: lesson.id },
          update: {
            trackId: subject.id,
            lectureId: lecture.id,
            title: lesson.title,
            durationMin: lesson.durationMin,
            weekNumber: lesson.weekNumber ?? null,
            targetMetrics: lesson.targetMetrics ?? {},
            sortOrder: lesson.sortOrder,
          },
          create: {
            id: lesson.id,
            trackId: subject.id,
            lectureId: lecture.id,
            title: lesson.title,
            durationMin: lesson.durationMin,
            weekNumber: lesson.weekNumber ?? null,
            targetMetrics: lesson.targetMetrics ?? {},
            sortOrder: lesson.sortOrder,
          },
        });
      }
    }
  }

  const subjectCount = await prisma.lessonTrack.count();
  const lectureCount = await prisma.lessonLecture.count();
  const lessonCount = await prisma.lesson.count();
  console.log(`Seeded ${subjectCount} subjects, ${lectureCount} lectures, and ${lessonCount} lessons.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(closeDb);

