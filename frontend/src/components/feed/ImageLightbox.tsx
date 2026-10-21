import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  startIndex?: number;
  title?: string;
  onClose: () => void;
}

/** Full-screen photo viewer: click a photo to expand it, arrows / swipe-free buttons / keyboard to move, Esc to close. */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, startIndex = 0, title, onClose }) => {
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), Math.max(images.length - 1, 0)));
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && images.length > 1) prev();
      else if (e.key === 'ArrowRight' && images.length > 1) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, onClose]);

  if (images.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 text-white z-10">
        <span className="text-xs font-semibold bg-white/15 rounded-full px-3 py-1">
          {index + 1} / {images.length}
          {title ? ` · ${title}` : ''}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center"
          aria-label="Close photo viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {failed[index] ? (
        <p className="text-white/80 text-sm px-8 text-center" onClick={(e) => e.stopPropagation()}>
          This photo could not be loaded.
        </p>
      ) : (
        <img
          key={index}
          src={images[index]}
          alt={`Photo ${index + 1} of ${images.length}`}
          className="max-w-full max-h-[85vh] object-contain select-none"
          onClick={(e) => e.stopPropagation()}
          onError={() => setFailed((f) => ({ ...f, [index]: true }))}
        />
      )}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>,
    document.body
  );
};
