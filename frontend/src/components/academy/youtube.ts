import { assetUrl } from '../../lib/api';

// Minimal YouTube IFrame API wrapper (loaded on demand from youtube.com) plus a helper that reads a video's length.
export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 } as const;

let apiPromise: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      apiPromise = null;
      reject(new Error('YouTube did not load. Check your connection or turn off the ad-blocker for this page.'));
    }, 15000);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      window.clearTimeout(timer);
      if (window.YT?.Player) resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => {
      window.clearTimeout(timer);
      apiPromise = null;
      reject(new Error('YouTube could not be reached from this network.'));
    };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/** Extracts the 11-character id from any common YouTube link, or null. */
export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.split('/')[1] || null;
    else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0])) id = parts[1];
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Reads the length (seconds) of a YouTube video or a direct video file. Rejects when it cannot be read. */
export async function detectVideoSeconds(url: string): Promise<number> {
  const id = youTubeId(url);
  if (!id) {
    return new Promise<number>((resolve, reject) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      const done = (fn: () => void) => {
        v.removeAttribute('src');
        v.load();
        fn();
      };
      const timer = window.setTimeout(() => done(() => reject(new Error('timeout'))), 10000);
      v.onloadedmetadata = () => {
        window.clearTimeout(timer);
        const d = v.duration;
        done(() => (Number.isFinite(d) && d > 0 ? resolve(Math.round(d)) : reject(new Error('unknown length'))));
      };
      v.onerror = () => {
        window.clearTimeout(timer);
        done(() => reject(new Error('cannot load')));
      };
      v.src = assetUrl(url);
    });
  }
  const YT = await loadYouTubeApi();
  return new Promise<number>((resolve, reject) => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;height:120px;';
    document.body.appendChild(host);
    const el = document.createElement('div');
    host.appendChild(el);
    let player: YTPlayer | null = null;
    const cleanup = () => {
      try {
        player?.destroy();
      } catch {
        /* already gone */
      }
      host.remove();
    };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, 10000);
    player = new YT.Player(el, {
      videoId: id,
      playerVars: { controls: 0, playsinline: 1 },
      events: {
        onReady: () => {
          let tries = 0;
          const poll = window.setInterval(() => {
            const d = player?.getDuration() ?? 0;
            if (d > 0 || ++tries > 20) {
              window.clearInterval(poll);
              window.clearTimeout(timer);
              cleanup();
              d > 0 ? resolve(Math.round(d)) : reject(new Error('unknown length'));
            }
          }, 250);
        },
        onError: () => {
          window.clearTimeout(timer);
          cleanup();
          reject(new Error('This video cannot be embedded or does not exist'));
        },
      },
    });
  });
}
