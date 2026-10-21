import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CAMPAIGN_KINDS,
  createCampaign,
  createIssueRequest,
  fetchIssues,
  uploadImageDataUrl,
  type BackendIssue,
  type Campaign,
} from '../../lib/api';
import { Sheet, errorText, field, localInput } from './shared';

export interface PresetIssue {
  id: number;
  title: string;
  category: string;
  address?: string;
}

interface Props {
  preset?: PresetIssue;
  onClose: () => void;
  onCreated: (c: Campaign) => void;
}

const CATEGORIES = ['Roads', 'Water', 'Sanitation', 'Streetlights', 'Public Safety', 'Parks', 'Community'];
type Mode = 'existing' | 'new' | 'none';

/** Start a civic drive: for an existing report, for a brand-new report made right here, or on its own. */
export const CampaignForm: React.FC<Props> = ({ preset, onClose, onCreated }) => {
  const { addToast, refreshData } = useApp();
  const [mode, setMode] = useState<Mode>(preset ? 'existing' : 'none');
  const [picked, setPicked] = useState<PresetIssue | null>(preset ?? null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<BackendIssue[]>([]);

  const [title, setTitle] = useState(preset ? `Community drive: ${preset.title}`.slice(0, 150) : '');
  const [kind, setKind] = useState<string>('Cleanup');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(preset?.address ?? '');
  const [starts, setStarts] = useState(localInput(new Date(Date.now() + 2 * 86400000)));
  const [ends, setEnds] = useState(localInput(new Date(Date.now() + 2 * 86400000 + 3 * 3600000)));
  const [needed, setNeeded] = useState(10);

  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueCategory, setIssueCategory] = useState('Sanitation');
  const [createdIssueId, setCreatedIssueId] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
      setError('Choose an image under 8 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // search the existing reports as the user types
  useEffect(() => {
    if (mode !== 'existing' || preset) return;
    const t = window.setTimeout(() => {
      fetchIssues({ q: search.trim() || undefined, page_size: 6 })
        .then((r) => setResults(r.items))
        .catch(() => setResults([]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [search, mode, preset]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'existing' && !picked) return setError('Choose the report this drive is for, or pick another option above.');
    const startsAt = new Date(starts);
    const endsAt = new Date(ends);
    if (!(endsAt > startsAt)) return setError('The end time must be after the start time.');
    if (mode === 'new' && createdIssueId === null) {
      if (!address.trim()) return setError('Add the place below. The new report needs a location.');
      if (!photo) return setError('Add a clear photo of the problem. Every report needs one.');
    }

    setBusy(true);
    try {
      let issueId: number | null = mode === 'existing' ? picked!.id : null;
      if (mode === 'new') {
        issueId = createdIssueId;
        if (issueId === null) {
          const photoUrl = await uploadImageDataUrl(photo!);
          const res = await createIssueRequest({
            title: issueTitle.trim(),
            description: issueDesc.trim(),
            category: issueCategory,
            priority: 'Medium',
            address: address.trim() || undefined,
            image_urls: [photoUrl],
          });
          issueId = res.issue.id;
          setCreatedIssueId(issueId); // if the drive step fails, retrying must not file the report twice
          refreshData().catch(() => undefined);
        }
      }
      const campaign = await createCampaign({
        title: title.trim(),
        description: description.trim(),
        kind,
        issue_id: issueId,
        address: address.trim() || undefined,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        volunteers_needed: needed,
      });
      addToast('Drive created', 'Volunteers can join it now. Wrap it up after the event to pay out points.', 'success');
      onCreated(campaign);
    } catch (err) {
      setError(
        (createdIssueId !== null ? 'Your report was filed, but the drive could not be created: ' : '') + errorText(err)
      );
    } finally {
      setBusy(false);
    }
  };

  const modes: { key: Mode; label: string }[] = [
    { key: 'existing', label: 'For an existing report' },
    { key: 'new', label: 'New report + drive' },
    { key: 'none', label: 'Standalone drive' },
  ];

  return (
    <Sheet title="Start a civic drive" subtitle="Organise neighbours, an NGO or a school around a real problem" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {!preset && (
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="What is this drive about">
            {modes.map((m) => (
              <button
                type="button"
                key={m.key}
                role="radio"
                aria-checked={mode === m.key}
                onClick={() => setMode(m.key)}
                className={`text-[10px] font-bold py-2 px-1 rounded-xl border leading-tight cursor-pointer ${
                  mode === m.key ? 'bg-[#0f2d59] text-white border-[#0f2d59]' : 'bg-white text-[#334155] border-[#cbd5e1]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {mode === 'existing' && (
          <div className="space-y-2">
            {picked ? (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-blue-800">LINKED REPORT</div>
                  <div className="text-xs font-bold text-[#0f172a] truncate">{picked.title}</div>
                </div>
                {!preset && (
                  <button type="button" onClick={() => setPicked(null)} className="text-[11px] font-bold text-blue-800 cursor-pointer">
                    Change
                  </button>
                )}
              </div>
            ) : (
              <>
                <input className={field} placeholder="Search reports by title or place" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {results.length === 0 && <p className="text-[11px] text-[#64748b] px-1">No reports found.</p>}
                  {results.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => {
                        setPicked({ id: r.id, title: r.title, category: r.category, address: r.address ?? undefined });
                        if (!address && r.address) setAddress(r.address);
                        if (!title) setTitle(`Community drive: ${r.title}`.slice(0, 150));
                      }}
                      className="w-full text-left p-2.5 rounded-xl border border-[#e2e8f0] hover:bg-[#f8fafc] cursor-pointer"
                    >
                      <div className="text-xs font-bold text-[#0f172a] truncate">{r.title}</div>
                      <div className="text-[10px] text-[#64748b]">
                        {r.category} · {r.status}
                        {r.address ? ` · ${r.address}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {mode === 'new' && (
          <div className="space-y-2 p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
            <div className="text-[11px] font-bold text-[#0f2d59]">The problem (filed as a normal report, +points as usual)</div>
            <input required minLength={3} disabled={createdIssueId !== null} className={field} placeholder="What is wrong? e.g. Garbage dump on 5th Cross" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} />
            <textarea required minLength={3} disabled={createdIssueId !== null} rows={2} className={field} placeholder="Describe the problem" value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} />
            <select disabled={createdIssueId !== null} className={field} value={issueCategory} onChange={(e) => setIssueCategory(e.target.value)} aria-label="Category">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Problem" className="w-full h-28 object-cover rounded-xl" />
                {createdIssueId === null && (
                  <button type="button" onClick={() => setPhoto(null)} className="absolute top-1.5 right-1.5 text-[10px] font-bold bg-black/70 text-white px-2 py-1 rounded-full cursor-pointer">Remove</button>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-3 rounded-xl border-2 border-dashed border-[#cbd5e1] text-[11px] font-bold text-[#64748b] cursor-pointer">
                Add a photo of the problem (required)
              </button>
            )}
            {createdIssueId !== null && <p className="text-[10px] text-emerald-700 font-bold">Report filed (#{createdIssueId}).</p>}
          </div>
        )}

        <input required minLength={5} className={field} placeholder="Drive title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type of drive">
            {CAMPAIGN_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <input type="number" min={1} max={500} className={field} value={needed} onChange={(e) => setNeeded(Number(e.target.value))} aria-label="Volunteers needed" title="Volunteers needed" />
        </div>
        <textarea required minLength={10} rows={3} className={field} placeholder="What will you do and what should people bring?" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className={field} placeholder={mode === 'new' ? 'Place (also used as the report location)' : 'Meeting place / address'} value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-bold text-[#0f172a]">
            Starts
            <input required type="datetime-local" className={`${field} mt-1`} value={starts} onChange={(e) => setStarts(e.target.value)} />
          </label>
          <label className="text-[11px] font-bold text-[#0f172a]">
            Ends
            <input required type="datetime-local" className={`${field} mt-1`} value={ends} onChange={(e) => setEnds(e.target.value)} />
          </label>
        </div>
        <p className="text-[10px] text-[#64748b]">
          Points are paid after the drive: you confirm who attended, each of them earns 30 points and volunteer hours, and you earn 20 + 10 per confirmed volunteer.
        </p>

        {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
        <button disabled={busy} className="w-full py-3 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'new' && createdIssueId === null ? 'File report & create drive' : 'Create drive'}
        </button>
      </form>
    </Sheet>
  );
};
