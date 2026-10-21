import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  coordinates: [number, number][]; // [lng, lat] from OSRM GeoJSON
}

type TileStyleKey = 'dark' | 'osm';

interface TileStyleConfig {
  name: string;
  url: string;
  subdomains?: string;
  attribution: string;
  maxZoom: number;
}

const TILE_STYLES: Record<TileStyleKey, TileStyleConfig> = {
  dark: {
    name: 'Dark Matter (Ola Style)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  osm: {
    name: 'OpenStreetMap (Standard)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

/** Default center of India when no coordinates are present */
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // [lat, lng] for Leaflet
const DEFAULT_ZOOM = 5;

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
 * Interactive in-app civic map experience powered by OpenStreetMap / Leaflet.
 * Works 100% reliably in every browser (no WebGL requirement).
 * Features dark Ola/Rapido raster tiles, pulsing issue & user GPS pins,
 * OSRM live driving route, glassmorphic navigation sheet, and smooth animations.
 */
export const IssueMapView: React.FC<IssueMapViewProps> = ({
  title,
  address,
  latitude,
  longitude,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const issueMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLayersRef = useRef<L.Polyline[]>([]);

  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  const [mapStyleKey, setMapStyleKey] = useState<TileStyleKey>('dark');
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

  // Request user's GPS geolocation
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

  // Fetch initial user location on mount
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Initialize Leaflet Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter: [number, number] = hasCoords ? [latitude!, longitude!] : DEFAULT_CENTER;
    const initialZoom = hasCoords ? 15 : DEFAULT_ZOOM;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
    });

    const activeConfig = TILE_STYLES[mapStyleKey];
    const tileLayer = L.tileLayer(activeConfig.url, {
      subdomains: activeConfig.subdomains || 'abc',
      maxZoom: activeConfig.maxZoom,
      attribution: activeConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;
    setMapLoaded(true);

    // Invalidate size after layout settles to guarantee full-canvas rendering
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Switch tile layer when style key changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const activeConfig = TILE_STYLES[mapStyleKey];
    const newLayer = L.tileLayer(activeConfig.url, {
      subdomains: activeConfig.subdomains || 'abc',
      maxZoom: activeConfig.maxZoom,
      attribution: activeConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapStyleKey, mapLoaded]);

  // Add or update the Issue Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !hasCoords) return;

    if (issueMarkerRef.current) {
      map.removeLayer(issueMarkerRef.current);
      issueMarkerRef.current = null;
    }

    const issueIcon = L.divIcon({
      className: 'issue-leaflet-marker',
      html: `
        <div style="position: relative; width: 44px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
          <span class="animate-pulse-ring" style="position: absolute; width: 48px; height: 48px; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); pointer-events: none;"></span>
          <span class="animate-pulse-ring-delayed" style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(220, 38, 38, 0.5); pointer-events: none;"></span>
          <div style="position: relative; z-index: 10; width: 36px; height: 36px; border-radius: 9999px; background: linear-gradient(135deg, #dc2626, #f43f5e); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4); border: 2.5px solid white;">
            <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3" fill="currentColor"></circle>
            </svg>
          </div>
          <div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background: #dc2626; border-right: 1.5px solid white; border-bottom: 1.5px solid white; z-index: 5;"></div>
        </div>
      `,
      iconSize: [44, 48],
      iconAnchor: [22, 46],
      popupAnchor: [0, -44],
    });

    const marker = L.marker([latitude!, longitude!], { icon: issueIcon })
      .bindPopup(`
        <div style="padding: 4px; font-family: sans-serif; max-width: 200px; color: #0f172a;">
          <div style="font-size: 10px; font-weight: bold; color: #dc2626; text-transform: uppercase; letter-spacing: 0.05em;">Civic Issue</div>
          <div style="font-size: 12px; font-weight: bold; margin-top: 2px; line-height: 1.3;">${title}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">${address}</div>
        </div>
      `)
      .addTo(map);

    issueMarkerRef.current = marker;

    return () => {
      if (issueMarkerRef.current) {
        map.removeLayer(issueMarkerRef.current);
        issueMarkerRef.current = null;
      }
    };
  }, [mapLoaded, hasCoords, latitude, longitude, title, address]);

  // Add or update the User Location Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !userLocation) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    const userIcon = L.divIcon({
      className: 'user-leaflet-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <span class="animate-pulse-ring" style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(59, 130, 246, 0.45); pointer-events: none;"></span>
          <div style="position: relative; z-index: 10; width: 22px; height: 22px; border-radius: 9999px; background: linear-gradient(135deg, #2563eb, #38bdf8); border: 2.5px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 9999px; background: white;"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .bindPopup(`
        <div style="padding: 4px; font-family: sans-serif; font-size: 11px; font-weight: bold; color: #0f172a;">
          Your current GPS location
        </div>
      `)
      .addTo(map);

    userMarkerRef.current = marker;

    return () => {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    };
  }, [mapLoaded, userLocation]);

  // Fetch driving route from OSRM Directions API
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

  // Render Route Polyline on Leaflet and adjust map view
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear previous route polylines
    routeLayersRef.current.forEach((layer) => {
      map.removeLayer(layer);
    });
    routeLayersRef.current = [];

    if (routeInfo && routeInfo.coordinates.length > 0) {
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      const latLngs = routeInfo.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );

      // Glow polyline
      const glow = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 10,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Core route polyline
      const line = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routeLayersRef.current = [glow, line];

      // Auto-fit bounds with padding
      map.fitBounds(line.getBounds(), {
        paddingTopLeft: [40, 90],
        paddingBottomRight: [40, 290],
        maxZoom: 16,
      });
    } else if (hasCoords && userLocation) {
      const bounds = L.latLngBounds([
        [latitude!, longitude!],
        [userLocation.lat, userLocation.lng],
      ]);
      map.fitBounds(bounds, {
        paddingTopLeft: [40, 90],
        paddingBottomRight: [40, 290],
        maxZoom: 15,
      });
    } else if (hasCoords) {
      map.setView([latitude!, longitude!], 15);
    }
  }, [mapLoaded, routeInfo, hasCoords, latitude, longitude, userLocation]);

  // Center on user GPS position
  const handleFlyToUser = () => {
    const map = mapRef.current;
    if (!map) return;
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 0.8 });
    } else {
      requestUserLocation();
    }
  };

  // Center on issue location
  const handleFlyToIssue = () => {
    const map = mapRef.current;
    if (!map || !hasCoords) return;
    map.flyTo([latitude!, longitude!], 16, { duration: 0.8 });
  };

  // Fit both markers & route
  const handleFitRoute = () => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayersRef.current.length > 0) {
      const line = routeLayersRef.current[routeLayersRef.current.length - 1];
      map.fitBounds(line.getBounds(), {
        paddingTopLeft: [40, 90],
        paddingBottomRight: [40, 290],
        maxZoom: 16,
      });
    } else if (hasCoords && userLocation) {
      const bounds = L.latLngBounds([
        [latitude!, longitude!],
        [userLocation.lat, userLocation.lng],
      ]);
      map.fitBounds(bounds, {
        paddingTopLeft: [40, 90],
        paddingBottomRight: [40, 290],
        maxZoom: 15,
      });
    } else if (hasCoords) {
      map.setView([latitude!, longitude!], 15);
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

  // External turn-by-turn navigation URL
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
          100% { transform: scale(2.4); opacity: 0; }
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
        .issue-leaflet-marker, .user-leaflet-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      {/* TOP FLOATING APP BAR */}
      <header className="absolute top-0 inset-x-0 z-[1000] flex items-center justify-between p-3 sm:p-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/15 text-white shadow-xl flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide">Live Issue Map</span>
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
              {mapStyleKey === 'dark' ? 'Ola Dark' : 'OpenStreetMap'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Toggle Map Tile Style */}
          <button
            type="button"
            onClick={() => setMapStyleKey((prev) => (prev === 'dark' ? 'osm' : 'dark'))}
            className="w-10 h-10 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center active:scale-95 cursor-pointer"
            title={`Switch to ${mapStyleKey === 'dark' ? 'OpenStreetMap' : 'Dark Matter'} style`}
            aria-label="Toggle map style"
          >
            <Layers className="w-4 h-4 text-sky-400" />
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-rose-600 hover:border-rose-500 transition-all shadow-xl flex items-center justify-center active:scale-95 cursor-pointer"
            title="Close map"
            aria-label="Close interactive map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAP CANVAS CONTAINER */}
      <div
        ref={mapContainerRef}
        className="w-full h-full flex-1 relative bg-slate-950 z-0"
        style={{ minHeight: '100%' }}
      />

      {/* RIGHT FLOATING MAP CONTROLS */}
      <div className="absolute right-3.5 top-20 z-[1000] flex flex-col gap-2">
        {/* Recenter on Route */}
        <button
          type="button"
          onClick={handleFitRoute}
          className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-[#0f2d59] transition-all shadow-lg flex items-center justify-center active:scale-90 cursor-pointer"
          title="Fit route and markers"
          aria-label="Fit route"
        >
          <Maximize2 className="w-4 h-4 text-slate-200" />
        </button>

        {/* Locate Me */}
        <button
          type="button"
          onClick={handleFlyToUser}
          className={`w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-[#0f2d59] transition-all shadow-lg flex items-center justify-center active:scale-90 cursor-pointer ${
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
            className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-red-600 transition-all shadow-lg flex items-center justify-center active:scale-90 cursor-pointer"
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
          className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-[#0f2d59] transition-all shadow-lg flex items-center justify-center font-bold text-base active:scale-90 cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          +
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white hover:bg-[#0f2d59] transition-all shadow-lg flex items-center justify-center font-bold text-base active:scale-90 cursor-pointer"
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
          className="absolute bottom-0 inset-x-0 z-[1000] pointer-events-auto"
        >
          <div className="w-full max-w-xl mx-auto bg-white/95 backdrop-blur-xl border-t border-x border-white/60 rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-900">
            {/* Grab handle bar */}
            <button
              type="button"
              onClick={() => setIsSheetCollapsed((v) => !v)}
              className="w-full flex items-center justify-center pb-2 focus:outline-hidden cursor-pointer"
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
                      className="flex items-center gap-1 text-[11px] font-bold text-[#0f2d59] hover:text-blue-600 transition-colors cursor-pointer"
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
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0f2d59] to-[#1d4e8c] hover:from-[#13376d] hover:to-[#225ba3] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-sky-300" />
                <span>Start Turn-by-Turn</span>
              </a>

              {hasCoords && (
                <button
                  type="button"
                  onClick={handleFitRoute}
                  className="px-3.5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-[#0f2d59] text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="View full route on map"
                >
                  <Route className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Fit Route</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
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
