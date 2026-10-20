import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  CivicPost,
  DailyBriefing,
  ReelStory,
  UserNotification,
  Vacancy,
  VolunteerDrive,
  CivicQuiz,
  Badge,
  LearnModule,
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
  INITIAL_VACANCIES,
  INITIAL_VOLUNTEER_DRIVES,
  INITIAL_QUIZZES,
  INITIAL_BADGES,
  INITIAL_MODULES,
} from '../mockData/initialData';
import {
  ApiError,
  UNAUTHORIZED_EVENT,
  addCommentRequest,
  claimReward,
  createIssueRequest,
  fetchIssue,
  fetchIssues,
  fetchMe,
  fetchNotifications,
  getToken,
  loginRequest,
  markAllNotificationsRead,
  markNotificationRead,
  registerRequest,
  removeUpvote,
  setToken,
  updateIssueStatus,
  updateMe,
  uploadImageDataUrl,
  upvoteIssue,
  type BackendTokenResponse,
} from '../lib/api';
import { nextLevelPoints, toCivicPost, toComment, toNotification, toUserProfile } from '../lib/mappers';

interface AppContextType {
  user: UserProfile;
  isLoggedIn: boolean;
  /** Log in against the Core API. Resolves true on success (an error toast is shown otherwise). */
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: { name: string; email: string; password: string; ward?: string }) => Promise<boolean>;
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
  vacancies: Vacancy[];
  appliedVacancies: string[];
  applyVacancy: (vacancyId: string, applicantNote?: string) => void;
  volunteerDrives: VolunteerDrive[];
  joinVolunteerDrive: (driveId: string) => void;
  submitVolunteerProof: (driveId: string, photoDataUrl: string, note: string) => void;
  quizzes: CivicQuiz[];
  completedQuizzes: Record<string, { score: number; pointsEarned: number }>;
  completeQuiz: (quizId: string, score: number, pointsEarned: number) => void;
  badges: Badge[];
  modules: LearnModule[];
  completeModuleLesson: (moduleId: string) => void;
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
          parsed.avatar = '/profile_3d_avatar.jpg';
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USER;
  });

  // Posts State
  const [posts, setPosts] = useState<CivicPost[]>(() => {
    const saved = localStorage.getItem('prajapulse_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  // Briefing
  const [briefing] = useState<DailyBriefing>(INITIAL_BRIEFING);

  // Reels
  const [reels, setReels] = useState<ReelStory[]>(() => {
    const saved = localStorage.getItem('prajapulse_reels');
    return saved ? JSON.parse(saved) : INITIAL_REELS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<UserNotification[]>(() => {
    const saved = localStorage.getItem('prajapulse_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Vacancies
  const [vacancies] = useState<Vacancy[]>(INITIAL_VACANCIES);
  const [appliedVacancies, setAppliedVacancies] = useState<string[]>(() => {
    const saved = localStorage.getItem('prajapulse_applied_vacancies');
    return saved ? JSON.parse(saved) : [];
  });

  // NGO Volunteer Drives (Dataset integrated)
  const [volunteerDrives, setVolunteerDrives] = useState<VolunteerDrive[]>(() => {
    const saved = localStorage.getItem('prajapulse_volunteer_drives');
    return saved ? JSON.parse(saved) : INITIAL_VOLUNTEER_DRIVES;
  });

  useEffect(() => {
    localStorage.setItem('prajapulse_volunteer_drives', JSON.stringify(volunteerDrives));
  }, [volunteerDrives]);

  // Quizzes
  const [quizzes] = useState<CivicQuiz[]>(INITIAL_QUIZZES);
  const [completedQuizzes, setCompletedQuizzes] = useState<Record<string, { score: number; pointsEarned: number }>>(() => {
    const saved = localStorage.getItem('prajapulse_completed_quizzes');
    return saved ? JSON.parse(saved) : {};
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

  // Learning Modules
  const [modules, setModules] = useState<LearnModule[]>(() => {
    const saved = localStorage.getItem('prajapulse_modules');
    return saved ? JSON.parse(saved) : INITIAL_MODULES;
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
    localStorage.setItem('prajapulse_applied_vacancies', JSON.stringify(appliedVacancies));
  }, [appliedVacancies]);

  useEffect(() => {
    localStorage.setItem('prajapulse_completed_quizzes', JSON.stringify(completedQuizzes));
  }, [completedQuizzes]);

  useEffect(() => {
    localStorage.setItem('prajapulse_badges', JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    localStorage.setItem('prajapulse_modules', JSON.stringify(modules));
  }, [modules]);

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
      const detail = await fetchIssue(id);
      const comments = detail.comments.map(toComment);
      const patch = (p: CivicPost | null) =>
        p && p.id === id ? { ...p, comments, commentsCount: comments.length } : p;
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
    addToast('Welcome, ' + res.user.name, 'Connected to PrajaPulse Bengaluru Network', 'success');
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

  const register = async (input: { name: string; email: string; password: string; ward?: string }): Promise<boolean> => {
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
      addToast('Could not submit report', errText(e), 'info');
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

  const applyVacancy = (vacancyId: string, applicantNote?: string) => {
    if (appliedVacancies.includes(vacancyId)) {
      addToast('Application Already Received', 'The team is reviewing your profile.', 'info');
      return;
    }
    setAppliedVacancies((prev) => [...prev, vacancyId]);
    setUser((u) => ({ ...u, points: u.points + 25 }));
    addToast('Application Submitted! +25 Points', 'The organizing NGO will contact you via email.', 'reward');
  };

  const joinVolunteerDrive = (driveId: string) => {
    setVolunteerDrives((prev) =>
      prev.map((drive) => {
        if (drive.id === driveId) {
          if (drive.userStatus === 'joined' || drive.userStatus === 'proof_submitted') {
            return drive;
          }
          return {
            ...drive,
            volunteersJoined: drive.volunteersJoined + 1,
            userStatus: 'joined' as const,
          };
        }
        return drive;
      })
    );
    addToast(
      'Joined as Volunteer!',
      'You are now registered. Upload your photo proof during or after the drive to claim +100 reward points.',
      'success'
    );
  };

  const submitVolunteerProof = (driveId: string, photoDataUrl: string, note: string) => {
    setVolunteerDrives((prev) =>
      prev.map((drive) => {
        if (drive.id === driveId) {
          return {
            ...drive,
            userStatus: 'proof_submitted' as const,
            proofPhoto: photoDataUrl,
            proofNote: note,
          };
        }
        return drive;
      })
    );

    // Award +100 points and +3 volunteer hours!
    setUser((u) => ({
      ...u,
      points: u.points + 100,
      stats: {
        ...u.stats,
        volunteerHours: (u.stats.volunteerHours || 0) + 3,
      },
    }));

    // Add high-priority reward notification
    const newNotif: UserNotification = {
      id: 'notif-' + Date.now(),
      type: 'reward',
      title: 'Volunteering Proof Verified! +100 Pts',
      message: `Your photo proof of volunteering was verified. 100 points and 3 volunteer hours credited to your profile! Note: "${note}"`,
      timestamp: 'Just now',
      isRead: false,
      group: 'Today',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    addToast(
      'Photo Proof Verified! +100 Points',
      'Heroic civic work! 100 points and 3 volunteer hours have been credited to your profile.',
      'reward'
    );
  };

  const completeQuiz = async (quizId: string, score: number, pointsEarned: number) => {
    setCompletedQuizzes((prev) => ({
      ...prev,
      [quizId]: { score, pointsEarned },
    }));

    try {
      const res = await claimReward({ action_type: 'quiz', action_id: quizId, points: pointsEarned });
      applyPoints(res.user_points, res.user_tier);
      if (res.duplicate) {
        addToast('Quiz Complete', 'Points for this quiz were already earned - one reward per quiz.', 'info');
      } else if (res.awarded === 0) {
        addToast('Quiz Complete', 'Daily 60-point cap reached - no points this time.', 'info');
      } else {
        addToast(`Quiz Complete! +${res.awarded} Points`, `Score: ${score} - great civic knowledge!`, 'reward');
      }
    } catch (e) {
      addToast('Quiz saved, points not credited', errText(e), 'info');
    }
  };

  const completeModuleLesson = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const nextProgress = Math.min(100, mod.progress + 25);
    const isCertified = nextProgress >= 100;
    const newlyCertified = isCertified && !mod.certified;

    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, progress: nextProgress, certified: isCertified } : m)));

    if (newlyCertified) {
      claimReward({ action_type: 'academy_module', action_id: moduleId, points: 60 })
        .then((res) => {
          applyPoints(res.user_points, res.user_tier);
          addToast(
            res.awarded > 0 ? `Module Certified! +${res.awarded} Points` : 'Module Certified!',
            `Congratulations on completing "${mod.title}"!`,
            'reward'
          );
        })
        .catch((e) => addToast('Module certified, points not credited', errText(e), 'info'));
    }
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
        vacancies,
        appliedVacancies,
        applyVacancy,
        volunteerDrives,
        joinVolunteerDrive,
        submitVolunteerProof,
        quizzes,
        completedQuizzes,
        completeQuiz,
        badges,
        modules,
        completeModuleLesson,
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
        theme,
        setTheme,
        toggleTheme,
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
