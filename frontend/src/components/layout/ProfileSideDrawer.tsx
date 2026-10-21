import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  HandHeart,
  Megaphone,
  Settings,
  LogOut,
  ChevronUp,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const ProfileSideDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { user, isProfileDrawerOpen, setIsProfileDrawerOpen, logout, addToast } = useApp();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfileDrawerOpen) {
        setIsProfileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileDrawerOpen, setIsProfileDrawerOpen]);

  if (!isProfileDrawerOpen) return null;

  const handleNavigate = (path: string) => {
    setIsProfileDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsProfileDrawerOpen(false);
    logout();
    navigate('/login');
  };

  const handleVersionClick = () => {
    addToast('JanSevak v1.4', 'You are running the latest civic build.', 'info');
  };

  return (
    <>
      {/* Dimmed backdrop overlay - click outside to close */}
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] transition-opacity"
        onClick={() => setIsProfileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Profile Sidebar Panel anchored directly below the header avatar */}
      <aside
        className="absolute top-12 right-2.5 z-50 w-[108px] bg-gradient-to-b from-[#0a1e38] via-[#0f2d59] to-[#08182b] text-white rounded-[20px] shadow-[-5px_7px_20px_rgba(0,0,0,0.45)] border border-blue-500/30 pt-2 pb-0.5 px-1.5 flex flex-col items-center select-none animate-profile-drawer"
        role="dialog"
        aria-label="Profile navigation menu"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Avatar with Saffron/Gold Border and Toggle Tab */}
        <div className="relative mt-0.5 mb-1 flex items-center justify-center">
          <div className="w-[44px] h-[44px] rounded-full p-[1.5px] border-[2px] border-[#ea580c] bg-[#0a1e38] flex items-center justify-center shadow-md relative overflow-hidden">
            <Avatar src={user.avatar} name={user.name} size={38} />
          </div>

          {/* Right edge chevron toggle tab */}
          <button
            onClick={() => setIsProfileDrawerOpen(false)}
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-4.5 bg-[#ea580c] hover:bg-[#c2410c] text-white border border-amber-300/40 rounded-r-md flex items-center justify-center shadow-xs cursor-pointer transition-transform active:scale-95 focus:outline-none"
            title="Close menu"
            aria-label="Close profile menu"
          >
            <ChevronLeft className="w-2 h-2 stroke-[3] text-white" />
          </button>
        </div>

        {/* Menu Items Container */}
        <div className="w-full flex flex-col items-stretch space-y-1 mt-0.5">
          {/* Item 1: Profile (Highlighted Card) */}
          <button
            onClick={() => handleNavigate('/profile')}
            className="w-full bg-gradient-to-b from-[#1d4e8c] to-[#0f2d59] hover:from-[#2563eb] hover:to-[#1d4e8c] active:scale-98 transition-all rounded-lg py-1.5 px-0.5 flex flex-col items-center justify-center shadow-xs cursor-pointer border border-blue-400/30 group"
          >
            <User className="w-4 h-4 text-white stroke-[2] group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-white mt-0.5 tracking-tight">
              Profile
            </span>
          </button>

          {/* Item 2: My Requests */}
          <button
            onClick={() => handleNavigate('/profile?tab=reports')}
            className="w-full hover:bg-white/10 active:scale-98 transition-all rounded-md py-1 px-0.5 flex flex-col items-center justify-center text-white cursor-pointer group"
          >
            <HandHeart className="w-4 h-4 text-white stroke-[1.8] group-hover:scale-105 transition-transform" />
            <span className="text-[9px] font-medium text-white/95 mt-0.5 text-center leading-tight">
              My Requests
            </span>
          </button>

          {/* Item 3: Notifications */}
          <button
            onClick={() => handleNavigate('/notifications')}
            className="w-full hover:bg-white/10 active:scale-98 transition-all rounded-md py-1 px-0.5 flex flex-col items-center justify-center text-white cursor-pointer group"
          >
            <Megaphone className="w-4 h-4 text-white stroke-[1.8] group-hover:scale-105 transition-transform" />
            <span className="text-[9px] font-medium text-white/95 mt-0.5 text-center leading-tight">
              Notifications
            </span>
          </button>

          {/* Item 4: Settings */}
          <button
            onClick={() => handleNavigate('/profile?tab=settings')}
            className="w-full hover:bg-white/10 active:scale-98 transition-all rounded-md py-1 px-0.5 flex flex-col items-center justify-center text-white cursor-pointer group"
          >
            <Settings className="w-4 h-4 text-white stroke-[1.8] group-hover:scale-105 transition-transform" />
            <span className="text-[9px] font-medium text-white/95 mt-0.5 text-center leading-tight">
              Settings
            </span>
          </button>

          {/* Item 5: Version 1.4 */}
          <button
            onClick={handleVersionClick}
            className="w-full flex items-center justify-center gap-1 px-1 py-0.5 text-white/90 hover:bg-white/10 rounded-md transition-colors cursor-pointer text-left"
          >
            <svg
              className="w-3 h-3 text-white/90 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="4" />
              <path d="M7 8h10" />
              <path d="M7 12h10" />
              <path d="M7 16h6" />
            </svg>
            <span className="text-[9px] font-medium text-white/90 whitespace-nowrap">
              Version 1.4
            </span>
          </button>

          {/* Divider line */}
          <div className="w-full h-px bg-white/20 my-0.5" />

          {/* Item 6: Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 px-1 py-0.5 text-white hover:text-red-300 hover:bg-white/10 rounded-md transition-colors cursor-pointer group text-left"
          >
            <LogOut className="w-3.5 h-3.5 text-white group-hover:text-red-300 shrink-0 stroke-[2]" />
            <span className="text-[10px] font-medium text-white group-hover:text-red-300">
              Logout
            </span>
          </button>

          {/* Item 7: Bottom Chevron Up */}
          <button
            onClick={() => setIsProfileDrawerOpen(false)}
            className="w-full flex items-center justify-center pt-0.5 pb-0.5 text-white/80 hover:text-white transition-colors cursor-pointer focus:outline-none group"
            title="Collapse menu"
            aria-label="Collapse menu"
          >
            <ChevronUp className="w-4 h-4 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </aside>
    </>
  );
};
