import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronLeft,
  CloudRain,
  ShieldAlert,
  Calendar,
  MapPin,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Share2,
  Sparkles,
  Camera,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sun,
  Activity,
  Layers,
  CheckSquare,
  Square,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PREDICTIVE_ALERTS } from '../mockData/predictiveAlertsData';
import { AlertSeason, PredictiveAlert } from '../types';

export const PredictiveAlertsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserProfile, addToast } = useApp();

  const [selectedSeason, setSelectedSeason] = useState<AlertSeason | 'All'>('Monsoon');
  // Default first high probability alert expanded
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>('alert-monsoon-drain');
  const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('praja_predictive_checklist');
    return saved ? JSON.parse(saved) : {};
  });

  // Street Risk Checker interactive state
  const [searchStreet, setSearchStreet] = useState('');
  const [streetSimulationResult, setStreetSimulationResult] = useState<{
    zone: string;
    riskLevel: 'High' | 'Moderate' | 'Low';
    probability: number;
    predictedHazard: string;
    actionRequired: string;
  } | null>(null);

  const seasonsList: { label: string; value: AlertSeason | 'All'; icon: React.ReactNode }[] = [
    { label: 'Upcoming Monsoon', value: 'Monsoon', icon: <CloudRain className="w-3.5 h-3.5" /> },
    { label: 'Next 30 Days', value: 'Immediate (30-day)', icon: <Activity className="w-3.5 h-3.5" /> },
    { label: 'Post-Monsoon', value: 'Post-Monsoon', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { label: 'Peak Summer', value: 'Summer', icon: <Sun className="w-3.5 h-3.5" /> },
    { label: 'All Forecasts', value: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  // Sort by probability descending (highest probability upcoming hazards first)
  const filteredAlerts = PREDICTIVE_ALERTS
    .filter((alert) => {
      if (selectedSeason === 'All') return true;
      return alert.season === selectedSeason;
    })
    .sort((a, b) => b.probability - a.probability);

  const toggleChecklistItem = (item: { id: string; text: string }) => {
    const isNowDone = !completedChecklist[item.id];
    const updated = { ...completedChecklist, [item.id]: isNowDone };
    setCompletedChecklist(updated);
    localStorage.setItem('praja_predictive_checklist', JSON.stringify(updated));

    if (isNowDone) {
      addToast('Task Completed', 'Preventative precaution marked as done.', 'info');
    } else {
      addToast('Task Unmarked', undefined, 'info');
    }
  };

  const handleShare = (alert: PredictiveAlert) => {
    const shareText = `⚠️ CIVIC ALERT - PREDICTIVE HAZARD REPORT [${alert.seasonLabel.toUpperCase()}]\n\n🚨 Predicted Hazard: ${alert.title}\n📍 Affected Areas: ${alert.affectedZones.join(', ')}\n📊 AI Forecast Probability: ${alert.probability}%\n\n🛡️ HOW RESIDENTS CAN PREVENT THIS:\n${alert.citizenSolutions.map((s, idx) => `${idx + 1}. ${s.title}: ${s.actionableStep}`).join('\n')}\n\nEmergency Helpline: ${alert.helpline}\nIssued by BBMP Ward 112 Predictive Intelligence Portal.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      addToast('Alert Copied to Clipboard!', 'Share with your RWA or neighborhood WhatsApp group.', 'success');
    }
  };

  const handleStreetCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchStreet.trim()) return;

    const term = searchStreet.toLowerCase();
    let result = {
      zone: searchStreet,
      riskLevel: 'Moderate' as 'High' | 'Moderate' | 'Low',
      probability: 72,
      predictedHazard: 'Localized runoff ponding & gutter leaf blockages',
      actionRequired: 'Ensure balcony & terrace drain mouths have mesh wire filters installed.',
    };

    if (term.includes('100ft') || term.includes('underpass') || term.includes('4th cross') || term.includes('low')) {
      result = {
        zone: searchStreet,
        riskLevel: 'High',
        probability: 91,
        predictedHazard: 'Severe stormwater drain backflow & basement inundation during heavy downpours',
        actionRequired: 'Inspect and elevate sump lids above driveway grade; install non-return flap valves in basement outlets.',
      };
    } else if (term.includes('main') || term.includes('defense') || term.includes('hal') || term.includes('tree')) {
      result = {
        zone: searchStreet,
        riskLevel: 'High',
        probability: 78,
        predictedHazard: 'Overhead 11kV electrical wire contact with brittle canopy tree branches in squall gusts',
        actionRequired: 'Check for leaning or hollow branches; report overhangs to BESCOM (1912) before storms.',
      };
    } else if (term.includes('road') || term.includes('metro') || term.includes('cmh')) {
      result = {
        zone: searchStreet,
        riskLevel: 'Moderate',
        probability: 88,
        predictedHazard: 'Sub-base settling in recently backfilled utility cable trenches forming potholes',
        actionRequired: 'Drive with caution during initial drizzle; log uncompacted trenches via Praja portal.',
      };
    }

    setStreetSimulationResult(result);
  };

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-12 space-y-4 max-w-2xl mx-auto w-full select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0f2d59] hover:underline cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Back to Menu</span>
        </button>
        <span className="text-[11px] font-black uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          High Probability Hazards
        </span>
      </div>

      {/* Main Hero Banner: Upcoming Hazards & Prevention Overview */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#7f1d1d] via-[#9a3412] to-[#0f2d59] text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-white/10">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -top-8 w-32 h-32 bg-red-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs text-amber-200 px-2.5 py-0.5 rounded-full border border-white/10">
              <Sparkles className="w-3 h-3" />
              Ward 112 Predictive Intelligence
            </span>
            <span className="text-[11px] font-medium text-amber-100">
              Early Warning & Citizen Action Guide
            </span>
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
              Upcoming Hazards & How to Prevent Them
            </h1>
            <p className="text-xs text-slate-100/90 mt-1 leading-relaxed">
              Civic problems with highest probability of occurrence in the upcoming season, why they will happen, and actionable prevention methods for citizens.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 text-center">
              <span className="text-[9.5px] uppercase font-bold text-amber-200 block">Upcoming Season</span>
              <span className="text-xs sm:text-sm font-extrabold text-white block mt-0.5">🌧️ Monsoon</span>
              <span className="text-[9px] text-slate-200">Onset in ~42 days</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 text-center">
              <span className="text-[9.5px] uppercase font-bold text-amber-200 block">Highest Threat</span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-300 block mt-0.5">Waterlogging</span>
              <span className="text-[9px] text-red-200 font-bold">91% Probability</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 text-center">
              <span className="text-[9.5px] uppercase font-bold text-amber-200 block">Prevention Guide</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-300 block mt-0.5">Actionable</span>
              <span className="text-[9px] text-slate-200">Action Guide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Street / Location Risk Checker */}
      <div className="bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0f2d59] flex items-center justify-center font-bold">
            <Search className="w-4 h-4 text-[#0f2d59]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#0f172a]">
              Check Next Season Hazard for Your Street
            </h3>
            <p className="text-[11px] text-[#64748b]">
              Simulate AI hazard probability for your specific road or layout.
            </p>
          </div>
        </div>

        <form onSubmit={handleStreetCheck} className="flex gap-2">
          <input
            type="text"
            value={searchStreet}
            onChange={(e) => setSearchStreet(e.target.value)}
            placeholder="e.g. 100ft Road, 4th Cross, Defense Colony..."
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2d59] dark:focus:ring-blue-500 bg-[#f8fafc] dark:bg-slate-800 text-[#0f172a] dark:text-white dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#0f2d59] hover:bg-[#1d4e8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Assess Risk
          </button>
        </form>

        {streetSimulationResult && (
          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0f172a] dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                {streetSimulationResult.zone}
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  streetSimulationResult.riskLevel === 'High'
                    ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {streetSimulationResult.probability}% Probability ({streetSimulationResult.riskLevel} Risk)
              </span>
            </div>
            <p className="text-xs text-[#0f172a] dark:text-slate-200">
              <strong>Predicted Hazard:</strong> {streetSimulationResult.predictedHazard}
            </p>
            <p className="text-xs text-amber-900 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/60">
              <strong>💡 How to Prevent It:</strong> {streetSimulationResult.actionRequired}
            </p>
          </div>
        )}
      </div>

      {/* Season Timeline Filter Tabs */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B] dark:text-slate-400 px-1 block">
          Forecast Seasons & Timelines
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {seasonsList.map((season) => (
            <button
              key={season.value}
              type="button"
              onClick={() => setSelectedSeason(season.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSeason === season.value
                  ? 'bg-[#0f2d59] dark:bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-[#cbd5e1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {season.icon}
              <span>{season.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Predictive Hazard Cards List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;

          const severityBadgeColor =
            alert.severity === 'Critical'
              ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60'
              : alert.severity === 'High'
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';

          return (
            <div
              key={alert.id}
              className="bg-white dark:bg-[#111c2e] rounded-3xl border border-[#cbd5e1] dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-300"
            >
              {/* Top Accent Strip */}
              <div
                className={`h-1.5 w-full ${
                  alert.severity === 'Critical'
                    ? 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-500'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                }`}
              />

              {/* Card Header & Preview */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${severityBadgeColor} flex items-center gap-1.5`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          alert.severity === 'Critical' ? 'bg-red-600 animate-ping' : 'bg-amber-600'
                        }`}
                      />
                      {alert.probability}% High Probability
                    </span>
                    <span className="text-[10px] font-bold text-[#64748b] dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {alert.category}
                    </span>
                  </div>

                  <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Expected in {alert.daysAway} days ({alert.season})
                  </span>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white leading-tight">
                    {alert.title}
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-slate-300 mt-1.5 leading-relaxed">
                    {alert.problemDescription}
                  </p>
                </div>

                {/* Probability Meter & Timeline Pill */}
                <div className="bg-[#f8fafc] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0f172a] dark:text-white flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      AI Predictive Probability Score
                    </span>
                    <span className="font-extrabold text-[#0f2d59] dark:text-blue-300">{alert.probability}% Likelihood</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        alert.probability >= 85
                          ? 'bg-gradient-to-r from-orange-500 to-red-600'
                          : 'bg-gradient-to-r from-amber-400 to-orange-500'
                      }`}
                      style={{ width: `${alert.probability}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#64748b] dark:text-slate-400 italic pt-0.5">
                    {alert.historicalPrecedent}
                  </p>
                </div>

                {/* Affected Zones Tags */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748b] dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" />
                    Vulnerable Hotspots in Ward 112
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {alert.affectedZones.map((zone, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold text-[#0f2d59] dark:text-blue-300 bg-[#eff6ff] dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/60 px-2 py-0.5 rounded-lg"
                      >
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expand / Collapse Button */}
                <button
                  type="button"
                  onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                  className="w-full flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-[#0f2d59] dark:text-blue-300 hover:text-[#1d4e8c] dark:hover:text-blue-200 transition-colors cursor-pointer"
                >
                  <span className="text-[#9a3412] dark:text-amber-400 font-black">
                    {isExpanded ? 'Hide Prevention Guide' : '👉 View Problems Faced & How to Prevent Them'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#9a3412] dark:text-amber-400" /> : <ChevronDown className="w-4 h-4 text-[#9a3412] dark:text-amber-400" />}
                </button>
              </div>

              {/* Detailed Expandable Section */}
              {isExpanded && (
                <div className="bg-[#f8fafc] dark:bg-[#0c1524] border-t border-[#cbd5e1] dark:border-slate-800 p-4 sm:p-5 space-y-5 animate-fadeIn">
                  {/* 1. Impact on People: Problems People Are Going to Face */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-red-800 dark:text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      Problems People Are Going to Face (Expected Hazard Impact)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {alert.citizenImpact.map((impact, i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-[#152238] p-2.5 rounded-xl border border-red-100 dark:border-red-950/80 shadow-2xs flex items-start gap-2"
                        >
                          <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-xs text-[#0f172a] dark:text-slate-200 leading-tight">{impact}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Solutions & Methods to Prevent for Citizens */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Solutions & Methods to Prevent (Citizen Action Guide)
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                        Household Pre-Emptive Steps
                      </span>
                    </div>

                    <div className="space-y-2">
                      {alert.citizenSolutions.map((sol, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-[#152238] p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#0f172a] dark:text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {sol.title}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-transparent dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                              Prevention Method #{idx + 1}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed">
                            {sol.description}
                          </p>
                          <div className="bg-emerald-50/60 dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-200/50 dark:border-emerald-800/60 flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                            <span>👉 Action to Take:</span>
                            <span className="text-[#0f172a] dark:text-emerald-100 font-medium">{sol.actionableStep}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Household Prevention Checklist */}
                  <div className="bg-white dark:bg-[#152238] p-3.5 rounded-2xl border border-[#cbd5e1] dark:border-slate-700 space-y-2.5">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#0f2d59] dark:text-blue-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0f2d59] dark:text-blue-300" />
                        Household Prevention Checklist
                      </h4>
                      <p className="text-[11px] text-[#64748b] dark:text-slate-400">
                        Check off completed preventive tasks to safeguard your property and home.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      {alert.checklist.map((item) => {
                        const isDone = !!completedChecklist[item.id];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleChecklistItem(item)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isDone
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-[#0f172a] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span
                                className={`text-xs ${
                                  isDone ? 'line-through text-emerald-800 dark:text-emerald-300 font-medium' : 'font-semibold'
                                }`}
                              >
                                {item.text}
                              </span>
                            </div>

                            {isDone && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
                                Completed
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Municipal Pre-Emptive Mitigation Plan */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Municipal Authority Mitigation & Pre-Season Action
                    </h4>
                    <div className="space-y-1.5">
                      {alert.municipalMitigation.map((m, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-[#152238] p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-extrabold text-[#0f2d59] dark:text-blue-300 block text-[11px]">
                              {m.department}
                            </span>
                            <span className="text-[#475569] dark:text-slate-300 text-xs block leading-tight">
                              {m.plan}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                                m.status === 'In Progress'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200'
                                  : 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200'
                              }`}
                            >
                              {m.status}
                            </span>
                            <span className="text-[9px] text-[#64748b] dark:text-slate-400 block mt-0.5">
                              Due: {m.targetDate}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Action Buttons: Proactive Reporting & Share Notice */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/create-report', {
                          state: {
                            prefillCategory: alert.category,
                            prefillTitle: `Pre-Season Hazard: ${alert.title}`,
                          },
                        })
                      }
                      className="flex-1 flex items-center justify-center gap-2 bg-[#0f2d59] hover:bg-[#1d4e8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-2.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                    >
                      <Camera className="w-4 h-4 text-amber-300" />
                      <span>Report Vulnerability Before It Strikes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShare(alert)}
                      className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0f2d59] dark:text-white py-2.5 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Share Alert with Neighbors</span>
                    </button>
                  </div>

                  {/* Helpline Footnote */}
                  <div className="bg-slate-100/90 dark:bg-slate-800/90 rounded-xl p-2 text-center text-[11px] text-[#475569] dark:text-slate-300 font-medium flex items-center justify-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{alert.helpline}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 24x7 Ward Emergency Support Hub */}
      <div className="bg-gradient-to-r from-slate-900 to-[#0f2d59] text-white rounded-3xl p-4 sm:p-5 space-y-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-300 flex items-center justify-center">
            <PhoneCall className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Emergency & Early Warning Helpline Directory
            </h3>
            <p className="text-[11px] text-slate-300">
              Ward 112 Control Room & Disaster Management Rapid Response.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">Flood & Drain Cell</span>
            <span className="font-extrabold text-amber-300 text-sm">080-22221188</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">BESCOM Power Outage</span>
            <span className="font-extrabold text-amber-300 text-sm">1912</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">BWSSB Water Contamination</span>
            <span className="font-extrabold text-amber-300 text-sm">1916</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">Dengue / Vector Officer</span>
            <span className="font-extrabold text-amber-300 text-sm">080-22975800</span>
          </div>
        </div>
      </div>
    </div>
  );
};
