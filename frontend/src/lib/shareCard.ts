import type { MonthlyReport } from './api';

/**
 * Draws the monthly report as a picture that can be posted to a story (9:16) or a feed post (1:1).
 * Plain canvas, no libraries and no network: the numbers come from the report the server just returned.
 */
export type CardFormat = 'story' | 'post';

export const CARD_SIZES: Record<CardFormat, { w: number; h: number; label: string; hint: string }> = {
  story: { w: 1080, h: 1920, label: 'Story', hint: '9:16 · Instagram, WhatsApp status' },
  post: { w: 1080, h: 1080, label: 'Post', hint: '1:1 · feed, X, LinkedIn' },
};

export interface CardOptions {
  format: CardFormat;
  showName: boolean;
}

const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Shrinks the font until the text fits the width, so long names never run off the card. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startPx: number, weight = 800, minPx = 28) {
  let px = startPx;
  while (px > minPx) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  ctx.font = `${weight} ${px}px ${FONT}`;
  return px;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const CATEGORY_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa'];

export async function drawReportCard(canvas: HTMLCanvasElement, report: MonthlyReport, opts: CardOptions): Promise<void> {
  const { w, h } = CARD_SIZES[opts.format];
  const story = opts.format === 'story';
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot draw the card.');

  // ---- background -----------------------------------------------------------------------------
  const bg = ctx.createLinearGradient(0, 0, w * 0.6, h);
  bg.addColorStop(0, '#0a1e38');
  bg.addColorStop(0.55, '#0f2d59');
  bg.addColorStop(1, '#14532d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.85, h * 0.12, 10, w * 0.85, h * 0.12, w * 0.7);
  glow.addColorStop(0, 'rgba(251,191,36,0.28)');
  glow.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  const glow2 = ctx.createRadialGradient(w * 0.1, h * 0.95, 10, w * 0.1, h * 0.95, w * 0.8);
  glow2.addColorStop(0, 'rgba(52,211,153,0.25)');
  glow2.addColorStop(1, 'rgba(52,211,153,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);

  const pad = 84;
  const inner = w - pad * 2;
  // Stories get covered by the app's own header and reply bar, so keep the content inside the safe area
  const top = story ? 200 : 78;
  const bottom = story ? h - 230 : h - 78;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // ---- brand row --------------------------------------------------------------------------------
  const logo = await loadImage('/logo.png');
  let y = top;
  if (logo) {
    ctx.save();
    roundRect(ctx, pad, y, 84, 84, 20);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pad, y, 84, 84);
    ctx.drawImage(logo, pad + 6, y + 6, 72, 72);
    ctx.restore();
  }
  const bx = pad + (logo ? 108 : 0);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText('JanSevak', bx, y + 40);
  ctx.fillStyle = '#fbbf24';
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText('CIVIC OS', bx, y + 76);

  // month pill on the right
  ctx.font = `700 28px ${FONT}`;
  const monthText = report.month_label;
  const mw = ctx.measureText(monthText).width + 56;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, w - pad - mw, y + 14, mw, 56, 28);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(monthText, w - pad - mw / 2, y + 52);
  ctx.textAlign = 'left';

  // ---- headline ---------------------------------------------------------------------------------
  y += story ? 180 : 148;
  ctx.fillStyle = '#a7f3d0';
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText('MY CIVIC IMPACT', pad, y);
  y += story ? 92 : 76;
  ctx.fillStyle = '#ffffff';
  const who = opts.showName ? report.citizen_name : 'A JanSevak citizen';
  fitText(ctx, who, inner, story ? 84 : 72);
  ctx.fillText(who, pad, y);
  if (opts.showName && report.ward) {
    y += story ? 48 : 44;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = `600 30px ${FONT}`;
    ctx.fillText(report.ward, pad, y);
  }

  // ---- big number ---------------------------------------------------------------------------------
  y += story ? 140 : 84;
  const pointsText = `${report.net_points >= 0 ? '+' : ''}${report.net_points}`;
  ctx.fillStyle = '#fbbf24';
  const bigPx = story ? 200 : 130;
  ctx.font = `900 ${bigPx}px ${FONT}`;
  ctx.fillText(pointsText, pad, y + bigPx * 0.28);
  const pw = ctx.measureText(pointsText).width;
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText('civic points', pad + pw + 28, y + bigPx * 0.28 - 56);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText('earned this month', pad + pw + 28, y + bigPx * 0.28 - 14);
  y += bigPx * 0.28 + (story ? 64 : 40);

  // ---- four stat tiles ----------------------------------------------------------------------------
  const tiles: [string, number][] = [
    ['Reports filed', report.reports_filed],
    ['Issues resolved', report.reports_resolved_this_month],
    ['Supporters', report.supporters_received],
    ['Neighbours helped', report.reports_supported + report.evidence_added],
  ];
  const gap = story ? 24 : 20;
  const tw = (inner - gap) / 2;
  const th = story ? 170 : 126;
  tiles.forEach(([label, value], i) => {
    const tx = pad + (i % 2) * (tw + gap);
    const ty = y + Math.floor(i / 2) * (th + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, tx, ty, tw, th, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${story ? 80 : 56}px ${FONT}`;
    ctx.fillText(String(value), tx + 36, ty + (story ? 94 : 70));
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `700 ${story ? 30 : 26}px ${FONT}`;
    ctx.fillText(label, tx + 36, ty + th - (story ? 34 : 24));
  });
  y += th * 2 + gap + (story ? 56 : 30);

  // ---- categories (story only: the post is already full) ------------------------------------------
  const cats = report.category_breakdown.slice(0, 3);
  if (story && cats.length) {
    ctx.fillStyle = '#a7f3d0';
    ctx.font = `800 28px ${FONT}`;
    ctx.fillText('WHAT I REPORTED', pad, y);
    y += 14;
    cats.forEach((c, i) => {
      y += 56;
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 30px ${FONT}`;
      ctx.fillText(c.category, pad, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`${c.count} · ${c.percent}%`, w - pad, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      roundRect(ctx, pad, y + 14, inner, 16, 8);
      ctx.fill();
      ctx.fillStyle = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
      roundRect(ctx, pad, y + 14, Math.max(16, (inner * c.percent) / 100), 16, 8);
      ctx.fill();
      y += 22;
    });
    y += 34;
  }

  // ---- level bar ---------------------------------------------------------------------------------------
  const levelH = story ? 118 : 104;
  const levelY = y;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  roundRect(ctx, pad, levelY, inner, levelH, 30);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(pad + 58, levelY + levelH / 2, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a1e38';
  ctx.font = `900 34px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('★', pad + 58, levelY + levelH / 2 + 12);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 36px ${FONT}`;
  ctx.fillText(`${report.tier} level`, pad + 112, levelY + 52);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 27px ${FONT}`;
  const nextLine = report.next_tier
    ? `${report.lifetime_points} pts · ${report.points_to_next_tier} to ${report.next_tier}`
    : `${report.lifetime_points} pts · top level reached`;
  ctx.fillText(nextLine, pad + 112, levelY + 90);

  // ---- footer ---------------------------------------------------------------------------------------------
  const fy = bottom;
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 32px ${FONT}`;
  ctx.fillText('Report. Support. Get it resolved.', pad, fy - 34);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText('Made with JanSevak · points are recognition, not money', pad, fy + 6);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/png')
  );
}

export const cardFileName = (report: MonthlyReport, format: CardFormat) => `jansevak-${report.month}-${format}.png`;
