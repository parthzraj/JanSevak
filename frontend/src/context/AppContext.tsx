import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  CivicPost,
  DailyBriefing,
  ReelStory,
  UserNotification,
  Badge,
  UserProfile,
  ToastMessage,
  CivicCategory,
  IssuePriority,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_BRIEFING,
  INITIAL_POSTS,
  INITIAL_REELS,
  INITIAL_NOTIFICATIONS,
  INITIAL_BADGES,
} from '../mockData/initialData';
import {
  ApiError,
  assetUrl,
  UNAUTHORIZED_EVENT,
  addCommentRequest,
  createIssueRequest,
  deleteIssueRequest,
  fetchIssue,
  fetchIssues,
  fetchMe,
  fetchNotifications,
  fetchSupporters,
  getToken,
  loginRequest,
  markAllNotificationsRead,
  markNotificationRead,
  registerRequest,
  removeUpvote,
  setToken,
  updateIssueStatus,
  updateMe,
  uploadEvidence,
  uploadImageDataUrl,
  upvoteIssue,
  type BackendTokenResponse,
} from '../lib/api';
import { avatarFrom, nextLevelPoints, toCivicPost, toComment, toNotification, toSupporter, toUserProfile } from '../lib/mappers';

interface AppContextType {
  user: UserProfile;
  isLoggedIn: boolean;
  /** Log in against the Core API. Resolves true on success (an error toast is shown otherwise). */
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    ward?: string;
    account_type?: 'citizen' | 'ngo';
    ngo_code?: string;
  }) => Promise<boolean>;
  logout: () => void;
  posts: CivicPost[];
  createReport: (report: {
    title: string;
    category: CivicCategory;
    description: string;
    locality: string;
    priority: IssuePriority;
    imageUrl?: string;
    images?: string[];
    latitude?: number;
    longitude?: number;
  }) => Promise<string | null>;
  toggleUpvote: (postId: string) => void;
  /** Adds 1-3 photos to an existing live report. Resolves true on success. */
  addEvidence: (postId: string, files: File[]) => Promise<boolean>;
  addComment: (postId: string, text: string) => void;
  toggleBookmark: (postId: string) => void;
  voteInPoll: (postId: string, optionId: string) => void;
  briefing: DailyBriefing;
  reels: ReelStory[];
  toggleReelLike: (reelId: string) => void;
  toggleReelSave: (reelId: string) => void;
  addReelComment: (reelId: string, text: string) => void;
  notifications: UserNotification[];
  unreadNotificationsCount: number;
  markAllNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;
  /** Re-reads the signed-in user (points), the feed and notifications from the server. */
  refreshData: () => Promise<void>;
  /** Apply a points/tier total that the server just returned (e.g. after a quiz). */
  syncPoints: (points: number, tier: string) => void;
  badges: Badge[];
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: 'success' | 'info' | 'reward') => void;
  removeToast: (id: string) => void;
  selectedPostForDetail: CivicPost | null;
  setSelectedPostForDetail: (post: CivicPost | null) => void;
  selectedPostForComments: CivicPost | null;
  setSelectedPostForComments: (post: CivicPost | null) => void;
  selectedPostForShare: CivicPost | null;
  setSelectedPostForShare: (post: CivicPost | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  /** Pick a built-in avatar ('preset:woman-1'), upload a photo (File), or pass '' to go back to the initials avatar. */
  changeAvatar: (choice: string | File) => Promise<boolean>;
  /** Delete one of your own reports (only while it is still "Reported"). Resolves true on success. */
  deleteReport: (postId: string) => Promise<boolean>;
  /** Set when the server says a new report repeats an existing one, so the form can offer to open the original. */
  duplicateReport: { issueId: string; title: string; message: string } | null;
  clearDuplicateReport: () => void;
  /** Opens a report in the detail view even if it is not in the loaded feed. */
  openIssueById: (id: string) => Promise<void>;
  isMenuPopupOpen: boolean;
  setIsMenuPopupOpen: (open: boolean) => void;
  toggleMenuPopup: () => void;
  isProfileDrawerOpen: boolean;
  setIsProfileDrawerOpen: (open: boolean) => void;
  toggleProfileDrawer: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  resolveReport: (postId: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  isBriefingAvailable: boolean;
  isBriefingAcknowledged: boolean;
  acknowledgeBriefing: () => void;
  resetBriefingAcknowledgment: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State: default is 'light'
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('jansevak_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('jansevak_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Authentication State
  // Logged in = we hold a token from the Core API (see lib/api.ts)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getToken() !== null);

  // User Profile State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('prajapulse_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (['Bronze', 'Silver', 'Gold', 'Platinum', 'Legend'].includes(parsed.level)) {
          if (!parsed.avatar || parsed.avatar === '/profile_3d_avatar.jpg') parsed.avatar = '';
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USER;
  });

  // Posts State (safe parse)
  const [posts, setPosts] = useState<CivicPost[]>(() => {
    try {
      const saved = localStorage.getItem('prajapulse_posts');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  // Briefing
  const [briefing] = useState<DailyBriefing>(INITIAL_BRIEFING);

  // Daily Briefing Acknowledged State (per day)
  const getBriefingKey = (date: Date = new Date()) => {
    const today = date;
    return `praja_briefing_ack_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
  };

  const [isBriefingAcknowledged, setIsBriefingAcknowledged] = useState<boolean>(() => {
    try {
      return localStorage.getItem(getBriefingKey()) === 'true';
    } catch {
      return false;
    }
  });
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const refreshBriefingState = () => {
      const now = new Date();
      setCurrentTime(now);
      try {
        setIsBriefingAcknowledged(localStorage.getItem(getBriefingKey(now)) === 'true');
      } catch {
        setIsBriefingAcknowledged(false);
      }
    };

    refreshBriefingState();
    const refreshTimer = window.setInterval(refreshBriefingState, 30_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const acknowledgeBriefing = useCallback(() => {
    try {
      localStorage.setItem(getBriefingKey(), 'true');
    } catch {
      // The in-memory state still keeps the acknowledgement for this session.
    }
    setIsBriefingAcknowledged(true);
  }, []);

  const resetBriefingAcknowledgment = useCallback(() => {
    try {
      localStorage.removeItem(getBriefingKey());
    } catch {
      // Keep the in-memory state reset even if storage is unavailable.
    }
    setIsBriefingAcknowledged(false);
  }, []);

  const isBriefingAvailable = currentTime.getHours() >= 7;

  // Reels (safe parse)
  const [reels, setReels] = useState<ReelStory[]>(() => {
    try {
      const saved = localStorage.getItem('prajapulse_reels');
      return saved ? JSON.parse(saved) : INITIAL_REELS;
    } catch {
      return INITIAL_REELS;
    }
  });

  // Notifications (safe parse)
  const [notifications, setNotifications] = useState<UserNotification[]>(() => {
    try {
      const saved = localStorage.getItem('prajapulse_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

 
  // Badges (7 badges matching user design specification)
  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('prajapulse_badges');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === INITIAL_BADGES.length && parsed[0]?.requirement) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_BADGES;
  });


  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<CivicPost | null>(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState<CivicPost | null>(null);
  const [selectedPostForShare, setSelectedPostForShare] = useState<CivicPost | null>(null);
  const [isMenuPopupOpen, setIsMenuPopupOpen] = useState<boolean>(false);
  const toggleMenuPopup = () => setIsMenuPopupOpen((prev) => !prev);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const toggleProfileDrawer = () => setIsProfileDrawerOpen((prev) => !prev);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('prajapulse_auth', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('prajapulse_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('prajapulse_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('prajapulse_reels', JSON.stringify(reels));
  }, [reels]);

  useEffect(() => {
    localStorage.setItem('prajapulse_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('prajapulse_badges', JSON.stringify(badges));
  }, [badges]);

  const addToast = (title: string, description?: string, type: 'success' | 'info' | 'reward' = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ---------------------------------------------------------------------
  // Server sync (Core API, port 8000)
  // ---------------------------------------------------------------------
  const inFlight = useRef<Set<string>>(new Set());

  const errText = (e: unknown, fallback = 'Cannot reach the server. Is the Core API running on port 8000?') =>
    e instanceof ApiError && e.message ? e.message : fallback;

  const applyPoints = (points: number, tier: string) =>
    setUser((prev) => ({ ...prev, points, level: tier, nextLevelPoints: nextLevelPoints(points) }));

  const refreshUser = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser((prev) => toUserProfile(me, prev));
    } catch {
      /* keep the cached profile */
    }
  }, []);

  const refreshPosts = useCallback(async () => {
    try {
      const res = await fetchIssues({ page_size: 50, sort: 'recent' });
      setPosts((prev) => {
        const bookmarked = new Set(prev.filter((p) => p.isBookmarked).map((p) => p.id));
        return res.items.map((i) => ({ ...toCivicPost(i), isBookmarked: bookmarked.has(String(i.id)) }));
      });
    } catch {
      /* keep cached posts when the server is unreachable */
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications();
      setNotifications(res.items.map(toNotification));
    } catch {
      /* keep cached notifications */
    }
  }, []);

  // Load everything once logged in, then refresh periodically
  useEffect(() => {
    if (!isLoggedIn || !getToken()) return;
    refreshUser();
    refreshPosts();
    refreshNotifications();
    const timer = setInterval(() => {
      refreshPosts();
      refreshNotifications();
    }, 60000);
    return () => clearInterval(timer);
  }, [isLoggedIn, refreshUser, refreshPosts, refreshNotifications]);

  // The API said our token is no longer valid -> back to the login screen
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setIsLoggedIn(false);
      addToast('Session expired', 'Please log in again.', 'info');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Comments are not part of the feed list: fetch them when a post is opened
  const loadComments = async (id: string) => {
    if (!/^\d+$/.test(id)) return; // old mock posts have ids like "post-1234"
    try {
      const [detail, supp] = await Promise.all([
        fetchIssue(id),
        fetchSupporters(id).catch(() => null), // the supporters list is a nice-to-have
      ]);
      const comments = detail.comments.map(toComment);
      const timeline = detail.timeline;
      // the reporter's photos followed by photos other citizens added later
      const images = [...detail.image_urls, ...detail.evidence.map((e) => e.url)].map(assetUrl);
      const supporters = supp ? supp.items.map(toSupporter) : undefined;
      const supportersTotal = supp ? supp.total : undefined;
      const patch = (p: CivicPost | null) =>
        p && p.id === id
          ? { ...p, comments, commentsCount: comments.length, timeline, images, supporters, supportersTotal }
          : p;
      setPosts((prev) => prev.map((p) => (p.id === id ? (patch(p) as CivicPost) : p)));
      setSelectedPostForDetail(patch);
      setSelectedPostForComments(patch);
    } catch {
      /* comments stay empty */
    }
  };

  const detailId = selectedPostForDetail?.id;
  const commentsId = selectedPostForComments?.id;
  useEffect(() => {
    if (detailId) loadComments(detailId);
    if (commentsId && commentsId !== detailId) loadComments(commentsId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId, commentsId]);

  const finishLogin = (res: BackendTokenResponse) => {
    setToken(res.access_token);
    setUser(toUserProfile(res.user));
    setIsLoggedIn(true);
    addToast('Welcome, ' + res.user.name, 'Connected to JanSevak Bengaluru Network', 'success');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      finishLogin(await loginRequest(email.trim(), password));
      return true;
    } catch (e) {
      addToast('Login failed', errText(e), 'info');
      return false;
    }
  };

  const register = async (input: Parameters<AppContextType['register']>[0]): Promise<boolean> => {
    try {
      finishLogin(await registerRequest({ ...input, email: input.email.trim(), name: input.name.trim() }));
      return true;
    } catch (e) {
      addToast('Could not create account', errText(e), 'info');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setIsLoggedIn(false);
    setNotifications([]);
    setPosts([]);
    addToast('Logged out successfully', 'See you soon!', 'info');
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
    addToast('Profile Updated', 'Changes saved successfully', 'success');
    // Persist name / ward on the server (the ward is stored as "Ward 112 - Indiranagar")
    const next = { ...user, ...updates };
    const ward = [next.wardNumber, next.neighborhood].filter(Boolean).join(' - ');
    updateMe({ name: next.name, ward }).catch(() => undefined);
  };

  const changeAvatar = async (choice: string | File): Promise<boolean> => {
    try {
      let value = choice as string;
      if (choice instanceof File) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Could not read that file'));
          reader.readAsDataURL(choice);
        });
        value = await uploadImageDataUrl(dataUrl); // "/uploads/xxxx.jpg"
      }
      const me = await updateMe({ avatar_url: value });
      const avatar = avatarFrom(me.avatar_url);
      setUser((prev) => ({ ...prev, avatar }));
      setPosts((prev) =>
        prev.map((p) => (p.reporter.id === String(me.id) ? { ...p, reporter: { ...p.reporter, avatar } } : p))
      );
      addToast('Profile Photo Updated', 'Everyone will now see your new picture.', 'success');
      return true;
    } catch (e) {
      addToast('Could not change photo', errText(e), 'info');
      return false;
    }
  };

  const [duplicateReport, setDuplicateReport] = useState<{ issueId: string; title: string; message: string } | null>(null);
  const clearDuplicateReport = () => setDuplicateReport(null);

  const openIssueById = async (id: string): Promise<void> => {
    const loaded = posts.find((p) => p.id === id);
    if (loaded) {
      setSelectedPostForDetail(loaded);
      return;
    }
    try {
      const detail = await fetchIssue(id);
      setSelectedPostForDetail(toCivicPost(detail));
    } catch (e) {
      addToast('Could not open report', errText(e), 'info');
    }
  };

  const deleteReport = async (postId: string): Promise<boolean> => {
    if (!/^\d+$/.test(postId)) {
      addToast('Cannot delete here', 'Demo reports are not stored on the server.', 'info');
      return false;
    }
    try {
      const res = await deleteIssueRequest(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setSelectedPostForDetail(null);
      setUser((prev) => ({
        ...prev,
        points: res.user_points,
        level: res.user_tier,
        nextLevelPoints: nextLevelPoints(res.user_points),
        stats: { ...prev.stats, reportsCount: Math.max(0, prev.stats.reportsCount - 1) },
      }));
      addToast(
        'Report Deleted',
        res.points_reverted > 0 ? `${res.points_reverted} points earned from this report were taken back.` : 'Your report was removed.',
        'info'
      );
      return true;
    } catch (e) {
      addToast('Could not delete report', errText(e), 'info');
      return false;
    }
  };

  const createReport = async (report: {
    title: string;
    category: CivicCategory;
    description: string;
    locality: string;
    priority: IssuePriority;
    imageUrl?: string;
    images?: string[];
    latitude?: number;
    longitude?: number;
  }): Promise<string | null> => {
    setDuplicateReport(null);
    try {
      // Photos picked in the app are data URLs: upload them first, send the returned URLs with the report
      const imageUrls: string[] = [];
      for (const img of (report.images ?? []).slice(0, 6)) {
        if (img.startsWith('data:')) imageUrls.push(await uploadImageDataUrl(img));
        else if (/^https?:\/\//.test(img)) imageUrls.push(img);
      }

      const res = await createIssueRequest({
        title: report.title,
        description: report.description,
        category: report.category,
        priority: report.priority, // "Urgent" is accepted and stored as "Critical" by the API
        address: report.locality.slice(0, 255),
        latitude: report.latitude,
        longitude: report.longitude,
        image_urls: imageUrls,
      });

      const post = toCivicPost(res.issue);
      setPosts((prev) => [post, ...prev.filter((p) => p.id !== post.id)]);
      setUser((prev) => ({
        ...prev,
        points: res.user_points,
        level: res.user_tier,
        nextLevelPoints: nextLevelPoints(res.user_points),
        stats: { ...prev.stats, reportsCount: prev.stats.reportsCount + 1 },
      }));
      refreshNotifications();

      if (res.points_awarded > 0) {
        addToast(`Report Submitted! +${res.points_awarded} Points`, `Tracking ID: #${post.id}`, 'reward');
      } else {
        addToast('Report Submitted Successfully', `Tracking ID: #${post.id}. Daily 60-point cap reached - no points this time.`, 'success');
      }
      return post.id;
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data.issue_id === 'number') {
        setDuplicateReport({ issueId: String(e.data.issue_id), title: String(e.data.title ?? 'existing report'), message: e.message });
      } else {
        addToast('Could not submit report', errText(e), 'info');
      }
      return null;
    }
  };

  const resolveReport = async (postId: string) => {
    try {
      await updateIssueStatus(postId, 'Resolved');
      await Promise.all([refreshPosts(), refreshUser()]);
      addToast('Issue Marked Resolved', 'The reporter has been credited with the resolution reward.', 'reward');
    } catch (e) {
      addToast('Could not resolve issue', errText(e), 'info');
    }
  };

  const toggleUpvote = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || inFlight.current.has(postId)) return;
    inFlight.current.add(postId);
    try {
      const res = post.hasUpvoted ? await removeUpvote(postId) : await upvoteIssue(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, hasUpvoted: res.has_upvoted, upvotes: res.upvotes } : p))
      );
      setUser((prev) => ({
        ...prev,
        points: res.user_points,
        level: res.user_tier,
        nextLevelPoints: nextLevelPoints(res.user_points),
        stats: {
          ...prev.stats,
          supportedCount: Math.max(0, prev.stats.supportedCount + (res.has_upvoted ? 1 : -1)),
        },
      }));
      if (res.has_upvoted) {
        addToast(
          res.points_delta > 0 ? `Issue Endorsed +${res.points_delta} Points` : 'Issue Endorsed',
          res.points_delta > 0
            ? 'Your support helps prioritize this report for the Ward Committee.'
            : 'No points this time (daily cap reached or already earned for this issue).',
          res.points_delta > 0 ? 'reward' : 'success'
        );
      } else {
        addToast('Endorsement Removed', undefined, 'info');
      }
    } catch (e) {
      addToast('Could not update your vote', errText(e), 'info');
    } finally {
      inFlight.current.delete(postId);
    }
  };

  const addEvidence = async (postId: string, files: File[]): Promise<boolean> => {
    if (!/^\d+$/.test(postId)) {
      addToast('Cannot add photos here', 'Photos can only be added to live reports from the server.', 'info');
      return false;
    }
    try {
      const res = await uploadEvidence(postId, files);
      const urls = res.evidence.map((e) => assetUrl(e.url));
      const add = <T extends CivicPost | null>(p: T): T =>
        p && p.id === postId ? ({ ...p, images: [...(p.images ?? []), ...urls] } as T) : p;
      setPosts((prev) => prev.map((p) => add(p)));
      setSelectedPostForDetail((prev) => add(prev));
      setSelectedPostForComments((prev) => add(prev));
      applyPoints(res.user_points, res.user_tier);
      addToast(
        res.points_awarded > 0 ? `Photo Added! +${res.points_awarded} Points` : 'Photo Added',
        res.points_awarded > 0
          ? 'Thanks for documenting this issue on site.'
          : 'Thanks for documenting this issue. (No points for your own report or a repeat contribution.)',
        res.points_awarded > 0 ? 'reward' : 'success'
      );
      return true;
    } catch (e) {
      addToast('Could not add photos', errText(e), 'info');
      return false;
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!text.trim()) return;
    try {
      const saved = toComment(await addCommentRequest(postId, text.trim()));
      const add = <T extends CivicPost | null>(p: T): T =>
        p && p.id === postId
          ? ({ ...p, commentsCount: p.commentsCount + 1, comments: [...p.comments, saved] } as T)
          : p;
      setPosts((prev) => prev.map((p) => add(p)));
      setSelectedPostForDetail((prev) => add(prev));
      setSelectedPostForComments((prev) => add(prev));
      addToast('Comment Posted', 'Thank you for adding your voice to the neighborhood discussion.', 'info');
    } catch (e) {
      addToast('Could not post comment', errText(e), 'info');
    }
  };

  const toggleBookmark = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isBookmarked = !post.isBookmarked;
          addToast(
            isBookmarked ? 'Saved to Bookmarks' : 'Removed from Bookmarks',
            isBookmarked ? 'Access saved civic issues anytime in your profile.' : undefined,
            'info'
          );
          return { ...post, isBookmarked };
        }
        return post;
      })
    );
  };

  const voteInPoll = (postId: string, optionId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId && post.poll) {
          if (post.poll.userVotedId === optionId) return post; // already voted this
          const currentVotedId = post.poll.userVotedId;
          const updatedOptions = post.poll.options.map((opt) => {
            if (opt.id === optionId) {
              return { ...opt, votes: opt.votes + 1 };
            }
            if (currentVotedId && opt.id === currentVotedId) {
              return { ...opt, votes: Math.max(0, opt.votes - 1) };
            }
            return opt;
          });

          addToast('Vote Counted!', 'Thank you for participating in the community consultation poll.', 'success');

          return {
            ...post,
            poll: {
              ...post.poll,
              options: updatedOptions,
              userVotedId: optionId,
            },
          };
        }
        return post;
      })
    );
  };

  const toggleReelLike = (reelId: string) => {
    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id === reelId) {
          const hasLiked = !reel.hasLiked;
          const likes = hasLiked ? reel.likes + 1 : Math.max(0, reel.likes - 1);
          if (hasLiked) {
            addToast('Impact Celebrated!', 'Inspired by community transformation.', 'success');
          }
          return { ...reel, hasLiked, likes };
        }
        return reel;
      })
    );
  };

  const toggleReelSave = (reelId: string) => {
    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id === reelId) {
          const isSaved = !reel.isSaved;
          addToast(
            isSaved ? 'Impact Story Saved' : 'Story Removed',
            isSaved ? 'Find this in your saved community stories.' : undefined,
            'info'
          );
          return { ...reel, isSaved };
        }
        return reel;
      })
    );
  };

  const addReelComment = (reelId: string, text: string) => {
    if (!text.trim()) return;
    const newComment = {
      id: 'rc-' + Date.now(),
      author: user.name,
      text: text.trim(),
      time: 'Just now',
    };
    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id === reelId) {
          return {
            ...reel,
            commentsCount: reel.commentsCount + 1,
            comments: [...reel.comments, newComment],
          };
        }
        return reel;
      })
    );
    addToast('Comment Added', undefined, 'info');
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    markAllNotificationsRead().catch(() => undefined);
    addToast('All Caught Up', 'Marked all notifications as read', 'info');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    markNotificationRead(id).catch(() => undefined);
  };

  const refreshData = async () => {
    await Promise.all([refreshUser(), refreshPosts(), refreshNotifications()]);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn,
        login,
        register,
        logout,
        posts,
        createReport,
        toggleUpvote,
        addEvidence,
        addComment,
        toggleBookmark,
        voteInPoll,
        briefing,
        reels,
        toggleReelLike,
        toggleReelSave,
        addReelComment,
        notifications,
        unreadNotificationsCount,
        markAllNotificationsAsRead,
        markNotificationAsRead,
        syncPoints: applyPoints,
        badges,
        toasts,
        addToast,
        removeToast,
        selectedPostForDetail,
        setSelectedPostForDetail,
        selectedPostForComments,
        setSelectedPostForComments,
        selectedPostForShare,
        setSelectedPostForShare,
        updateUserProfile,
        changeAvatar,
        deleteReport,
        duplicateReport,
        clearDuplicateReport,
        openIssueById,
        isMenuPopupOpen,
        setIsMenuPopupOpen,
        toggleMenuPopup,
        isProfileDrawerOpen,
        setIsProfileDrawerOpen,
        toggleProfileDrawer,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        resolveReport,
        refreshData,
        theme,
        setTheme,
        toggleTheme,
        isBriefingAvailable,
        isBriefingAcknowledged,
        acknowledgeBriefing,
        resetBriefingAcknowledgment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
