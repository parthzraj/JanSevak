import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  MapPin,
  Calendar,
  Trophy,
  ShieldCheck,
  Edit3,
  Settings,
  Bookmark,
  FileText,
  Award,
  ChevronRight,
  LogOut,
  X,
  Check,
  Bell,
  Globe,
  Sliders,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CivicBadgeIcon, CivicLevelIcon } from '../components/common/CivicBadges';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, posts, badges, logout, updateUserProfile, setSelectedPostForDetail, addToast, theme, setTheme, toggleTheme } = useApp();

  const [activeTab, setActiveTab] = useState<'reports' | 'saved' | 'badges'>('reports');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Handle URL query parameters (e.g. /profile?tab=reports or /profile?tab=settings)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'reports' || tab === 'saved' || tab === 'badges') {
      setActiveTab(tab);
    }
    if (tab === 'settings') {
      setShowSettingsModal(true);
    }
  }, [location.search]);

  // Edit fields
  const [editName, setEditName] = useState(user.name);
  const [editNeighborhood, setEditNeighborhood] = useState(user.neighborhood);
  const [editWard, setEditWard] = useState(user.wardNumber);

  // Settings fields
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const myReports = posts.filter(
    (p) => p.reporter.id === user.id || p.reporter.name === user.name
  );

  const bookmarkedPosts = posts.filter((p) => p.isBookmarked);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: editName,
      neighborhood: editNeighborhood,
      wardNumber: editWard,
    });
    setShowEditModal(false);
  };

  const handleSaveSettings = () => {
    addToast('Preferences Saved', 'Notification choices updated.', 'success');
    setShowSettingsModal(false);
  };

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-8 space-y-4">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#0f2d59] uppercase tracking-wider">
          Citizen Profile
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]"
            title="Edit Profile"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]"
            title="App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] shadow-xs space-y-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src="/profile_3d_avatar.jpg"
              alt={user.name}
              className="w-16 h-16 rounded-3xl object-cover border-2 border-white shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = user.avatar;
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-[#0f2d59] rounded-full p-1 text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-[#0f172a] truncate">
                {user.name}
              </h1>
            </div>
            <p className="text-xs text-[#64748b] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#0f2d59]" />
              {user.neighborhood} ({user.wardNumber})
            </p>
            <p className="text-[11px] text-[#98A59E] flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              Member since {user.joinedDate}
            </p>
          </div>
        </div>

        {/* 4 Quantitative Profile Counters */}
        <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-[#cbd5e1] text-center">
          <div className="bg-[#f8fafc] p-2 rounded-2xl">
            <span className="text-sm sm:text-base font-extrabold text-[#0f172a] tabular-nums block">
              {user.stats.reportsCount}
            </span>
            <span className="text-[10px] text-[#64748b]">Reports</span>
          </div>

          <div className="bg-[#f8fafc] p-2 rounded-2xl">
            <span className="text-sm sm:text-base font-extrabold text-[#0f172a] tabular-nums block">
              {user.stats.supportedCount}
            </span>
            <span className="text-[10px] text-[#64748b]">Supported</span>
          </div>

          <div className="bg-[#f8fafc] p-2 rounded-2xl">
            <span className="text-sm sm:text-base font-extrabold text-[#0f2d59] tabular-nums block">
              {user.stats.resolvedCount}
            </span>
            <span className="text-[10px] text-[#64748b]">Resolved</span>
          </div>

          <div className="bg-[#f8fafc] p-2 rounded-2xl">
            <span className="text-sm sm:text-base font-extrabold text-[#d97706] tabular-nums block">
              {user.stats.volunteerHours}h
            </span>
            <span className="text-[10px] text-[#64748b]">Volunteer</span>
          </div>
        </div>
      </div>

      {/* Rewards Status Banner */}
      <div
        onClick={() => navigate('/rewards')}
        className="bg-gradient-to-r from-[#0f2d59] to-[#1d4e8c] text-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-[#d97706]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">
                {user.level}
              </span>
              <span className="text-[10px] bg-[#d97706] text-[#0f172a] font-bold px-1.5 py-0.2 rounded-md">
                {user.points} pts
              </span>
            </div>
            <p className="text-[11px] text-[#eff6ff] mt-0.5">
              {user.nextLevelPoints - user.points} points until Gold Champion status
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/80" />
      </div>

      {/* Profile Tabs: My Reports | Bookmarks | Badges */}
      <div className="space-y-3">
        <div className="flex items-center p-1 bg-white rounded-2xl border border-[#cbd5e1]">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-[#0f2d59] text-white shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            My Reports ({myReports.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'saved'
                ? 'bg-[#0f2d59] text-white shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Bookmarks ({bookmarkedPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'badges'
                ? 'bg-[#0f2d59] text-white shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Badges
          </button>
        </div>

        {/* Tab 1: My Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-2.5">
            {myReports.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#cbd5e1]">
                <p className="text-xs text-[#64748b]">No reports filed yet.</p>
              </div>
            ) : (
              myReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedPostForDetail(report)}
                  className="bg-white rounded-2xl p-3 border border-[#cbd5e1] hover:border-[#0f2d59]/40 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#0f2d59] uppercase">
                      {report.category} · {report.formattedTime}
                    </span>
                    <h4 className="text-xs font-bold text-[#0f172a] truncate">
                      {report.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      report.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Bookmarks */}
        {activeTab === 'saved' && (
          <div className="space-y-2.5">
            {bookmarkedPosts.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#cbd5e1]">
                <p className="text-xs text-[#64748b]">No saved civic issues yet.</p>
              </div>
            ) : (
              bookmarkedPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostForDetail(post)}
                  className="bg-white rounded-2xl p-3 border border-[#cbd5e1] hover:border-[#0f2d59]/40 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#0f2d59] uppercase">
                      {post.category} · {post.reporter.wardOrArea}
                    </span>
                    <h4 className="text-xs font-bold text-[#0f172a] truncate">
                      {post.title}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#64748b] shrink-0" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Badges & Level Milestone Showcase */}
        {activeTab === 'badges' && (
          <div className="space-y-3">
            {/* Current Tier Medal Box */}
            <div className="bg-[#FEFBF0] rounded-3xl p-4 border border-[#F6E6B8] flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <CivicLevelIcon levelId="gold" size={56} />
                <div>
                  <span className="text-[10px] font-bold text-[#D69E2E] uppercase tracking-wider block">
                    Current Civic Tier
                  </span>
                  <h4 className="text-sm font-extrabold text-[#0f172a]">
                    {user.level} Citizen
                  </h4>
                  <span className="text-[11px] text-[#64748b]">
                    {user.points} points · 300 – 749 milestone
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/badges-certificates')}
                className="text-xs font-bold text-[#0f2d59] bg-white px-3 py-1.5 rounded-xl border border-[#cbd5e1] hover:bg-[#eff6ff] shadow-2xs"
              >
                All Milestones &rarr;
              </button>
            </div>

            {/* Badges Grid */}
            <div className="bg-white rounded-3xl p-4 border border-[#cbd5e1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0f172a]">
                  Civic Achievement Badges
                </span>
                <button
                  onClick={() => navigate('/badges-certificates')}
                  className="text-xs font-bold text-[#0f2d59] hover:underline"
                >
                  View certificates &rarr;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    onClick={() => navigate('/badges-certificates')}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center cursor-pointer transition-all ${
                      badge.isUnlocked
                        ? 'bg-white border-[#cbd5e1] hover:border-[#0f2d59]/40 shadow-2xs'
                        : 'bg-[#f8fafc] border-[#cbd5e1] opacity-75'
                    }`}
                  >
                    <CivicBadgeIcon badgeId={badge.id} size={48} />
                    <span className="text-xs font-bold text-[#0f172a] mt-1.5 leading-tight">
                      {badge.name}
                    </span>
                    <span className="text-[10px] text-[#64748b] mt-0.5 line-clamp-1">
                      {badge.requirement}
                    </span>
                    <div className="mt-1.5">
                      {badge.isUnlocked ? (
                        <span className="text-[9px] font-bold text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-md">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-[#64748b]">
                          {badge.progress}% done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
              <h3 className="text-sm font-bold text-[#0f172a]">
                Edit Profile
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full text-[#64748b] hover:text-[#0f172a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#0f172a] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-[#0f172a]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#0f172a] block mb-1">
                  Neighborhood
                </label>
                <input
                  type="text"
                  required
                  value={editNeighborhood}
                  onChange={(e) => setEditNeighborhood(e.target.value)}
                  className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-[#0f172a]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#0f172a] block mb-1">
                  Ward Number
                </label>
                <input
                  type="text"
                  required
                  value={editWard}
                  onChange={(e) => setEditWard(e.target.value)}
                  className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-[#0f172a]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0f2d59] text-white text-xs font-bold hover:bg-[#1d4e8c]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theme & Appearance Settings Card */}
      <div className="bg-white dark:bg-[#131c2e] rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#eff6ff] dark:bg-blue-950/60 text-[#0f2d59] dark:text-blue-300 flex items-center justify-center">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </div>
            <div>
              <h3 className="text-xs font-black text-[#0f172a] dark:text-white uppercase tracking-wider">
                Theme & Appearance
              </h3>
              <p className="text-[11px] text-[#64748b] dark:text-slate-400">
                Current mode: <strong className="text-[#0f2d59] dark:text-amber-300">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="text-xs font-bold text-[#0f2d59] dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Preferences</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dual Theme Selector Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              addToast('Light Mode Activated', 'Daylight civic theme enabled.', 'info');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-[#eff6ff] text-[#0f2d59] border-[#0f2d59] shadow-xs ring-2 ring-[#0f2d59]/20 font-extrabold'
                : 'bg-[#f8fafc] dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-[#cbd5e1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light Mode</span>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#0f2d59]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              addToast('Dark Mode Activated', 'High-contrast midnight theme enabled.', 'info');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 text-amber-300 border-amber-400 shadow-xs ring-2 ring-amber-400/20 font-extrabold'
                : 'bg-[#f8fafc] dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-[#cbd5e1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4 text-amber-400" />
            <span>Dark Mode</span>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl p-5 shadow-2xl space-y-4 border border-[#cbd5e1] dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1] dark:border-slate-800">
              <h3 className="text-sm font-bold text-[#0f172a] dark:text-white">
                App Preferences & Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-full text-[#64748b] hover:text-[#0f172a] dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* THEME SELECTION: Light vs Dark Mode */}
              <div className="p-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#0f172a] dark:text-white block">
                      Theme Appearance
                    </span>
                    <span className="text-[10px] text-[#64748b] dark:text-slate-400">
                      Choose between Light and Dark interface
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      addToast('Light Mode Activated', 'Interface updated to daylight theme.', 'info');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-white text-[#0f2d59] border-[#0f2d59] shadow-sm ring-2 ring-[#0f2d59]/20 font-extrabold'
                        : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-white/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      addToast('Dark Mode Activated', 'Interface updated to midnight theme.', 'info');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900 text-amber-300 border-amber-400 shadow-sm ring-2 ring-amber-400/20 font-extrabold'
                        : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Ward Dispatch Alerts */}
              <div className="flex items-center justify-between p-2.5 bg-[#f8fafc] dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="font-bold text-[#0f172a] dark:text-white block">
                    Ward Dispatch Alerts
                  </span>
                  <span className="text-[10px] text-[#64748b] dark:text-slate-400">
                    Push notifications on critical emergencies
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#0f2d59]"
                />
              </div>

              {/* Status SMS Notifications */}
              <div className="flex items-center justify-between p-2.5 bg-[#f8fafc] dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="font-bold text-[#0f172a] dark:text-white block">
                    Status SMS Notifications
                  </span>
                  <span className="text-[10px] text-[#64748b] dark:text-slate-400">
                    Updates when BBMP repairs your report
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#0f2d59]"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 bg-[#0f2d59] text-white text-xs font-bold rounded-xl hover:bg-[#1d4e8c] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Sign Out Button */}
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="w-full py-3 rounded-2xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center justify-center gap-2 dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-300"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of Account</span>
      </button>
    </div>
  );
};
