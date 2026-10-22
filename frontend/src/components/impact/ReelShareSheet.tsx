import React from 'react';
import { X, Link2, Send, Share2, MessageCircle, Facebook } from 'lucide-react';

export type ShareChannel = 'whatsapp' | 'x' | 'telegram' | 'facebook' | 'copy' | 'native';

interface Props {
  title: string;
  url: string;
  text: string;
  onShared: (channel: ShareChannel) => void;
  onClose: () => void;
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/** Share options for one reel: WhatsApp, X, Telegram, Facebook, Copy link and (where supported) the phone's own share sheet. */
export const ReelShareSheet: React.FC<Props> = ({ title, url, text, onShared, onClose }) => {
  const enc = encodeURIComponent;
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const open = (href: string, channel: ShareChannel) => {
    window.open(href, '_blank', 'noopener,noreferrer');
    onShared(channel);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard blocked (http / old browser): fall back to a hidden textarea
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* nothing more we can do */
      }
      ta.remove();
    }
    onShared('copy');
  };

  const native = async () => {
    try {
      await navigator.share({ title, text, url });
      onShared('native');
    } catch {
      /* user closed the share sheet: not an error */
    }
  };

  const options: { key: string; label: string; icon: React.ReactNode; color: string; run: () => void }[] = [
    {
      key: 'wa',
      label: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-[#25D366]',
      run: () => open(`https://wa.me/?text=${enc(`${text}\n${url}`)}`, 'whatsapp'),
    },
    {
      key: 'x',
      label: 'X',
      icon: <XIcon />,
      color: 'bg-black',
      run: () => open(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, 'x'),
    },
    {
      key: 'tg',
      label: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      color: 'bg-[#229ED9]',
      run: () => open(`https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`, 'telegram'),
    },
    {
      key: 'fb',
      label: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-[#1877F2]',
      run: () => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, 'facebook'),
    },
    { key: 'copy', label: 'Copy link', icon: <Link2 className="w-5 h-5" />, color: 'bg-[#0f2d59]', run: copy },
    ...(canNative
      ? [{ key: 'more', label: 'More…', icon: <Share2 className="w-5 h-5" />, color: 'bg-slate-600', run: native }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Share this story"
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 text-[#0f172a] space-y-4 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-[#cbd5e1] rounded-full mx-auto" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold">Share this story</h3>
            <p className="text-xs text-[#64748b] truncate">{title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-[#64748b] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={o.run}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[#f8fafc] hover:bg-[#eef2f7] active:scale-95 transition cursor-pointer"
            >
              <span className={`w-11 h-11 rounded-full ${o.color} text-white flex items-center justify-center`}>{o.icon}</span>
              <span className="text-[11px] font-bold text-[#0f172a]">{o.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
