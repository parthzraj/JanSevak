import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ExternalLink,
  Users,
  Award,
  MapPin,
  Calendar,
  CheckCircle2,
  ChevronDown,
  TreePine,
  BarChart3,
  Recycle,
  ShieldCheck,
  Briefcase,
  Search,
  Sparkles,
  HandHeart,
  Camera,
  Upload,
  X,
  UserCheck,
  Check,
  HeartHandshake,
  Clock,
  Info,
  Droplets,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VolunteerDrive } from '../types';

interface VacancyTheme {
  topBarGradient: string;
  ambientGlow: string;
  cardBorder: string;
  iconBg: string;
  icon: React.ReactNode;
  bulletDot: string;
  btnGradient: string;
  btnShadow: string;
}

const VACANCY_THEMES: Record<string, VacancyTheme> = {
  'vac-1': {
    topBarGradient: 'from-emerald-500 via-teal-500 to-green-400',
    ambientGlow: 'bg-emerald-400',
    cardBorder: 'border-emerald-100 hover:border-emerald-300',
    iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/25',
    icon: <TreePine className="w-5 h-5 stroke-[2.2]" />,
    bulletDot: 'bg-emerald-600',
    btnGradient: 'bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900',
    btnShadow: 'shadow-emerald-900/20',
  },
  'vac-2': {
    topBarGradient: 'from-blue-600 via-indigo-500 to-sky-400',
    ambientGlow: 'bg-blue-400',
    cardBorder: 'border-blue-100 hover:border-blue-300',
    iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-700/25',
    icon: <BarChart3 className="w-5 h-5 stroke-[2.2]" />,
    bulletDot: 'bg-blue-600',
    btnGradient: 'bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900',
    btnShadow: 'shadow-blue-900/20',
  },
  'vac-3': {
    topBarGradient: 'from-teal-500 via-cyan-500 to-emerald-400',
    ambientGlow: 'bg-teal-400',
    cardBorder: 'border-teal-100 hover:border-teal-300',
    iconBg: 'bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-md shadow-teal-700/25',
    icon: <Recycle className="w-5 h-5 stroke-[2.2]" />,
    bulletDot: 'bg-teal-600',
    btnGradient: 'bg-gradient-to-r from-teal-700 to-cyan-800 hover:from-teal-800 hover:to-cyan-900',
    btnShadow: 'shadow-teal-900/20',
  },
  'vac-4': {
    topBarGradient: 'from-amber-500 via-orange-500 to-yellow-400',
    ambientGlow: 'bg-amber-400',
    cardBorder: 'border-amber-100 hover:border-amber-300',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-700/25',
    icon: <ShieldCheck className="w-5 h-5 stroke-[2.2]" />,
    bulletDot: 'bg-amber-600',
    btnGradient: 'bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-800 hover:to-orange-900',
    btnShadow: 'shadow-amber-900/20',
  },
};

const DEFAULT_THEME: VacancyTheme = {
  topBarGradient: 'from-emerald-500 via-teal-500 to-green-400',
  ambientGlow: 'bg-emerald-400',
  cardBorder: 'border-emerald-100 hover:border-emerald-300',
  iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/25',
  icon: <Briefcase className="w-5 h-5 stroke-[2.2]" />,
  bulletDot: 'bg-emerald-600',
  btnGradient: 'bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900',
  btnShadow: 'shadow-emerald-900/20',
};

// Preset sample photos for fast verification demo
const SAMPLE_PROOF_PHOTOS = [
  {
    name: 'Plastic Cleanup Action',
    url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
    caption: 'Cleared 4 bags of plastic & wrappers with the neighborhood squad.',
  },
  {
    name: 'Tree Plantation Drive',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    caption: 'Planted 3 indigenous neem saplings & placed protective bamboo guards.',
  },
  {
    name: 'Drain De-silting Work',
    url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    caption: 'Assisted team in clearing storm water drain blockage before rain.',
  },
];

export const VacanciesScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    vacancies,
    appliedVacancies,
    applyVacancy,
    volunteerDrives,
    joinVolunteerDrive,
    submitVolunteerProof,
    addToast,
    user,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'drives' | 'fellowships'>('drives');
  const [driveFilter, setDriveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Photo Proof Upload Modal State
  const [proofModalDrive, setProofModalDrive] = useState<VolunteerDrive | null>(null);
  const [uploadedPhotoPreview, setUploadedPhotoPreview] = useState<string>('');
  const [proofNote, setProofNote] = useState<string>('');
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);

  // Filtered Volunteer Drives
  const filteredDrives = useMemo(() => {
    return volunteerDrives.filter((drive) => {
      const matchesSearch =
        drive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drive.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drive.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = driveFilter === 'All' || drive.category === driveFilter;
      return matchesSearch && matchesCategory;
    });
  }, [volunteerDrives, searchQuery, driveFilter]);

  // Filtered Fellowships
  const filteredVacancies = useMemo(() => {
    return vacancies.filter((vac) => {
      return (
        vac.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vac.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vac.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [vacancies, searchQuery]);

  const handleApplyClick = (vacancyId: string, roleTitle: string) => {
    applyVacancy(vacancyId, 'Applied via Direct Google Form');
    addToast(
      'Application Form Opened!',
      `You earned +25 points for applying to "${roleTitle}".`,
      'reward'
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Open Proof Modal
  const openProofModal = (drive: VolunteerDrive) => {
    setProofModalDrive(drive);
    setUploadedPhotoPreview('');
    setProofNote('');
  };

  // Handle Photo File Upload
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhotoPreview(reader.result as string);
        if (!proofNote) {
          setProofNote('Completed volunteering tasks with NGO field team.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Proof Submit
  const handleProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofModalDrive) return;
    if (!uploadedPhotoPreview) {
      addToast('Photo Required', 'Please capture or upload a photo of your volunteering work.', 'info');
      return;
    }

    setIsSubmittingProof(true);
    setTimeout(() => {
      submitVolunteerProof(
        proofModalDrive.id,
        uploadedPhotoPreview,
        proofNote.trim() || 'Volunteering participation completed at site.'
      );
      setIsSubmittingProof(false);
      setProofModalDrive(null);
      setUploadedPhotoPreview('');
      setProofNote('');
    }, 600);
  };

  return (
    <div className="pb-28 max-w-xl mx-auto px-4 pt-3 space-y-4 animate-in fade-in duration-200">
      {/* TOP HEADER */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-base sm:text-lg font-black text-[#0f2d59] leading-tight">
            NGO Volunteering & Civic Drives
          </h1>
          <p className="text-[11px] text-[#64748b]">
            Join nearby NGO cleanups & social work to earn points
          </p>
        </div>

        {/* User Karma Stats Badge */}
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900 shadow-2xs">
          <Award className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>{user.points} pts</span>
        </div>
      </div>

      {/* TOP DUAL-TAB SWITCHER */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('drives')}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'drives'
              ? 'bg-white text-[#0f2d59] shadow-sm shadow-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HandHeart className="w-4 h-4 text-[#ea580c]" />
          <span>Volunteer Drives</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c] font-black">
            {volunteerDrives.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fellowships')}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'fellowships'
              ? 'bg-white text-[#0f2d59] shadow-sm shadow-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4 text-emerald-600" />
          <span>Fellowships</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-black">
            {vacancies.length}
          </span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === 'drives'
              ? 'Search cleanup drives, NGO name, or ward...'
              : 'Search fellowships, role, or NGO...'
          }
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2d59]/20 focus:border-[#0f2d59] transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* TAB 1: NGO VOLUNTEER DRIVES (Cleanups, Social Work, Photo Proof) */}
      {activeTab === 'drives' && (
        <div className="space-y-3.5">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Cleanup', 'Tree Planting', 'Drainage', 'Sanitation', 'Social Work'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setDriveFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    driveFilter === cat
                      ? 'bg-[#0f2d59] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Points Policy Callout Banner */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-emerald-500/10 rounded-2xl p-3 border border-orange-200/60 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-snug">
              <strong className="text-slate-900 block font-bold">Earn Points by Volunteering:</strong>
              Join any nearby drive sent by NGOs. Upload your action photo from the site to claim{' '}
              <strong className="text-[#ea580c] font-black">+100 Reward Points</strong> & 3 volunteer hours!
            </div>
          </div>

          {/* Drives List */}
          <div className="space-y-3">
            {filteredDrives.map((drive) => {
              const isJoined = drive.userStatus === 'joined';
              const isProofSubmitted = drive.userStatus === 'proof_submitted';
              const isExpanded = expandedId === drive.id;
              const fillPct = Math.min(100, Math.round((drive.volunteersJoined / drive.volunteersNeeded) * 100));

              return (
                <div
                  key={drive.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 space-y-3"
                >
                  {/* Top Category Gradient Strip */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

                  {/* Header: NGO & Category Pill */}
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60 inline-block mb-1">
                        {drive.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {drive.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
                        <span>Organized by {drive.organization}</span>
                      </p>
                    </div>

                    <div className="shrink-0 bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                      <Award className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      <span>+{drive.pointsReward} pts</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {drive.description}
                  </p>

                  {/* Meta Tags: Location & Time */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[200px]">{drive.location}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{drive.date}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{drive.time}</span>
                    </span>
                  </div>

                  {/* Volunteer Capacity Progress Bar */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Volunteer Roster:</span>
                      </span>
                      <span className="font-extrabold text-[#0f2d59]">
                        {drive.volunteersJoined} / {drive.volunteersNeeded} Volunteers
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Safety Instructions Accordion */}
                  {drive.safetyInstructions && drive.safetyInstructions.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(drive.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>{isExpanded ? 'Hide Safety Guidelines' : 'View Safety Guidelines & Gear'}</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs space-y-1.5 animate-in fade-in duration-200">
                          {drive.safetyInstructions.map((inst, i) => (
                            <div key={i} className="flex items-start gap-2 text-slate-600 leading-snug">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                              <span>{inst}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* If Proof was submitted: Show photo thumbnail & verified badge */}
                  {isProofSubmitted && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-start gap-3">
                      {drive.proofPhoto && (
                        <img
                          src={drive.proofPhoto}
                          alt="Volunteering Proof"
                          className="w-16 h-16 rounded-xl object-cover border border-emerald-300 shadow-2xs shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Proof Verified · +100 Points Awarded</span>
                        </div>
                        {drive.proofNote && (
                          <p className="text-[11px] text-emerald-900/80 mt-1 italic line-clamp-2">
                            "{drive.proofNote}"
                          </p>
                        )}
                        <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">
                          ✓ 3 Volunteer hours added to your civic certificate
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500">
                      Nearby citizen participation welcome
                    </div>

                    {!isJoined && !isProofSubmitted && (
                      <button
                        type="button"
                        onClick={() => joinVolunteerDrive(drive.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold transition-all shadow-md shadow-[#0f2d59]/20 active:scale-95 cursor-pointer"
                      >
                        <HandHeart className="w-3.5 h-3.5" />
                        <span>Join as Volunteer</span>
                      </button>
                    )}

                    {isJoined && !isProofSubmitted && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          ✓ Registered
                        </span>
                        <button
                          type="button"
                          onClick={() => openProofModal(drive)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-black transition-all shadow-md shadow-orange-900/20 active:scale-95 cursor-pointer animate-pulse"
                        >
                          <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Upload Photo (+100 Pts)</span>
                        </button>
                      </div>
                    )}

                    {isProofSubmitted && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredDrives.length === 0 && (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs space-y-2">
                <HandHeart className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Volunteer Drives found</h3>
                <p className="text-xs text-slate-500">
                  Try clearing the category filter or searching with different keywords.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FELLOWSHIPS & LONG-TERM ROLES */}
      {activeTab === 'fellowships' && (
        <div className="space-y-3.5">
          <div className="space-y-3">
            {filteredVacancies.map((vac) => {
              const theme = VACANCY_THEMES[vac.id] || DEFAULT_THEME;
              const isApplied = appliedVacancies.includes(vac.id);
              const isExpanded = expandedId === vac.id;
              const formUrl =
                vac.googleFormUrl ||
                'https://docs.google.com/forms/d/e/1FAIpQLSc_CivicDataFellowship/viewform';

              return (
                <div
                  key={vac.id}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border ${theme.cardBorder} shadow-xs relative overflow-hidden transition-all duration-200 space-y-3`}
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.topBarGradient}`}
                  />

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${theme.iconBg}`}
                    >
                      {theme.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm sm:text-base font-extrabold text-[#0F172A] leading-snug">
                        {vac.role}
                      </h2>
                      <p className="text-xs font-semibold text-[#64748B] mt-0.5">
                        {vac.organization}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 bg-[#FEF9C3]/80 text-[#854D0E] border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>+25 pts</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#334155] leading-relaxed">
                    {vac.description}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-[#475569]">
                    <span className="inline-flex items-center gap-1.5 bg-[#F8FAFC] border border-slate-200 px-2.5 py-1 rounded-full font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[170px]">{vac.location}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 bg-[#F8FAFC] border border-slate-200 px-2.5 py-1 rounded-full font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{vac.spotsRemaining} spots left</span>
                    </span>

                    {vac.stipend && (
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full font-bold">
                        <span>{vac.stipend}</span>
                      </span>
                    )}
                  </div>

                  {vac.requirements && vac.requirements.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleExpand(vac.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#334155] hover:text-[#0F172A] transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide requirements' : 'View key requirements'}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 bg-[#F8FAFC] rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
                          {vac.requirements.map((req, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs text-[#334155] leading-relaxed"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${theme.bulletDot} mt-1.5 shrink-0`}
                              />
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-[#64748B]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Deadline: <strong className="text-slate-800">{vac.deadline}</strong>
                      </span>
                    </div>

                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Applied
                      </span>
                    ) : (
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleApplyClick(vac.id, vac.role)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl ${theme.btnGradient} text-white text-xs font-bold transition-all shadow-xs ${theme.btnShadow} hover:scale-[1.02] active:scale-95 cursor-pointer`}
                      >
                        <span>Apply Now</span>
                        <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PHOTO PROOF UPLOAD MODAL */}
      {proofModalDrive && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setProofModalDrive(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-[#0f2d59] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-400/30">
                  <Camera className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Upload Volunteering Photo</h3>
                  <p className="text-[10px] text-blue-200">{proofModalDrive.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProofModalDrive(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleProofSubmit} className="p-4 space-y-3.5 overflow-y-auto">
              {/* Reward Highlights */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
                <Award className="w-6 h-6 text-amber-600 fill-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-amber-950">+100 Reward Points & +3 Hours</h4>
                  <p className="text-[11px] text-amber-800">
                    Uploaded photos are verified by {proofModalDrive.organization} coordinators.
                  </p>
                </div>
              </div>

              {/* Photo Upload / Capture Box */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  1. Capture or Select Volunteering Action Photo <span className="text-rose-500">*</span>
                </label>

                {uploadedPhotoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md">
                    <img
                      src={uploadedPhotoPreview}
                      alt="Uploaded action"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedPhotoPreview('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-emerald-700/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓ Ready for submission
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 hover:border-[#0f2d59] rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer p-4 text-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-1.5" />
                    <span className="text-xs font-bold text-[#0f2d59]">
                      Take photo with camera or choose file
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Clear picture of you participating or site cleanup
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Fast Sample Selector for easy demo */}
              {!uploadedPhotoPreview && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Or select demo photo:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SAMPLE_PROOF_PHOTOS.map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setUploadedPhotoPreview(sample.url);
                          setProofNote(sample.caption);
                        }}
                        className="p-1.5 rounded-xl border border-slate-200 hover:border-orange-400 bg-white text-left transition-all cursor-pointer group"
                      >
                        <img
                          src={sample.url}
                          alt={sample.name}
                          className="w-full h-12 rounded-lg object-cover mb-1 group-hover:scale-105 transition-transform"
                        />
                        <span className="text-[9px] font-bold text-slate-700 block truncate">
                          {sample.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Note Textarea */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  2. Brief Note on Contribution (Optional)
                </label>
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="e.g. Collected 3 sacks of plastic and assisted team with road margin clearance..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0f2d59]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProofModalDrive(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadedPhotoPreview || isSubmittingProof}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-950/20 active:scale-95 cursor-pointer"
                >
                  {isSubmittingProof ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Submit Proof (+100 Pts)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
