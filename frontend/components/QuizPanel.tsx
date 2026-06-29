'use client';

import { useState } from 'react';
import { ArrowClockwise, ArrowRight, CheckCircle, XCircle } from '@phosphor-icons/react';
import { btnPrimary } from '@/components/ui';

interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizPanelProps {
  quiz: LessonQuiz[];
  onComplete: () => void;
}

export default function QuizPanel({ quiz, onComplete }: QuizPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!quiz || quiz.length === 0) return null;

  const currentQ = quiz[currentIndex];
  const isCorrect = selectedOption === currentQ.correctIndex;

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setHasSubmitted(true);
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  const handleNext = () => {
    if (!isCorrect) return;

    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setHasSubmitted(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Kiểm tra nhanh</h2>
        <span className="text-sm font-semibold text-muted bg-surface px-3 py-1 rounded-full border border-white/10">
          Câu {currentIndex + 1} / {quiz.length}
        </span>
      </div>

      <div className="rounded-3xl border border-white/10 bg-surface/50 backdrop-blur-md p-8 shadow-xl">
        <h3 className="text-lg font-semibold text-text leading-relaxed">
          {currentQ.question}
        </h3>

        <div className="mt-6 space-y-3">
          {currentQ.options.map((option, idx) => {
            let optionStyles = 'border-white/10 hover:border-accent hover:bg-accent/5';
            if (hasSubmitted) {
              if (idx === currentQ.correctIndex) {
                optionStyles = 'border-green-500 bg-green-500/10 text-green-100';
              } else if (idx === selectedOption) {
                optionStyles = 'border-red-500 bg-red-500/10 text-red-100';
              } else {
                optionStyles = 'border-white/5 opacity-50';
              }
            } else if (selectedOption === idx) {
              optionStyles = 'border-accent bg-accent/20 ring-1 ring-accent text-accent';
            }

            return (
              <button
                key={idx}
                disabled={hasSubmitted}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ${optionStyles}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{option}</span>
                  {hasSubmitted && idx === currentQ.correctIndex && (
                    <CheckCircle size={24} weight="fill" className="shrink-0 text-green-500" />
                  )}
                  {hasSubmitted && idx === selectedOption && idx !== currentQ.correctIndex && (
                    <XCircle size={24} weight="fill" className="shrink-0 text-red-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {hasSubmitted && (
          <div className={`mt-6 p-5 rounded-2xl border ${isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
            <h4 className={`font-bold flex items-center gap-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? <CheckCircle size={20} weight="fill" /> : <XCircle size={20} weight="fill" />}
              {isCorrect ? 'Chính xác!' : 'Chưa đúng rồi!'}
            </h4>
            <p className="mt-2 text-sm text-text/80 leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          {!hasSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className={`${btnPrimary} ${selectedOption === null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Trả lời
            </button>
          ) : isCorrect ? (
            <button onClick={handleNext} className={btnPrimary}>
              {currentIndex < quiz.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành & Thực hành'} <ArrowRight size={18} weight="bold" />
            </button>
          ) : (
            <button onClick={handleRetry} className={btnPrimary}>
              <ArrowClockwise size={18} weight="bold" /> Thử lại câu này
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
