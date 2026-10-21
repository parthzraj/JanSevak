import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CampaignBoard } from '../components/volunteer/CampaignBoard';
import { VacancyBoard } from '../components/volunteer/VacancyBoard';

type Tab = 'drives' | 'ngo';

/** NGO Volunteering and Civic Drives: both tabs are live (server data, real points). */
export const VolunteerHubScreen: React.FC = () => {
  const [params] = useSearchParams();
  const driveId = Number(params.get('drive')) || null;
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'ngo' ? 'ngo' : 'drives');

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-32 space-y-3 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="text-lg font-extrabold text-[#0f172a]">NGO Volunteering &amp; Civic Drives</h1>
        <p className="text-[11px] text-[#64748b]">Join a drive near you, start your own for a problem you reported, or apply for an NGO role.</p>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#e2e8f0]" role="tablist">
        {([['drives', 'Civic Drives'], ['ngo', 'NGO Volunteering']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${tab === key ? 'bg-white text-[#0f2d59] shadow-sm' : 'text-[#475569]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'drives' ? <CampaignBoard initialOpenId={driveId} /> : <VacancyBoard />}
    </div>
  );
};
