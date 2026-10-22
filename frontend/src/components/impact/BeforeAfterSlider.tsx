import React, { useRef, useState } from 'react';

interface Props {
  before: string;
  after: string;
  alt: string;
  onFail?: () => void;
}

/**
 * The one before/after view. The "after" photo sits underneath; the "before" photo is clipped on top.
 * Drag the round handle (or tap Before / After) to compare. Only the handle captures the pointer, so a
 * vertical swipe anywhere else still moves to the next reel.
 */
export const BeforeAfterSlider: React.FC<Props> = ({ before, after, alt, onFail }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // % of the width showing "before"
  const dragging = useRef(false);

  const moveTo = (clientX: number) => {
    const box = boxRef.current;
    if (!box) return;
    const { left, width } = box.getBoundingClientRect();
    if (width > 0) setPos(Math.min(96, Math.max(4, ((clientX - left) / width) * 100)));
  };

  return (
    <div ref={boxRef} className="absolute inset-0 select-none">
      <img src={after} alt={`${alt} - after`} className="absolute inset-0 w-full h-full object-cover" draggable={false} onError={onFail} />
      <img
        src={before}
        alt={`${alt} - before`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
        onError={onFail}
      />

      <button
        type="button"
        onClick={() => setPos(92)}
        className="absolute top-20 left-3 z-10 text-[10px] font-extrabold uppercase tracking-wider bg-red-600/90 text-white px-2.5 py-1 rounded-full shadow cursor-pointer"
      >
        Before
      </button>
      <button
        type="button"
        onClick={() => setPos(8)}
        className="absolute top-20 right-3 z-10 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600/90 text-white px-2.5 py-1 rounded-full shadow cursor-pointer"
      >
        After
      </button>

      <div className="absolute top-0 bottom-0 z-10 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.6)] pointer-events-none" style={{ left: `${pos}%` }} />
      <div
        role="slider"
        aria-label="Compare before and after"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setPos((p) => Math.max(4, p - 6));
          if (e.key === 'ArrowRight') setPos((p) => Math.min(96, p + 6));
        }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          e.stopPropagation();
        }}
        onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        className="absolute z-20 top-[38%] -translate-x-1/2 w-11 h-11 rounded-full bg-white shadow-xl border-2 border-[#0f2d59] flex items-center justify-center text-[#0f2d59] font-black text-base cursor-ew-resize"
        style={{ left: `${pos}%`, touchAction: 'none' }}
      >
        ⇆
      </div>
    </div>
  );
};
