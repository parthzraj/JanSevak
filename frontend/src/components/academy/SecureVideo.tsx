import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play, RotateCcw } from 'lucide-react';
import { assetUrl } from '../../lib/api';
import { YT_STATE, loadYouTubeApi, type YTPlayer } from './youtube';

/**
 * A video player that cannot be skipped through.
 *  - no native controls, so there is no seek bar or speed menu to use
 *  - if the playhead gets ahead of the furthest point honestly watched, it is pulled back
 *  - playback speed is forced to 1x
 *  - the video pauses when the tab is hidden
 *  - every 5 s of real playback the position is reported; the SERVER does the actual counting
 */
interface Controller {
  play(): void;
  pause(): void;
  time(): number;
  seek(s: number): void;
  playing(): boolean;
  rate(): number;
  setRate(r: number): void;
}

interface Props {
  kind: 'youtube' | 'file';
  videoRef: string;
  durationSeconds: number;
  resumeSeconds: number;
  onBeat: (position: number) => void;
  onEnded: () => void;
}

const SKIP_TOLERANCE = 2.5; // seconds of drift allowed before the playhead is pulled back
const BEAT_MS = 5000;

const clock = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

export const SecureVideo: React.FC<Props> = ({ kind, videoRef, durationSeconds, resumeSeconds, onBeat, onEnded }) => {
  const ctl = useRef<Controller | null>(null);
  const allowed = useRef(resumeSeconds);
  const hostRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLVideoElement>(null);
  const beatRef = useRef(onBeat);
  const endedRef = useRef(onEnded);
  beatRef.current = onBeat;
  endedRef.current = onEnded;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(resumeSeconds);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<number | undefined>(undefined);
  const wasPlaying = useRef(false);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 2500);
  }, []);

  // ---- create the player -------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let yt: YTPlayer | null = null;
    let wrapper: HTMLDivElement | null = null;
    allowed.current = resumeSeconds;
    setReady(false);
    setError('');

    if (kind === 'youtube') {
      loadYouTubeApi()
        .then((YT) => {
          if (cancelled || !hostRef.current) return;
          wrapper = document.createElement('div');
          wrapper.style.cssText = 'width:100%;height:100%;';
          hostRef.current.appendChild(wrapper);
          yt = new YT.Player(wrapper, {
            width: '100%',
            height: '100%',
            videoId: videoRef,
            playerVars: {
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0,
              modestbranding: 1,
              iv_load_policy: 3,
              playsinline: 1,
              start: Math.floor(resumeSeconds),
              origin: window.location.origin,
            },
            events: {
              onReady: () => {
                if (cancelled || !yt) return;
                const p = yt;
                ctl.current = {
                  play: () => p.playVideo(),
                  pause: () => p.pauseVideo(),
                  time: () => p.getCurrentTime() || 0,
                  seek: (s) => p.seekTo(s, true),
                  playing: () => p.getPlayerState() === YT_STATE.PLAYING,
                  rate: () => p.getPlaybackRate(),
                  setRate: (r) => p.setPlaybackRate(r),
                };
                setReady(true);
              },
              onStateChange: (e: { data: number }) => {
                if (e.data === YT_STATE.ENDED) {
                  beatRef.current(durationSeconds);
                  endedRef.current();
                }
              },
              onError: () => setError('This video cannot be played (it may have been removed or blocked from embedding).'),
            },
          });
        })
        .catch((e: Error) => !cancelled && setError(e.message));
    } else {
      const v = fileRef.current;
      if (v) {
        ctl.current = {
          play: () => void v.play().catch(() => undefined),
          pause: () => v.pause(),
          time: () => v.currentTime || 0,
          seek: (s) => {
            v.currentTime = s;
          },
          playing: () => !v.paused && !v.ended,
          rate: () => v.playbackRate,
          setRate: (r) => {
            v.playbackRate = r;
          },
        };
      }
    }

    return () => {
      cancelled = true;
      ctl.current = null;
      try {
        yt?.destroy();
      } catch {
        /* player already gone */
      }
      wrapper?.remove();
    };
  }, [kind, videoRef, resumeSeconds, durationSeconds]);

  // ---- watch the playhead: pull it back when it runs ahead, keep speed at 1x -------------------
  useEffect(() => {
    const id = window.setInterval(() => {
      const c = ctl.current;
      if (!c || (kind === 'youtube' && !ready)) return;
      if (Math.abs(c.rate() - 1) > 0.01) c.setRate(1);
      const t = c.time();
      const isPlaying = c.playing();
      if (t > allowed.current + SKIP_TOLERANCE) {
        c.seek(allowed.current);
        flash('Skipping ahead is switched off. Watch the video to continue.');
      } else if (isPlaying) {
        allowed.current = Math.max(allowed.current, t);
      }
      // the first beat of every play starts the server's clock for this viewing
      if (isPlaying && !wasPlaying.current) beatRef.current(t);
      wasPlaying.current = isPlaying;
      setCurrent(t);
      setPlaying(isPlaying);
    }, 400);
    return () => window.clearInterval(id);
  }, [kind, ready, flash]);

  // ---- heartbeat + pause when the tab is hidden ------------------------------------------------
  useEffect(() => {
    const beat = window.setInterval(() => {
      const c = ctl.current;
      if (c && c.playing() && !document.hidden) beatRef.current(c.time());
    }, BEAT_MS);
    const onVisibility = () => {
      const c = ctl.current;
      if (document.hidden && c?.playing()) {
        beatRef.current(c.time());
        c.pause();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(beat);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const toggle = () => {
    const c = ctl.current;
    if (!c) return;
    if (c.playing()) {
      beatRef.current(c.time());
      c.pause();
    } else {
      c.play();
    }
  };

  const back10 = () => {
    const c = ctl.current;
    if (c) c.seek(Math.max(0, c.time() - 10));
  };

  const pct = durationSeconds ? Math.min(100, (current / durationSeconds) * 100) : 0;
  const reached = durationSeconds ? Math.min(100, (allowed.current / durationSeconds) * 100) : 0;

  return (
    <div className="rounded-2xl overflow-hidden bg-black select-none">
      <div className="relative aspect-video bg-black">
        {kind === 'youtube' ? (
          <div ref={hostRef} className="absolute inset-0" />
        ) : (
          <video
            ref={fileRef}
            src={assetUrl(videoRef)}
            className="absolute inset-0 w-full h-full"
            playsInline
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
            onContextMenu={(e) => e.preventDefault()}
            onLoadedMetadata={(e) => {
              if (resumeSeconds > 0) e.currentTarget.currentTime = resumeSeconds;
              setReady(true);
            }}
            onPause={() => {
              if (ctl.current) beatRef.current(ctl.current.time());
            }}
            onEnded={() => {
              beatRef.current(durationSeconds);
              endedRef.current();
            }}
            onError={() => setError('This video file cannot be played.')}
          />
        )}
        {/* a transparent layer keeps clicks away from the embedded player's own menus and links */}
        <button
          type="button"
          aria-label={playing ? 'Pause video' : 'Play video'}
          onClick={toggle}
          className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center bg-transparent"
        >
          {!playing && ready && !error && (
            <span className="w-14 h-14 rounded-full bg-white/90 text-[#0f2d59] flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 ml-0.5" />
            </span>
          )}
        </button>
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80 pointer-events-none">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-white bg-black/80">{error}</div>
        )}
        {notice && (
          <div className="absolute top-2 left-2 right-2 text-center text-[11px] font-bold text-amber-900 bg-amber-100 rounded-lg px-3 py-1.5 pointer-events-none">
            {notice}
          </div>
        )}
      </div>

      <div className="bg-[#0b1f3d] px-3 py-2.5 space-y-2">
        <div className="relative h-1.5 rounded-full bg-white/15 overflow-hidden" role="progressbar" aria-label="Video progress" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="absolute inset-y-0 left-0 bg-white/25" style={{ width: `${reached}%` }} />
          <div className="absolute inset-y-0 left-0 bg-emerald-400" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-3 text-white">
          <button type="button" onClick={toggle} disabled={!ready} aria-label={playing ? 'Pause' : 'Play'} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 cursor-pointer">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button type="button" onClick={back10} disabled={!ready} aria-label="Back 10 seconds" className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 cursor-pointer">
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-semibold tabular-nums">
            {clock(current)} / {clock(durationSeconds)}
          </span>
          <span className="ml-auto text-[10px] text-white/60">Seeking ahead is disabled</span>
        </div>
      </div>
    </div>
  );
};
