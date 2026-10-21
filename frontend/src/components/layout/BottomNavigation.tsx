import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, PlaySquare, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ACTIVE = 'text-[#0f2d59] dark:text-blue-400';
const IDLE = 'text-[#64748b] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white';

interface TabProps {
  label: string;
  aria: string;
  icon: LucideIcon;
  active: boolean;
  spinWhenActive?: boolean;
  onClick: () => void;
}

/** One equal-width tab. min-w-0 lets it shrink on narrow phones instead of pushing the bar wider than the screen. */
const Tab: React.FC<TabProps> = ({ label, aria, icon: Icon, active, spinWhenActive, onClick }) => (
  <button
    onClick={onClick}
    aria-label={aria}
    aria-current={active ? 'page' : undefined}
    className={`min-w-0 flex flex-col items-center justify-center gap-0.5 h-full transition-colors cursor-pointer ${active ? ACTIVE : IDLE}`}
  >
    <span className="relative flex items-center justify-center">
      <Icon className={`w-5 h-5 transition-transform ${active ? `scale-110 stroke-[2.4] ${spinWhenActive ? 'rotate-90' : ''}` : 'stroke-[1.8]'}`} />
      {active && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ea580c]" />}
    </span>
    <span className={`text-[10px] min-[380px]:text-[11px] leading-tight tracking-tight whitespace-nowrap truncate max-w-full ${active ? 'font-extrabold' : 'font-medium'}`}>
      {label}
    </span>
  </button>
);

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMenuPopupOpen, toggleMenuPopup } = useApp();

  const path = location.pathname;
  const is = (p: string) => path === p;
  const homeActive = path === '/' || path === '/home';
  const menuActive =
    isMenuPopupOpen ||
    is('/menu') ||
    is('/volunteer') ||
    is('/games') ||
    is('/report-analysis') ||
    path.startsWith('/academy') ||
    is('/rewards');

  return (
    // Same width as the phone shell in AppLayout (max-w-lg), centred, so the bar never spills past the screen
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-[#cbd5e1] dark:border-slate-800 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom,0px)] transition-colors duration-250"
      role="navigation"
      aria-label="Bottom Navigation"
    >
      <div className="grid grid-cols-5 items-center h-16 px-1">
        <Tab label="Home" aria="Home Feed" icon={Home} active={homeActive} onClick={() => navigate('/home')} />
        <Tab label="Search" aria="Search and Explore" icon={Search} active={is('/search')} onClick={() => navigate('/search')} />

        {/* Centre: report an issue */}
        <div className="flex items-center justify-center -mt-6">
          <button
            onClick={() => navigate('/create-report')}
            className="group relative flex items-center justify-center w-12 h-12 min-[380px]:w-[52px] min-[380px]:h-[52px] rounded-full bg-gradient-to-tr from-[#0a1e38] via-[#0f2d59] to-[#1d4e8c] text-white shadow-lg shadow-[#0f2d59]/35 hover:scale-105 active:scale-95 transition-all focus:outline-none border-2 border-[#d97706]/80 cursor-pointer"
            aria-label="Create Civic Report"
            title="Report a Civic Issue"
          >
            <Plus className="w-6 h-6 stroke-[2.6] transition-transform group-hover:rotate-90 text-[#fbbf24]" />
          </button>
        </div>

        <Tab label="Impact" aria="Positive Impact Reels" icon={PlaySquare} active={is('/positive-impact')} onClick={() => navigate('/positive-impact')} />
        <Tab label="Menu" aria="Features Menu" icon={LayoutGrid} active={menuActive} spinWhenActive onClick={() => toggleMenuPopup()} />
      </div>
    </nav>
  );
};
