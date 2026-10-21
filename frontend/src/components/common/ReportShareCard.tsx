import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import type { MonthlyReport } from '../../lib/api';
import { CARD_SIZES, canvasToBlob, cardFileName, drawReportCard, type CardFormat } from '../../lib/shareCard';
import { useApp } from '../../context/AppContext';

/** A picture version of the monthly report, sized for stories (9:16) and posts (1:1). */
export const ReportShareCard: React.FC<{ report: MonthlyReport }> = ({ report }) => {
  const { addToast } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<CardFormat>('story');
  const [showName, setShowName] = useState(true);
  const [drawing, setDrawing] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    setError('');
    drawReportCard(canvas, report, { format, showName })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setDrawing(false));
    return () => {
      cancelled = true;
    };
  }, [report, format, showName]);

  const makeFile = async () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Card is not ready yet.');
    const blob = await canvasToBlob(canvas);
    return new File([blob], cardFileName(report, format), { type: 'image/png' });
  };

  const download = async () => {
    try {
      const file = await makeFile();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      addToast('Image saved', `Post it as a ${CARD_SIZES[format].label.toLowerCase()} on any app.`, 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the image.');
    }
  };

  const share = async () => {
    try {
      const file = await makeFile();
      const data = { files: [file], title: `My civic impact, ${report.month_label}`, text: 'My civic impact this month on JanSevak.' };
      if (navigator.canShare?.(data)) {
        await navigator.share(data);
      } else {
        await download(); // this browser cannot hand an image to other apps: save it instead
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('Could not open the share sheet. Use Save image instead.');
    }
  };

  const size = CARD_SIZES[format];
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="space-y-3 pt-1" data-testid="share-card">
      <div>
        <h3 className="text-xs font-extrabold text-[#0f172a]">Share your month</h3>
        <p className="text-[11px] text-[#64748b]">A ready-made picture for your story or feed. It only shows totals, never your report titles.</p>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#e2e8f0]" role="tablist">
        {(Object.keys(CARD_SIZES) as CardFormat[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={format === f}
            onClick={() => setFormat(f)}
            className={`py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${format === f ? 'bg-white text-[#0f2d59] shadow-sm' : 'text-[#475569]'}`}
          >
            {CARD_SIZES[f].label}
            <span className="block text-[9px] font-semibold text-[#64748b]">{CARD_SIZES[f].hint}</span>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-[11px] font-semibold text-[#334155] cursor-pointer">
        <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} className="accent-[#0f2d59]" />
        Show my name and ward on the picture
      </label>

      <div className="relative mx-auto rounded-2xl overflow-hidden border border-[#cbd5e1] bg-[#0a1e38]" style={{ maxWidth: format === 'story' ? 260 : 340, aspectRatio: `${size.w} / ${size.h}` }}>
        <canvas ref={canvasRef} className="w-full h-full block" aria-label={`${size.label} picture of your monthly report`} />
        {drawing && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}

      <div className="flex gap-2">
        <button onClick={download} disabled={drawing} className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-bold text-[#0f172a] flex items-center justify-center gap-1.5 hover:bg-[#f8fafc] disabled:opacity-60 cursor-pointer">
          <Download className="w-3.5 h-3.5" /> Save image
        </button>
        {canShare && (
          <button onClick={share} disabled={drawing} className="flex-1 py-2.5 rounded-xl bg-[#0f2d59] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#1d4e8c] disabled:opacity-60 cursor-pointer">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        )}
      </div>
    </div>
  );
};
