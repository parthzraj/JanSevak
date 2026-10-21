import React, { useEffect, useState } from 'react';
import { X, Send, ShieldCheck } from 'lucide-react';
import { addCommentRequest } from '../../lib/api';
import { getReelComments } from '../../lib/reelsApi';
import { toComment } from '../../lib/mappers';
import { Avatar } from '../common/Avatar';

interface Props {
  issueId: string;
  title: string;
  onCount: (count: number) => void;
  onClose: () => void;
  onOpenProfile: (userId?: string, name?: string) => void;
}

type C = ReturnType<typeof toComment>;

/** Comments on a reel are the issue's real comments (same thread as on the report itself). */
export const ReelCommentsSheet: React.FC<Props> = ({ issueId, title, onCount, onClose, onOpenProfile }) => {
  const [comments, setComments] = useState<C[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    getReelComments(issueId)
      .then((list) => live && setComments(list.map(toComment)))
      .catch(() => live && setError('Could not load comments.'));
    return () => {
      live = false;
    };
  }, [issueId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const saved = toComment(await addCommentRequest(issueId, text.trim()));
      setComments((prev) => {
        const next = [...(prev ?? []), saved];
        onCount(next.length);
        return next;
      });
      setText('');
    } catch {
      setError('Could not post your comment. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 text-[#0f172a] flex flex-col max-h-[75vh] animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-[#cbd5e1] rounded-full mx-auto mb-2" />
        <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold">Comments{comments ? ` (${comments.length})` : ''}</h3>
            <p className="text-[11px] text-[#64748b] truncate">{title}</p>
          </div>
          <button onClick={onClose} aria-label="Close comments" className="p-1 rounded-full text-[#64748b] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 min-h-[120px]">
          {comments === null && !error && <p className="text-xs text-[#64748b] text-center py-6">Loading…</p>}
          {comments?.length === 0 && <p className="text-xs text-[#64748b] text-center py-6">No comments yet. Say thanks!</p>}
          {comments?.map((c) => (
            <div key={c.id} className="p-2.5 bg-[#f8fafc] rounded-xl text-xs flex gap-2.5">
              <Avatar src={c.avatar} name={c.author} size={28} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <button
                    type="button"
                    onClick={() => onOpenProfile(c.userId, c.author)}
                    className="font-bold hover:underline cursor-pointer text-left"
                  >
                    {c.author}
                  </button>
                  {c.isOfficial && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-label="Official" />}
                  <span className="text-[10px] text-[#64748b]">{c.time}</span>
                </div>
                <p className="text-slate-800 break-words">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-[11px] text-red-600 pb-1">{error}</p>}
        <form onSubmit={submit} className="flex gap-2 pt-2 border-t border-[#cbd5e1]">
          <input
            type="text"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your appreciation..."
            className="flex-1 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0f2d59]"
          />
          <button
            type="submit"
            disabled={!text.trim() || busy}
            aria-label="Post comment"
            className="p-2.5 bg-[#0f2d59] text-white rounded-xl disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
