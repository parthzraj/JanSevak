import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  MoreVertical,
  MapPin,
  Calendar,
  Users,
  Star,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Wrench,
  Building2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  X,
  Upload,
  Lightbulb,
  Landmark,
  MessageCircle,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { timeAgo } from '../../lib/mappers';
import { ImageLightbox } from './ImageLightbox';
import { MapViewModal } from './MapViewModal';
import { DepartmentModal, getDepartmentInfo } from './DepartmentModal';
import { SupporterAvatar, SupportersModal } from './SupportersModal';
import { Avatar } from '../common/Avatar';
import { useProfileLink } from '../../lib/useProfileLink';
import { IssueDrives } from '../volunteer/IssueDrives';

export const PostDetailModal: React.FC = () => {
  const navigate = useNavigate();
  const openProfile = useProfileLink();
  const {
    selectedPostForDetail,
    setSelectedPostForDetail,
    toggleBookmark,
    setSelectedPostForShare,
    addToast,
    addComment,
    addEvidence,
    resolveReport,
    deleteReport,
    user,
  } = useApp();

  const [commentInput, setCommentInput] = useState('');

  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<{ file: File; preview: string }[]>([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [showSupporters, setShowSupporters] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showDepartment, setShowDepartment] = useState(false);

  // Opening a different report must not inherit the previous one's slide / pop-ups
  const openPostId = selectedPostForDetail?.id;
  useEffect(() => {
    setActiveImageIndex(0);
    setLightboxIndex(null);
    setShowMap(false);
    setShowDepartment(false);
    setShowSupporters(false);
    setShowMenu(false);
    setConfirmDelete(false);
    setIsDeleting(false);
    setShowEvidenceUpload(false);
    setEvidenceFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
  }, [openPostId]);

  if (!selectedPostForDetail) return null;

  const post = selectedPostForDetail;

  // Photos the reporter really attached. API posts use `images: []` when there are none;
  // older offline/mock posts have no `images` field and show their single `imageUrl`.
  const evidencePhotos: string[] =
    post.images === undefined ? (post.imageUrl ? [post.imageUrl] : []) : post.images;
  const hasPhotos = evidencePhotos.length > 0;
  // The hero always shows something: the real photos, or an illustrative category image
  const detailImages = hasPhotos ? evidencePhotos : [post.imageUrl];

  const getDepartment = (category: string) => getDepartmentInfo(category).name;

  // ---- Status & timeline built from the real history -----------------------------------
  const STATUS_STEPS = ['Reported', 'Under Review', 'In Progress', 'Resolved'] as const;
  const currentStep = Math.max(0, STATUS_STEPS.indexOf(post.status as (typeof STATUS_STEPS)[number]));
  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  };
  const timelineSteps = STATUS_STEPS.map((step, idx) => {
    const event = post.timeline?.find((t) => t.status === step);
    const state: 'done' | 'current' | 'pending' =
      idx < currentStep || (idx === currentStep && step === 'Resolved')
        ? 'done'
        : idx === currentStep
        ? 'current'
        : 'pending';
    let detail: string;
    if (event) {
      detail = [formatWhen(event.created_at), event.note && event.note !== 'Issue reported' ? event.note : '']
        .filter(Boolean)
        .join(' · ');
    } else if (step === 'Reported') {
      detail = [formatWhen(post.timestamp), timeAgo(post.timestamp)].filter(Boolean).join(' · ');
    } else if (state === 'pending') {
      detail = 'Pending';
    } else {
      detail = state === 'current' ? 'In this stage now' : 'Completed';
    }
    return { step, state, detail };
  });

  const getSuggestiveRemarks = (currentPost: typeof post) => {
    if (currentPost.suggestiveRemarks) return currentPost.suggestiveRemarks;

    switch (currentPost.category) {
      case 'Roads':
        return {
          whatWeHaveToDo: [
            'Place makeshift hazard markers or caution flags to warn oncoming commuters.',
            'Slow down approaching vehicles and guide two-wheelers around skidding margins.',
            'Upvote and share geotagged photos to escalate ward engineering response.',
          ],
          whatGovernmentHasToDo: [
            'Deploy certified reflective warning barricades around the excavation site.',
            'Dispatch rapid cold-mix asphalt repair team to level the surface immediately.',
            'Penalize the errant excavation contractor for violating civic safety protocols.',
          ],
        };
      case 'Water':
        return {
          whatWeHaveToDo: [
            'Avoid walking or driving through submerged sections with hidden drain openings.',
            'Turn off community booster pumps to prevent sewage back-siphonage.',
            'Alert elderly neighbors and children to avoid contaminated stagnant runoff.',
          ],
          whatGovernmentHasToDo: [
            'Dispatch municipal high-capacity suction dewatering tankers to clear the street.',
            'Isolate leaking feeder valve and deploy emergency pipe-welding crew.',
            'Chlorinate the surrounding area and test potable supply lines for cross-contamination.',
          ],
        };
      case 'Sanitation':
        return {
          whatWeHaveToDo: [
            'Cease further garbage dumping and strictly segregate household dry and wet waste.',
            'Report illegal commercial waste dumping and nocturnal debris tippers.',
            'Cooperate with the morning door-to-door municipal collection vehicle.',
          ],
          whatGovernmentHasToDo: [
            'Deploy front-end loaders and covered compactor trucks for zero-waste clearing.',
            'Sanitize the cleared ground with disinfectant lime powder and post CCTV surveillance warning.',
            'Penalize repeat commercial offenders under municipal solid waste management bylaws.',
          ],
        };
      case 'Streetlights':
        return {
          whatWeHaveToDo: [
            'Turn on residential boundary lights to illuminate the sidewalk for pedestrians.',
            'Use mobile torches when walking through the unlit zone after dark.',
            'Share ward alerts and coordinate safe walking groups for late commuters.',
          ],
          whatGovernmentHasToDo: [
            'Send electric lineman squad to replace burnt fuses and repair underground cables.',
            'Install high-lumen, smart LED fixtures with automatic daylight sensors.',
            'Trim obstructing tree branches shielding the lamp illumination area.',
          ],
        };
      case 'Public Safety':
        return {
          whatWeHaveToDo: [
            'Maintain a minimum 15-foot safety perimeter and strictly keep children away.',
            'Alert nearby security guards and shopkeepers to monitor the hazard site.',
            'Contact the ward emergency helpline immediately if arcing or smoke is spotted.',
          ],
          whatGovernmentHasToDo: [
            'De-energize the hazardous line immediately via the local substation breaker.',
            'Erect lockable protective fencing with prominent high-voltage danger signage.',
            'Complete certified insulation rewiring and conduct safety verification audit.',
          ],
        };
      case 'Parks':
        return {
          whatWeHaveToDo: [
            'Cordon off broken swings, open electrical conduits, or unstable tree branches.',
            'Refrain from parking vehicles under brittle tree limbs during windy conditions.',
            'Form a community park monitoring group to prevent vandalism and littering.',
          ],
          whatGovernmentHasToDo: [
            'Dispatch forest cell pruning team with cranes to remove hazardous overhanging boughs.',
            'Repair damaged children play equipment and outdoor fitness installations.',
            'Restore automated sprinkler watering and install pathway security lights.',
          ],
        };
      default:
        return {
          whatWeHaveToDo: [
            'Coordinate with the local Resident Welfare Association (RWA) for representation.',
            'Keep sidewalks clear of construction materials and vehicle encroachment.',
            'Track ward resolution timelines and provide verified ground feedback.',
          ],
          whatGovernmentHasToDo: [
            'Schedule an on-site joint inspection by the ward junior engineer within 24 hours.',
            'Allocate emergency ward development funds to execute corrective repairs.',
            'Publish official progress milestones and photographic completion evidence.',
          ],
        };
    }
  };

  const remarks = getSuggestiveRemarks(post);


  // ---- Real photo evidence (uploaded to the server) -------------------------------------
  const MAX_EVIDENCE_FILES = 3;
  const MAX_EVIDENCE_MB = 10;
  const isOwnReport = post.reporter.id === user.id;

  const clearEvidenceFiles = () => {
    evidenceFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    setEvidenceFiles([]);
  };

  const closeEvidenceBox = () => {
    clearEvidenceFiles();
    setShowEvidenceUpload(false);
  };

  const handlePickEvidence = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow picking the same file again
    const accepted: { file: File; preview: string }[] = [];
    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        addToast('Photos only', `"${file.name}" is not an image.`, 'info');
      } else if (file.size > MAX_EVIDENCE_MB * 1024 * 1024) {
        addToast('Photo too large', `"${file.name}" is over ${MAX_EVIDENCE_MB} MB.`, 'info');
      } else {
        accepted.push({ file, preview: URL.createObjectURL(file) });
      }
    }
    setEvidenceFiles((prev) => {
      const merged = [...prev, ...accepted];
      merged.slice(MAX_EVIDENCE_FILES).forEach((f) => URL.revokeObjectURL(f.preview));
      if (merged.length > MAX_EVIDENCE_FILES) {
        addToast('Up to 3 photos at a time', undefined, 'info');
      }
      return merged.slice(0, MAX_EVIDENCE_FILES);
    });
  };

  const handleSubmitEvidence = async () => {
    if (evidenceFiles.length === 0 || isUploadingEvidence) return;
    setIsUploadingEvidence(true);
    const ok = await addEvidence(post.id, evidenceFiles.map((f) => f.file));
    setIsUploadingEvidence(false);
    if (ok) closeEvidenceBox();
  };

  // ---- Community activity (real supporters) ---------------------------------------------
  const supporters = post.supporters;
  const supportersTotal = post.supportersTotal ?? post.upvotes;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 transition-all animate-in fade-in duration-200"
      onClick={() => setSelectedPostForDetail(null)}
    >
      {/* Screen container: full height mobile screen look matching screenshot */}
      <div
        className="w-full max-w-lg bg-white h-[95vh] sm:h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Top Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#cbd5e1] shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedPostForDetail(null)}
              className="p-1.5 -ml-1.5 rounded-full text-[#0f2d59] hover:bg-[#f8fafc] transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-[#0f2d59] tracking-tight">
              Issue Details
            </h1>
          </div>

          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => toggleBookmark(post.id)}
              className={`p-2 rounded-full transition-colors ${
                post.isBookmarked
                  ? 'text-[#0f2d59] bg-[#eff6ff]'
                  : 'text-[#0f172a] hover:bg-[#f8fafc]'
              }`}
              title="Bookmark Issue"
            >
              <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
              title="Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-10 z-30 w-44 bg-white rounded-2xl shadow-xl border border-[#cbd5e1] py-1.5 text-xs animate-in fade-in"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => {
                    setSelectedPostForShare(post);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f8fafc] text-[#0f172a]"
                >
                  Share Issue
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText?.(window.location.href);
                    addToast('Link Copied to Clipboard', undefined, 'success');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f8fafc] text-[#0f172a]"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => {
                    addToast(`Contacting ${getDepartment(post.category)}`, 'Official ward desk alerted.', 'info');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f8fafc] text-[#0f2d59] font-bold"
                >
                  Contact Ward Desk
                </button>
                {(isOwnReport || user.role === 'admin') && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (user.role !== 'admin' && post.status !== 'Reported') {
                        addToast(
                          'Cannot delete this report',
                          `It is "${post.status}" - officials have already started working on it.`,
                          'info'
                        );
                      } else {
                        setConfirmDelete(true);
                      }
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-700 font-bold border-t border-slate-100"
                  >
                    Delete Report
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
          {/* 2. Hero Image Carousel with Pill Badges and Slide Feature */}
          <div className="relative aspect-[16/10] sm:aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-xs select-none group">
            {/* Horizontal Slide Carousel Track */}
            <div
              className="flex h-full w-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
            >
              {detailImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative w-full h-full shrink-0 bg-slate-900 ${hasPhotos ? 'cursor-zoom-in' : ''}`}
                  onClick={() => hasPhotos && setLightboxIndex(idx)}
                  role={hasPhotos ? 'button' : undefined}
                  aria-label={hasPhotos ? `Expand photo ${idx + 1}` : undefined}
                >
                  <img
                    src={img}
                    alt={`${post.title} - evidence photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    onError={(e) => {
                      const el = e.target as HTMLElement;
                      el.style.display = 'none';
                      if (el.parentElement) {
                        el.parentElement.style.background = post.imageFallbackGradient;
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Gradient Scrims */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

            {/* Top Left Badge: Critical / High Priority */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
              <span className="flex items-center gap-1 bg-[#FEE2E2] text-[#DC2626] font-bold text-xs px-3 py-1 rounded-full shadow-xs">
                <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[10px] font-extrabold">
                  !
                </span>
                <span>{post.priority === 'Urgent' ? 'Critical' : `${post.priority || 'High'}`}</span>
              </span>
            </div>

            {/* Top Right Badge: Status (In Progress, Resolved, etc.) */}
            <div className="absolute top-3 right-3 z-10 pointer-events-none">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full shadow-xs ${
                  post.status === 'Resolved'
                    ? 'bg-[#eff6ff] text-[#0f2d59]'
                    : post.status === 'In Progress'
                    ? 'bg-[#E0F2FE] text-[#0284C7]'
                    : 'bg-[#FEF3C7] text-[#D97706]'
                }`}
              >
                {post.status}
              </span>
            </div>

            {/* CHEVRON SLIDE BUTTONS: Left (<) and Right (>) */}
            {detailImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev === 0 ? detailImages.length - 1 : prev - 1
                    )
                  }
                  aria-label="Previous image"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/25 transition-all shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.6] -translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev === detailImages.length - 1 ? 0 : prev + 1
                    )
                  }
                  aria-label="Next image"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/25 transition-all shadow-md"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.6] translate-x-0.5" />
                </button>
              </>
            )}

            {/* Bottom Row Overlay: Evidence Images Counter + Slide Pagination Dots */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20 shadow-xs">
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {hasPhotos
                    ? `${activeImageIndex + 1}/${detailImages.length} Evidence Photos`
                    : 'Illustrative image · no photo attached'}
                </span>
              </div>

              {detailImages.length > 1 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-auto">
                  {detailImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`transition-all duration-300 rounded-full ${
                        idx === activeImageIndex
                          ? 'w-4 h-1.5 bg-white shadow-xs'
                          : 'w-1.5 h-1.5 bg-white/45 hover:bg-white/80'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Title & Subtitle Section */}
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-[#0f2d59] tracking-tight leading-snug">
              {post.title}
            </h2>

            <div className="flex items-center justify-between text-xs text-[#64748b] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[#0f172a] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#0f2d59]" />
                  {post.reporter.wardOrArea}
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-[#64748b]">
                  <Clock className="w-3.5 h-3.5 text-[#64748b]" />
                  {timeAgo(post.timestamp) || post.formattedTime}
                </span>
              </div>

              {/* Category Badge on Right */}
              <span className="flex items-center gap-1 bg-[#eff6ff] text-[#0f2d59] font-bold text-xs px-2.5 py-1 rounded-xl">
                <span>🛣</span>
                <span>{post.category}</span>
              </span>
            </div>
          </div>

          {/* 4. Description Paragraph */}
          <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
            {post.description}
          </p>

          {/* Suggestive Remarks Section: 2 Columns - What We Have to Do & What Government Has to Do */}
          <div className="bg-[#F8FAF9] rounded-2xl p-3 sm:p-3.5 border border-[#E2E8E4] space-y-2.5 select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-[#0f2d59]/10 text-[#0f2d59] flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0f172a]">
                  Suggestive Remarks
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-full border border-[#0f2d59]/20">
                Action Matrix
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Column 1: What We Have to Do */}
              <div className="bg-gradient-to-b from-[#F2FBF5] to-white rounded-xl p-2.5 sm:p-3 border border-[#D1E7D8] shadow-xs flex flex-col justify-between space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-[#eff6ff]">
                    <div className="w-5 h-5 rounded-full bg-[#0f2d59] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Users className="w-2.5 h-2.5 stroke-[2.8]" />
                    </div>
                    <h4 className="text-[11px] sm:text-xs font-extrabold text-[#0f2d59] leading-tight">
                      What We Have to Do
                    </h4>
                  </div>
                  <ul className="space-y-1.5">
                    {remarks.whatWeHaveToDo.map((remark, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-1.5 text-[10px] sm:text-[11px] text-[#2D3A32] leading-snug"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-[#eff6ff] text-[#0f2d59] text-[9px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-[#0f2d59]/20">
                          {idx + 1}
                        </span>
                        <span>{remark}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-1.5 border-t border-[#eff6ff]/60 text-[9px] font-bold text-[#0f2d59] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f2d59]" />
                  <span>Citizens' Responsibility</span>
                </div>
              </div>

              {/* Column 2: What Government Has to Do */}
              <div className="bg-gradient-to-b from-[#F0F7FF] to-white rounded-xl p-2.5 sm:p-3 border border-[#BFDBFE] shadow-xs flex flex-col justify-between space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-[#EFF6FF]">
                    <div className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Landmark className="w-2.5 h-2.5 stroke-[2.8]" />
                    </div>
                    <h4 className="text-[11px] sm:text-xs font-extrabold text-[#1D4ED8] leading-tight">
                      What Government Has to Do
                    </h4>
                  </div>
                  <ul className="space-y-1.5">
                    {remarks.whatGovernmentHasToDo.map((remark, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-1.5 text-[10px] sm:text-[11px] text-[#1E293B] leading-snug"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] text-[9px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-[#1D4ED8]/20">
                          {idx + 1}
                        </span>
                        <span>{remark}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-1.5 border-t border-[#EFF6FF]/60 text-[9px] font-bold text-[#1D4ED8] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                  <span>Municipal Responsibility</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Three Key Metric Cards in 1 Row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Card 1: Reported */}
            <div className="bg-[#f8fafc] p-2.5 sm:p-3 rounded-2xl border border-[#cbd5e1] flex items-center gap-2.5">
              <div className="text-[#0f2d59]">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#64748b] block">Status</span>
                <span className="text-xs font-bold text-[#0f172a] truncate block">
                  {post.status}
                </span>
              </div>
            </div>

            {/* Card 2: Community */}
            <div className="bg-[#f8fafc] p-2.5 sm:p-3 rounded-2xl border border-[#cbd5e1] flex items-center gap-2.5">
              <div className="text-[#0f2d59]">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#64748b] block">Community</span>
                <span className="text-xs font-bold text-[#0f172a] truncate block">
                  {post.upvotes} supporting
                </span>
              </div>
            </div>

            {/* Card 3: Impact */}
            <div className="bg-[#f8fafc] p-2.5 sm:p-3 rounded-2xl border border-[#cbd5e1] flex items-center gap-2.5">
              <div className="text-[#0f2d59]">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#64748b] block">Impact</span>
                <span className="text-xs font-bold text-[#0f172a] truncate block">
                  {post.priority || 'High'}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Evidence Gallery Section (real photos only) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f2d59]">Evidence</h3>
              {hasPhotos && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="text-xs font-semibold text-[#0f2d59] flex items-center gap-0.5 hover:underline"
                >
                  <span>View all ({evidencePhotos.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {hasPhotos ? (
              <div className="grid grid-cols-4 gap-2">
                {evidencePhotos.slice(0, 4).map((img, idx) => {
                  const extra = evidencePhotos.length - 4;
                  const showMore = idx === 3 && extra > 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-[#cbd5e1] bg-slate-100 group cursor-zoom-in"
                      aria-label={showMore ? `View ${extra} more photo${extra > 1 ? 's' : ''}` : `Expand photo ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Evidence ${idx + 1}`}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${
                          showMore ? 'opacity-60' : ''
                        }`}
                      />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#0f2d59] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                          <Camera className="w-2.5 h-2.5" /> Main
                        </span>
                      )}
                      {showMore && (
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-white font-extrabold text-sm sm:text-base">
                          +{extra}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] py-5 text-center">
                <p className="text-xs font-semibold text-[#0f172a]">No photos were attached to this report.</p>
              </div>
            )}
          </div>

          {/* 7. Location Card Strip */}
          <div className="p-3 bg-[#f8fafc] rounded-2xl border border-[#cbd5e1] flex items-center gap-3">
            {/* Map Mini Vector Graphic */}
            <button
              type="button"
              onClick={() => setShowMap(true)}
              aria-label="View on map"
              className="w-20 h-16 rounded-xl bg-[#E8EFEA] border border-[#CBD9CF] relative overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
            >
              {/* Subtle road grid lines */}
              <div className="absolute inset-x-0 top-3 h-1.5 bg-white/80 rotate-12" />
              <div className="absolute inset-y-0 left-6 w-1.5 bg-white/80 -rotate-12" />
              <div className="w-6 h-6 rounded-full bg-red-100 border border-red-300 flex items-center justify-center relative z-10 shadow-xs animate-bounce">
                <MapPin className="w-4 h-4 text-red-600 fill-current" />
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0f2d59]" /> Location
              </span>
              <p className="text-xs font-bold text-[#0f172a] truncate mt-0.5">
                {post.reporter.wardOrArea}
              </p>
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="text-xs font-bold text-[#0f2d59] flex items-center gap-0.5 hover:underline mt-1"
              >
                <span>View on Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 8. Status & Timeline Section (built from the real status history) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#0f2d59]">
              Status & Timeline
            </h3>

            <div className="space-y-4 pl-1">
              {timelineSteps.map(({ step, state, detail }, idx) => {
                const isLast = idx === timelineSteps.length - 1;
                const nextDone = timelineSteps[idx + 1]?.state !== 'pending';
                const icon =
                  step === 'In Progress' ? (
                    <Wrench className="w-3 h-3" />
                  ) : step === 'Under Review' ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  );
                return (
                  <div key={step} className="flex items-start gap-3 relative">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 relative z-10 ${
                        state === 'done'
                          ? step === 'Resolved'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#0f2d59] text-white'
                          : state === 'current'
                          ? 'bg-[#F59E0B] text-white shadow-xs ring-4 ring-amber-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {state === 'pending' ? <span className="w-2 h-2 rounded-full bg-slate-400" /> : icon}
                    </div>
                    {!isLast && (
                      <div
                        className={`absolute top-6 left-3 -ml-px w-0.5 h-9 ${
                          state === 'done' && nextDone ? 'bg-[#0f2d59]' : 'bg-[#CBD5E1]'
                        }`}
                      />
                    )}
                    <div className="min-w-0 flex-1 -mt-0.5">
                      <h4
                        className={`text-xs font-bold ${
                          state === 'pending' ? 'text-slate-500' : state === 'current' ? 'text-[#D97706]' : 'text-[#0f2d59]'
                        }`}
                      >
                        {step}
                      </h4>
                      <p className="text-[11px] text-[#64748b]">
                        {detail}
                        {step === 'Reported' && (
                          <>
                            {' · By '}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPostForDetail(null);
                                openProfile(post.reporter.id, post.reporter.name);
                              }}
                              className="font-bold text-[#0f2d59] hover:underline cursor-pointer"
                              title={`View profile for ${post.reporter.name}`}
                            >
                              {post.reporter.name}
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 9. Responsible Department Card */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#cbd5e1] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#eff6ff] text-[#0f2d59] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#64748b] block font-medium">
                  Responsible Department
                </span>
                <p className="text-xs font-bold text-[#0f172a] truncate">
                  {getDepartment(post.category)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDepartment(true)}
              className="text-xs font-bold text-[#0f2d59] px-3 py-1.5 rounded-full border border-[#cbd5e1] hover:bg-[#f8fafc] shrink-0 transition-colors"
            >
              View Details &rarr;
            </button>
          </div>

          {/* 10. Community Activity Card (real supporters from the server) */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#cbd5e1] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#eff6ff] text-[#0f2d59] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#64748b] block font-medium">
                  Community Activity
                </span>
                <p className="text-xs font-bold text-[#0f172a] truncate">
                  {post.upvotes === 0
                    ? 'No one has supported this issue yet'
                    : `${post.upvotes} ${post.upvotes === 1 ? 'person has' : 'people have'} supported this issue`}
                </p>
                {supporters && supporters.length > 0 && (
                  <div className="flex items-center -space-x-1.5 mt-1">
                    {supporters.slice(0, 4).map((s) => (
                      <SupporterAvatar key={s.id} supporter={s} />
                    ))}
                    {supportersTotal > 4 && (
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-[#0f2d59] text-[9px] font-bold flex items-center justify-center border-2 border-white">
                        +{supportersTotal - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                supporters
                  ? setShowSupporters(true)
                  : addToast('Community Endorsements', `${post.upvotes} citizens logged support for this fix`, 'info')
              }
              className="text-xs font-bold text-[#0f2d59] px-3 py-1.5 rounded-full border border-[#cbd5e1] hover:bg-[#f8fafc] shrink-0 transition-colors"
            >
              View all &rarr;
            </button>
          </div>

          {/^\d+$/.test(post.id) && (
            <IssueDrives
              issueId={Number(post.id)}
              title={post.title}
              category={post.category}
              address={post.reporter.wardOrArea}
              onOpenDrive={(id) => {
                setSelectedPostForDetail(null);
                navigate(`/volunteer?drive=${id}`);
              }}
            />
          )}

          {/* 11. Community Discussion & Citizen Comments */}
          <div className="p-4 bg-white rounded-2xl border border-[#cbd5e1] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#0f2d59]" />
                <h4 className="text-xs font-black text-[#0f172a]">
                  Community Discussion ({post.comments?.length || 0})
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Citizen Feedback</span>
            </div>

            {/* List of comments from other people */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {!post.comments || post.comments.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  <p className="font-semibold text-slate-600">No comments yet</p>
                  <p className="text-[11px] mt-0.5">Be the first to share an update or context on this issue!</p>
                </div>
              ) : (
                post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-2xl text-xs space-y-1 ${
                      comment.isOfficial
                        ? 'bg-[#eff6ff]/70 border border-blue-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPostForDetail(null);
                          openProfile(comment.userId, comment.author);
                        }}
                        className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity"
                        title={`View profile for ${comment.author}`}
                      >
                        <Avatar src={comment.avatar} name={comment.author} size={20} />
                        <span className="font-bold text-slate-800 text-[11px] hover:underline">{comment.author}</span>
                        {comment.isOfficial && (
                          <span className="text-[9px] font-black text-[#0f2d59] bg-blue-100 px-1.5 py-0.2 rounded-md">
                            Official Desk
                          </span>
                        )}
                      </button>
                      <span className="text-[10px] text-slate-400">{comment.time}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px] pl-7">
                      {comment.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Post comment input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentInput.trim()) return;
                addComment(post.id, commentInput.trim());
                setCommentInput('');
              }}
              className="flex gap-2 pt-1 border-t border-slate-100"
            >
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Share a ground update or comment..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0f2d59]"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="px-3.5 py-2 bg-[#0f2d59] text-white rounded-xl text-xs font-bold hover:bg-[#1d4e8c] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* 12. Bottom Sticky Action Bar */}
        <footer className="p-3.5 border-t border-[#cbd5e1] bg-white flex items-center justify-between gap-2.5 shrink-0">
          {post.status === 'Resolved' ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-emerald-800 block leading-tight">
                  Problem Resolved
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  +50 Points Credited to Reporter
                </span>
              </div>
            </div>
          ) : user.role === 'official' || user.role === 'admin' ? (
            <button
              onClick={() => {
                resolveReport(post.id);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Verify and Mark Problem Resolved"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Mark Resolved (+50 Pts)</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-[#64748b]">Status updates are made by ward officials</span>
          )}

          <button
            onClick={() => setShowEvidenceUpload(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold transition-all shadow-md shadow-[#0f2d59]/20 active:scale-95 shrink-0 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{isOwnReport ? 'Add Photo' : 'Add Photo (+10 pts)'}</span>
          </button>
        </footer>

        {lightboxIndex !== null && hasPhotos && (
          <ImageLightbox
            images={evidencePhotos}
            startIndex={lightboxIndex}
            title={post.title}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        {showSupporters && supporters && (
          <SupportersModal
            title={post.title}
            supporters={supporters}
            total={supportersTotal}
            onClose={() => setShowSupporters(false)}
            onOpenProfile={(id, name) => {
              setShowSupporters(false);
              setSelectedPostForDetail(null);
              openProfile(id, name);
            }}
          />
        )}

        {confirmDelete && (
          <div
            className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
            role="alertdialog"
            aria-modal="true"
            aria-label="Delete report"
            onClick={(e) => {
              e.stopPropagation();
              if (!isDeleting) setConfirmDelete(false);
            }}
          >
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-extrabold text-[#0f172a]">Delete this report?</h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                &ldquo;{post.title}&rdquo; will be removed for everyone, together with its photos, comments and upvotes.
                The points you earned for it will be taken back. This cannot be undone.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#64748b] cursor-pointer"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    await deleteReport(post.id);
                    setIsDeleting(false);
                    setConfirmDelete(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showMap && (
          <MapViewModal
            title={post.title}
            address={post.reporter.wardOrArea}
            latitude={post.latitude}
            longitude={post.longitude}
            onClose={() => setShowMap(false)}
          />
        )}

        {showDepartment && (
          <DepartmentModal
            category={post.category}
            status={post.status}
            priority={post.priority}
            onContact={() =>
              addToast(`Contacting ${getDepartment(post.category)}`, 'Official ward desk alerted.', 'info')
            }
            onClose={() => setShowDepartment(false)}
          />
        )}

        {/* Add photo evidence to this report */}
        {showEvidenceUpload && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={closeEvidenceBox}
          >
            <div
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
                <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#0f2d59]" />
                  <span>Add Photo Evidence</span>
                </h3>
                <button
                  type="button"
                  onClick={closeEvidenceBox}
                  className="p-1 rounded-full text-[#64748b] hover:text-[#0f172a]"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#64748b] leading-relaxed">
                Add up to {MAX_EVIDENCE_FILES} fresh photos from the site to show the current condition.{' '}
                {isOwnReport ? (
                  'You can add photos to your own report, but points are only given for other citizens\' reports.'
                ) : (
                  <>
                    Your first photo contribution to this issue earns <strong>+10 Civic Points</strong>.
                  </>
                )}
              </p>

              {evidenceFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {evidenceFiles.map((f, idx) => (
                    <div key={f.preview} className="relative aspect-square rounded-xl overflow-hidden border border-[#cbd5e1]">
                      <img src={f.preview} alt={`Selected photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(f.preview);
                          setEvidenceFiles((prev) => prev.filter((x) => x.preview !== f.preview));
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {evidenceFiles.length < MAX_EVIDENCE_FILES && (
                <label className="border-2 border-dashed border-[#0f2d59]/30 bg-[#f8fafc] rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-[#0f2d59] transition-colors">
                  <Upload className="w-7 h-7 text-[#0f2d59] mb-1.5" />
                  <span className="text-xs font-bold text-[#0f172a]">
                    {evidenceFiles.length === 0 ? 'Tap to take or choose photos' : 'Add another photo'}
                  </span>
                  <span className="text-[10px] text-[#64748b] mt-0.5">JPG, PNG, WEBP up to {MAX_EVIDENCE_MB}MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handlePickEvidence}
                    className="hidden"
                    aria-label="Choose evidence photos"
                  />
                </label>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeEvidenceBox}
                  className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitEvidence}
                  disabled={evidenceFiles.length === 0 || isUploadingEvidence}
                  className="flex-1 py-2.5 rounded-xl bg-[#0f2d59] text-white text-xs font-bold hover:bg-[#1d4e8c] disabled:opacity-40"
                >
                  {isUploadingEvidence
                    ? 'Uploading...'
                    : `Submit ${evidenceFiles.length || ''} Photo${evidenceFiles.length === 1 ? '' : 's'}`.replace('  ', ' ')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
