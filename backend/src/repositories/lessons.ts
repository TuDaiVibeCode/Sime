import type { LessonDetail, Subject } from '../data/lessons';
import { prisma } from '../lib/prisma';

export async function getSubjectsFromDb(): Promise<Subject[]> {
  const rows = await prisma.lessonTrack.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      summary: true,
      lectures: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          title: true,
          summary: true,
          lessons: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, title: true, durationMin: true, weekNumber: true, targetMetrics: true },
          },
        },
      },
    },
  });

  return rows.map((track) => ({
    id: track.id,
    name: track.name,
    summary: track.summary,
    lectures: track.lectures.map((lecture) => ({
      id: lecture.id,
      title: lecture.title,
      summary: lecture.summary,
      lessons: lecture.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        durationMin: lesson.durationMin,
        weekNumber: lesson.weekNumber,
        targetMetrics: lesson.targetMetrics as Record<string, unknown>,
      })),
    })),
    lessons: track.lectures.flatMap((lecture) => lecture.lessons).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      durationMin: lesson.durationMin,
      weekNumber: lesson.weekNumber,
      targetMetrics: lesson.targetMetrics as Record<string, unknown>,
    })),
  }));
}

export const getTracksFromDb = getSubjectsFromDb;

export async function findLessonFromDb(id: string): Promise<LessonDetail | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      durationMin: true,
      weekNumber: true,
      targetMetrics: true,
      track: {
        select: { id: true, name: true },
      },
      lecture: {
        select: { id: true, title: true },
      },
    },
  });
  if (!lesson) return null;
  return {
    id: lesson.id,
    title: lesson.title,
    durationMin: lesson.durationMin,
    weekNumber: lesson.weekNumber,
    targetMetrics: lesson.targetMetrics as Record<string, unknown>,
    trackId: lesson.track.id,
    subjectId: lesson.track.id,
    subjectName: lesson.track.name,
    lectureId: lesson.lecture.id,
    lectureTitle: lesson.lecture.title,
  };
}


