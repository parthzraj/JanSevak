import React from 'react';
import { useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomNavigation } from './BottomNavigation';
import { ToastContainer } from '../common/ToastContainer';
import { PostDetailModal } from '../feed/PostDetailModal';
import { CommentsSheet } from '../feed/CommentsSheet';
import { ShareModal } from '../feed/ShareModal';
import { CivicChatbot } from '../chat/CivicChatbot';
import { MenuPopupModal } from './MenuPopupModal';
import { SidebarDrawer } from './SidebarDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isReelsPage = location.pathname === '/positive-impact';

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1120] text-[#0f172a] dark:text-slate-100 flex flex-col justify-center">
        <ToastContainer />
        {children}
        {/* Floating Chatbot present on every screen */}
        <CivicChatbot />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e2e8f0] dark:bg-[#030712] flex justify-center text-[#0f172a] dark:text-slate-100 transition-colors duration-250">
      {/* Phone container shell: max-w-lg on larger screens with subtle border and elevation */}
      <div className="w-full max-w-lg min-h-screen bg-[#f8fafc] dark:bg-[#0b1120] relative flex flex-col shadow-2xl border-x border-[#cbd5e1] dark:border-slate-800 transition-colors duration-250">
        <ToastContainer />
        <SidebarDrawer />
        <PostDetailModal />
        <CommentsSheet />
        <ShareModal />
        <MenuPopupModal />

        {/* Top Header - hidden on full-screen reels for cinematic vertical experience, or shown compactly */}
        {!isReelsPage && <AppHeader />}

        {/* Main Content Area with bottom safe padding */}
        <main className={`flex-1 flex flex-col ${isReelsPage ? 'pb-16' : 'pb-24'}`}>
          {children}
        </main>

        {/* Fixed Bottom Navigation */}
        <BottomNavigation />

        {/* Floating Chatbot present on every screen in the bottom right corner */}
        <CivicChatbot isReelsPage={isReelsPage} />
      </div>
    </div>
  );
};
