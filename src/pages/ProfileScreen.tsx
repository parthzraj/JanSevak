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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar, AVATAR_PRESETS } from '../components/common/Avatar';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, posts, logout, updateUserProfile, changeAvatar, setSelectedPostForDetail, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'reports' | 'saved'>('reports');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const pickAvatar = async (choice: string | File) => {
    setSavingAvatar(true);
    await changeAvatar(choice);
    setSavingAvatar(false);
  };

  const onPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      addToast('Choose an image', 'Pick a photo (JPG, PNG, WEBP) under 10 MB.', 'info');
      return;
    }
    void pickAvatar(file);
  };

  // Handle URL query parameters (e.g. /profile?tab=reports or /profile?tab=settings)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'reports' || tab === 'saved') {
      setActiveTab(tab);
    }
    if (tab === 'badges') {
      navigate('/rewards', { replace: true });
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
            <Avatar src={user.avatar} name={user.name} size={64} className="border-2 border-white shadow-md" />
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

      {/* Profile Tabs: My Reports | Bookmarks (badges live on the Badges & Certificates page) */}
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

            <div>
              <label className="text-[11px] font-bold text-[#0f172a] block mb-1.5">Profile Picture</label>
              <div className="flex flex-wrap items-center gap-2" aria-busy={savingAvatar}>
                <button
                  type="button"
                  disabled={savingAvatar}
                  onClick={() => pickAvatar('')}
                  title="Initials"
                  className={`rounded-full p-0.5 border-2 cursor-pointer ${user.avatar === '' ? 'border-[#0f2d59]' : 'border-transparent'}`}
                >
                  <Avatar src="" name={user.name} size={36} />
                </button>
                {AVATAR_PRESETS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    disabled={savingAvatar}
                    onClick={() => pickAvatar(`preset:${a.key}`)}
                    title={a.label}
                    aria-label={a.label}
                    className={`rounded-full p-0.5 border-2 cursor-pointer ${
                      user.avatar === `preset:${a.key}` ? 'border-[#0f2d59]' : 'border-transparent'
                    }`}
                  >
                    <Avatar src={`preset:${a.key}`} name={a.label} size={36} />
                  </button>
                ))}
              </div>
              <label className="inline-block mt-2 text-[11px] font-bold text-[#0f2d59] hover:underline cursor-pointer">
                Upload your own photo
                <input type="file" accept="image/*" className="hidden" aria-label="Upload profile photo" onChange={onPhotoFile} />
              </label>
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
