import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  User,
  ClipboardList,
  Award,
  AlertTriangle,
  Trophy,
  HeartHandshake,
  GraduationCap,
  Gamepad2,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SidebarDrawer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSidebarOpen, setIsSidebarOpen, logout, theme, toggleTheme } = useApp();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, setIsSidebarOpen]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  if (!isSidebarOpen) return null;

  const handleNavigate = (path: string) => {
    setIsSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsSidebarOpen(false);
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      label: 'My Profile',
      path: '/profile',
      icon: User,
      badge: user.level,
      color: 'text-blue-600',
    },
    {
      label: 'My Requests & Grievances',
      path: '/report-analysis',
      icon: ClipboardList,
      badge: `${user.stats.reportsCount} filed`,
      color: 'text-emerald-600',
    },
    {
      label: 'Badges & Certificates',
      path: '/badges-certificates',
      icon: Award,
      badge: 'Certified',
      color: 'text-amber-600',
    },
    {
      label: 'Predictive Civic Alerts',
      path: '/alerts',
      icon: AlertTriangle,
      badge: 'Live',
      color: 'text-orange-600',
    },
    {
      label: 'Civic Rewards & Karma',
      path: '/rewards',
      icon: Trophy,
      badge: `${user.points} pts`,
      color: 'text-yellow-600',
    },
    {
      label: 'NGO Volunteering & Drives',
      path: '/vacancies',
      icon: HeartHandshake,
      color: 'text-rose-600',
    },
    {
      label: 'Civic Academy (Learn)',
      path: '/learn-certify',
      icon: GraduationCap,
      color: 'text-indigo-600',
    },
    {
      label: 'Civic Games & Quiz',
      path: '/games',
      icon: Gamepad2,
      color: 'text-purple-600',
    },
    {
      label: 'Account & Ward Settings',
      path: '/profile?tab=settings',
      icon: Settings,
      color: 'text-slate-600',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex justify-center transition-all duration-300 animate-in fade-in"
      onClick={() => setIsSidebarOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation sidebar"
    >
      {/* Centered Mobile App Shell Boundary */}
      <div className="w-full max-w-lg h-full relative pointer-events-none overflow-hidden">
        {/* Slide-out Left Sidebar Drawer: opens inside the app's left edge */}
        <aside
          className="absolute top-0 bottom-0 left-0 w-[82%] sm:w-[78%] max-w-[320px] bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-300 select-none border-r border-slate-200 dark:border-slate-800 pointer-events-auto h-full"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-[#0f2d59] to-[#1d4e8c] text-white p-5 pt-6 relative shadow-md">
          {/* Tricolor stripe at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ea580c] via-white to-[#0b6623]" />

          {/* Close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Profile Card - Clickable to open profile */}
          <button
            type="button"
            onClick={() => handleNavigate('/profile')}
            className="flex items-center gap-3.5 text-left w-full hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer group"
            title="View Full Profile"
          >
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-2xl overflow-hidden p-0.5 border-2 border-[#ea580c] bg-white/10 shadow-md group-hover:border-white transition-colors">
                <img
                  src="/profile_3d_avatar.jpg"
                  alt={user.name}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = user.avatar;
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 text-white ring-2 ring-[#0f2d59]">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-sm text-white truncate tracking-tight group-hover:underline">
                {user.name}
              </h3>
              <p className="text-[11px] text-blue-100 truncate">
                {user.neighborhood} · {user.wardNumber}
              </p>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-[10px] font-bold text-amber-300 border border-white/20">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{user.points} pts</span>
                <span className="text-white/60">·</span>
                <span>{user.level}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Scrollable Navigation Options */}
        <div className="flex-1 overflow-y-auto py-2.5 px-3 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Quick Navigation
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.label}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#eff6ff] text-[#0f2d59] font-bold shadow-2xs dark:bg-blue-950/70 dark:text-blue-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 active:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#0f2d59] text-white' : 'bg-slate-100 dark:bg-slate-800 ' + item.color
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-[#0f2d59] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions & Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1120] space-y-2.5">
          {/* Theme Quick Toggle Row */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 min-w-0">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Sun className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#0f2d59] hover:bg-[#1d4e8c] text-white shadow-xs transition-colors cursor-pointer shrink-0"
              title="Switch Theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer border border-red-200/60 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          {/* App Branding & Version */}
          <div className="text-center pt-0.5">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              JanSevak Civic OS · v1.4
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500">
              Transparent, Citizen-Powered Governance
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
  );
};
