import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  Sparkles,
  ThumbsUp,
  CheckCircle2,
  Trophy,
  Calendar,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserNotification } from '../types';

export const NotificationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    unreadNotificationsCount,
    posts,
    setSelectedPostForDetail,
  } = useApp();

  const todayNotifications = notifications.filter((n) => n.group === 'Today');
  const earlierNotifications = notifications.filter((n) => n.group === 'Earlier');

  const getNotifIcon = (type: UserNotification['type']) => {
    switch (type) {
      case 'reward':
        return <Trophy className="w-4 h-4 text-[#d97706]" />;
      case 'upvote':
        return <ThumbsUp className="w-4 h-4 text-[#0f2d59]" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-[#1d4e8c]" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'vacancy':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
  };

  const handleNotificationClick = (notif: UserNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.relatedPostId) {
      const targetPost = posts.find((p) => p.id === notif.relatedPostId);
      if (targetPost) {
        setSelectedPostForDetail(targetPost);
      }
    } else if (notif.type === 'reward') {
      navigate('/rewards');
    } else if (notif.type === 'vacancy') {
      navigate('/vacancies');
    }
  };

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-8 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {unreadNotificationsCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] hover:underline"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#0f2d59] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4 text-[#0f2d59]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
                Notifications
              </h1>
              <p className="text-xs text-[#64748b]">
                Real-time updates on your civic reports and ward alerts.
              </p>
            </div>
          </div>

          {unreadNotificationsCount > 0 && (
            <span className="text-xs font-bold text-white bg-[#0f2d59] px-2.5 py-1 rounded-full">
              {unreadNotificationsCount} New
            </span>
          )}
        </div>
      </div>

      {/* Today Group */}
      {todayNotifications.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider px-1 block">
            Today
          </span>
          <div className="space-y-2">
            {todayNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !notif.isRead
                    ? 'bg-[#eff6ff]/50 border-[#1d4e8c]/30 shadow-xs'
                    : 'bg-white border-[#cbd5e1] hover:bg-[#f8fafc]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-[#cbd5e1] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-bold text-[#0f172a] truncate">
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-[#64748b] shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5 leading-snug">
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-[#0f2d59] shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earlier Group */}
      {earlierNotifications.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider px-1 block">
            Earlier
          </span>
          <div className="space-y-2">
            {earlierNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !notif.isRead
                    ? 'bg-[#eff6ff]/50 border-[#1d4e8c]/30 shadow-xs'
                    : 'bg-white border-[#cbd5e1] hover:bg-[#f8fafc]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-[#cbd5e1] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-bold text-[#0f172a] truncate">
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-[#64748b] shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5 leading-snug">
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-[#0f2d59] shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
