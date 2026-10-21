import React from 'react';
import { Copy, Download, Printer, ShieldCheck, X } from 'lucide-react';
import { PrajaCertificateCard, type PrajaCertificateData } from '../common/PrajaCertificateCard';
import { useApp } from '../../context/AppContext';
import type { Certificate } from '../../lib/academyApi';

const THEME: Record<string, PrajaCertificateData['theme']> = { Beginner: 'green', Intermediate: 'blue', Advanced: 'forest' };

export const formatIssued = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const verifyLink = (code: string) => `${window.location.origin}/certificate/${encodeURIComponent(code)}`;

/** Adapts a real, server-issued course certificate to the existing certificate card design. */
export function toPrajaCertificate(c: Certificate): PrajaCertificateData {
  const tasks = c.tasks_verified ? `, with ${c.tasks_verified} task${c.tasks_verified > 1 ? 's' : ''} verified` : '';
  return {
    id: c.code,
    title: c.course_title.length > 56 ? `${c.course_title.slice(0, 55)}…` : c.course_title,
    category: c.course_title,
    awardTo: c.learner_name,
    issueDate: formatIssued(c.completed_at),
    pointsBadge: c.points_awarded ? `+${c.points_awarded} pts` : 'Certified',
    slogan: 'LEARN · ACT · CERTIFY',
    theme: THEME[c.level] ?? 'green',
    description: `for completing all ${c.lessons_count} lessons${tasks}. Course issued by ${c.issuer.name}. Certificate ID ${c.code}.`,
    shortSummary: `Issued by ${c.issuer.name}`,
  };
}

export const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  .print-certificate, .print-certificate * { visibility: visible !important; }
  .print-certificate { position: fixed !important; left: 0; right: 0; top: 10vh; margin: 0 auto; width: 90vw !important; max-width: 900px; }
}`;

/** Shows ONE certificate: the one for the course the learner just finished (or chose). */
export const CertificateModal: React.FC<{ certificate: Certificate; onClose: () => void }> = ({ certificate, onClose }) => {
  const { addToast } = useApp();
  const link = verifyLink(certificate.code);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      addToast('Link copied', 'Anyone with this link can check that the certificate is genuine.', 'success');
    } catch {
      addToast('Could not copy', link, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3.5 overflow-y-auto" onClick={onClose}>
      <style>{PRINT_CSS}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Certificate for ${certificate.course_title}`}
        className="w-full max-w-xl bg-white rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 text-slate-500 z-10 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <div className="pt-6 print-certificate">
          <PrajaCertificateCard certificate={toPrajaCertificate(certificate)} userName={certificate.learner_name} />
        </div>

        <div className="rounded-2xl bg-[#f8fafc] border border-[#cbd5e1] p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-extrabold text-emerald-800">
            <ShieldCheck className="w-4 h-4" /> Verified certificate
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#64748b]">Certificate ID</span>
            <strong className="text-[#0f172a] font-mono">{certificate.code}</strong>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#64748b]">Course by</span>
            <strong className="text-[#0f172a] text-right">{certificate.issuer.name}</strong>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#64748b]">Completed</span>
            <strong className="text-[#0f172a]">{formatIssued(certificate.completed_at)}</strong>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0f2d59] hover:bg-[#07172c] text-white text-xs font-bold cursor-pointer">
            <Copy className="w-4 h-4" /> Copy verify link
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-[#cbd5e1] text-[#0f172a] text-xs font-bold hover:bg-[#f8fafc] cursor-pointer"
          >
            <Printer className="w-4 h-4" /> <Download className="w-4 h-4 -ml-1" /> Print / PDF
          </button>
        </div>
      </div>
    </div>
  );
};
