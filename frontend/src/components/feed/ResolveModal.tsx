import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, X, Sparkles, AlertTriangle, ShieldCheck, RefreshCw, Info } from 'lucide-react';
import { verifyImpactReel, type ImpactVerificationResult } from '../../lib/api';

interface Props {
  title: string;
  category?: string;
  description?: string;
  beforePhoto?: string;
  onConfirm: (opts: { afterPhoto?: string; note?: string; impactResult?: ImpactVerificationResult }) => Promise<boolean>;
  onClose: () => void;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Officials close an issue here. The "after" photo and note become the reel's before/after story. */
export const ResolveModal: React.FC<Props> = ({
  title,
  category,
  description,
  beforePhoto,
  onConfirm,
  onClose,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string>();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ImpactVerificationResult | null>(null);

  const runVerification = async (afterDataUrl: string, currentNote: string) => {
    setIsVerifying(true);
    try {
      const res = await verifyImpactReel({
        beforeImageB64: beforePhoto,
        afterImageB64: afterDataUrl,
        title,
        category,
        description,
        resolutionNote: currentNote,
      });
      setVerificationResult(res);
    } catch (err) {
      console.warn('AI Impact verification unavailable, continuing with standard resolution:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.');
    if (file.size > 8 * 1024 * 1024) return setError('That photo is over 8 MB. Choose a smaller one.');
    setError('');
    const dataUrl = await readAsDataUrl(file);
    setPhoto(dataUrl);

    // Automatically trigger AI impact verification when photo is selected
    runVerification(dataUrl, note);
  };

  const handleManualVerify = () => {
    if (!photo && !note.trim()) {
      setError('Please add an after photo or resolution note to verify.');
      return;
    }
    setError('');
    runVerification(photo || '', note);
  };

  const submit = async () => {
    setBusy(true);
    const ok = await onConfirm({
      afterPhoto: photo,
      note,
      impactResult: verificationResult || undefined,
    });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Mark resolved"
      onClick={(e) => {
        e.stopPropagation();
        if (!busy) onClose();
      }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-extrabold text-[#0f172a]">Mark as Resolved</h3>
            </div>
            <p className="text-[11px] text-[#64748b] truncate mt-0.5">{title}</p>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Close" className="p-1 text-[#64748b] hover:text-[#0f172a] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#64748b] leading-relaxed">
          Add a photo of the completed work. Our AI analyzes location consistency and community impact before featuring it in <span className="font-bold text-[#0f2d59]">Impact Reels</span>.
        </p>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

        {/* Before / After Preview Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Before Photo Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[4/3] flex flex-col items-center justify-center">
            {beforePhoto ? (
              <>
                <img src={beforePhoto} alt="Before" className="w-full h-full object-cover" />
                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-rose-600/90 text-white px-2 py-0.5 rounded-md shadow-xs">
                  BEFORE (Reported)
                </span>
              </>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium text-center px-2">
                No before photo attached
              </span>
            )}
          </div>

          {/* After Photo Preview or Upload Button */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[4/3] flex flex-col items-center justify-center">
            {photo ? (
              <>
                <img src={photo} alt="After" className="w-full h-full object-cover" />
                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-emerald-600/90 text-white px-2 py-0.5 rounded-md shadow-xs">
                  AFTER (Resolved)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(undefined);
                    setVerificationResult(null);
                  }}
                  className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-black/75 hover:bg-black text-white px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                >
                  Change
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#0f2d59] hover:bg-slate-50 transition-colors p-2 text-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0f2d59] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold">Add "After" Photo</span>
                <span className="text-[9px] text-[#64748b]">Required for Reels</span>
              </button>
            )}
          </div>
        </div>

        {/* Resolution Note */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>Work Details & Community Scope</span>
            <span className="text-[10px] text-slate-400">{note.length}/500</span>
          </label>
          <textarea
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Describe the transformation (e.g., cleared 4-ton illegal dumpsite, disinfected area with 20 volunteers, and leveled ground)."
            className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0f2d59] resize-none"
          />
        </div>

        {/* Manual Re-Verify Button if note changed */}
        {photo && (
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500 text-[10px]">AI auto-evaluates impact & location</span>
            <button
              type="button"
              onClick={handleManualVerify}
              disabled={isVerifying}
              className="inline-flex items-center gap-1 font-bold text-[#0f2d59] hover:text-[#1d4e8c] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Analyzing…' : 'Re-verify with AI'}</span>
            </button>
          </div>
        )}

        {/* AI Verification Assessment Card */}
        {isVerifying && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-[#0f2d59] animate-pulse">
            <span className="w-4 h-4 border-2 border-[#0f2d59] border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="text-xs">
              <span className="font-bold block">Analyzing Location & Civic Impact…</span>
              <span className="text-[10px] text-blue-800">Checking physical landmarks, civic niche, and transformation depth</span>
            </div>
          </div>
        )}

        {!isVerifying && verificationResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
              verificationResult.verdict === 'approved'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-extrabold text-[12px]">
                {verificationResult.verdict === 'approved' ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>AI Verified: {verificationResult.impact_tier}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Impact Reels Filter</span>
                  </>
                )}
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  verificationResult.verdict === 'approved'
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                Score: {verificationResult.impact_score}/100
              </span>
            </div>

            {/* Checklist of verification criteria */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1">
              <div className="flex items-center gap-1">
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${verificationResult.is_civic_niche ? 'text-emerald-600' : 'text-red-500'}`}
                />
                <span className={verificationResult.is_civic_niche ? 'text-slate-700' : 'text-red-700 font-bold'}>
                  {verificationResult.is_civic_niche ? 'Civic Grievance Niche' : 'Non-Civic Content'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${verificationResult.is_location_match ? 'text-emerald-600' : 'text-red-500'}`}
                />
                <span className={verificationResult.is_location_match ? 'text-slate-700' : 'text-red-700 font-bold'}>
                  {verificationResult.is_location_match ? 'Location Match Verified' : 'Location Mismatch'}
                </span>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed pt-1">
              {verificationResult.reason}
            </p>

            {verificationResult.verdict === 'approved' && verificationResult.community_takeaway && (
              <div className="flex items-start gap-1.5 text-[10px] bg-white/70 p-2 rounded-xl text-emerald-800 border border-emerald-100">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{verificationResult.community_takeaway}</span>
              </div>
            )}

            {verificationResult.verdict === 'rejected' && (
              <div className="text-[10px] text-amber-800 bg-white/80 p-2 rounded-xl border border-amber-200">
                <span className="font-bold block">Advisory:</span>
                This resolution can still be finalized for the citizen. However, only high-impact civic milestones and mass community drives are featured on the public Impact Reels feed.
              </div>
            )}
          </div>
        )}

        {error && <p className="text-[11px] text-red-600 font-semibold">{error}</p>}

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] hover:bg-slate-200 text-xs font-bold text-[#334155] cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer transition-colors shadow-md shadow-emerald-600/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            {busy ? 'Saving…' : 'Mark Resolved'}
          </button>
        </div>
      </div>
    </div>
  );
};
