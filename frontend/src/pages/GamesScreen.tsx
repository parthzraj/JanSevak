import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Trophy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CivicQuiz } from '../types';

export const GamesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { quizzes, completedQuizzes, completeQuiz, user } = useApp();

  const [activeQuiz, setActiveQuiz] = useState<CivicQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const startQuiz = (quiz: CivicQuiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setCorrectAnswersCount(0);
    setIsQuizFinished(false);
  };

  const handleSelectOption = (index: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(index);
    setHasAnswered(true);

    const question = activeQuiz?.questions[currentQuestionIndex];
    if (question && index === question.answerIndex) {
      setCorrectAnswersCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      // Quiz Finished!
      const totalQuestions = activeQuiz.questions.length;
      const finalScore = correctAnswersCount;
      const pointsEarned = Math.round((finalScore / totalQuestions) * activeQuiz.pointsReward);

      completeQuiz(activeQuiz.id, finalScore, pointsEarned);
      setIsQuizFinished(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-8 space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (activeQuiz) {
              setActiveQuiz(null);
            } else {
              navigate('/menu');
            }
          }}
          className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{activeQuiz ? 'Exit Quiz' : 'Back to Menu'}</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f2d59] bg-[#eff6ff] px-2.5 py-1 rounded-full">
          <Trophy className="w-3.5 h-3.5 text-[#d97706]" />
          <span>{user.points} pts</span>
        </div>
      </div>

      {/* Screen Banner */}
      {!activeQuiz && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Gamepad2 className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
                Civic Games & Knowledge Challenges
              </h1>
              <p className="text-xs text-[#64748b]">
                Sharpen your neighborhood skills and earn verified reward points!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Playing Interface */}
      {activeQuiz ? (
        <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] shadow-sm space-y-4">
          {!isQuizFinished ? (
            <>
              {/* Quiz Header & Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0f2d59] uppercase tracking-wider text-[10px]">
                    {activeQuiz.category} · Question {currentQuestionIndex + 1} of{' '}
                    {activeQuiz.questions.length}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#64748b]">
                    Score: {correctAnswersCount}
                  </span>
                </div>

                <div className="h-1.5 bg-[#f8fafc] rounded-full overflow-hidden border border-[#cbd5e1]">
                  <div
                    className="h-full bg-[#0f2d59] transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Current Question */}
              <div className="py-2">
                <h3 className="text-sm sm:text-base font-bold text-[#0f172a] leading-snug">
                  {activeQuiz.questions[currentQuestionIndex].question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {activeQuiz.questions[currentQuestionIndex].options.map((option, idx) => {
                  const isCorrect = idx === activeQuiz.questions[currentQuestionIndex].answerIndex;
                  const isUserSelection = selectedAnswer === idx;

                  let optionStyles = 'bg-[#f8fafc] border-[#cbd5e1] text-[#0f172a] hover:border-[#0f2d59]/40';

                  if (hasAnswered) {
                    if (isCorrect) {
                      optionStyles = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                    } else if (isUserSelection) {
                      optionStyles = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                    } else {
                      optionStyles = 'bg-[#f8fafc] opacity-60 border-[#cbd5e1] text-[#64748b]';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3 ${optionStyles}`}
                    >
                      <span className="flex-1">{option}</span>
                      {hasAnswered && isCorrect && (
                        <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                      {hasAnswered && isUserSelection && !isCorrect && (
                        <X className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box on Answer */}
              {hasAnswered && (
                <div className="p-3.5 bg-[#eff6ff]/60 border border-[#1d4e8c]/20 rounded-2xl text-xs space-y-1 animate-in fade-in">
                  <span className="font-bold text-[#0f2d59] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Civic Explanation
                  </span>
                  <p className="text-[#0f172a]/90 leading-relaxed">
                    {activeQuiz.questions[currentQuestionIndex].explanation}
                  </p>
                </div>
              )}

              {/* Next Button */}
              {hasAnswered && (
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 bg-[#0f2d59] text-white text-xs font-bold rounded-xl hover:bg-[#1d4e8c] transition-colors flex items-center justify-center gap-2"
                >
                  <span>
                    {currentQuestionIndex < activeQuiz.questions.length - 1
                      ? 'Next Question'
                      : 'Complete Quiz & Claim Points'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            /* Quiz Completed Celebration Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#eff6ff] text-[#0f2d59] flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-9 h-9 text-[#d97706]" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-[#0f172a]">
                  Challenge Complete!
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  You scored {correctAnswersCount} of {activeQuiz.questions.length} correct
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-[#0f2d59] to-[#1d4e8c] text-white rounded-2xl inline-block px-6">
                <span className="text-[11px] text-[#eff6ff] block font-semibold">
                  Reward Points Earned
                </span>
                <span className="text-xl font-extrabold text-[#d97706]">
                  +{completedQuizzes[activeQuiz.id]?.pointsEarned || activeQuiz.pointsReward} Points
                </span>
              </div>

              <p className="text-xs text-[#64748b] max-w-xs mx-auto">
                Your civic knowledge helps keep Indiranagar clean, green, and resilient!
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => startQuiz(activeQuiz)}
                  className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-bold text-[#0f172a] flex items-center justify-center gap-1 hover:bg-[#f8fafc]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0f2d59] text-white text-xs font-bold hover:bg-[#1d4e8c]"
                >
                  Other Quizzes
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Quizzes List Cards */
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const completed = completedQuizzes[quiz.id];

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl p-5 border border-[#cbd5e1] shadow-xs space-y-3 hover:border-[#0f2d59]/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-full inline-block mb-1">
                      {quiz.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">
                      {quiz.title}
                    </h3>
                  </div>

                  <span className="text-xs font-bold text-[#0f2d59] bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-[#d97706]" />
                    +{quiz.pointsReward} pts
                  </span>
                </div>

                <p className="text-xs text-[#64748b] leading-relaxed">
                  {quiz.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#cbd5e1] text-xs">
                  <span className="text-[11px] text-[#64748b]">
                    {quiz.questionsCount} questions · ~{quiz.estimatedMinutes} mins
                  </span>

                  {completed ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f2d59] bg-[#eff6ff] px-2.5 py-1 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed ({completed.score}/{quiz.questionsCount})
                      </span>
                      <button
                        onClick={() => startQuiz(quiz)}
                        className="p-1.5 rounded-lg border border-[#cbd5e1] text-[#64748b] hover:text-[#0f172a]"
                        title="Replay quiz"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startQuiz(quiz)}
                      className="px-4 py-2 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Start Challenge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
