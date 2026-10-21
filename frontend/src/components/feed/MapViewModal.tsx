import React from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, MapPin, X } from 'lucide-react';

interface MapViewModalProps {
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
  onClose: () => void;
}

/** Shows where an issue is. Uses OpenStreetMap (free, no API key); falls back to an address search when there are no coordinates. */
export const MapViewModal: React.FC<MapViewModalProps> = ({ title, address, latitude, longitude, onClose }) => {
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  const embedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - 0.005}%2C${latitude! - 0.0035}%2C${
        longitude! + 0.005
      }%2C${latitude! + 0.0035}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : null;

  const googleUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const osmUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[75] bg-black/60 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Issue location"
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#cbd5e1]">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#0f2d59] flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Issue Location
            </h2>
            <p className="text-[11px] text-[#64748b] truncate">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f8fafc] text-[#0f172a]"
            aria-label="Close map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {embedUrl ? (
          <iframe
            title="Issue location map"
            src={embedUrl}
            className="w-full h-72 border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-40 bg-[#E8EFEA] flex flex-col items-center justify-center gap-2 text-center px-6">
            <MapPin className="w-8 h-8 text-red-600" />
            <p className="text-xs text-[#0f172a] font-semibold">No exact GPS pin was saved for this report.</p>
            <p className="text-[11px] text-[#64748b]">Use the buttons below to search the address on a map.</p>
          </div>
        )}

        <div className="p-4 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Address</span>
            <p className="text-xs font-bold text-[#0f172a]">{address}</p>
            {hasCoords && (
              <p className="text-[11px] text-[#64748b] mt-0.5">
                GPS: {latitude!.toFixed(4)}° N, {longitude!.toFixed(4)}° E
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Google Maps
            </a>
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#0f2d59] text-xs font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5" /> OpenStreetMap
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
