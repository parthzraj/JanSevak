import React from 'react';
import { createPortal } from 'react-dom';
import { Users, X } from 'lucide-react';
import type { CivicPost } from '../../types';
import { Avatar } from '../common/Avatar';

type Supporter = NonNullable<CivicPost['supporters']>[number];

export const SupporterAvatar: React.FC<{ supporter: Supporter; size?: number }> = ({ supporter, size = 20 }) => (
  <Avatar src={supporter.avatar} name={supporter.name} size={size} className="border-2 border-white" />
);

interface SupportersModalProps {
  title: string;
  supporters: Supporter[];
  total: number;
  onClose: () => void;
  onOpenProfile?: (userId: string, name: string) => void;
}

export const SupportersModal: React.FC<SupportersModalProps> = ({ title, supporters, total, onClose, onOpenProfile }) =>
  createPortal(
    <div
      className="fixed inset-0 z-[75] bg-black/60 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Supporters"
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#cbd5e1] shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#0f2d59] flex items-center gap-1.5">
              <Users className="w-4 h-4" /> {total} {total === 1 ? 'citizen supports' : 'citizens support'} this issue
            </h2>
            <p className="text-[11px] text-[#64748b] truncate">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f8fafc] text-[#0f172a]"
            aria-label="Close supporters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="overflow-y-auto divide-y divide-slate-100">
          {supporters.length === 0 ? (
            <li className="py-8 text-center text-xs text-[#64748b]">Nobody has upvoted this issue yet.</li>
          ) : (
            supporters.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(s.id, s.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f8fafc] cursor-pointer"
                >
                  <SupporterAvatar supporter={s} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0f172a] truncate">{s.name}</p>
                    {s.ward && <p className="text-[11px] text-[#64748b] truncate">{s.ward}</p>}
                  </div>
                  <span className="text-[10px] text-[#64748b] shrink-0">{s.time}</span>
                </button>
              </li>
            ))
          )}
          {total > supporters.length && (
            <li className="py-3 text-center text-[11px] text-[#64748b]">
              Showing the latest {supporters.length} of {total} supporters
            </li>
          )}
        </ul>
      </div>
    </div>,
    document.body
  );
