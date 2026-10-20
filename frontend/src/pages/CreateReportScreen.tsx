import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  Sparkles,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Info,
  X,
  Compass,
  Navigation,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CivicCategory, IssuePriority } from '../types';
import { MapPickerModal } from '../components/report/MapPickerModal';
import { improveDescription } from '../lib/api';

export const CreateReportScreen: React.FC = () => {
  const navigate = useNavigate();
  const { createReport, user, addToast } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CivicCategory>('Roads');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('High');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  // Location fields
  const [addressText, setAddressText] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setImagesList((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (idxToRemove: number) => {
    setImagesList((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleGenerateAIDescription = async () => {
    const rawText = description.trim() || title.trim();
    if (!rawText) {
      addToast('Input Needed', 'Please enter a rough description or title first, then tap "Draft with AI" to polish it.', 'info');
      return;
    }
    setIsAiDrafting(true);
    try {
      const improved = await improveDescription(rawText);
      setDescription(improved);
      addToast('AI Draft Ready', 'Your description has been polished by AI.', 'success');
    } catch (error) {
      addToast('AI Unavailable', error instanceof Error ? error.message : 'Could not reach the AI service. Please try again.', 'info');
    } finally {
      setIsAiDrafting(false);
    }
  };

  // Acquire current GPS location
  const handleAcquireGps = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation Unavailable', 'Your browser does not support GPS location.', 'info');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setPinnedCoords(null);
        addToast(
          'GPS Location Acquired',
          `Tagged at ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E (±${Math.round(accuracy)}m accuracy)`,
          'success'
        );
      },
      (error) => {
        setIsLocatingGps(false);
        // Fallback default coordinates for demonstration
        const defaultLat = 12.9716;
        const defaultLng = 77.5946;
        setGpsCoords({ lat: defaultLat, lng: defaultLng });
        addToast(
          'Location Tagged',
          'Using current ward coordinates: Indiranagar Ward 112 (12.9716°N, 77.5946°E)',
          'info'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle map pin confirmation
  const handleMapPinConfirmed = (coords: { lat: number; lng: number; address: string }) => {
    setPinnedCoords({ lat: coords.lat, lng: coords.lng });
    setGpsCoords(null);
    if (!addressText.trim()) {
      setAddressText(coords.address);
    }
    addToast('Location Marked on Map', coords.address, 'success');
  };

  // Check if at least one location method is provided (Compulsory validation)
  const hasValidLocation = Boolean(
    addressText.trim().length >= 3 ||
    gpsCoords !== null ||
    pinnedCoords !== null
  );

  const getEffectiveLocalityString = () => {
    if (addressText.trim()) {
      return addressText.trim();
    }
    if (pinnedCoords) {
      return `Pinned on Map (${pinnedCoords.lat.toFixed(4)}°N, ${pinnedCoords.lng.toFixed(4)}°E) · Ward 112`;
    }
    if (gpsCoords) {
      return `GPS Verified (${gpsCoords.lat.toFixed(4)}°N, ${gpsCoords.lng.toFixed(4)}°E) · Ward 112`;
    }
    return `${user.neighborhood} · ${user.wardNumber}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      addToast('Missing Information', 'Please provide a title and description.', 'info');
      return;
    }

    if (!hasValidLocation) {
      addToast('Location Required', 'Please provide an address, use GPS, or mark the location on the map.', 'info');
      return;
    }

    setIsSubmitting(true);

    const coords = pinnedCoords || gpsCoords;
    const reportId = await createReport({
      title: title.trim(),
      category,
      description: description.trim(),
      locality: getEffectiveLocalityString(),
      priority,
      images: imagesList.length > 0 ? imagesList : undefined,
      latitude: coords?.lat,
      longitude: coords?.lng,
    });

    setIsSubmitting(false);
    if (reportId) setSubmittedReportId(reportId);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-28">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-3">
        <div>
          <h1 className="text-lg font-black text-[#0f172a] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#ea580c]" />
            <span>Report a Civic Grievance</span>
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Log an issue directly to {user.wardNumber} engineering control room
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Photo Upload (Real Camera / File upload) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#0f172a]">
              Problem Evidence Photos
            </label>
            <span className="text-[11px] text-[#64748b]">
              {imagesList.length} photo(s) selected
            </span>
          </div>

          {imagesList.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {imagesList.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-xl overflow-hidden border border-[#cbd5e1] bg-slate-100 group"
                  >
                    <img
                      src={imgUrl}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f2d59] hover:text-[#1d4e8c] cursor-pointer bg-[#eff6ff] px-3 py-1.5 rounded-xl border border-blue-200">
                <Upload className="w-3.5 h-3.5" />
                <span>Add more photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="border-2 border-dashed border-[#cbd5e1] dark:border-slate-700 hover:border-[#0f2d59] dark:hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#f8fafc] dark:bg-slate-800/60 text-center group">
                <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] dark:bg-blue-950/60 text-[#0f2d59] dark:text-blue-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <Camera className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-xs font-extrabold text-[#0f172a] dark:text-white">
                  Take a photo or upload from device
                </span>
                <span className="text-[11px] text-[#64748b] dark:text-slate-400 mt-0.5">
                  Tap to capture on-site evidence (JPG, PNG)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* 2. Category Selector */}
        <div>
          <label className="text-xs font-bold text-[#0f172a] dark:text-white block mb-1.5">
            Category
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                'Roads',
                'Water',
                'Sanitation',
                'Streetlights',
                'Public Safety',
                'Parks',
              ] as CivicCategory[]
            ).map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all truncate text-center cursor-pointer ${
                  category === cat
                    ? 'bg-[#0f2d59] dark:bg-blue-600 text-white border-[#0f2d59] dark:border-blue-600 shadow-xs font-bold'
                    : 'bg-[#f8fafc] dark:bg-slate-800 text-[#0f172a] dark:text-slate-200 border-[#cbd5e1] dark:border-slate-700 hover:border-[#0f2d59]/40 dark:hover:border-blue-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Issue Title */}
        <div>
          <label className="text-xs font-bold text-[#0f172a] dark:text-white block mb-1">
            Issue Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep pothole on 100ft road near 12th main"
            className="w-full text-xs bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0f2d59] dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 text-[#0f172a] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* 4. Problem Description + AI Generator button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-[#0f172a] dark:text-white">
              Problem Description
            </label>
            <button
              type="button"
              onClick={handleGenerateAIDescription}
              disabled={isAiDrafting}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f2d59] dark:text-blue-300 hover:text-[#1d4e8c] bg-[#eff6ff] dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-transparent dark:border-blue-900/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAiDrafting ? (
                <>
                  <span className="w-3 h-3 border-2 border-[#0f2d59] border-t-transparent rounded-full animate-spin" />
                  <span>Drafting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-[#0f2d59] dark:text-blue-300" />
                  <span>Draft with AI</span>
                </>
              )}
            </button>
          </div>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue, hazards, or urgency so ward teams can act swiftly..."
            className="w-full text-xs bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#0f2d59] dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 text-[#0f172a] dark:text-white dark:placeholder:text-slate-500 leading-relaxed"
          />
        </div>

        {/* 5. Locality & Map Location (COMPULSORY: Address, GPS, or Map Pin) */}
        <div className="space-y-2.5 p-3.5 bg-slate-50/80 dark:bg-[#131c2e] rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-[#0f172a] dark:text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#ea580c]" />
              <span>Location Identification</span>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-1.5 py-0.2 rounded-md">
                Compulsory
              </span>
            </label>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Add at least one: enter the street address, tag your current location, or mark it on the map.
          </p>

          {/* Option A: Text Address Input */}
          <div className="relative">
            <input
              type="text"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="1. Enter street address or landmark (e.g. 100ft Road, Indiranagar)"
              className="w-full text-xs bg-white dark:bg-slate-800/90 border border-[#cbd5e1] dark:border-slate-700 rounded-xl pl-3.5 pr-3 py-2.5 focus:outline-none focus:border-[#0f2d59] dark:focus:border-blue-400 text-[#0f172a] dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Option B & C Buttons: Current GPS & Mark on Map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            {/* GPS Button */}
            <button
              type="button"
              onClick={handleAcquireGps}
              disabled={isLocatingGps}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                gpsCoords
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-800 text-[#0f2d59] dark:text-blue-300 border-slate-300 dark:border-slate-700 hover:bg-[#eff6ff] dark:hover:bg-slate-700 active:scale-98'
              }`}
            >
              {isLocatingGps ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#0f2d59] dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Acquiring GPS...</span>
                </>
              ) : gpsCoords ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  <span>GPS Attached ({gpsCoords.lat.toFixed(3)}, {gpsCoords.lng.toFixed(3)})</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 text-[#ea580c]" />
                  <span>Use Current Location</span>
                </>
              )}
            </button>

            {/* Mark on Map Button */}
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                pinnedCoords
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 text-[#0f2d59] dark:text-blue-300 border-slate-300 dark:border-slate-700 hover:bg-[#eff6ff] dark:hover:bg-slate-700 active:scale-98'
              }`}
            >
              {pinnedCoords ? (
                <>
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[3]" />
                  <span>Pinned on Map ({pinnedCoords.lat.toFixed(3)}, {pinnedCoords.lng.toFixed(3)})</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-[#0f2d59] dark:text-blue-300" />
                  <span>Mark Location on Map</span>
                </>
              )}
            </button>
          </div>

          {/* Validation Status Indicator */}
          <div className="pt-1">
            {hasValidLocation ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">
                  Location Verified: {getEffectiveLocalityString()}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/50 p-2 rounded-xl border border-rose-200 dark:border-rose-900/60">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>
                  Please enter an address, tap "Use Current Location", or mark on map.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 6. Severity / Priority Selector */}
        <div>
          <label className="text-xs font-bold text-[#0f172a] dark:text-white block mb-1.5">
            Severity Level
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['Low', 'Medium', 'High', 'Urgent'] as IssuePriority[]).map((lvl) => (
              <button
                type="button"
                key={lvl}
                onClick={() => setPriority(lvl)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                  priority === lvl
                    ? lvl === 'Urgent'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                      : 'bg-[#0f2d59] dark:bg-blue-600 text-white border-[#0f2d59] dark:border-blue-600 shadow-xs'
                    : 'bg-[#f8fafc] dark:bg-slate-800 text-[#64748b] dark:text-slate-300 border-[#cbd5e1] dark:border-slate-700 hover:border-[#0f2d59]/40 dark:hover:border-blue-400'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Points Policy Info Callout */}
        <div className="p-3 rounded-2xl bg-[#eff6ff]/70 dark:bg-blue-950/40 border border-[#1d4e8c]/20 dark:border-blue-800/50 flex items-start gap-2.5 text-[11px] text-[#0f2d59] dark:text-blue-200">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0f2d59] dark:text-blue-300" />
          <p className="leading-snug">
            Your grievance routes directly to the Ward 112 Engineering Desk. <strong>+50 reward points</strong> will be awarded to your profile once this problem is resolved.
          </p>
        </div>

        {/* Submit Report Button */}
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !description.trim() || !hasValidLocation}
          className="w-full py-3.5 rounded-2xl bg-[#0f2d59] hover:bg-[#1d4e8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-[#0f2d59]/20 dark:shadow-blue-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Routing Report to Ward Desk...</span>
            </div>
          ) : (
            <>
              <span>Submit Civic Report</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Map Picker Modal */}
      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleMapPinConfirmed}
        initialCoords={gpsCoords || pinnedCoords || undefined}
      />

      {/* Success Modal / State */}
      {submittedReportId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#111c2e] rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            <div className="w-16 h-16 rounded-3xl bg-[#eff6ff] dark:bg-blue-950/60 text-[#0f2d59] dark:text-blue-300 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f2d59] dark:text-blue-400">
                Report Logged Successfully
              </span>
              <h3 className="text-lg font-bold text-[#0f172a] dark:text-white mt-0.5">
                Ward Dispatch Triggered!
              </h3>
              <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">
                Your report has been assigned reference ID:
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-[#f8fafc] dark:bg-slate-800 rounded-xl border border-[#cbd5e1] dark:border-slate-700 font-mono text-xs font-bold text-[#0f2d59] dark:text-blue-300">
                #{submittedReportId.toUpperCase()}
              </div>
            </div>

            {/* Resolution Points Policy Notification */}
            <div className="p-3 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950/60 text-slate-800 dark:text-slate-100 rounded-2xl flex items-center justify-start gap-2.5 border border-blue-200 dark:border-blue-900/60 text-left">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span className="text-[11px] font-extrabold text-[#0f2d59] dark:text-blue-200 block leading-tight">
                  +50 Reward Points Pending
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 block leading-tight mt-0.5">
                  Points will be credited directly to your profile once this grievance is verified and resolved by authorities!
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#64748b] dark:text-slate-400">
              Your issue is now live on the citizen feed for neighborhood upvoting and municipal tracking.
            </p>

            <button
              onClick={() => {
                setSubmittedReportId(null);
                navigate('/home');
              }}
              className="w-full py-3 bg-[#0f2d59] hover:bg-[#1d4e8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Go to Civic Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
