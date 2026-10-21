import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Navigation,
  MapPin,
  Clock,
  Route,
  Locate,
  Layers,
  Copy,
  Check,
  Maximize2,
  AlertCircle,
  Car,
} from 'lucide-react';

export interface IssueMapViewProps {
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
  onClose: () => void;
}

interface RouteInfo {
  distanceText: string;
  durationText: string;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
}

const TILE_STYLES = {
  dark: {
    name: 'Dark (Default)',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  positron: {
    name: 'Positron',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
};

/** Default center of India when no coordinates are present */
const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937];
const DEFAULT_ZOOM = 4.8;

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return '< 1 min';
  }
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min${mins > 1 ? 's' : ''}`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hr`;
}

/**
 * Interactive in-app civic map experience powered by MapLibre GL JS.
 * Features dark-matter tiles, pulsing issue & user GPS pins, OSRM live routing,
 * glassmorphic navigation sheet, and smooth motion animations.
 */
export const IssueMapView: React.FC<IssueMapViewProps> = ({
  title,
  address,
  latitude,
  longitude,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const issueMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude);

  const [mapStyleKey, setMapStyleKey] = useState<'dark' | 'positron'>('dark');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);

  // Lock body scroll while map modal is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Request user's geolocation
  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied');
        } else {
          setGeoError('Unable to retrieve your location');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  // Fetch initial location on mount
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Initialize MapLibre instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter: [number, number] = hasCoords ? [longitude!, latitude!] : DEFAULT_CENTER;
    const initialZoom = hasCoords ? 15 : DEFAULT_ZOOM;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: TILE_STYLES[mapStyleKey].url,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 35,
      bearing: 0,
      attributionControl: false,
    });

    // Add minimal navigation control
    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: false,
        visualizePitch: true,
      }),
      'top-right'
    );

    map.on('load', () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [mapStyleKey]);

  // Add or update the Issue Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !hasCoords) return;

    // Remove existing issue marker
    if (issueMarkerRef.current) {
      issueMarkerRef.current.remove();
      issueMarkerRef.current = null;
    }

    // Build custom pulsing red marker element
    const el = document.createElement('div');
    el.className = 'issue-map-pin-wrapper';
    el.innerHTML = `
      <div class="relative flex items-center justify-center cursor-pointer group select-none">
        <span class="absolute w-12 h-12 rounded-full bg-rose-500/35 animate-pulse-ring pointer-events-none"></span>
        <span class="absolute w-7 h-7 rounded-full bg-red-600/50 animate-pulse-ring-delayed pointer-events-none"></span>
        <div class="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-xl border-2 border-white transform transition-transform group-hover:scale-115">
          <svg class="w-5 h-5 fill-none stroke-current stroke-[2.4]" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3" fill="currentColor"></circle>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45 border-r border-b border-white z-0"></div>
      </div>
    `;

    const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
      <div class="p-2 text-slate-900 font-sans max-w-[200px]">
        <div class="text-[10px] font-bold text-red-600 uppercase tracking-wider">Civic Issue</div>
        <div class="text-xs font-bold leading-snug line-clamp-2 mt-0.5">${title}</div>
        <div class="text-[10px] text-slate-500 mt-1">${address}</div>
      </div>
    `);

    const marker = new maplibregl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([longitude!, latitude!])
      .setPopup(popup)
      .addTo(map);

    issueMarkerRef.current = marker;

    return () => {
      marker.remove();
    };
  }, [mapLoaded, hasCoords, latitude, longitude, title, address]);

  // Add or update the User Location Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const userEl = document.createElement('div');
    userEl.className = 'user-map-pin-wrapper';
    userEl.innerHTML = `
      <div class="relative flex items-center justify-center cursor-pointer select-none">
        <span class="absolute w-10 h-10 rounded-full bg-blue-500/40 animate-pulse-ring pointer-events-none"></span>
        <div class="relative z-10 w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></div>
        </div>
      </div>
    `;

    const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
      <div class="px-2 py-1 text-slate-900 font-sans text-xs font-semibold">
        Your current location
      </div>
    `);

    const marker = new maplibregl.Marker({
      element: userEl,
      anchor: 'center',
    })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(popup)
      .addTo(map);

    userMarkerRef.current = marker;

    return () => {
      marker.remove();
    };
  }, [mapLoaded, userLocation]);

  // Fetch route from OSRM and render GeoJSON LineString
  useEffect(() => {
    if (!hasCoords || !userLocation) {
      setRouteInfo(null);
      return;
    }

    const controller = new AbortController();
    setRouteLoading(true);
    setRouteError(null);

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${longitude},${latitude}?overview=full&geometries=geojson`;

    fetch(osrmUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const firstRoute = data.routes[0];
          const coords = firstRoute.geometry?.coordinates as [number, number][];
          setRouteInfo({
            distanceText: formatDistance(firstRoute.distance),
            durationText: formatDuration(firstRoute.duration),
            distanceMeters: firstRoute.distance,
            durationSeconds: firstRoute.duration,
            coordinates: coords,
          });
          setRouteError(null);
        } else {
          setRouteInfo(null);
          setRouteError('No direct driving route found');
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setRouteInfo(null);
        setRouteError('Live route calculation temporarily unavailable');
      })
      .finally(() => {
        setRouteLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [hasCoords, latitude, longitude, userLocation]);

  // Render route layer on MapLibre map and adjust bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const sourceId = 'osrm-route-source';
    const glowLayerId = 'osrm-route-glow';
    const lineLayerId = 'osrm-route-line';

    const removeRouteLayers = () => {
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(glowLayerId)) map.removeLayer(glowLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };

    if (routeInfo && routeInfo.coordinates.length > 0) {
      removeRouteLayers();

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeInfo.coordinates,
          },
        },
      });

      // Glow layer for premium navigation appearance
      map.addLayer({
        id: glowLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 10,
          'line-opacity': 0.35,
          'line-blur': 4,
        },
      });

      // Core crisp route line
      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      });

      // Fit bounds to show entire route + user + issue
      const bounds = new maplibregl.LngLatBounds();
      routeInfo.coordinates.forEach((coord) => bounds.extend(coord));
      if (userLocation) bounds.extend([userLocation.lng, userLocation.lat]);
      if (hasCoords) bounds.extend([longitude!, latitude!]);

      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 280, left: 60, right: 60 },
        maxZoom: 16,
        duration: 900,
      });
    } else if (hasCoords && userLocation) {
      // No route line, but fit both points
      removeRouteLayers();
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([longitude!, latitude!]);
      bounds.extend([userLocation.lng, userLocation.lat]);
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 280, left: 60, right: 60 },
        maxZoom: 15,
        duration: 800,
      });
    } else if (hasCoords) {
      removeRouteLayers();
      map.flyTo({
        center: [longitude!, latitude!],
        zoom: 15,
        duration: 800,
      });
    }

    return () => {
      removeRouteLayers();
    };
  }, [mapLoaded, routeInfo, hasCoords, latitude, longitude, userLocation]);

  // Center on user location
  const handleFlyToUser = () => {
    const map = mapRef.current;
    if (!map) return;
    if (userLocation) {
      map.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16,
        duration: 800,
      });
    } else {
      requestUserLocation();
    }
  };

  // Center on issue location
  const handleFlyToIssue = () => {
    const map = mapRef.current;
    if (!map || !hasCoords) return;
    map.flyTo({
      center: [longitude!, latitude!],
      zoom: 16,
      duration: 800,
    });
  };

  // Fit both markers
  const handleFitRoute = () => {
    const map = mapRef.current;
    if (!map) return;
    if (routeInfo && routeInfo.coordinates.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      routeInfo.coordinates.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 280, left: 60, right: 60 },
        maxZoom: 16,
        duration: 800,
      });
    } else if (hasCoords && userLocation) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([longitude!, latitude!]);
      bounds.extend([userLocation.lng, userLocation.lat]);
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 280, left: 60, right: 60 },
        maxZoom: 15,
        duration: 800,
      });
    } else if (hasCoords) {
      map.flyTo({ center: [longitude!, latitude!], zoom: 15, duration: 600 });
    }
  };

  // Copy GPS Coordinates
  const handleCopyCoords = () => {
    if (!hasCoords) return;
    const str = `${latitude!.toFixed(6)}, ${longitude!.toFixed(6)}`;
    navigator.clipboard?.writeText(str);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // External navigation URL
  const navigationUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-slate-950 font-sans select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Issue Map"
    >
      {/* Inline styles for pulsing markers */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0.95; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pulse-ring-delayed {
          0% { transform: scale(0.5); opacity: 0.8; }
          50% { opacity: 0.45; }
          100% { transform: scale(2.0); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.2, 0.6, 0.35, 1) infinite;
        }
        .animate-pulse-ring-delayed {
          animation: pulse-ring-delayed 2s cubic-bezier(0.2, 0.6, 0.35, 1) infinite 0.5s;
        }
      `}</style>

      {/* TOP FLOATING APP BAR */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3 sm:p-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/15 text-white shadow-xl flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide">Live Issue Map</span>
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">MapLibre</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Toggle Map Tile Style */}
          <button
            type="button"
            onClick={() => setMapStyleKey((prev) => (prev === 'dark' ? 'positron' : 'dark'))}
            className="w-10 h-10 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/15 text-white hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center active:scale-95"
            title={`Switch to ${mapStyleKey === 'dark' ? 'Positron' : 'Dark'} style`}
            aria-label="Toggle map style"
          >
            <Layers className="w-4 h-4 text-sky-400" />
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/15 text-white hover:bg-rose-600 hover:border-rose-500 transition-all shadow-xl flex items-center justify-center active:scale-95"
            title="Close map"
            aria-label="Close interactive map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAP CANVAS CONTAINER */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 relative bg-slate-950" />

      {/* RIGHT FLOATING MAP CONTROLS */}
      <div className="absolute right-3.5 top-20 z-20 flex flex-col gap-2">
        {/* Recenter on Route */}
        <button
          type="button"
          onClick={handleFitRoute}
          className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-[#0f2d59] transition-all shadow-lg flex items-center justify-center active:scale-90"
          title="Fit route and markers"
          aria-label="Fit route"
        >
          <Maximize2 className="w-4 h-4 text-slate-200" />
        </button>

        {/* Locate Me */}
        <button
          type="button"
          onClick={handleFlyToUser}
          className={`w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-[#0f2d59] transition-all shadow-lg flex items-center justify-center active:scale-90 ${
            geoLoading ? 'animate-pulse text-blue-400' : ''
          }`}
          title={userLocation ? 'Fly to your GPS location' : 'Locate my position'}
          aria-label="Locate me"
        >
          <Locate className={`w-4 h-4 ${userLocation ? 'text-blue-400' : 'text-slate-300'}`} />
        </button>

        {/* Focus on Issue Pin */}
        {hasCoords && (
          <button
            type="button"
            onClick={handleFlyToIssue}
            className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-red-600 transition-all shadow-lg flex items-center justify-center active:scale-90"
            title="Focus on issue location"
            aria-label="Focus issue pin"
          >
            <MapPin className="w-4 h-4 text-red-400" />
          </button>
        )}

        {/* Zoom In */}
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-[#0f2d59] transition-all shadow-lg flex items-center justify-center font-bold text-base active:scale-90"
          title="Zoom In"
          aria-label="Zoom In"
        >
          +
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-[#0f2d59] transition-all shadow-lg flex items-center justify-center font-bold text-base active:scale-90"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          −
        </button>
      </div>

      {/* BOTTOM SLIDE-IN NAVIGATION CARD (Ola/Rapido styled) */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="absolute bottom-0 inset-x-0 z-30 pointer-events-auto"
        >
          <div className="w-full max-w-xl mx-auto bg-white/95 backdrop-blur-xl border-t border-x border-white/60 rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-900">
            {/* Grab handle bar */}
            <button
              type="button"
              onClick={() => setIsSheetCollapsed((v) => !v)}
              className="w-full flex items-center justify-center pb-2 focus:outline-hidden"
              aria-label="Toggle details view"
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full transition-colors hover:bg-slate-400" />
            </button>

            {/* ROUTE / ETA BADGE ROW */}
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {routeLoading && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold animate-pulse">
                  <Route className="w-3.5 h-3.5" />
                  <span>Calculating live driving route...</span>
                </div>
              )}

              {routeInfo && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-xs shadow-sm">
                  <Car className="w-3.5 h-3.5" />
                  <span>{routeInfo.distanceText}</span>
                  <span className="opacity-60">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{routeInfo.durationText}</span>
                  </div>
                </div>
              )}

              {routeInfo && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Fastest Route
                </span>
              )}

              {geoError && (
                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>{geoError}</span>
                </div>
              )}

              {!hasCoords && (
                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>No exact GPS coordinate for this report</span>
                </div>
              )}

              {routeError && !routeInfo && hasCoords && (
                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  <Route className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>Direct pin view</span>
                </div>
              )}
            </div>

            {/* TITLE & ADDRESS */}
            <div className="mb-3">
              <h2 className="text-base sm:text-lg font-bold text-[#0f2d59] leading-snug flex items-start gap-2">
                <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{title}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 ml-7 line-clamp-2">
                {address}
              </p>
            </div>

            {/* GPS COORDINATES PILL & ACTIONS (Expandable) */}
            {!isSheetCollapsed && (
              <>
                {hasCoords ? (
                  <div className="flex items-center justify-between bg-slate-100/90 rounded-xl px-3 py-2 mb-3.5 border border-slate-200/80">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                        GPS
                      </span>
                      <span>
                        {latitude!.toFixed(5)}° N, {longitude!.toFixed(5)}° E
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCoords}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#0f2d59] hover:text-blue-600 transition-colors"
                      title="Copy coordinates"
                    >
                      {copiedCoords ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50/80 rounded-xl p-2.5 mb-3.5 border border-amber-200/70 text-xs text-amber-800">
                    Showing approximate location. Use external maps for street-level search.
                  </div>
                )}
              </>
            )}

            {/* PRIMARY & SECONDARY ACTION BUTTONS */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <a
                href={navigationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0f2d59] to-[#1d4e8c] hover:from-[#13376d] hover:to-[#225ba3] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md transition-all"
              >
                <Navigation className="w-4 h-4 text-sky-300" />
                <span>Start Turn-by-Turn</span>
              </a>

              {hasCoords && (
                <button
                  type="button"
                  onClick={handleFitRoute}
                  className="px-3.5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-[#0f2d59] text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5"
                  title="View full route on map"
                >
                  <Route className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Fit Route</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
};
