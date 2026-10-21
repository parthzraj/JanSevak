import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Trophy, ShieldCheck, Search, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, unreadNotificationsCount, toggleSidebar, theme, toggleTheme } = useApp();

  const isSearchActive = location.pathname === '/search';
  const isNotificationsActive = location.pathname === '/notifications';
  const isRewardsActive = location.pathname === '/rewards';
  const isProfileActive = location.pathname === '/profile';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-[#cbd5e1] dark:border-slate-800 transition-all shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      {/* Official Government Tricolor Header Stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-[#ea580c] via-white to-[#0b6623]" />

      <div className="flex items-center justify-between max-w-full px-3 sm:px-4 py-2">
        {/* Left: 3 Horizontal Lines (Hamburger Menu) & JanSevak Emblem */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-xl text-[#0f2d59] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all focus:outline-none cursor-pointer"
            aria-label="Open navigation menu"
            title="Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.3]" />
          </button>

          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 group text-left focus:outline-none cursor-pointer"
            title="Home - JanSevak Civic Portal"
            aria-label="JanSevak Home"
          >
            {/* Government Official Crest Badge */}
            <div className="w-8 h-8 rounded-lg bg-[#0f2d59] border border-[#d4af37]/60 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform relative overflow-hidden">
              <svg
                className="w-4 h-4 text-[#fbbf24]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L4 5v6.5C4 17 7.5 21 12 22c4.5-1 8-5 8-10.5V5l-8-3z" />
                <path d="M12 7v8" />
                <path d="M8 11h8" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="font-black text-sm text-[#0f2d59] dark:text-white tracking-tight block">JanSevak</span>
              <span className="text-[9px] font-bold text-[#ea580c] uppercase tracking-wider block">Civic OS</span>
            </div>
          </button>
        </div>

        {/* Right side: Rewards Trophy, Search, Theme Toggle, Notifications, Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Rewards Points Pill */}
          <button
            onClick={() => navigate('/rewards')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              isRewardsActive
                ? 'bg-[#eff6ff] text-[#0f2d59] border-[#0f2d59]/40 shadow-xs dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/60'
                : 'bg-[#fff7ed] text-[#9a3412] border-[#fed7aa] hover:bg-[#ffedd5] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/40'
            }`}
            title="Your Civic Reward Points"
          >
            <Trophy className="w-3.5 h-3.5 text-[#d97706]" />
            <span className="tabular-nums font-extrabold text-[#0f2d59] dark:text-amber-200">{user.points}</span>
            <span className="text-[10px] text-[#64748b] dark:text-slate-400 font-medium hidden xs:inline">pts</span>
          </button>

          {/* Theme Quick Toggle (Light / Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark/light mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Search Button */}
          <button
            onClick={() => navigate('/search')}
            className={`relative p-2 rounded-full transition-colors cursor-pointer ${
              isSearchActive
                ? 'bg-[#eff6ff] text-[#0f2d59] dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-[#334155] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Search"
            aria-label="Search and Explore"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => navigate('/notifications')}
            className={`relative p-2 rounded-full transition-colors cursor-pointer ${
              isNotificationsActive
                ? 'bg-[#eff6ff] text-[#0f2d59] dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-[#334155] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ea580c] ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* User Profile Avatar - Clicking navigates directly to /profile without drawer */}
          <button
            onClick={() => navigate('/profile')}
            className={`relative p-0.5 rounded-full transition-all focus:outline-none cursor-pointer ${
              isProfileActive
                ? 'ring-2 ring-[#0f2d59] ring-offset-2 scale-105 shadow-sm'
                : 'hover:ring-2 hover:ring-[#0f2d59]/50'
            }`}
            title={`View profile for ${user.name}`}
            aria-label="View Profile"
          >
            <Avatar src={user.avatar} name={user.name} size={28} className="border border-white" />
            <div className="absolute -bottom-0.5 -right-0.5 bg-[#0f2d59] rounded-full p-0.5 text-white">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
