import React from 'react';
import { X, Sparkles, MapPin, ShieldCheck, CheckCircle2, Award, Lightbulb, Compass } from 'lucide-react';
import type { ReelStory } from '../../types';

interface Props {
  reel: ReelStory;
  onClose: () => void;
}

export const ReelImpactAuditSheet: React.FC<Props> = ({ reel, onClose }) => {
  const score = reel.impactScore ?? 85;
  const tier = reel.impactTier ?? 'Transformational';
  const isHighImpact = score >= 75 || tier === 'Transformational';

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 text-[#0f172a] space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-[#cbd5e1] rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0f172a]">AI Impact & Verification Audit</h3>
              <p className="text-[11px] text-[#64748b]">Multi-modal civic verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story overview */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#0f2d59] text-white">
              {reel.category}
            </span>
            <span className="text-[11px] text-[#64748b] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#ea580c]" />
              {reel.locality}
            </span>
          </div>
          <h4 className="text-sm font-bold text-[#0f172a] leading-tight">{reel.title}</h4>
        </div>

        {/* Three Core AI Verification Pillars */}
        <div className="space-y-2.5">
          <h5 className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">
            Verification Pillars
          </h5>

          {/* Pillar 1: Location Consistency */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">Site & Location Consistency</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Verified Match
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Before and after photos represent the identical physical site. Landmark alignment and street boundaries validated.
              </p>
            </div>
          </div>

          {/* Pillar 2: Civic Niche Check */}
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950">Civic Redressal Domain</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Public Domain
                </span>
              </div>
              <p className="text-[11px] text-blue-900 leading-relaxed">
                Verified public infrastructure redressal. Non-civic subjects (memes, cooking, domestic spaces) filtered out.
              </p>
            </div>
          </div>

          {/* Pillar 3: Community Impact Depth */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
            <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950">Community Impact Depth</span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Score {score}/100 • {tier}
                </span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                {isHighImpact
                  ? 'Exceeds community threshold: Substantial civic transformation, mass initiative, or structural overhaul that inspires citizens.'
                  : 'Meets standard civic redressal. Routine minor sweeps are filtered out to keep Impact Reels inspiring.'}
              </p>
            </div>
          </div>
        </div>

        {/* Key Transformation */}
        {reel.keyTransformation && (
          <div className="space-y-1">
            <h5 className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Visible Transformation</span>
            </h5>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200 leading-relaxed">
              {reel.keyTransformation}
            </p>
          </div>
        )}

        {/* Community Learning Takeaway */}
        {reel.communityTakeaway && (
          <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-1">
            <h5 className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
              <span>Community Takeaway</span>
            </h5>
            <p className="text-xs text-indigo-900 leading-relaxed">
              {reel.communityTakeaway}
            </p>
          </div>
        )}

        {/* Footer info */}
        <p className="text-[10px] text-center text-[#94a3b8] pt-1">
          Audited by JanSevak Community Impact Engine • Promoting high-impact civic actions
        </p>
      </div>
    </div>
  );
};
