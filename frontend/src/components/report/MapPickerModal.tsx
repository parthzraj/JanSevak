import React, { useState } from 'react';
import { X, Check, MapPin, Navigation, Compass, Plus, Minus, Search } from 'lucide-react';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coords: { lat: number; lng: number; address: string }) => void;
  initialCoords?: { lat: number; lng: number };
}

interface Landmark {
  name: string;
  ward: string;
  lat: number;
  lng: number;
}

const COMMON_LANDMARKS: Landmark[] = [
  { name: '100ft Road Junction', ward: 'Indiranagar · Ward 112', lat: 12.9716, lng: 77.6412 },
  { name: 'Domlur Flyover Underpass', ward: 'Domlur · Ward 114', lat: 12.9609, lng: 77.6387 },
  { name: 'CMH Road Metro Station', ward: 'Indiranagar · Ward 112', lat: 12.9784, lng: 77.6408 },
  { name: '80ft Road Koramangala', ward: 'Koramangala · Ward 151', lat: 12.9352, lng: 77.6245 },
  { name: 'Cambridge Layout Cross', ward: 'Cambridge · Ward 111', lat: 12.9682, lng: 77.6324 },
  { name: 'Tippasandra Main Market', ward: 'Tippasandra · Ward 112', lat: 12.9734, lng: 77.6531 },
];

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialCoords = { lat: 12.9716, lng: 77.6412 },
}) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(initialCoords);
  const [zoom, setZoom] = useState<number>(16);
  const [addressLabel, setAddressLabel] = useState<string>('Indiranagar 100ft Rd · Ward 112, Bengaluru');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLandmarkSelect = (lm: Landmark) => {
    setCoords({ lat: lm.lat, lng: lm.lng });
    setAddressLabel(`${lm.name}, ${lm.ward}`);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Relative shift from center
    const dx = (x - rect.width / 2) / rect.width;
    const dy = (y - rect.height / 2) / rect.height;

    // Shift lat/lng proportionally based on zoom level
    const scaleFactor = 0.005 / Math.pow(2, zoom - 15);
    const newLat = Number((coords.lat - dy * scaleFactor).toFixed(5));
    const newLng = Number((coords.lng + dx * scaleFactor).toFixed(5));

    setCoords({ lat: newLat, lng: newLng });
    setAddressLabel(`Custom Pin Location (${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E)`);
  };

  const handleGpsCenter = () => {
    if (!navigator.geolocation) {
      setAddressLabel('Indiranagar 12th Main (12.9716°N, 77.6412°E)');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const newLat = Number(latitude.toFixed(5));
        const newLng = Number(longitude.toFixed(5));
        setCoords({ lat: newLat, lng: newLng });
        setAddressLabel(`Live GPS: ${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E (Indiranagar Ward 112)`);
      },
      () => {
        setIsLocating(false);
        setAddressLabel('Indiranagar Central (12.9716°N, 77.6412°E)');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const matched = COMMON_LANDMARKS.find((lm) =>
      lm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lm.ward.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (matched) {
      handleLandmarkSelect(matched);
    } else {
      setAddressLabel(`${searchQuery.trim()} (Marked Spot)`);
    }
    setSearchQuery('');
  };

  const handleConfirm = () => {
    onConfirm({
      lat: coords.lat,
      lng: coords.lng,
      address: addressLabel,
    });
    onClose();
  };

  // OpenStreetMap embed bbox calculation based on center and zoom
  const delta = 0.008 / Math.pow(2, zoom - 15);
  const bbox = `${coords.lng - delta},${coords.lat - delta},${coords.lng + delta},${coords.lat + delta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#0f2d59] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-400/30">
              <MapPin className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Mark Problem on Map</h3>
              <p className="text-[10px] text-blue-200">Tap anywhere on map or choose a nearby ward landmark</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search landmark (e.g. 100ft road, flyover, metro...)"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-[#0f2d59] text-slate-800 placeholder-slate-400"
            />
          </form>
        </div>

        {/* Map View with Pin */}
        <div className="relative w-full h-72 bg-slate-100 overflow-hidden cursor-crosshair" onClick={handleMapClick}>
          {/* OpenStreetMap iframe background */}
          <iframe
            title="OpenStreetMap Picker"
            src={osmEmbedUrl}
            className="w-full h-full border-0 pointer-events-none opacity-90"
            loading="lazy"
          />

          {/* Centered Interactive Custom Pin Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-20 flex flex-col items-center">
            <div className="bg-[#ea580c] text-white p-2 rounded-full shadow-xl shadow-orange-950/40 border-2 border-white animate-bounce">
              <MapPin className="w-5 h-5 fill-white text-[#ea580c]" />
            </div>
            <div className="w-3 h-1.5 bg-black/30 rounded-full blur-[1px] mt-0.5"></div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => Math.min(z + 1, 18));
              }}
              className="w-8 h-8 rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => Math.max(z - 1, 13));
              }}
              className="w-8 h-8 rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* GPS Auto-Locate Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleGpsCenter();
            }}
            disabled={isLocating}
            className="absolute bottom-3 left-3 z-30 px-3 py-1.5 rounded-xl bg-white shadow-md border border-slate-200 text-[#0f2d59] font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          >
            <Compass className={`w-4 h-4 text-[#ea580c] ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Acquiring GPS...' : 'Center on My GPS'}</span>
          </button>

          {/* Tap Tip Pill */}
          <div className="absolute bottom-3 right-3 z-30 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-full font-medium pointer-events-none">
            Tap map to reposition
          </div>
        </div>

        {/* Quick Landmarks Horizontal Bar */}
        <div className="p-3 bg-white border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Ward Landmarks:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {COMMON_LANDMARKS.map((lm) => (
              <button
                key={lm.name}
                type="button"
                onClick={() => handleLandmarkSelect(lm)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0f2d59] hover:border-blue-200 border border-slate-200 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
              >
                {lm.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Coordinates info & Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="flex items-start gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <Navigation className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Selected Geographic Position
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">{addressLabel}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Lat: {coords.lat.toFixed(5)}°N · Lng: {coords.lng.toFixed(5)}°E
              </p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#0f2d59]/20 active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
