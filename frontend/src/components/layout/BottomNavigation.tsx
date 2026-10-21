import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, PlaySquare, LayoutGrid } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMenuPopupOpen, toggleMenuPopup } = useApp();

  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/home' && (currentPath === '/' || currentPath === '/home')) return true;
    return currentPath === path;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 dark:bg-[#0f172a]/98 backdrop-blur-md border-t border-[#cbd5e1] dark:border-slate-800 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] pb-safe transition-colors duration-250"
      role="navigation"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-xl mx-auto px-2">
        <div className="flex items-center justify-between h-16">
          {/* 1. Home */}
          <button
            onClick={() => navigate('/home')}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] transition-colors cursor-pointer ${
              isActive('/home')
                ? 'text-[#0f2d59] dark:text-blue-400'
                : 'text-[#64748b] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white'
            }`}
            aria-label="Home Feed"
          >
            <div className="relative">
              <Home
                className={`w-5 h-5 transition-transform ${
                  isActive('/home')
                    ? 'scale-110 stroke-[2.4] text-[#0f2d59] dark:text-blue-400'
                    : 'stroke-[1.8]'
                }`}
              />
              {isActive('/home') && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
              )}
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight font-medium ${
                isActive('/home')
                  ? 'text-[#0f2d59] dark:text-blue-400 font-extrabold'
                  : 'text-[#64748b] dark:text-slate-400'
              }`}
            >
              Home
            </span>
          </button>

          {/* 2. Search */}
          <button
            onClick={() => navigate('/search')}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] transition-colors cursor-pointer ${
              isActive('/search')
                ? 'text-[#0f2d59] dark:text-blue-400'
                : 'text-[#64748b] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white'
            }`}
            aria-label="Search and Explore"
          >
            <div className="relative">
              <Search
                className={`w-5 h-5 transition-transform ${
                  isActive('/search')
                    ? 'scale-110 stroke-[2.4] text-[#0f2d59] dark:text-blue-400'
                    : 'stroke-[1.8]'
                }`}
              />
              {isActive('/search') && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
              )}
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight font-medium ${
                isActive('/search')
                  ? 'text-[#0f2d59] dark:text-blue-400 font-extrabold'
                  : 'text-[#64748b] dark:text-slate-400'
              }`}
            >
              Search
            </span>
          </button>

          {/* 3. Central Prominent Plus Button (Create Report) */}
          <div className="flex-1 flex items-center justify-center -mt-5">
            <button
              onClick={() => navigate('/create-report')}
              className="group relative flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-tr from-[#0a1e38] via-[#0f2d59] to-[#1d4e8c] text-white shadow-lg shadow-[#0f2d59]/35 hover:shadow-xl hover:shadow-[#0f2d59]/45 hover:scale-105 active:scale-95 transition-all focus:outline-none border-2 border-[#d97706]/80 cursor-pointer"
              aria-label="Create Civic Report"
              title="Report a Civic Issue"
            >
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              <Plus className="w-6 h-6 stroke-[2.6] transition-transform group-hover:rotate-90 text-[#fbbf24]" />
            </button>
          </div>

          {/* 4. Positive Impact (Reels) */}
          <button
            onClick={() => navigate('/positive-impact')}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] transition-colors cursor-pointer ${
              isActive('/positive-impact')
                ? 'text-[#0f2d59] dark:text-blue-400'
                : 'text-[#64748b] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white'
            }`}
            aria-label="Positive Impact Reels"
          >
            <div className="relative">
              <PlaySquare
                className={`w-5 h-5 transition-transform ${
                  isActive('/positive-impact')
                    ? 'scale-110 stroke-[2.4] text-[#0f2d59] dark:text-blue-400'
                    : 'stroke-[1.8]'
                }`}
              />
              {isActive('/positive-impact') && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
              )}
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight font-medium whitespace-nowrap ${
                isActive('/positive-impact')
                  ? 'text-[#0f2d59] dark:text-blue-400 font-extrabold'
                  : 'text-[#64748b] dark:text-slate-400'
              }`}
            >
              Impact
            </span>
          </button>

          {/* 5. Menu */}
          <button
            onClick={() => toggleMenuPopup()}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] transition-colors cursor-pointer ${
              isMenuPopupOpen ||
              isActive('/menu') ||
              isActive('/volunteer') ||
              isActive('/games') ||
              isActive('/report-analysis') ||
              currentPath.startsWith('/academy') ||
              isActive('/rewards')
                ? 'text-[#0f2d59] dark:text-blue-400'
                : 'text-[#64748b] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white'
            }`}
            aria-label="Features Menu"
          >
            <div className="relative">
              <LayoutGrid
                className={`w-5 h-5 transition-transform ${
                  isMenuPopupOpen || isActive('/menu')
                    ? 'scale-110 stroke-[2.4] rotate-90 text-[#0f2d59] dark:text-blue-400'
                    : 'stroke-[1.8]'
                }`}
              />
              {(isMenuPopupOpen || isActive('/menu')) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
              )}
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight font-medium ${
                isMenuPopupOpen || isActive('/menu')
                  ? 'text-[#0f2d59] dark:text-blue-400 font-extrabold'
                  : 'text-[#64748b] dark:text-slate-400'
              }`}
            >
              Menu
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};
