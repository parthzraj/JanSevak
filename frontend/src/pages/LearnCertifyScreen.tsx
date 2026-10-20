import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnModule } from '../types';

export const LearnCertifyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { modules, completeModuleLesson } = useApp();
  const [activeModule, setActiveModule] = useState<LearnModule | null>(null);

  const handleLessonAdvance = () => {
    if (!activeModule) return;
    completeModuleLesson(activeModule.id);
    setActiveModule((prev) => (prev ? { ...prev, progress: Math.min(100, prev.progress + 25) } : null));
  };

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-8 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
        <span className="text-xs text-[#64748b] font-medium">
          Citizen Academy
        </span>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
              Learn & Certify
            </h1>
            <p className="text-xs text-[#64748b]">
              Essential civic literacy courses. Complete modules to earn verified certificates.
            </p>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-3">
        {modules.map((mod) => {
          const isDone = mod.progress >= 100;

          return (
            <div
              key={mod.id}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs space-y-3 hover:border-[#0f2d59]/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-full">
                      {mod.level}
                    </span>
                    <span className="text-[10px] text-[#64748b] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {mod.duration}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">
                    {mod.title}
                  </h3>
                </div>

                {isDone && (
                  <span className="text-[10px] font-bold text-[#0f2d59] bg-[#eff6ff] px-2.5 py-1 rounded-xl flex items-center gap-1 border border-[#1d4e8c]/20 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Certified
                  </span>
                )}
              </div>

              <p className="text-xs text-[#64748b] leading-relaxed">
                {mod.description}
              </p>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#0f172a]">
                    Course Progress
                  </span>
                  <span className="font-bold text-[#0f2d59] tabular-nums">
                    {mod.progress}%
                  </span>
                </div>
                <div className="h-2 bg-[#f8fafc] rounded-full overflow-hidden border border-[#cbd5e1]">
                  <div
                    className="h-full bg-gradient-to-r from-[#0f2d59] to-[#1d4e8c] transition-all duration-300 rounded-full"
                    style={{ width: `${mod.progress}%` }}
                  />
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-2 border-t border-[#cbd5e1] text-xs">
                <span className="text-[11px] text-[#64748b]">
                  {mod.lessonsCount} interactive lessons
                </span>
                <button
                  onClick={() => setActiveModule(mod)}
                  className="px-4 py-2 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                >
                  <span>{isDone ? 'Review Module' : 'Continue Learning'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Lesson Interactive Modal */}
      {activeModule && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setActiveModule(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto pb-safe animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0f2d59]" />
                <h3 className="text-sm font-bold text-[#0f172a] truncate">
                  {activeModule.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModule(null)}
                className="p-1 rounded-full text-[#64748b] hover:text-[#0f172a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#eff6ff] rounded-2xl flex items-center justify-between text-xs text-[#0f2d59]">
              <span className="font-bold">Module Completion Status</span>
              <span className="font-extrabold">{activeModule.progress}% Completed</span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#0f172a] block">
                Key Civic Takeaways:
              </span>
              <div className="space-y-2">
                {activeModule.keyTakeaways.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#f8fafc] border border-[#cbd5e1] flex items-start gap-2.5 text-xs text-[#0f172a]"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#0f2d59] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {activeModule.progress < 100 ? (
              <button
                onClick={handleLessonAdvance}
                className="w-full py-3 bg-[#0f2d59] text-white text-xs font-bold rounded-xl hover:bg-[#1d4e8c] transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Complete Lesson & Progress (+25%)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <Award className="w-8 h-8 text-[#0f2d59] mx-auto" />
                <h4 className="text-sm font-bold text-[#0f2d59]">
                  Module Certified!
                </h4>
                <p className="text-xs text-[#64748b]">
                  You have mastered this civic subject. View your credentials in Rewards & Certificates.
                </p>
                <button
                  onClick={() => {
                    setActiveModule(null);
                    navigate('/badges-certificates');
                  }}
                  className="w-full py-2 bg-[#0f2d59] text-white text-xs font-bold rounded-xl"
                >
                  View My Certificates
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
