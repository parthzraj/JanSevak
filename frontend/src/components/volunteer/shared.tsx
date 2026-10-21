import React from 'react';
import { Avatar } from '../common/Avatar';
import { avatarFrom } from '../../lib/mappers';
import type { CampaignStatus, Person } from '../../lib/api';
import { ApiError } from '../../lib/api';

export const field =
  'w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0f2d59] focus:bg-white text-[#0f172a]';

/** <input type="datetime-local"> value, in the browser's local time */
export const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export const errorText = (e: unknown) =>
  e instanceof ApiError ? e.message : 'Cannot reach the server. Is the Core API running?';

export const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const STATUS_STYLE: Record<CampaignStatus, string> = {
  Upcoming: 'bg-blue-50 text-blue-800 border-blue-200',
  Ongoing: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Awaiting wrap-up': 'bg-amber-50 text-amber-800 border-amber-200',
  Completed: 'bg-slate-100 text-slate-700 border-slate-300',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const StatusBadge: React.FC<{ status: CampaignStatus }> = ({ status }) => (
  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>{status}</span>
);

export const OrganiserChip: React.FC<{ person: Person; type: 'NGO' | 'Citizen' }> = ({ person, type }) => (
  <span className="inline-flex items-center gap-1.5 min-w-0">
    <Avatar src={avatarFrom(person.avatar_url)} name={person.name} size={20} />
    <span className="text-[11px] font-semibold text-[#334155] truncate">{person.name}</span>
    <span
      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
        type === 'NGO' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-50 text-indigo-700'
      }`}
    >
      {type}
    </span>
  </span>
);

export const Sheet: React.FC<{ title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  subtitle,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 pb-8 space-y-3 animate-in slide-in-from-bottom"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-[#0f172a]">{title}</h3>
          {subtitle && <p className="text-[11px] text-[#64748b]">{subtitle}</p>}
        </div>
        <button onClick={onClose} aria-label="Close" className="text-[#64748b] text-lg leading-none px-1 cursor-pointer">
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);
