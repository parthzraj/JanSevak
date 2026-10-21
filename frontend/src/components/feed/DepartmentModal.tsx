import React from 'react';
import { createPortal } from 'react-dom';
import { Building2, Phone, X } from 'lucide-react';

interface DepartmentInfo {
  name: string;
  handles: string[];
  helpline: string;
  helplineLabel: string;
  tel: string;
}

const DEPARTMENTS: Record<string, DepartmentInfo> = {
  Roads: {
    name: 'Public Works Department (BBMP Road Infra)',
    handles: ['Potholes and road surface damage', 'Footpaths and medians', 'Road signage and barricading'],
    helpline: '1533',
    helplineLabel: 'BBMP Sahaaya helpline',
    tel: '1533',
  },
  Water: {
    name: 'Water Supply & Sewerage Board (BWSSB)',
    handles: ['Pipeline leaks and bursts', 'Low pressure or no supply', 'Sewage overflow and blocked drains'],
    helpline: '1916',
    helplineLabel: 'BWSSB helpline',
    tel: '1916',
  },
  Sanitation: {
    name: 'Solid Waste Management Cell (SWM)',
    handles: ['Garbage collection and overflowing bins', 'Illegal dumping', 'Street sweeping'],
    helpline: '1533',
    helplineLabel: 'BBMP Sahaaya helpline',
    tel: '1533',
  },
  Streetlights: {
    name: 'Electricity Supply Company (BESCOM)',
    handles: ['Non-working streetlights', 'Damaged poles and cables', 'Power-line hazards'],
    helpline: '1912',
    helplineLabel: 'BESCOM helpline',
    tel: '1912',
  },
  'Public Safety': {
    name: 'City Police & Traffic Safety Cell',
    handles: ['Traffic and road-safety hazards', 'Exposed live wires (with BESCOM)', 'Emergency situations'],
    helpline: '112',
    helplineLabel: 'Emergency response',
    tel: '112',
  },
  Parks: {
    name: 'Horticulture & Public Parks Dept',
    handles: ['Park equipment and benches', 'Tree trimming and fallen branches', 'Park lighting and upkeep'],
    helpline: '1533',
    helplineLabel: 'BBMP Sahaaya helpline',
    tel: '1533',
  },
};

const FALLBACK: DepartmentInfo = {
  name: 'Municipal Ward Engineering Cell',
  handles: ['General ward infrastructure issues', 'Coordination with other departments'],
  helpline: '1533',
  helplineLabel: 'BBMP Sahaaya helpline',
  tel: '1533',
};

export const getDepartmentInfo = (category: string): DepartmentInfo => DEPARTMENTS[category] ?? FALLBACK;

interface DepartmentModalProps {
  category: string;
  status: string;
  priority?: string;
  onContact: () => void;
  onClose: () => void;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({ category, status, priority, onContact, onClose }) => {
  const dept = getDepartmentInfo(category);

  return createPortal(
    <div
      className="fixed inset-0 z-[75] bg-black/60 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Responsible department"
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[#cbd5e1]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#eff6ff] text-[#0f2d59] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#64748b] block font-medium">Responsible Department</span>
              <h2 className="text-sm font-bold text-[#0f2d59] leading-snug">{dept.name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f8fafc] text-[#0f172a] shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-2xl p-2.5">
              <span className="text-[10px] text-[#64748b] block">Issue status</span>
              <span className="text-xs font-bold text-[#0f172a]">{status}</span>
            </div>
            <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-2xl p-2.5">
              <span className="text-[10px] text-[#64748b] block">Priority</span>
              <span className="text-xs font-bold text-[#0f172a]">{priority || 'Medium'}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#0f2d59] mb-1.5">This department handles</h3>
            <ul className="space-y-1">
              {dept.handles.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-[#0f172a]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f2d59] mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={`tel:${dept.tel}`}
            className="flex items-center justify-between p-3 rounded-2xl border border-[#cbd5e1] hover:bg-[#f8fafc]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] block">{dept.helplineLabel}</span>
                <span className="text-sm font-extrabold text-[#0f172a]">{dept.helpline}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#0f2d59]">Call</span>
          </a>

          <button
            type="button"
            onClick={() => {
              onContact();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold"
          >
            Contact Ward Desk about this issue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
