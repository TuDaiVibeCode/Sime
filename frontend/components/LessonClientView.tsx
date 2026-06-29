'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Ear,
  WarningCircle,
  GraduationCap,
  Sparkle,
  Lightbulb,
  Barbell,
  PlayCircle,
  BookOpen,
  Microphone,
  Question
} from '@phosphor-icons/react';
import { btnPrimary, btnLine } from '@/components/ui';
import LessonProgressButton from '@/components/LessonProgressButton';
import CoachPanel from '@/components/CoachPanel';
import PracticePanel from '@/components/PracticePanel'; // As a generic fallback practice tool
import NoteReadingPracticePanel from '@/components/NoteReadingPracticePanel';
import QuizPanel from '@/components/QuizPanel';

export default function LessonClientView({ lesson, profile, guide, dictionary }: any) {
  const hasQuiz = Boolean(guide?.quiz && guide.quiz.length > 0);
  const noteReadingExercises = guide?.noteReadingExercises ?? [];
  const hasNoteReadingPractice = noteReadingExercises.length > 0;
  const [phase, setPhase] = useState<'theory' | 'quiz' | 'practice'>('theory');
  const [quizPassed, setQuizPassed] = useState(!hasQuiz);
  const [practicePassed, setPracticePassed] = useState(!hasNoteReadingPractice);
  const practiceLocked = hasQuiz && !quizPassed;

  const goToPractice = () => {
    if (practiceLocked) {
      setPhase('quiz');
      return;
    }

    setPhase('practice');
  };

  return (
    <>
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text mb-6">
        <ArrowLeft size={16} aria-hidden /> Back to Dashboard
      </Link>

      <div className="mb-10 flex justify-center">
        <div className="inline-flex rounded-full bg-bg2 p-1 ring-1 ring-white/10">
          <button
            onClick={() => setPhase('theory')}
            className={`relative flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
              phase === 'theory' ? 'text-bg bg-accent shadow-md' : 'text-muted hover:text-text'
            }`}
          >
            <BookOpen size={18} weight={phase === 'theory' ? 'fill' : 'regular'} />
            1. Lý thuyết (Chuẩn bị)
          </button>
          {hasQuiz && (
            <button
              onClick={() => setPhase('quiz')}
              className={`relative flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                phase === 'quiz' ? 'text-bg bg-accent shadow-md' : 'text-muted hover:text-text'
              }`}
            >
              <Question size={18} weight={phase === 'quiz' ? 'fill' : 'regular'} />
              2. Kiểm tra (Bắt buộc)
            </button>
          )}
                    <button
            onClick={goToPractice}
            aria-disabled={practiceLocked}
            className={`relative flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
              phase === 'practice'
                ? 'text-bg bg-accent shadow-md'
                : practiceLocked
                  ? 'text-muted/60 hover:text-text'
                  : 'text-muted hover:text-text'
            }`}
          >
            <Microphone size={18} weight={phase === 'practice' ? 'fill' : 'regular'} />
            {hasQuiz ? '3.' : '2.'} Thực hành (AI Coach)
          </button>
        </div>
      </div>

      <div className={`grid gap-8 ${phase === 'practice' ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        
        {/* Main Lesson Content */}
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-accent">
            {lesson.subjectName} · {lesson.lectureTitle}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">{lesson.title}</h1>
          <p className="mt-3 flex items-center gap-1.5 text-muted">
            <Clock size={17} aria-hidden /> {lesson.durationMin} {dictionary.common.minutes}
          </p>

          {phase === 'theory' && guide ? (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-lg text-muted">{guide.objective}</p>

              {/* Why it works */}
              <section className="mt-8 rounded-3xl border border-white/10 bg-surface/40 backdrop-blur-md p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Lightbulb size={120} />
                </div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-accent">
                  <Lightbulb size={24} weight="fill" aria-hidden /> {dictionary.lessonPage.why}
                </h2>
                <p className="mt-4 text-muted leading-relaxed relative z-10">{guide.why}</p>
              </section>

              {/* How to do it */}
              <section className="mt-10">
                <h2 className="text-2xl font-bold">{dictionary.lessonPage.how}</h2>
                <ol className="mt-6 space-y-4">
                  {guide.steps.map((step: string, i: number) => (
                    <li key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-surface/30 border border-white/5 transition-colors hover:bg-surface/50">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-bg shadow-[0_0_15px_rgba(255,184,77,0.3)]">
                        {i + 1}
                      </span>
                      <span className="pt-1 text-muted leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Pro tips */}
              <section className="mt-10 rounded-3xl border border-accent/30 bg-accent/5 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <GraduationCap size={150} />
                </div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-accent">
                  <GraduationCap size={24} weight="fill" aria-hidden /> {dictionary.lessonPage.proTips}
                </h2>
                <p className="mt-2 text-sm text-muted relative z-10">{dictionary.lessonPage.proTipsLead}</p>
                <ul className="mt-6 space-y-4 text-sm text-muted relative z-10">
                  {guide.proTips.map((tip: string, i: number) => (
                    <li key={i} className="flex gap-3 items-start">
                      <Sparkle size={18} className="mt-0.5 shrink-0 text-accent" weight="fill" aria-hidden />
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-8">
                <button onClick={() => setPhase(hasQuiz ? 'quiz' : 'practice')} className={btnPrimary}>
                  <PlayCircle size={18} aria-hidden /> {hasQuiz ? 'Chuyển sang Kiểm tra' : 'Chuyển sang Thực hành'}
                </button>
              </div>
            </div>
          ) : phase === 'theory' && !guide ? (
            <div className="mt-10 rounded-2xl border border-white/10 bg-surface p-7 text-muted">
              <p>{dictionary.lessonPage.comingSoon}</p>
            </div>
          ) : null}

          {phase === 'quiz' && guide?.quiz && (
            <QuizPanel 
              quiz={guide.quiz} 
              onComplete={() => {
                setQuizPassed(true);
                setPhase('practice');
              }} 
            />
          )}

          {phase === 'practice' && guide && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 mb-10">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen size={20} className="text-accent" /> Bạn đã sẵn sàng!
                </h2>
                <p className="text-muted mt-2 text-sm">
                  Hãy làm theo các bài tập (drills) bên dưới. AI Coach ở bên phải sẽ lắng nghe và phân tích cao độ của bạn theo thời gian thực để đưa ra lời khuyên.
                </p>
              </div>

              {/* The workout: repeatable drills */}
              <section>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Barbell size={22} className="text-accent" aria-hidden /> {dictionary.lessonPage.workout}
                </h2>
                <p className="mt-2 text-sm text-muted">{dictionary.lessonPage.workoutLead}</p>
                <div className="mt-5 space-y-4">
                  {guide.drills.map((drill: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-surface p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold">{drill.name}</h3>
                        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/25">
                          {drill.reps}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted">{drill.how}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-surface p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Ear size={20} className="text-accent" aria-hidden /> {dictionary.lessonPage.listen}
                  </h2>
                  <ul className="mt-4 space-y-2.5 text-sm text-muted">
                    {guide.feelFor.map((item: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl border border-white/10 bg-surface p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <WarningCircle size={20} className="text-accent" aria-hidden /> {dictionary.lessonPage.mistakes}
                  </h2>
                  <ul className="mt-4 space-y-2.5 text-sm text-muted">
                    {guide.mistakes.map((item: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              {/* Pitch Monitor for Practice Phase */}
              <section className="mt-10">
                {hasNoteReadingPractice ? (
                  <NoteReadingPracticePanel
                    exercises={noteReadingExercises}
                    onComplete={() => setPracticePassed(true)}
                  />
                ) : (
                  <PracticePanel />
                )}
              </section>

                            <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-8">
                {hasNoteReadingPractice && !practicePassed ? (
                  <p className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-muted">
                    Hoàn thành bài đọc nốt đúng cao độ để mở nút hoàn thành bài học.
                  </p>
                ) : (
                  <LessonProgressButton lessonId={lesson.id} labels={dictionary.progressButton} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: AI Coach ONLY in Practice Phase */}
        {phase === 'practice' && (
          <div className="relative animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="sticky top-[100px] h-[calc(100vh-140px)]">
              <CoachPanel 
                profile={profile} 
                lessonTitle={lesson.title} 
                lessonContext={guide ? `Objective: ${guide.objective}. Drills: ${guide.drills.map((d: any) => d.name).join(', ')}` : undefined} 
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

