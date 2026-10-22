import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, X } from 'lucide-react';

interface Props {
  title: string;
  onConfirm: (opts: { afterPhoto?: string; note?: string }) => Promise<boolean>;
  onClose: () => void;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Officials close an issue here. The optional "after" photo and note become the reel's before/after story. */
export const ResolveModal: React.FC<Props> = ({ title, onConfirm, onClose }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string>();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.');
    if (file.size > 8 * 1024 * 1024) return setError('That photo is over 8 MB. Choose a smaller one.');
    setError('');
    setPhoto(await readAsDataUrl(file));
  };

  const submit = async () => {
    setBusy(true);
    const ok = await onConfirm({ afterPhoto: photo, note });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Mark resolved"
      onClick={(e) => {
        e.stopPropagation();
        if (!busy) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#0f172a]">Mark as resolved</h3>
            <p className="text-[11px] text-[#64748b] truncate">{title}</p>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Close" className="p-1 text-[#64748b] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#64748b] leading-relaxed">
          Add a photo of the finished work. Citizens will see it next to the original report in Impact Reels.
        </p>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {photo ? (
          <div className="relative">
            <img src={photo} alt="After" className="w-full h-40 object-cover rounded-2xl" />
            <button
              onClick={() => setPhoto(undefined)}
              className="absolute top-2 right-2 text-[10px] font-bold bg-black/70 text-white px-2 py-1 rounded-full cursor-pointer"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-28 rounded-2xl border-2 border-dashed border-[#cbd5e1] text-[#64748b] text-xs font-semibold flex flex-col items-center justify-center gap-1.5 hover:bg-[#f8fafc] cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            Add “after” photo (recommended)
          </button>
        )}

        <textarea
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What was done? e.g. Pothole filled and road levelled"
          className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0f2d59] resize-none"
        />
        {error && <p className="text-[11px] text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] text-xs font-bold text-[#334155] cursor-pointer">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {busy ? 'Saving…' : 'Mark resolved'}
          </button>
        </div>
      </div>
    </div>
  );
};
