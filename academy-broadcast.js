/* =====================================================================
 * academy-broadcast.js  v2.8.0
 * 《MLB 勁旅對決 3D》同款轉播級畫面引擎 — 四大棒球教學單元
 * 道奇球場白天轉播風格：藍天棕櫚樹、看台觀眾、除草紋草皮、
 * Scorebug 計分板、LIVE/REPLAY 標籤、Lower-third 字幕條、Statcast 面板、
 * 立體描邊 LAD #17 小球員。
 *
 * 取代（覆寫）index.html 內的：
 *   drawGrip, drawPitchSim, drawMechanics, drawFieldingSkill,
 *   drawBaseCover, drawBatGrip, drawHitSim, drawDiamond
 * 狀態變數（currentPitch、pitchLabPoints…）沿用 index.html 內既有的全域變數。
 * ===================================================================== */
const ACAD = (() => {
  'use strict';

  // ------------------------------------------------------------------
  // Core helpers
  // ------------------------------------------------------------------
  const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei","Heiti TC",system-ui,sans-serif';
  const f = (w, s) => `${w} ${s}px ${FONT}`;
  const W = 960, H = 540;
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const stripTags = s => String(s || '').replace(/<[^>]+>/g, '');

  const KIT = {
    LAD: { jersey: '#ffffff', jerseyShade: '#cfd8e3', accent: '#005A9C', num: '#EF3E42', cap: '#005A9C', pants: '#f8fafc', logo: 'LA' },
    SD: { jersey: '#f3eee4', jerseyShade: '#d6cdbb', accent: '#2F241D', num: '#FFC425', cap: '#2F241D', pants: '#ece5d6', logo: 'SD' },
    GRAY: { jersey: '#cbd5e1', jerseyShade: '#94a3b8', accent: '#1e3a8a', num: '#1e3a8a', cap: '#1e3a8a', pants: '#cbd5e1', logo: 'NY' }
  };

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
    return `rgb(${clamp(r, 0, 255)},${clamp(g, 0, 255)},${clamp(b, 0, 255)})`;
  }

  function prep(id) {
    const c = document.getElementById(id);
    if (!c) return null;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.textBaseline = 'alphabetic';
    ctx.setLineDash([]);
    return ctx;
  }

  function visible(id) {
    const c = document.getElementById(id);
    return !!(c && c.offsetParent !== null);
  }

  function wrapLines(ctx, text, maxW) {
    const out = [];
    let line = '';
    for (const ch of text) {
      const t = line + ch;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = ch.trim() ? ch : ''; }
      else line = t;
    }
    if (line) out.push(line);
    return out;
  }

  function arrowHead(ctx, x, y, ang, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.65);
    ctx.lineTo(-size * 0.35, 0);
    ctx.lineTo(-size * 0.7, size * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function glowLine(ctx, pts, color, width, glow = true) {
    if (pts.length < 2) return;
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
    ctx.save();
    if (glow) {
      ctx.globalAlpha = 0.28; ctx.strokeStyle = color; ctx.lineWidth = width * 2.6; path(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = color; ctx.lineWidth = width; path(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1, width * 0.32); path(); ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Dodger Stadium daytime backdrop (matches MLB Rivals duel camera)
  // ------------------------------------------------------------------
  function stadium(ctx, o = {}) {
    const hy = o.horizon ?? 220;
    const cx = o.cx ?? W / 2;
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, '#1e40af');
    sky.addColorStop(0.45, '#3b82f6');
    sky.addColorStop(0.85, '#93c5fd');
    sky.addColorStop(1, '#dbeafe');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, hy);
    const sun = ctx.createRadialGradient(W * 0.86, 24, 4, W * 0.86, 24, 240);
    sun.addColorStop(0, 'rgba(255,250,230,0.95)');
    sun.addColorStop(0.25, 'rgba(255,250,230,0.35)');
    sun.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, hy);

    const standTop = hy - 96, wallTop = hy - 22;
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    [[110, standTop - 50, 1], [360, standTop - 66, 0.8], [600, standTop - 40, 1.1], [835, standTop - 12, 0.7]].forEach(([x, y, s]) => {
      if (y < -20) return;
      [[0, 0, 42, 15], [32, -9, 34, 17], [64, 1, 40, 14], [-30, 4, 26, 10]].forEach(([dx, dy, rx, ry]) => {
        ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, rx * s, ry * s, 0, 0, TAU); ctx.fill();
      });
    });

    // San Gabriel hills
    ctx.fillStyle = '#6b9a73';
    ctx.beginPath();
    ctx.moveTo(0, standTop + 30);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, standTop + 6 - Math.sin(x / 140 + 1) * 15 - Math.sin(x / 51) * 5);
    ctx.lineTo(W, standTop + 40);
    ctx.closePath();
    ctx.fill();

    // Palms (signature Dodger Stadium look)
    const palm = (px, base, h) => {
      ctx.strokeStyle = '#7c4a1e'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(px, base); ctx.quadraticCurveTo(px + 6, base - h * 0.6, px + 10, base - h); ctx.stroke();
      ctx.fillStyle = '#166534';
      for (let a = 0; a < 7; a++) {
        const ang = (a / 7) * TAU;
        ctx.beginPath(); ctx.ellipse(px + 10 + Math.cos(ang) * 15, base - h + Math.sin(ang) * 7 + 4, 18, 4.5, ang, 0, TAU); ctx.fill();
      }
    };
    [50, 118, 182, W - 205, W - 140, W - 68].forEach((px, i) => palm(px, standTop + 26, 58 + (i % 3) * 14));

    // Light towers
    [250, W - 300].forEach(lx => {
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, standTop + 20); ctx.lineTo(lx, standTop - 54); ctx.stroke();
      ctx.fillStyle = '#334155'; ctx.fillRect(lx - 20, standTop - 70, 40, 18);
      ctx.fillStyle = '#fef9c3';
      for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) ctx.fillRect(lx - 17 + c * 7.5, standTop - 67 + r * 8, 5, 5);
    });

    // Pavilion seating bowl
    const bowl = ctx.createLinearGradient(0, standTop, 0, wallTop);
    bowl.addColorStop(0, '#e2e8f0');
    bowl.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bowl;
    ctx.beginPath();
    ctx.moveTo(0, standTop + 22);
    ctx.quadraticCurveTo(cx, standTop + 2, W, standTop + 22);
    ctx.lineTo(W, wallTop);
    ctx.lineTo(0, wallTop);
    ctx.closePath();
    ctx.fill();
    const palette = ['#005A9C', '#f8fafc', '#ef4444', '#facc15', '#1e3a8a', '#e2e8f0', '#0ea5e9', '#f97316'];
    const rows = Math.max(3, Math.floor((wallTop - standTop - 26) / 8));
    for (let r = 0; r < rows; r++) {
      const y = standTop + 24 + r * 8 - (1 - Math.abs((0.5))) * 0;
      for (let x = 2 + (r % 2) * 4; x < W; x += 8) {
        const bend = Math.pow((x - cx) / (W / 2), 2) * 10;
        ctx.fillStyle = palette[Math.floor(hash(r * 997 + x) * palette.length)];
        ctx.fillRect(x, y - 10 + bend, 5, 5);
      }
    }
    ['#facc15', '#005A9C'].forEach((col, k) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2.5;
      ctx.beginPath();
      const ry = standTop + 22 + (k + 1) * Math.floor(rows / 3) * 8 - 3;
      ctx.moveTo(0, ry); ctx.quadraticCurveTo(cx, ry - 18, W, ry); ctx.stroke();
    });

    // Padded outfield wall
    const wall = ctx.createLinearGradient(0, wallTop, 0, hy);
    wall.addColorStop(0, '#166534');
    wall.addColorStop(1, '#0f3d22');
    ctx.fillStyle = wall;
    ctx.fillRect(0, wallTop, W, hy - wallTop);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    for (let x = 30; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, wallTop); ctx.lineTo(x, hy); ctx.stroke(); }
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, wallTop); ctx.lineTo(W, wallTop); ctx.stroke();
    if (o.markers) {
      ctx.fillStyle = '#fff'; ctx.font = f(900, 11); ctx.textAlign = 'center';
      o.markers.forEach(([x, t]) => ctx.fillText(t, x, wallTop + 15));
    }

    // Sunlit grass with mower stripes
    const grass = ctx.createLinearGradient(0, hy, 0, H);
    grass.addColorStop(0, '#2fbf5b');
    grass.addColorStop(0.5, '#1fa34a');
    grass.addColorStop(1, '#15803d');
    ctx.fillStyle = grass;
    ctx.fillRect(0, hy, W, H - hy);
    ctx.fillStyle = 'rgba(255,255,255,0.075)';
    if (o.stripes === 'radial') {
      for (let s = -9; s <= 9; s += 2) {
        ctx.beginPath();
        ctx.moveTo(cx + s * 26, hy); ctx.lineTo(cx + (s + 1) * 26, hy);
        ctx.lineTo(cx + (s + 1) * 170, H); ctx.lineTo(cx + s * 170, H);
        ctx.closePath(); ctx.fill();
      }
    } else {
      let y = hy, i = 0, bh = 7;
      while (y < H) { if (i % 2 === 0) ctx.fillRect(0, y, W, bh); y += bh; bh *= 1.22; i++; }
    }
  }

  function dirtPatch(ctx, x, y, rx, ry) {
    const g = ctx.createRadialGradient(x, y - ry * 0.3, 4, x, y, Math.max(rx, ry));
    g.addColorStop(0, '#d18a4a');
    g.addColorStop(0.7, '#b8692f');
    g.addColorStop(1, '#9a5424');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 40; i++) {
      const a = hash(i * 7.1 + x) * TAU, d = Math.sqrt(hash(i * 3.3 + y));
      ctx.fillRect(x + Math.cos(a) * rx * d * 0.92, y + Math.sin(a) * ry * d * 0.92, 2, 1.5);
    }
  }

  function dirtBand(ctx, y0) {
    const g = ctx.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, '#c47a3d');
    g.addColorStop(1, '#9a5424');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, y0 + 14);
    ctx.quadraticCurveTo(W / 2, y0 - 14, W, y0 + 14);
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(21,128,61,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, y0 + 14); ctx.quadraticCurveTo(W / 2, y0 - 14, W, y0 + 14); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 160; i++) ctx.fillRect(hash(i * 1.7) * W, y0 + 10 + hash(i * 2.9) * (H - y0), 2.5, 1.5);
  }

  // ------------------------------------------------------------------
  // Broadcast HUD (scorebug / LIVE tag / lower third / callouts / panels)
  // ------------------------------------------------------------------
  function scorebug(ctx, title, sub, o = {}) {
    const x = 16, y = 14, h = 56;
    ctx.font = f(900, 19); const tw = ctx.measureText(title).width;
    ctx.font = f(700, 12.5); const sw = ctx.measureText(sub).width;
    const w = 76 + Math.max(tw, sw) + 22;
    ctx.save();
    ctx.shadowColor = 'rgba(2,6,23,0.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#15254a'); g.addColorStop(1, '#0a1428');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
    ctx.fillStyle = o.teamColor || '#005A9C'; ctx.fillRect(x, y, 62, h);
    ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fillRect(x, y, 62, h / 2);
    ctx.fillStyle = o.accent || '#facc15'; ctx.fillRect(x, y + h - 4, w, 4);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.font = f(900, 18); ctx.fillText(o.team || 'LAD', x + 31, y + 27);
    ctx.fillStyle = '#bfdbfe'; ctx.font = f(800, 9.5); ctx.fillText(o.tag || 'ACADEMY', x + 31, y + 42);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff'; ctx.font = f(900, 19); ctx.fillText(title, x + 76, y + 25);
    ctx.fillStyle = o.accent || '#facc15'; ctx.font = f(700, 12.5); ctx.fillText(sub, x + 76, y + 44);
    ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 10); ctx.stroke();
    return { x, y, w, h };
  }

  function liveTag(ctx, text, o = {}) {
    ctx.font = f(900, 12);
    const tw = ctx.measureText(text).width;
    const w = tw + 44, x = (o.x ?? (W - 16)) - w, y = o.y ?? 16, h = 26;
    ctx.save();
    ctx.shadowColor = 'rgba(2,6,23,0.5)'; ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(10,20,40,0.88)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 13); ctx.fill();
    ctx.restore();
    const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 260);
    ctx.fillStyle = `rgba(239,68,68,${pulse})`;
    ctx.beginPath(); ctx.arc(x + 16, y + h / 2, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 28, y + h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    return { x, y, w, h };
  }

  function lowerThird(ctx, title, caption, accent = '#facc15', o = {}) {
    const x = 16, w = W - 32 - (o.marginRight || 0);
    ctx.font = f(600, 15);
    let lines = caption ? wrapLines(ctx, caption, w - 48) : [];
    const maxL = o.maxLines ?? 2;
    if (lines.length > maxL) { lines = lines.slice(0, maxL); lines[maxL - 1] = lines[maxL - 1].slice(0, -1) + '…'; }
    const h = 44 + lines.length * 21;
    const y = H - h - 12;
    ctx.save();
    ctx.shadowColor = 'rgba(2,6,23,0.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(8,16,36,0.95)'); g.addColorStop(1, 'rgba(14,32,66,0.92)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
    ctx.fillStyle = accent; ctx.fillRect(x, y, 8, h);
    const tg = ctx.createLinearGradient(x, 0, x + w * 0.7, 0);
    tg.addColorStop(0, accent); tg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = tg; ctx.fillRect(x, y, w, 3);
    ctx.restore();
    const tagStr = o.tag || 'MLB RIVALS ACADEMY';
    ctx.font = f(900, 11);
    const tagW = ctx.measureText(tagStr).width;
    ctx.fillStyle = accent; ctx.textAlign = 'right';
    ctx.fillText(tagStr, x + w - 16, y + 22);
    ctx.fillStyle = '#fff'; ctx.font = f(900, 20); ctx.textAlign = 'left';
    const maxTitleW = w - 48 - tagW;
    let dispTitle = title;
    while (ctx.measureText(dispTitle).width > maxTitleW && dispTitle.length > 4) dispTitle = dispTitle.slice(0, -2) + '…';
    ctx.fillText(dispTitle, x + 24, y + 30);
    ctx.textAlign = 'left'; ctx.fillStyle = '#dbeafe'; ctx.font = f(600, 15);
    lines.forEach((l, i) => ctx.fillText(l, x + 24, y + 54 + i * 21));
    return y;
  }

  function callout(ctx, px, py, lx, ly, text, color = '#facc15', o = {}) {
    const size = o.size || 15;
    ctx.save();
    ctx.font = f(800, size);
    const tw = ctx.measureText(text).width, bw = tw + 22, bh = size + 15;
    const bx = clamp(lx - bw / 2, 6, W - bw - 6), by = ly - bh / 2;
    if (px != null) {
      const ex = clamp(px, bx + 8, bx + bw - 8), ey = py < by ? by : (py > by + bh ? by + bh : by + bh / 2);
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.shadowColor = 'rgba(2,6,23,0.5)'; ctx.shadowBlur = 8;
    ctx.fillStyle = o.bg || 'rgba(10,20,40,0.92)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = o.textColor || '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + bw / 2, by + bh / 2 + 1);
    ctx.restore();
  }

  function panel(ctx, x, y, w, h, title, accent = '#38bdf8') {
    ctx.save();
    ctx.shadowColor = 'rgba(2,6,23,0.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
    ctx.fillStyle = 'rgba(10,20,42,0.9)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
    ctx.fillStyle = accent; ctx.globalAlpha = 0.22; ctx.fillRect(x, y, w, 26); ctx.globalAlpha = 1;
    ctx.fillStyle = accent; ctx.fillRect(x, y + 26, w, 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 10); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = f(900, 13); ctx.textAlign = 'left';
    ctx.fillText(title, x + 12, y + 18);
  }

  function statRows(ctx, x, y, w, rows) {
    rows.forEach(([label, val, col], i) => {
      const ry = y + i * 30;
      ctx.fillStyle = '#94a3b8'; ctx.font = f(700, 12.5); ctx.textAlign = 'left';
      ctx.fillText(label, x, ry);
      ctx.fillStyle = col || '#fff'; ctx.font = f(900, 17); ctx.textAlign = 'right';
      ctx.fillText(val, x + w, ry);
      if (i < rows.length - 1) { ctx.fillStyle = 'rgba(148,163,184,0.18)'; ctx.fillRect(x, ry + 10, w, 1); }
    });
    ctx.textAlign = 'left';
  }

  function stamp(ctx, text, sub, color = '#22c55e', o = {}) {
    const cx = o.x ?? W / 2, cy = o.y ?? 200;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(o.rot ?? -0.06);
    ctx.font = f(900, o.size || 46);
    const tw = ctx.measureText(text).width;
    const bw = tw + 60, bh = (o.size || 46) + (sub ? 44 : 24);
    ctx.shadowColor = 'rgba(2,6,23,0.6)'; ctx.shadowBlur = 20;
    const g = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    g.addColorStop(0, shade(color, 0.55)); g.addColorStop(0.5, color); g.addColorStop(1, shade(color, 0.55));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 12); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, sub ? -12 : 2);
    if (sub) { ctx.font = f(800, 15); ctx.fillText(sub, 0, bh / 2 - 20); }
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Baseball with real 3D seam curve
  // ------------------------------------------------------------------
  function seamPoints(rot, n = 240) {
    const a = 0.74, b = 0.26, c = 2 * Math.sqrt(a * b);
    const [rx, ry, rz] = rot;
    const cX = Math.cos(rx), sX = Math.sin(rx), cY = Math.cos(ry), sY = Math.sin(ry), cZ = Math.cos(rz), sZ = Math.sin(rz);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * TAU;
      let x = a * Math.cos(t) + b * Math.cos(3 * t);
      let y = a * Math.sin(t) - b * Math.sin(3 * t);
      let z = c * Math.sin(2 * t);
      let y1 = y * cX - z * sX, z1 = y * sX + z * cX; y = y1; z = z1;
      let x1 = x * cY + z * sY; z1 = -x * sY + z * cY; x = x1; z = z1;
      x1 = x * cZ - y * sZ; y1 = x * sZ + y * cZ; x = x1; y = y1;
      pts.push({ x, y, z });
    }
    return pts;
  }

  function baseball(ctx, cx, cy, r, rot = [0.5, 0.3, 0], o = {}) {
    ctx.save();
    if (o.shadow) {
      ctx.fillStyle = 'rgba(2,6,23,0.35)';
      ctx.beginPath(); ctx.ellipse(cx + r * 0.15, cy + r * 1.05, r * 0.85, r * 0.22, 0, 0, TAU); ctx.fill();
    }
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.06, cx, cy, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#f6f2ea'); g.addColorStop(0.86, '#e2dccd'); g.addColorStop(1, '#b3aa95');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    if (r >= 5) {
      const pts = seamPoints(rot, r > 40 ? 260 : 90);
      const lw = Math.max(0.9, r * 0.028);
      const stitchEvery = r > 40 ? 4 : 6;
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1], p1 = pts[i];
        if (p0.z < -0.02 || p1.z < -0.02) continue;
        const al = clamp(0.35 + p1.z * 1.4, 0.25, 1);
        ctx.strokeStyle = `rgba(150,25,35,${al})`; ctx.lineWidth = lw * 0.75;
        ctx.beginPath(); ctx.moveTo(cx + p0.x * r, cy + p0.y * r); ctx.lineTo(cx + p1.x * r, cy + p1.y * r); ctx.stroke();
        if (i % stitchEvery === 0 && r > 9) {
          const dx = p1.x - p0.x, dy = p1.y - p0.y, L = Math.hypot(dx, dy) || 1;
          const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
          const sz = r * 0.075 * (0.45 + 0.55 * clamp(p1.z, 0, 1));
          const px = cx + p1.x * r, py = cy + p1.y * r;
          ctx.strokeStyle = `rgba(225,35,45,${al})`; ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(px + nx * sz - ux * sz * 0.6, py + ny * sz - uy * sz * 0.6); ctx.lineTo(px + ux * sz * 0.25, py + uy * sz * 0.25);
          ctx.lineTo(px - nx * sz - ux * sz * 0.6, py - ny * sz - uy * sz * 0.6);
          ctx.stroke();
        }
      }
    }
    const rim = ctx.createRadialGradient(cx, cy, r * 0.72, cx, cy, r);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(70,55,30,0.28)');
    ctx.fillStyle = rim;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    if (o.outline !== false && r < 14) {
      ctx.strokeStyle = 'rgba(15,23,42,0.65)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Cel-shaded 3D player renderer (joint skeleton, local units ≈ 1.45 m / 186u)
  // ------------------------------------------------------------------
  function drawPlayer(ctx, P, o = {}) {
    const T = Object.assign({ x: 0, y: 0, s: 1, face: 1, kit: KIT.LAD, num: '17', view: 'side', headwear: 'cap', gear: null, ball: null, bat: null, alpha: 1 }, o);
    const kit = T.kit;
    const J = Object.assign({}, P);
    J.shG = J.shG || J.sh; J.shT = J.shT || J.sh; J.hipG = J.hipG || J.hip; J.hipT = J.hipT || J.hip;
    const sh = J.sh || mix(J.shG, J.shT, 0.5);
    const hip = J.hip || mix(J.hipG, J.hipT, 0.5);
    const OUT = 'rgba(12,18,34,0.92)';
    const skin = '#f2c29b', skinS = '#cf9466';
    const shadeSet = new Set(J.shade || ['legT', 'armG']);
    const order = J.order || ['legT', 'armG', 'torso', 'legG', 'armT', 'head'];

    ctx.save();
    ctx.globalAlpha *= T.alpha;
    ctx.translate(T.x, T.y);
    ctx.scale(T.s * T.face, T.s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    if (!T.noShadow) {
      const fx = (J.footG[0] + J.footT[0]) / 2;
      ctx.fillStyle = 'rgba(15,23,42,0.3)';
      ctx.beginPath(); ctx.ellipse(fx, 3, Math.abs(J.footG[0] - J.footT[0]) / 2 + 36, 9, 0, 0, TAU); ctx.fill();
    }

    const path = pts => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
    const seg = (pts, w, col) => {
      path(pts); ctx.strokeStyle = OUT; ctx.lineWidth = w + 5; ctx.stroke();
      path(pts); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    };

    const shoe = foot => {
      ctx.save();
      ctx.translate(foot[0], foot[1]);
      if (T.view === 'front') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.ellipse(0, -3, 11, 7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-9, 1, 18, 2.5);
      } else {
        ctx.rotate(foot[1] < -6 ? 0.4 : 0);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.roundRect(-11, -10, 32, 12, 6); ctx.fill();
        ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-8, 0, 27, 2.5);
        ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(11, -7); ctx.stroke();
      }
      ctx.restore();
    };

    const leg = (h, k, ft, dark) => {
      const pantsCol = dark ? shade(kit.pants.length === 7 ? kit.pants : '#f8fafc', 0.84) : kit.pants;
      const sockStart = mix(k, ft, 0.4);
      seg([h, k, sockStart], 22, pantsCol);
      if (T.gear === 'catcher') seg([mix(k, ft, 0.0), mix(k, ft, 0.86)], 20, dark ? '#1e3a8a' : '#2547a8');
      else seg([sockStart, mix(k, ft, 0.9)], 15, dark ? shade(kit.accent, 0.75) : kit.accent);
      shoe(ft);
    };

    const glove = (hd, e) => {
      const ang = Math.atan2(hd[1] - e[1], hd[0] - e[0]);
      ctx.save();
      ctx.translate(hd[0], hd[1]);
      ctx.rotate(ang);
      const big = T.gear === 'catcher' ? 1.25 : 1;
      ctx.scale(big, big);
      const gg = ctx.createRadialGradient(6, -4, 2, 6, 0, 22);
      gg.addColorStop(0, '#e08a2c'); gg.addColorStop(1, '#7c2d12');
      ctx.fillStyle = gg; ctx.strokeStyle = OUT; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(9, 0, 19, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#451a03'; ctx.lineWidth = 1.7;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(12, i * 6); ctx.lineTo(26, i * 6.8); ctx.stroke(); }
      ctx.fillStyle = 'rgba(69,26,3,0.5)';
      ctx.beginPath(); ctx.ellipse(6, 0, 7, 6.5, 0, 0, TAU); ctx.fill();
      ctx.restore();
    };

    const arm = (s, e, hd, dark, isGlove) => {
      seg([s, e], 15, dark ? shade(kit.accent, 0.72) : kit.accent);
      seg([s, mix(s, e, 0.42)], 19, dark ? kit.jerseyShade : kit.jersey);
      seg([e, hd], 12, dark ? skinS : skin);
      if (isGlove && !T.noGlove) glove(hd, e);
      else {
        ctx.fillStyle = T.battingGloves ? (isGlove ? kit.accent : '#ffffff') : (dark ? skinS : skin);
        ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(hd[0], hd[1], 8, 0, TAU); ctx.fill(); ctx.stroke();
      }
    };

    const torso = () => {
      const tw = J.tw || 36;
      const poly = [J.shG, J.shT, J.hipT, J.hipG];
      path(poly); ctx.closePath(); ctx.strokeStyle = OUT; ctx.lineWidth = tw + 5; ctx.stroke();
      const xs = poly.map(p => p[0]);
      const minX = Math.min(...xs) - tw / 2, maxX = Math.max(...xs) + tw / 2;
      const g = ctx.createLinearGradient(minX, 0, maxX, 0);
      g.addColorStop(0, kit.jerseyShade); g.addColorStop(0.45, kit.jersey); g.addColorStop(1, kit.jerseyShade);
      path(poly); ctx.closePath(); ctx.strokeStyle = g; ctx.fillStyle = g; ctx.lineWidth = tw; ctx.stroke(); ctx.fill();
      if (T.gear === 'catcher') {
        path(poly); ctx.closePath(); ctx.strokeStyle = '#1e3a8a'; ctx.fillStyle = '#1e3a8a'; ctx.lineWidth = tw - 8; ctx.stroke(); ctx.fill();
      }
      // belt
      const ax = sh[0] - hip[0], ay = sh[1] - hip[1], L = Math.hypot(ax, ay) || 1;
      const nx = -ay / L, ny = ax / L;
      const half = Math.hypot(J.hipT[0] - J.hipG[0], J.hipT[1] - J.hipG[1]) / 2 + tw / 2 - 1;
      const bx = hip[0] + (ax / L) * 5, by = hip[1] + (ay / L) * 5;
      ctx.strokeStyle = shade(kit.accent, 0.8); ctx.lineWidth = 6.5; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(bx - nx * half, by - ny * half); ctx.lineTo(bx + nx * half, by + ny * half); ctx.stroke();
      ctx.lineCap = 'round';
      if (T.gear === 'catcher') return;
      // number / script
      const c = mix(sh, hip, 0.42);
      const ang = Math.atan2(ay, ax) + Math.PI / 2;
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate(ang);
      ctx.scale(T.face, 1);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (T.view === 'front') {
        ctx.fillStyle = kit.accent; ctx.font = `italic 900 9px ${FONT}`;
        ctx.fillText(kit === KIT.LAD ? 'Dodgers' : 'Padres', 0, -8);
        ctx.fillStyle = kit.num; ctx.font = f(900, 12); ctx.fillText(T.num, 0, 7);
      } else {
        ctx.font = f(900, 21);
        ctx.lineWidth = 3; ctx.strokeStyle = kit === KIT.LAD ? '#ffffff' : kit.accent;
        ctx.strokeText(T.num, 0, 2);
        ctx.fillStyle = kit.num; ctx.fillText(T.num, 0, 2);
      }
      ctx.restore();
    };

    const head = () => {
      const hd = J.head, r = 15;
      seg([sh, mix(sh, hd, 0.62)], 11, skinS);
      const tilt = Math.atan2(hd[1] - sh[1], hd[0] - sh[0]) + Math.PI / 2;
      ctx.save();
      ctx.translate(hd[0], hd[1]);
      ctx.rotate(T.view === 'front' ? 0 : tilt * 0.6);
      const hg = ctx.createRadialGradient(4, -4, 2, 0, 0, r);
      hg.addColorStop(0, '#f8d6b4'); hg.addColorStop(1, skinS);
      ctx.fillStyle = hg; ctx.strokeStyle = OUT; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a';
      if (T.view === 'front') {
        ctx.beginPath(); ctx.arc(-5, 2, 2, 0, TAU); ctx.arc(5, 2, 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(0, 6, 4, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(8, 1, 2, 0, TAU); ctx.fill();
        ctx.fillStyle = skinS; ctx.beginPath(); ctx.ellipse(-3, 3, 3.5, 4.5, 0, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = kit.cap; ctx.strokeStyle = OUT; ctx.lineWidth = 2.4;
      if (T.headwear === 'helmet') {
        ctx.beginPath(); ctx.arc(0, -1, r + 3.5, Math.PI * 0.98, Math.PI * 2.02); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (T.view !== 'front') { ctx.beginPath(); ctx.arc(-3, 2, 9, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = kit.cap;
        if (T.view === 'front') { ctx.beginPath(); ctx.ellipse(0, -2, r + 6, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
        else { ctx.beginPath(); ctx.roundRect(r - 5, -5, 15, 5, 2); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath(); ctx.ellipse(-5, -12, 6, 3.5, -0.4, 0, TAU); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(0, -2, r + 1.5, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (T.view === 'front') { ctx.beginPath(); ctx.ellipse(0, -2, r + 4, 4.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
        else { ctx.beginPath(); ctx.roundRect(r - 4, -5, 16, 5, 2.5); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.ellipse(-5, -11, 5, 3, -0.4, 0, TAU); ctx.fill();
      }
      if (T.gear === 'catcher') {
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(4 + i * 4, -6); ctx.lineTo(6 + i * 4, 12); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(17, 0); ctx.moveTo(2, 7); ctx.lineTo(16, 7); ctx.stroke();
      }
      ctx.save();
      ctx.scale(T.face, 1);
      ctx.fillStyle = '#fff'; ctx.font = f(900, 8); ctx.textAlign = 'center';
      const lx = T.view === 'front' ? 0 : 5 * T.face;
      ctx.fillText(kit.logo, lx, -7);
      ctx.restore();
      ctx.restore();
    };

    const bat = () => {
      if (!T.bat) return;
      const a = T.bat.a, b = T.bat.b;
      const mid = mix(a, b, 0.42);
      seg([a, mid], 6, '#1f2937');
      seg([mid, b], 11, '#c08a4a');
      ctx.strokeStyle = 'rgba(255,240,210,0.55)'; ctx.lineWidth = 3;
      path([mix(a, b, 0.5), mix(a, b, 0.95)]); ctx.stroke();
    };

    const drawn = new Set();
    order.forEach(k => {
      drawn.add(k);
      if (k === 'legT') leg(J.hipT, J.kneeT, J.footT, shadeSet.has('legT'));
      else if (k === 'legG') leg(J.hipG, J.kneeG, J.footG, shadeSet.has('legG'));
      else if (k === 'armG') arm(J.shG, J.elbowG, J.handG, shadeSet.has('armG'), true);
      else if (k === 'armT') arm(J.shT, J.elbowT, J.handT, shadeSet.has('armT'), false);
      else if (k === 'torso') { torso(); if (!order.includes('bat')) bat(); }
      else if (k === 'head') head();
      else if (k === 'bat') bat();
    });
    if (T.ball) baseball(ctx, T.ball[0], T.ball[1], 7.5, [0.4, 0.6, 0.2]);
    ctx.restore();
  }

  function toScreen(o, p) { return [o.x + p[0] * o.s * (o.face || 1), o.y + p[1] * o.s]; }

  // ------------------------------------------------------------------
  // Pose library (facing +x unless noted, feet on y = 0)
  // ------------------------------------------------------------------
  const POSE = {
    // 5-step pitching mechanics (G = glove side / stride leg, T = throwing side / pivot leg)
    pitch: [
      { sh: [-2, -160], hip: [0, -98], kneeT: [3, -50], footT: [0, 0], kneeG: [44, -104], footG: [34, -60], elbowG: [20, -128], handG: [24, -146], elbowT: [12, -124], handT: [20, -142], head: [2, -186] },
      { sh: [-14, -152], hip: [-12, -92], kneeT: [-48, -48], footT: [-70, 0], kneeG: [36, -56], footG: [78, 0], elbowG: [22, -156], handG: [56, -160], elbowT: [-56, -152], handT: [-58, -200], head: [-8, -180] },
      { sh: [8, -150], hip: [4, -90], kneeT: [-36, -44], footT: [-58, -4], kneeG: [50, -54], footG: [82, 0], elbowG: [30, -126], handG: [18, -136], elbowT: [-22, -160], handT: [-28, -206], head: [16, -176] },
      { sh: [42, -136], hip: [18, -80], kneeT: [-8, -40], footT: [-42, -14], kneeG: [60, -50], footG: [84, 0], elbowG: [44, -106], handG: [34, -120], elbowT: [72, -160], handT: [104, -176], head: [58, -158] },
      { sh: [58, -120], hip: [30, -78], kneeT: [44, -40], footT: [28, -4], kneeG: [80, -48], footG: [92, 0], elbowG: [56, -98], handG: [44, -112], elbowT: [84, -90], handT: [76, -56], head: [74, -138] }
    ],
    stance: { footG: [44, 0], kneeG: [36, -46], footT: [-40, 0], kneeT: [-34, -46], hip: [0, -90], sh: [-6, -148], head: [2, -174], elbowG: [14, -128], handG: [-16, -150], elbowT: [-40, -136], handT: [-20, -156], order: ['legT', 'armT', 'torso', 'legG', 'bat', 'armG', 'head'], shade: ['legT', 'armT'] },
    follow: { footG: [44, 0], kneeG: [40, -46], footT: [-30, -6], kneeT: [-12, -44], hip: [4, -90], sh: [14, -146], head: [24, -170], elbowG: [40, -140], handG: [22, -176], elbowT: [18, -136], handT: [26, -172], order: ['legT', 'armT', 'torso', 'legG', 'bat', 'armG', 'head'], shade: ['legT', 'armT'] },
    catcher: { footG: [30, 0], kneeG: [42, -38], footT: [-22, 0], kneeT: [-6, -40], hip: [-14, -50], sh: [4, -110], head: [16, -132], elbowG: [34, -92], handG: [56, -96], elbowT: [16, -82], handT: [28, -66], tw: 40, order: ['legT', 'armT', 'torso', 'legG', 'armG', 'head'], shade: ['legT', 'armT'] },
    // front view
    ready: { shG: [-20, -128], shT: [20, -128], hipG: [-12, -74], hipT: [12, -74], kneeG: [-22, -38], kneeT: [22, -38], footG: [-26, 0], footT: [26, 0], elbowG: [-30, -96], handG: [-24, -72], elbowT: [30, -96], handT: [24, -72], head: [0, -152], tw: 30, order: ['legT', 'legG', 'torso', 'armT', 'armG', 'head'], shade: [] },
    squat: { shG: [24, -112], shT: [-24, -112], hipG: [20, -60], hipT: [-20, -60], kneeG: [58, -46], kneeT: [-58, -46], footG: [50, 0], footT: [-50, 0], elbowG: [26, -60], handG: [2, 16], elbowT: [-26, -66], handT: [-2, -24], head: [0, -140], tw: 32, order: ['legT', 'legG', 'torso', 'armT', 'armG', 'head'], shade: [] },
    high: { shG: [24, -122], shT: [-24, -122], hipG: [14, -66], hipT: [-14, -66], kneeG: [22, -34], kneeT: [-22, -34], footG: [28, 0], footT: [-28, 0], elbowG: [36, -158], handG: [12, -184], elbowT: [-34, -156], handT: [-8, -178], head: [0, -146], tw: 30, order: ['legT', 'legG', 'torso', 'armT', 'armG', 'head'], shade: [] },
    low: { shG: [24, -104], shT: [-24, -104], hipG: [16, -56], hipT: [-16, -56], kneeG: [42, -34], kneeT: [-42, -34], footG: [40, 0], footT: [-40, 0], elbowG: [30, -56], handG: [8, -14], elbowT: [-30, -60], handT: [-8, -22], head: [0, -128], tw: 30, order: ['legT', 'legG', 'torso', 'armT', 'armG', 'head'], shade: [] },
    straddle: { shG: [-22, -110], shT: [22, -110], hipG: [-18, -58], hipT: [18, -58], kneeG: [-50, -40], kneeT: [50, -40], footG: [-40, 0], footT: [40, 0], elbowG: [-44, -50], handG: [-52, -6], elbowT: [-10, -62], handT: [-34, -22], head: [0, -136], tw: 32, order: ['legT', 'legG', 'torso', 'armT', 'armG', 'head'], shade: [] },
    // side view fielding / running
    stretch: { footT: [0, 0], kneeT: [10, -46], hip: [24, -86], kneeG: [64, -50], footG: [102, 0], sh: [54, -136], head: [70, -156], elbowG: [88, -132], handG: [120, -128], elbowT: [46, -106], handT: [58, -92], order: ['legT', 'armT', 'torso', 'legG', 'armG', 'head'], shade: ['legT', 'armT'] },
    catchC: { footG: [32, 0], kneeG: [36, -46], footT: [-30, 0], kneeT: [-26, -46], hip: [0, -90], sh: [8, -148], head: [16, -172], elbowG: [34, -128], handG: [42, -138], elbowT: [30, -122], handT: [38, -134] },
    hop: { footT: [8, -16], kneeT: [0, -58], footG: [52, -12], kneeG: [48, -58], hip: [10, -100], sh: [4, -158], head: [8, -184], elbowG: [26, -130], handG: [24, -142], elbowT: [16, -128], handT: [22, -140] },
    slide: { hip: [0, -22], sh: [-66, -46], head: [-86, -60], kneeG: [48, -24], footG: [98, -8], kneeT: [40, -12], footT: [14, -6], elbowG: [-58, -86], handG: [-44, -112], elbowT: [-80, -82], handT: [-70, -110], tw: 34, order: ['armT', 'legT', 'torso', 'legG', 'armG', 'head'], shade: ['armT', 'legT'] },
    runA: { footG: [46, -10], kneeG: [38, -60], footT: [-40, -22], kneeT: [-12, -48], hip: [0, -92], sh: [16, -148], head: [26, -172], elbowG: [-14, -124], handG: [-6, -102], elbowT: [36, -122], handT: [46, -140] },
    runB: { footT: [46, -10], kneeT: [38, -60], footG: [-40, -22], kneeG: [-12, -48], hip: [0, -92], sh: [16, -148], head: [26, -172], elbowT: [-14, -124], handT: [-6, -102], elbowG: [36, -122], handG: [46, -140] }
  };

  function blendPose(A, B, t) {
    const out = {};
    Object.keys(A).forEach(k => {
      if (Array.isArray(A[k]) && typeof A[k][0] === 'number' && B[k]) out[k] = mix(A[k], B[k], t);
      else out[k] = A[k];
    });
    return out;
  }
  function runPose(phase) { return blendPose(POSE.runA, POSE.runB, (Math.sin(phase) + 1) / 2); }

  return {
    W, H, TAU, FONT, f, lerp, clamp, ease, hash, mix, stripTags, shade, KIT, POSE,
    prep, visible, wrapLines, arrowHead, glowLine, stadium, dirtPatch, dirtBand,
    scorebug, liveTag, lowerThird, callout, panel, statRows, stamp,
    seamPoints, baseball, drawPlayer, toScreen, blendPose, runPose
  };
})();

/* =====================================================================
 * Part 2: Broadcast Scene Renderers & Interactive Overrides
 * ===================================================================== */
(() => {
  'use strict';
  const A = ACAD;
  const { W, H, TAU, f, lerp, clamp, ease, mix, stripTags, KIT, POSE } = A;

  // Store clickable zones for interactive canvas targeting
  let lastPitchZoneRect = null;
  let lastMechStepPills = [];

  // Shared helper: draw sculpted anatomical finger capsule over ball
  function drawFinger(ctx, pts, width, tipColor, label) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Outer shadow/outline
    ctx.strokeStyle = 'rgba(15,23,42,0.85)';
    ctx.lineWidth = width + 5;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();

    // Skin gradient fill
    const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1]);
    g.addColorStop(0, '#d89b6e');
    g.addColorStop(0.6, '#f2c29b');
    g.addColorStop(1, '#fbd6b6');
    ctx.strokeStyle = g;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();

    // Knuckle creases
    for (let i = 1; i < pts.length - 1; i++) {
      ctx.strokeStyle = 'rgba(140,75,35,0.45)';
      ctx.lineWidth = 1.6;
      const dx = pts[i + 1][0] - pts[i - 1][0], dy = pts[i + 1][1] - pts[i - 1][1];
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      ctx.beginPath();
      ctx.moveTo(pts[i][0] - nx * width * 0.28, pts[i][1] - ny * width * 0.28);
      ctx.lineTo(pts[i][0] + nx * width * 0.28, pts[i][1] + ny * width * 0.28);
      ctx.stroke();
    }

    // Fingertip nail & pressure pad highlight
    const tip = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
    ctx.save();
    ctx.translate(tip[0], tip[1]);
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(255,245,235,0.75)';
    ctx.beginPath();
    ctx.ellipse(2, 0, width * 0.24, width * 0.3, 0, 0, TAU);
    ctx.fill();
    if (tipColor) {
      ctx.strokeStyle = tipColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, width * 0.56, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = tipColor;
      ctx.globalAlpha = 0.28;
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();

    if (label) {
      const tipPt = pts[pts.length - 1];
      A.callout(ctx, tipPt[0], tipPt[1], label.lx, label.ly, label.text, tipColor || '#38bdf8', { size: 13.5 });
    }
  }

  // ------------------------------------------------------------------
  // 1A. PITCH GRIP & PALM GAP LAB (Broadcast 3D)
  // ------------------------------------------------------------------
  function renderBroadcastGrip() {
    const ctx = A.prep('gripCanvas');
    if (!ctx) return;

    const pKey = typeof currentPitch !== 'undefined' ? currentPitch : '4seam';
    const info = (typeof pitchData !== 'undefined' && pitchData[pKey]) || {
      title: '四縫線直球', defaultSpeed: 88, defaultRpm: 1900, color: '#ef4444', tip: ''
    };

    // Dodger Stadium daytime broadcast background + dark studio lens contrast
    A.stadium(ctx, { horizon: 300, stripes: 'radial' });
    const veil = ctx.createRadialGradient(280, 235, 70, 480, 270, 560);
    veil.addColorStop(0, 'rgba(10, 20, 44, 0.42)');
    veil.addColorStop(1, 'rgba(6, 13, 28, 0.72)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, W, H);

    // Top HUD
    const shortTitle = info.title.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').split('(')[0].trim();
    A.scorebug(ctx, shortTitle, `${info.defaultSpeed} km/h • ${info.defaultRpm} RPM`, {
      team: 'LAD', tag: 'GRIP LAB', accent: info.color
    });
    A.liveTag(ctx, '3D 縫線握法 ＆ 掌心透視');

    // LEFT STAGE: Giant 3D Baseball + Anatomical Grip
    const bx = 276, by = 232, br = 104;
    // Glowing broadcast focus ring
    const ring = ctx.createRadialGradient(bx, by, br * 0.8, bx, by, br * 1.48);
    ring.addColorStop(0, 'rgba(56,189,248,0.22)');
    ring.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.fillStyle = ring;
    ctx.beginPath(); ctx.arc(bx, by, br * 1.48, 0, TAU); ctx.fill();

    // Pitch-specific 3D seam rotation
    const rotMap = {
      '4seam': [0.22, 0.35, 0.08],
      '2seam': [0.16, 1.48, 0.04],
      'changeup': [0.42, 1.05, 0.35],
      'curve': [0.24, -0.95, 0.28]
    };
    A.baseball(ctx, bx, by, br, rotMap[pKey] || [0.25, 0.4, 0.05], { shadow: true });

    // Spin axis pole & rotation curve
    ctx.save();
    ctx.strokeStyle = 'rgba(250,204,21,0.7)';
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2.4;
    const axisAng = pKey === '4seam' ? 0 : pKey === '2seam' ? -0.45 : pKey === 'curve' ? 0.55 : -0.2;
    const ax1 = [bx - Math.cos(axisAng) * (br + 36), by - Math.sin(axisAng) * (br + 36)];
    const ax2 = [bx + Math.cos(axisAng) * (br + 36), by + Math.sin(axisAng) * (br + 36)];
    ctx.beginPath(); ctx.moveTo(ax1[0], ax1[1]); ctx.lineTo(ax2[0], ax2[1]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Draw fingers tailored to each pitch grip
    if (pKey === '4seam') {
      // Thumb under bottom
      drawFinger(ctx, [[bx - 16, by + br + 34], [bx - 4, by + br + 8], [bx + 6, by + br - 16]], 24, '#f59e0b',
        { lx: 108, ly: 344, text: '大拇指正下方穩托' });
      // Index & Middle across horizontal horseshoe seam
      drawFinger(ctx, [[bx - 42, by - br - 36], [bx - 34, by - br + 12], [bx - 30, by - 22]], 25, '#3b82f6',
        { lx: 108, ly: 108, text: '食指：跨壓馬蹄縫線' });
      drawFinger(ctx, [[bx + 34, by - br - 38], [bx + 30, by - br + 10], [bx + 26, by - 20]], 26, '#10b981',
        { lx: 432, ly: 108, text: '中指：分開一指寬扣線' });
      // Gap gauge between index & middle
      ctx.save();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(bx - 16, by - 58); ctx.lineTo(bx + 12, by - 58); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.font = f(800, 12); ctx.textAlign = 'center';
      ctx.fillText('↔ 留一指寬', bx - 2, by - 66);
      ctx.restore();
    } else if (pKey === '2seam') {
      drawFinger(ctx, [[bx - 12, by + br + 34], [bx + 2, by + br + 6], [bx + 10, by + br - 16]], 24, '#f59e0b',
        { lx: 112, ly: 368, text: '大拇指微偏內側托球' });
      drawFinger(ctx, [[bx - 28, by - br - 34], [bx - 24, by - br + 16], [bx - 22, by - 16]], 24, '#3b82f6',
        { lx: 118, ly: 120, text: '食指：順貼左平行縫線' });
      drawFinger(ctx, [[bx + 20, by - br - 36], [bx + 18, by - br + 14], [bx + 16, by - 16]], 25, '#10b981',
        { lx: 432, ly: 120, text: '中指：順貼右平行縫線' });
    } else if (pKey === 'changeup') {
      drawFinger(ctx, [[bx - 48, by + 54], [bx - 62, by + 20], [bx - 52, by - 4]], 23, '#f59e0b',
        { lx: 102, ly: 348, text: '拇指與食指扣成 C 字環' });
      drawFinger(ctx, [[bx - 36, by - br - 28], [bx - 30, by - br + 16], [bx - 28, by - 18]], 23, '#3b82f6');
      drawFinger(ctx, [[bx + 6, by - br - 36], [bx + 6, by - br + 12], [bx + 4, by - 26]], 24, '#10b981',
        { lx: 280, ly: 96, text: '三指平均分散在球上方' });
      drawFinger(ctx, [[bx + 48, by - br - 22], [bx + 42, by - br + 20], [bx + 36, by - 12]], 21, '#a855f7');
    } else {
      drawFinger(ctx, [[bx - 22, by + br + 34], [bx - 8, by + br + 6], [bx + 4, by + br - 16]], 24, '#f59e0b',
        { lx: 112, ly: 368, text: '大拇指穩定下托' });
      drawFinger(ctx, [[bx - 8, by - br - 32], [bx - 4, by - br + 16], [bx + 2, by - 16]], 24, '#3b82f6',
        { lx: 118, ly: 120, text: '食指緊靠中指旁輔助' });
      drawFinger(ctx, [[bx + 38, by - br - 34], [bx + 36, by - br + 14], [bx + 34, by - 10]], 25, '#a855f7',
        { lx: 434, ly: 120, text: '中指緊扣右側長縫線下撥' });
    }

    // Spin indicator badge
    const spinText = pKey === '4seam' ? '↻ 強烈正後旋 (上浮力 MAX)' :
                     pKey === '2seam' ? '↘ 側傾斜旋 (內角下沉)' :
                     pKey === 'changeup' ? '🐢 低轉速 (減速急墜)' : '↺ 高速前旋 (大弧度暴墜)';
    A.callout(ctx, bx, by + 26, bx, by + br + 36, spinText, info.color, { size: 13 });

    // RIGHT PANEL: Side Profile X-Ray (Palm Ping-Pong Ball Gap)
    const px = 562, py = 74, pw = 382, ph = 336;
    A.panel(ctx, px, py, pw, ph, pKey === 'changeup' ? '🔍 側面透視：深塞掌心減速法' : '🔍 側面透視：掌心乒乓球空隙圖', info.color);

    const cx = px + 185, cy = py + 178;
    // Draw baseball side profile
    A.baseball(ctx, cx + 36, cy - 10, 62, [0.4, 0.9, 0.2], { shadow: false });

    // Draw anatomical palm profile wrapping from left/bottom
    ctx.save();
    const palmOffset = pKey === 'changeup' ? 0 : -40; // Gap vs deep palm
    ctx.fillStyle = '#e7b185';
    ctx.strokeStyle = 'rgba(15,23,42,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 105, cy + 92);
    ctx.quadraticCurveTo(cx - 115 + palmOffset * 0.2, cy + 12, cx - 52 + palmOffset * 0.55, cy - 42);
    ctx.quadraticCurveTo(cx - 18 + palmOffset * 0.4, cy - 88, cx + 52, cy - 78);
    ctx.lineTo(cx + 66, cy - 68);
    ctx.quadraticCurveTo(cx + 12, cy - 64, cx - 22 + palmOffset * 0.55, cy - 22);
    ctx.quadraticCurveTo(cx - 32 + palmOffset * 0.65, cy + 28, cx + 10, cy + 56);
    ctx.lineTo(cx + 46, cy + 58);
    ctx.quadraticCurveTo(cx + 52, cy + 78, cx + 22, cy + 82);
    ctx.quadraticCurveTo(cx - 38, cy + 88, cx - 64, cy + 104);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (pKey === 'changeup') {
      // Friction glow between palm & ball
      ctx.save();
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(cx + 36, cy - 10, 66, Math.PI * 0.75, Math.PI * 1.35); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#6ee7b7'; ctx.font = f(800, 14); ctx.textAlign = 'center';
      ctx.fillText('💥 球塞進掌心增加摩擦', cx + 4, cy + 114);
      ctx.fillStyle = '#94a3b8'; ctx.font = f(600, 12.5);
      ctx.fillText('球速自然慢 15 km/h 騙打者揮空！', cx + 4, cy + 135);
      ctx.restore();
    } else {
      // Glowing Ping-Pong Ball in the gap!
      const ppx = cx - 40, ppy = cy - 4, ppr = 21;
      const pg = ctx.createRadialGradient(ppx - 6, ppy - 6, 3, ppx, ppy, ppr);
      pg.addColorStop(0, '#fff7ed');
      pg.addColorStop(0.55, '#fb923c');
      pg.addColorStop(1, '#c2410c');
      ctx.save();
      ctx.fillStyle = pg;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(ppx, ppy, ppr, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.font = f(900, 10.5); ctx.textAlign = 'center';
      ctx.fillText('🏓 乒乓球', ppx, ppy + 4);
      ctx.restore();

      A.callout(ctx, ppx, ppy - ppr, cx - 32, py + 72, '✅ 掌心留一指寬空隙！', '#38bdf8', { size: 13 });
      ctx.fillStyle = '#bae6fd'; ctx.font = f(700, 13); ctx.textAlign = 'center';
      ctx.fillText('手指才能全力扣壓縫線，球才投得快！', cx + 4, cy + 124);
    }

    // Bottom Broadcast Lower-Third
    A.lowerThird(ctx, info.title, stripTags(info.tip), info.color, { tag: 'STATCAST GRIP LAB' });
  }

  // ------------------------------------------------------------------
  // 1B. DUAL-CAMERA STATCAST PITCH SIMULATOR
  // ------------------------------------------------------------------
  function renderBroadcastPitchSim() {
    const ctx = A.prep('pitchSimCanvas');
    if (!ctx) return;

    if (typeof simulateLabPitchPhysics === 'function' && (!pitchLabPoints || pitchLabPoints.length === 0)) {
      simulateLabPitchPhysics();
    }

    const pKey = typeof currentPitch !== 'undefined' ? currentPitch : '4seam';
    const info = (typeof pitchData !== 'undefined' && pitchData[pKey]) || { title: '四縫線直球', color: '#ef4444', defaultSpeed: 88, defaultRpm: 1900 };
    const spdEl = document.getElementById('slider-pitch-speed');
    const rpmEl = document.getElementById('slider-pitch-rpm');
    const spd = spdEl ? Number(spdEl.value) : info.defaultSpeed;
    const rpm = rpmEl ? Number(rpmEl.value) : info.defaultRpm;
    const pts = pitchLabPoints || [];
    const gpts = pitchLabGravityPoints || [];
    const curIdx = clamp(typeof pitchLabAnimIdx === 'number' ? pitchLabAnimIdx : pts.length - 1, 0, Math.max(0, pts.length - 1));

    const platePt = pts.find(p => p.y >= 14.0) || pts[pts.length - 1] || { x: 0, y: 14, z: 0.7, bounced: false };
    const gravPlatePt = gpts.find(p => p.y >= 14.0) || gpts[gpts.length - 1] || { x: 0, y: 14, z: 0.55 };
    const liftCm = Math.round((platePt.z - gravPlatePt.z) * 100);
    const breakCm = Math.round((platePt.x - gravPlatePt.x) * 100);

    // Sync external telemetry badges if present
    const tSpd = document.getElementById('tele-pitch-spd');
    const tRpm = document.getElementById('tele-pitch-rpm');
    const tLift = document.getElementById('tele-pitch-lift');
    if (tSpd) tSpd.textContent = `${spd} km/h`;
    if (tRpm) tRpm.textContent = `${rpm} RPM`;
    if (tLift) tLift.textContent = `${liftCm >= 0 ? '+' : ''}${liftCm} cm`;

    // ---- LEFT CAMERA: MOUND-TO-PLATE SIDE BROADCAST (0..552) ----
    const splitX = 552;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, splitX, H); ctx.clip();
    A.stadium(ctx, { horizon: 242, cx: 276, stripes: 'horiz' });

    const groundY = 398;
    // Infield grass & dirt strip
    ctx.fillStyle = '#1fa34a';
    ctx.fillRect(0, 242, splitX, groundY - 242);
    // Dirt lane mound to home
    const lane = ctx.createLinearGradient(0, groundY - 14, 0, H);
    lane.addColorStop(0, '#c47a3d'); lane.addColorStop(1, '#8b4513');
    ctx.fillStyle = lane;
    ctx.fillRect(0, groundY - 8, splitX, H - groundY + 8);
    // Dirt mound & plate circles
    A.dirtPatch(ctx, 84, groundY, 54, 15);
    A.dirtPatch(ctx, 474, groundY + 4, 62, 16);

    const mapSideX = y => 84 + (y / 14.2) * 380;
    const mapSideY = z => groundY - (z / 2.2) * 185;

    // White pitching rubber & home plate
    ctx.fillStyle = '#fff';
    ctx.fillRect(mapSideX(0) - 10, groundY - 4, 20, 4);
    ctx.fillRect(mapSideX(14.0) - 9, groundY - 2, 18, 4);

    // Distance ticks
    ctx.fillStyle = '#fef3c7'; ctx.font = f(800, 11.5); ctx.textAlign = 'center';
    [[0, '0m 投手板'], [5, '5m'], [10, '10m'], [14, '14m 本壘']].forEach(([m, lbl]) => {
      const mx = mapSideX(m);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(mx, groundY); ctx.lineTo(mx, groundY + 10); ctx.stroke();
      ctx.fillText(lbl, mx, groundY + 24);
    });

    // Side-view Strike Zone box at 14m
    const szTop = mapSideY(1.06), szBot = mapSideY(0.42);
    ctx.strokeStyle = 'rgba(244,63,94,0.85)'; ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(244,63,94,0.16)';
    ctx.fillRect(mapSideX(14.0) - 6, szTop, 12, szBot - szTop);
    ctx.strokeRect(mapSideX(14.0) - 6, szTop, 12, szBot - szTop);

    // #17 Dodgers Pitcher on mound & Catcher behind plate
    const animFrac = pts.length > 1 ? curIdx / (pts.length - 1) : 1;
    const pPose = animFrac < 0.15 ? POSE.pitch[2] : (animFrac < 0.35 ? POSE.pitch[3] : POSE.pitch[4]);
    A.drawPlayer(ctx, pPose, { x: 80, y: groundY - 2, s: 0.6, kit: KIT.LAD, num: '17' });
    A.drawPlayer(ctx, POSE.catcher, { x: 518, y: groundY + 2, s: 0.62, face: -1, kit: KIT.SD, gear: 'catcher', headwear: 'helmet' });

    // Gravity-only reference parabola (dashed white)
    if (gpts.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2.2; ctx.setLineDash([6, 5]);
      ctx.beginPath();
      gpts.forEach((p, i) => {
        const px = mapSideX(p.y), py = Math.min(groundY, mapSideY(p.z));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Active Magnus trajectory ribbon
    if (pts.length > 1) {
      const ribbon = [];
      for (let i = 0; i <= curIdx; i++) {
        ribbon.push([mapSideX(pts[i].y), mapSideY(pts[i].z)]);
        if (pts[i].bounced && i > 0 && !pts[i - 1].bounced) {
          // Dirt bounce splash starburst
          const bx = mapSideX(pts[i].y), by = groundY;
          ctx.fillStyle = '#fbbf24';
          for (let k = 0; k < 6; k++) {
            const ang = -Math.PI * (0.15 + 0.7 * (k / 5));
            ctx.beginPath(); ctx.arc(bx + Math.cos(ang) * 14, by + Math.sin(ang) * 14, 2.5, 0, TAU); ctx.fill();
          }
        }
      }
      A.glowLine(ctx, ribbon, info.color, 4);
      const cur = pts[curIdx];
      A.baseball(ctx, mapSideX(cur.y), mapSideY(cur.z), 9, [curIdx * 0.4, 0.5, 0.2]);
    }

    // Legend inside side cam
    ctx.fillStyle = 'rgba(10,20,42,0.85)';
    ctx.beginPath(); ctx.roundRect(14, 78, 224, 50, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(24, 95); ctx.lineTo(52, 95); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#e2e8f0'; ctx.font = f(700, 11.5); ctx.textAlign = 'left';
    ctx.fillText('無旋轉純重力拋物線', 58, 99);
    ctx.strokeStyle = info.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(24, 114); ctx.lineTo(52, 114); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('Statcast 真實軌跡', 58, 118);

    ctx.restore();

    // Broadcast split divider
    ctx.fillStyle = '#0f172a'; ctx.fillRect(splitX - 2, 0, 6, H);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(splitX, 0, 2, H);

    // ---- RIGHT CAMERA: UMPIRE / CATCHER 3D POV (556..960) ----
    ctx.save();
    ctx.beginPath(); ctx.rect(splitX + 4, 0, W - splitX - 4, H); ctx.clip();
    const rx = 758;
    // Bright sky & distant stadium behind mound
    const sky = ctx.createLinearGradient(0, 0, 0, 210);
    sky.addColorStop(0, '#1e40af'); sky.addColorStop(0.55, '#60a5fa'); sky.addColorStop(1, '#dbeafe');
    ctx.fillStyle = sky; ctx.fillRect(splitX + 4, 0, W - splitX, 210);
    // Outfield stands & green wall
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(splitX + 4, 150, W - splitX, 42);
    ctx.fillStyle = '#166534'; ctx.fillRect(splitX + 4, 188, W - splitX, 22);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(splitX + 4, 188); ctx.lineTo(W, 188); ctx.stroke();

    // Sunlit green field & home plate dirt circle
    const field = ctx.createLinearGradient(0, 210, 0, H);
    field.addColorStop(0, '#22c55e'); field.addColorStop(0.55, '#16a34a'); field.addColorStop(1, '#15803d');
    ctx.fillStyle = field; ctx.fillRect(splitX + 4, 210, W - splitX, H - 210);

    // Distant pitcher mound + tiny pitcher facing camera
    A.dirtPatch(ctx, rx, 246, 36, 10);
    A.drawPlayer(ctx, POSE.ready, { x: rx, y: 245, s: 0.25, view: 'front', kit: KIT.LAD, num: '17', noShadow: true });

    // Foreground home dirt
    const hg = ctx.createRadialGradient(rx, 405, 40, rx, 405, 220);
    hg.addColorStop(0, '#c87e42'); hg.addColorStop(1, '#9a5424');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.ellipse(rx, 412, 230, 110, 0, 0, TAU); ctx.fill();

    // White chalk batter's boxes & home plate
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2.2;
    ctx.strokeRect(rx - 145, 368, 72, 72);
    ctx.strokeRect(rx + 73, 368, 72, 72);
    // White 5-sided home plate
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx - 30, 400); ctx.lineTo(rx + 30, 400);
    ctx.lineTo(rx + 32, 412); ctx.lineTo(rx, 426); ctx.lineTo(rx - 32, 412);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Batter in Left Box (RHB) looking at incoming pitch
    A.drawPlayer(ctx, POSE.stance, {
      x: rx - 110, y: 406, s: 0.85, face: 1, kit: KIT.SD, num: '23',
      headwear: 'helmet', battingGloves: true, bat: { a: [-16, -152], b: [-64, -206] }
    });

    // 3D Ruby Glass Strike Zone (3x3 clickable grid + Dirt Bounce Box)
    const zw = 114, zh = 144;
    const zx = rx - zw / 2, zy = 222;
    const dirtY = zy + zh + 10, dirtH = 34;
    lastPitchZoneRect = { zx, zy, zw, zh, dirtY, dirtH };

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
    ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.roundRect(zx, zy, zw, zh, 6); ctx.fill(); ctx.stroke();

    const cw = zw / 3, ch = zh / 3;
    const curCol = typeof aimCol !== 'undefined' ? aimCol : 1;
    const curRow = typeof aimRow !== 'undefined' ? aimRow : 1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cxCell = zx + c * cw, cyCell = zy + r * ch;
        const isSel = (curRow < 3 && curCol === c && curRow === r);
        ctx.strokeStyle = isSel ? '#facc15' : 'rgba(248, 250, 252, 0.25)';
        ctx.lineWidth = isSel ? 2.5 : 1;
        if (isSel) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.36)';
          ctx.fillRect(cxCell + 1, cyCell + 1, cw - 2, ch - 2);
        }
        ctx.strokeRect(cxCell, cyCell, cw, ch);
      }
    }
    // Dirt bounce zone button directly on canvas
    const isDirtSel = (curRow === 3);
    ctx.fillStyle = isDirtSel ? 'rgba(245, 158, 11, 0.4)' : 'rgba(15, 23, 42, 0.55)';
    ctx.strokeStyle = isDirtSel ? '#facc15' : 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = isDirtSel ? 2.5 : 1.5;
    ctx.setLineDash(isDirtSel ? [] : [5, 4]);
    ctx.beginPath(); ctx.roundRect(zx, dirtY, zw, dirtH, 6); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fde68a'; ctx.font = f(800, 11.5); ctx.textAlign = 'center';
    ctx.fillText('💥 點此瞄準挖地瓜', rx, dirtY + 21);
    ctx.restore();

    // Map incoming pitch onto 3D catcher POV
    const mapZoneX = x => rx + (x / 0.36) * (zw / 2);
    const mapZoneY = z => zy + zh - ((clamp(z, -0.32, 1.25) - 0.36) / 0.72) * zh;

    if (pts.length > 1) {
      const trail = [];
      for (let i = Math.max(0, curIdx - 28); i <= curIdx; i++) {
        const p = pts[i];
        const t = clamp(p.y / 14.0, 0, 1);
        const px = lerp(rx, mapZoneX(p.x), Math.pow(t, 0.75));
        const py = lerp(218, mapZoneY(p.z), Math.pow(t, 0.75));
        trail.push([px, py]);
      }
      A.glowLine(ctx, trail, info.color, 3.5);
      const cur = pts[curIdx];
      const t = clamp(cur.y / 14.0, 0, 1);
      const bxPov = lerp(rx, mapZoneX(cur.x), Math.pow(t, 0.75));
      const byPov = lerp(218, mapZoneY(cur.z), Math.pow(t, 0.75));
      A.baseball(ctx, bxPov, byPov, 4.5 + t * 9.5, [curIdx * 0.45, 0.4, 0.2]);
    }

    // Top-right Statcast Telemetry HUD inside POV cam
    A.panel(ctx, 744, 52, 200, 120, '📡 STATCAST 進壘數據', info.color);
    const isStrike = !platePt.bounced && Math.abs(platePt.x) <= 0.33 && platePt.z >= 0.38 && platePt.z <= 1.06;
    A.statRows(ctx, 756, 98, 176, [
      ['垂直變化', `${liftCm >= 0 ? '+' : ''}${liftCm} cm`, liftCm >= 0 ? '#38bdf8' : '#f59e0b'],
      ['水平位移', `${breakCm >= 0 ? '+' : ''}${breakCm} cm`, '#a78bfa'],
      ['進壘好壞', platePt.bounced ? '💥 挖地瓜' : (isStrike ? '🔥 好球 Strike' : '⚪ 壞球 Ball'),
        platePt.bounced ? '#fbbf24' : (isStrike ? '#4ade80' : '#94a3b8')]
    ]);

    ctx.restore();

    // Global Top HUD + Lower Third
    A.scorebug(ctx, info.title.split('(')[0].trim(), `${spd} km/h • ${rpm} RPM`, {
      team: 'LAD', tag: 'PITCH LAB', accent: info.color
    });
    A.liveTag(ctx, '雙鏡頭 STATCAST', { x: 540 });
    A.liveTag(ctx, '點擊九宮格瞄準', { x: 944, y: 14 });

    const descEl = document.getElementById('pitch-flight-desc');
    const summaryText = descEl ? stripTags(descEl.textContent) : '';
    const ltTitle = platePt.bounced
      ? '💥 挖地瓜反彈物理 (紅土恢復係數 e = 0.46)'
      : `🌪️ 馬格努斯空力：${liftCm >= 0 ? '抗重力上浮 +' + liftCm : '進壘下墜 ' + liftCm} cm`;
    A.lowerThird(ctx, ltTitle, summaryText, info.color, { tag: 'STATCAST PITCHING', marginRight: 122 });
  }

  // ------------------------------------------------------------------
  // 1C. 5-STEP PITCHING MECHANICS (Broadcast Dodgers #17 Breakdown)
  // ------------------------------------------------------------------
  function renderBroadcastMechanics() {
    const ctx = A.prep('mechanicsCanvas');
    if (!ctx) return;

    const stepIdx = typeof pitchStepIdx !== 'undefined' ? clamp(pitchStepIdx, 0, 4) : 0;
    const stepColors = ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];
    const col = stepColors[stepIdx];
    const stepNames = ['站穩抬腿平衡', '跨步展翅成 90° L 型', '轉腰帶動手肘鞭打', '最高點放球扣腕', '收尾減速變防守'];
    const stepInfo = (typeof pitchStepsInfo !== 'undefined' && pitchStepsInfo[stepIdx]) || {
      title: `步驟 ${stepIdx + 1}：${stepNames[stepIdx]}`, caption: ''
    };

    A.stadium(ctx, { horizon: 245, cx: 480, stripes: 'horiz' });
    // Pitcher's mound dirt foreground
    const fg = ctx.createLinearGradient(0, 340, 0, H);
    fg.addColorStop(0, '#c47a3d'); fg.addColorStop(1, '#8b4513');
    ctx.fillStyle = fg; ctx.fillRect(0, 370, W, H - 370);
    A.dirtPatch(ctx, 430, 385, 290, 48);

    // White pitching rubber
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
    ctx.fillRect(344, 380, 44, 8); ctx.strokeRect(344, 380, 44, 8);

    // Direction arrow toward home plate
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = f(800, 14); ctx.textAlign = 'right';
    ctx.fillText('往本壘捕手方向 ➔', 920, 392);

    // Top HUD
    A.scorebug(ctx, `步驟 ${stepIdx + 1}/5：${stepNames[stepIdx]}`, '小四護手投球機制分解', {
      team: 'LAD', tag: '#17 OHTANI', accent: col
    });

    // Top-right clickable 5-step pills strip
    lastMechStepPills = [];
    const pillW = 54, pillGap = 6, startX = W - 16 - (5 * pillW + 4 * pillGap);
    for (let i = 0; i < 5; i++) {
      const px = startX + i * (pillW + pillGap), py = 18, ph = 28;
      lastMechStepPills.push({ x: px, y: py, w: pillW, h: ph, idx: i });
      const active = (i === stepIdx);
      ctx.fillStyle = active ? stepColors[i] : 'rgba(10,20,42,0.86)';
      ctx.strokeStyle = active ? '#ffffff' : 'rgba(148,163,184,0.45)';
      ctx.lineWidth = active ? 2.2 : 1;
      ctx.beginPath(); ctx.roundRect(px, py, pillW, ph, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? '#0f172a' : '#e2e8f0';
      ctx.font = f(900, 12.5); ctx.textAlign = 'center';
      ctx.fillText(`S${i + 1}`, px + pillW / 2, py + 18);
    }

    // Draw Ghost previous step + Main #17 Pitcher
    const T = { x: 410, y: 384, s: 1.44, kit: KIT.LAD, num: '17' };
    if (stepIdx > 0) {
      A.drawPlayer(ctx, POSE.pitch[stepIdx - 1], Object.assign({}, T, { alpha: 0.22, noShadow: true }));
    }
    const pose = POSE.pitch[stepIdx];
    const ballPos = stepIdx <= 2 ? pose.handT : null;
    A.drawPlayer(ctx, pose, Object.assign({}, T, { ball: ballPos }));

    // Biomechanics Callouts & Protractors per Step
    const sh = A.toScreen(T, pose.sh);
    const hip = A.toScreen(T, pose.hip);
    const elT = A.toScreen(T, pose.elbowT);
    const hdT = A.toScreen(T, pose.handT);
    const hdG = A.toScreen(T, pose.handG);
    const kneeG = A.toScreen(T, pose.kneeG);

    if (stepIdx === 0) {
      // Balance plumb line
      ctx.save();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.8; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(T.x, 78); ctx.lineTo(T.x, 386); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      A.callout(ctx, T.x, 126, 215, 130, '✅ 鉛垂核心平衡軸不後仰', '#38bdf8', { size: 14 });
      A.callout(ctx, kneeG[0], kneeG[1], 655, 225, '前腳大腿抬高至水平！', '#facc15', { size: 14 });
    } else if (stepIdx === 1) {
      // 90° Safe L-Arm Protractor Arc
      ctx.save();
      ctx.fillStyle = 'rgba(16,185,129,0.28)';
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(elT[0], elT[1]);
      ctx.lineTo(sh[0], sh[1]);
      ctx.lineTo(elT[0] + 10, elT[1] - 46);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(elT[0], elT[1], 44, -Math.PI * 0.52, 0.08);
      ctx.stroke();
      ctx.restore();
      A.callout(ctx, elT[0], elT[1], 175, 165, '🛡️ 90° 安全「L型」不傷手肘！', '#10b981', { size: 14.5 });
      // Target sightline from glove
      ctx.save();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(hdG[0], hdG[1]); ctx.lineTo(840, hdG[1]); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      A.callout(ctx, hdG[0] + 70, hdG[1], 700, 132, '👀 手套當瞄準鏡指捕手', '#facc15', { size: 14 });
    } else if (stepIdx === 2) {
      // Hip & Core rotation torque arrows
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(hip[0], hip[1], 64, 18, 0, Math.PI * 0.15, Math.PI * 0.95); ctx.stroke();
      A.arrowHead(ctx, hip[0] + 58, hip[1] + 8, -0.35, 12, '#f59e0b');
      // Whip arrow to throwing elbow
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(elT[0], elT[1]); ctx.quadraticCurveTo(sh[0] + 40, elT[1] - 30, sh[0] + 86, elT[1] - 6); ctx.stroke();
      A.arrowHead(ctx, sh[0] + 86, elT[1] - 6, 0.15, 12, '#ef4444');
      ctx.restore();
      A.callout(ctx, hip[0] - 48, hip[1] + 6, 170, 275, '🌀 肚臍先轉！下盤帶動上半身', '#f59e0b', { size: 14 });
      A.callout(ctx, elT[0], elT[1], 200, 145, '手肘領先鞭甩而出！', '#ef4444', { size: 14 });
    } else if (stepIdx === 3) {
      // Release point golden starburst + spinning ball flying out
      const rx = hdT[0] + 22, ry = hdT[1] - 12;
      ctx.save();
      ctx.fillStyle = '#fef08a';
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * TAU;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + Math.cos(ang - 0.14) * 26, ry + Math.sin(ang - 0.14) * 26);
        ctx.lineTo(rx + Math.cos(ang) * 42, ry + Math.sin(ang) * 42);
        ctx.lineTo(rx + Math.cos(ang + 0.14) * 26, ry + Math.sin(ang + 0.14) * 26);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      A.glowLine(ctx, [[rx, ry], [rx + 150, ry + 26]], '#ef4444', 4);
      A.baseball(ctx, rx + 162, ry + 28, 14, [0.4, 0.2, 0.6], { shadow: false });
      A.callout(ctx, rx, ry, 235, 118, '⚡ 頭頂前上方最高點扣壓縫線！', '#ef4444', { size: 14.5 });
    } else {
      // Deceleration brake arc
      ctx.save();
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.arc(sh[0], sh[1] + 10, 95, -0.4, 1.35); ctx.stroke();
      ctx.setLineDash([]);
      A.arrowHead(ctx, hdT[0], hdT[1] + 14, 2.2, 12, '#a855f7');
      ctx.restore();
      A.callout(ctx, hdT[0], hdT[1], 715, 290, '🛡️ 手臂順勢揮至前膝減速', '#a855f7', { size: 14 });
      A.callout(ctx, T.x + 75, 380, 210, 325, '雙腳站平・立刻準備接回傳球', '#38bdf8', { size: 14 });
    }

    A.lowerThird(ctx, stepInfo.title, stepInfo.caption, col, { tag: '點擊 S1-S5 切換', marginRight: 122 });
  }

  // ------------------------------------------------------------------
  // 2A. FIELDING LAB (Gold Glove Broadcast)
  // ------------------------------------------------------------------
  function renderBroadcastFieldingSkill() {
    const ctx = A.prep('fieldingSkillCanvas');
    if (!ctx) return;

    const mode = typeof fieldingMode !== 'undefined' ? fieldingMode : 'alligator';
    A.stadium(ctx, { horizon: 195, stripes: 'radial' });
    A.dirtBand(ctx, 272);

    const titles = {
      alligator: ['正三角形站姿 ＆ 鱷魚嘴接球', '雙腳寬於肩・雙手低重心迎球', '#10b981'],
      clock: ['高低球肚臍腰帶分界線', '腰帶以上大拇指相連・以下小拇指相連', '#38bdf8'],
      crowhop: ['傳球墊步 (Crow Hop) 三拍節奏', '接球 ➔ 合胸側身墊步 ➔ 踏步強傳', '#f59e0b']
    };
    const [scTitle, scSub, accent] = titles[mode] || titles.alligator;
    A.scorebug(ctx, scTitle, scSub, { team: 'LAD', tag: 'GOLD GLOVE', accent });
    A.liveTag(ctx, '金手套守備特訓');

    if (mode === 'alligator') {
      // Left: #17 Dodgers in wide low squat on Yellow Equilateral Triangle
      const F = { x: 272, y: 404, s: 1.28, view: 'front', kit: KIT.LAD, num: '17' };
      const ftG = A.toScreen(F, POSE.squat.footG);
      const ftT = A.toScreen(F, POSE.squat.footT);
      const glv = [F.x, F.y + 42]; // apex in front

      // Yellow Equilateral Triangle on dirt
      ctx.save();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ftT[0], ftT[1]); ctx.lineTo(ftG[0], ftG[1]); ctx.lineTo(glv[0], glv[1]);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();

      A.drawPlayer(ctx, POSE.squat, F);
      // Rolling baseball entering glove
      A.glowLine(ctx, [[glv[0] - 85, glv[1] + 18], [glv[0] - 12, glv[1] - 4]], '#10b981', 3.5);
      A.baseball(ctx, glv[0], glv[1] - 10, 12, [0.4, 0.3, 0.1]);

      A.callout(ctx, ftT[0] - 12, ftT[1], 118, 340, '雙腳張開比肩寬 (底邊)', '#facc15', { size: 13 });
      A.callout(ctx, glv[0], glv[1] + 6, 405, 430, '手套前伸貼地 (頂點)', '#10b981', { size: 13.5 });

      // Right Inset Panel: Magnified Alligator Hands Bite
      const px = 528, py = 82, pw = 414, ph = 326;
      A.panel(ctx, px, py, pw, ph, '🐊 雙手「鱷魚嘴巴」立體剖析', '#10b981');

      const gx = px + 210, gy = py + 198;
      // Bottom jaw: Leather glove wide open on ground
      ctx.save();
      const lg = ctx.createRadialGradient(gx, gy + 18, 6, gx, gy + 18, 86);
      lg.addColorStop(0, '#e58e26'); lg.addColorStop(1, '#7c2d12');
      ctx.fillStyle = lg; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(gx, gy + 24, 82, 30, 0, 0, Math.PI);
      ctx.quadraticCurveTo(gx, gy + 4, gx - 82, gy + 24);
      ctx.fill(); ctx.stroke();
      // Webbing laces
      ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(gx + i * 24, gy + 18); ctx.lineTo(gx + i * 28, gy + 44); ctx.stroke();
      }
      ctx.restore();

      // Baseball inside pocket
      A.baseball(ctx, gx - 4, gy + 4, 24, [0.3, 0.6, 0.1], { shadow: false });

      // Top jaw: Bare throwing hand snapping down
      ctx.save();
      ctx.fillStyle = '#f2c29b'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx - 68, gy - 44);
      ctx.quadraticCurveTo(gx + 10, gy - 68, gx + 76, gy - 32);
      ctx.quadraticCurveTo(gx + 54, gy - 14, gx - 46, gy - 20);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Snap arrow downward
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(gx + 88, gy - 48); ctx.lineTo(gx + 88, gy - 12); ctx.stroke();
      A.arrowHead(ctx, gx + 88, gy - 8, Math.PI / 2, 11, '#facc15');
      ctx.restore();

      A.callout(ctx, gx - 10, gy - 50, px + 146, py + 72, '上顎：空手在上方立刻蓋緊！', '#facc15', { size: 13 });
      A.callout(ctx, gx + 10, gy + 44, px + 265, py + 292, '下顎：手套貼地接穩絕不漏彈', '#10b981', { size: 13 });

      A.lowerThird(ctx, '🐊 正三角形站姿 ＋ 鱷魚嘴巴雙手接球', '球一進手套立刻用另一手像鱷魚上顎蓋住！接著像漏斗一樣順勢收進胸口準備快傳！', '#10b981', { tag: 'GOLD GLOVE' });

    } else if (mode === 'clock') {
      // Split screen: High ball (above navel) vs Low ball (below navel)
      ctx.save();
      ctx.strokeStyle = 'rgba(250,204,21,0.85)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(30, 314); ctx.lineTo(W - 30, 314); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(10,20,42,0.92)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 96, 297, 192, 34, 17); ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#facc15'; ctx.font = f(900, 14); ctx.textAlign = 'center';
      ctx.fillText('📏 肚臍 / 腰帶分界線', W / 2, 319);
      ctx.restore();

      // Left: High Ball (#17 POSE.high)
      A.drawPlayer(ctx, POSE.high, { x: 240, y: 404, s: 1.18, view: 'front', kit: KIT.LAD, num: '17' });
      A.baseball(ctx, 252, 186, 13, [0.2, 0.5, 0.3]);
      A.callout(ctx, 252, 186, 148, 126, '⬆️ 胸口以上：手指朝上！', '#38bdf8', { size: 14 });
      A.panel(ctx, 32, 232, 152, 68, '👍 大拇指相連', '#38bdf8');
      ctx.fillStyle = '#e0f2fe'; ctx.font = f(700, 12.5); ctx.textAlign = 'left';
      ctx.fillText('在額頭前上方', 44, 276);
      ctx.fillText('接高飛／平飛球！', 44, 294);

      // Right: Low Ball (#17 POSE.low)
      A.drawPlayer(ctx, POSE.low, { x: 720, y: 404, s: 1.18, view: 'front', kit: KIT.LAD, num: '17' });
      A.baseball(ctx, 730, 386, 13, [0.5, 0.3, 0.2]);
      A.callout(ctx, 730, 386, 825, 365, '⬇️ 腰部以下：手指朝下！', '#10b981', { size: 14 });
      A.panel(ctx, 775, 224, 162, 68, '🤙 小拇指相連', '#10b981');
      ctx.fillStyle = '#d1fae5'; ctx.font = f(700, 12.5); ctx.textAlign = 'left';
      ctx.fillText('手套貼地像推土機', 787, 268);
      ctx.fillText('把滾地球鏟進來！', 787, 286);

      A.lowerThird(ctx, '👐 記住口訣：「胸口以上拇指靠、腰部以下小指靠」', '千萬不能接低球時手腕反折指尖朝上，球會順著手套彈打到臉或手腕！', '#38bdf8', { tag: 'GOLD GLOVE' });

    } else {
      // 3-Beat Crow Hop Rhythm across field
      const xs = [180, 465, 750];
      const poses = [POSE.catchC, POSE.hop, POSE.pitch[3]];
      const labels = ['1️⃣ 雙手接穩收胸', '2️⃣ 後腳往前小墊步', '3️⃣ 前肩瞄準大步強傳'];
      const cols = ['#10b981', '#f59e0b', '#ef4444'];

      // Rhythm connectors
      A.glowLine(ctx, [[xs[0] + 60, 310], [xs[1] - 55, 295]], '#f59e0b', 4);
      A.arrowHead(ctx, xs[1] - 55, 295, -0.1, 11, '#f59e0b');
      A.glowLine(ctx, [[xs[1] + 55, 295], [xs[2] - 65, 305]], '#ef4444', 4);
      A.arrowHead(ctx, xs[2] - 65, 305, 0.05, 11, '#ef4444');

      xs.forEach((px, i) => {
        const py = i === 1 ? 378 : 400;
        A.drawPlayer(ctx, poses[i], { x: px, y: py, s: 1.12, kit: KIT.LAD, num: '17' });
        A.callout(ctx, px, py - 210, px, 108, labels[i], cols[i], { size: 13.5 });
      });

      // Thrown baseball streaking out from step 3
      A.glowLine(ctx, [[862, 180], [945, 168]], '#ef4444', 4.5);
      A.baseball(ctx, 940, 169, 11, [0.4, 0.7, 0.1]);

      A.lowerThird(ctx, '👟 墊步助跑強傳 (Crow Hop)：用下盤腳步幫手臂加速！', '絕不原地站著只用手臂死甩！養成「雙手接球 ➔ 合胸墊步 ➔ 轉身強傳」三拍節奏！', '#f59e0b', { tag: 'GOLD GLOVE' });
    }
  }

  // ------------------------------------------------------------------
  // 2B. BASE COVERING (1B Force Stretch vs 2B Tag Straddle)
  // ------------------------------------------------------------------
  function renderBroadcastBaseCover() {
    const ctx = A.prep('baseCoverCanvas');
    if (!ctx) return;

    const mode = typeof basePlayMode !== 'undefined' ? basePlayMode : 'force1b';
    const prog = typeof basePlayProgress === 'number' ? clamp(basePlayProgress, 0, 1) : 1;
    const ep = ease(prog);

    A.stadium(ctx, { horizon: 185, stripes: 'horiz' });
    A.dirtBand(ctx, 250);

    if (mode === 'force1b') {
      A.scorebug(ctx, '一壘封殺：踩內側延伸接球', '防守踩場內側邊緣・跑壘線留給跑者', { team: 'LAD', tag: '1B DEFENSE', accent: '#38bdf8' });
      A.liveTag(ctx, '防相撞安全守壘');

      // Perspective 1st Base Foul Line dividing Infield (Safe) vs Runner's Lane
      ctx.save();
      // Orange runner's lane (foul side)
      ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
      ctx.beginPath();
      ctx.moveTo(150, 480); ctx.lineTo(940, 316); ctx.lineTo(940, 385); ctx.lineTo(295, 515);
      ctx.closePath(); ctx.fill();

      // White chalk line
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(150, 480); ctx.lineTo(940, 316); ctx.stroke();

      ctx.fillStyle = '#fed7aa'; ctx.font = f(800, 13); ctx.textAlign = 'left';
      ctx.fillText('⚠️ 界外區：跑者通道', 668, 396);
      ctx.fillStyle = '#86efac';
      ctx.fillText('✅ 界內區：防守安全位置', 120, 355);
      ctx.restore();

      // Raised 3D 1st Base Bag at (520, 398)
      const bx = 520, by = 398;
      ctx.save();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.moveTo(bx - 30, by + 6); ctx.lineTo(bx, by + 18); ctx.lineTo(bx + 30, by + 6); ctx.lineTo(bx + 30, by + 15); ctx.lineTo(bx, by + 27); ctx.lineTo(bx - 30, by + 15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by - 10); ctx.lineTo(bx + 30, by + 4); ctx.lineTo(bx, by + 18); ctx.lineTo(bx - 30, by + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Green highlight on INSIDE edge
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(bx - 27, by + 3); ctx.lineTo(bx, by - 8); ctx.stroke();
      // Red danger X on middle/outside
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx + 4, by + 2); ctx.lineTo(bx + 16, by + 11); ctx.moveTo(bx + 16, by + 2); ctx.lineTo(bx + 4, by + 11); ctx.stroke();
      ctx.restore();

      // 1B Defender stretching from inside edge toward incoming ball from infield (left)
      const stretchT = clamp((prog - 0.15) / 0.65, 0, 1);
      const p1b = A.blendPose(POSE.ready, POSE.stretch, ease(stretchT));
      A.drawPlayer(ctx, p1b, { x: bx - 18, y: by - 4, s: 1.05, face: -1, kit: KIT.LAD, num: '5' });

      // Incoming thrown ball from SS/3B (left side)
      const ballX = lerp(90, bx - 135, ep);
      const ballY = lerp(245, by - 132, ep) - Math.sin(ep * Math.PI) * 32;
      A.glowLine(ctx, [[90, 245], [ballX, ballY]], '#38bdf8', 3.5);
      A.baseball(ctx, ballX, ballY, 10, [prog * 12, 0.5, 0.2]);

      // Padres Runner sprinting down outer foul lane (x=210 -> 590)
      const rx = lerp(210, 565, ep), ry = lerp(496, 422, ep);
      A.drawPlayer(ctx, A.runPose(prog * 14), { x: rx, y: ry, s: 1.02, face: 1, kit: KIT.SD, num: '23', headwear: 'helmet' });

      A.callout(ctx, bx - 16, by - 4, 345, 290, '🦶 後腳踩緊「壘包內側緣」', '#22c55e', { size: 13.5 });
      A.callout(ctx, bx - 130, by - 134, 215, 130, '看準來球往前大跨步延伸！', '#38bdf8', { size: 13.5 });
      if (prog > 0.92) A.stamp(ctx, 'OUT! 提早抓到出局！', '完全避開跑者釘鞋碰撞', '#22c55e', { x: 750, y: 185, size: 32 });

      A.lowerThird(ctx, '🦶 一壘手守壘秘訣：踩「朝向場內的壘包內側邊緣」', '先看清楚球再大步延伸 (Stretch)！把外側壘包讓給衝刺跑者，安全不踩腳又能提早半秒接球！', '#38bdf8', { tag: '1B BASE COVER', marginRight: 122 });

    } else {
      A.scorebug(ctx, '二、三壘觸殺：跨站等滑壘', '手套穩貼地上等跑者滑進來・雙手護球', { team: 'LAD', tag: '2B TAG PLAY', accent: '#f59e0b' });
      A.liveTag(ctx, '安全觸殺守備法');

      // 2nd Base bag at (530, 398)
      const bx = 530, by = 398;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(100, 412); ctx.lineTo(900, 386); ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.moveTo(bx - 32, by + 5); ctx.lineTo(bx, by + 17); ctx.lineTo(bx + 32, by + 5); ctx.lineTo(bx + 32, by + 13); ctx.lineTo(bx, by + 25); ctx.lineTo(bx - 32, by + 13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by - 11); ctx.lineTo(bx + 32, by + 3); ctx.lineTo(bx, by + 17); ctx.lineTo(bx - 32, by + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();

      // #17 Dodgers 2B/SS straddling 2B bag with glove resting low on front edge
      A.drawPlayer(ctx, POSE.straddle, { x: bx, y: by + 6, s: 1.18, view: 'front', kit: KIT.LAD, num: '17' });

      // Incoming catcher throw to 2B glove
      const throwT = clamp(prog / 0.72, 0, 1);
      const ballX = lerp(890, bx - 54, ease(throwT));
      const ballY = lerp(180, by - 4, ease(throwT)) - Math.sin(throwT * Math.PI) * 35;
      if (prog < 0.75) {
        A.glowLine(ctx, [[890, 180], [ballX, ballY]], '#f59e0b', 3.5);
        A.baseball(ctx, ballX, ballY, 10, [prog * 14, 0.2, 0.5]);
      }

      // Runner sliding in from left with dirt spray
      const rx = lerp(120, bx - 155, ep);
      if (prog > 0.3) {
        ctx.fillStyle = 'rgba(214, 158, 92, 0.55)';
        for (let k = 0; k < 7; k++) {
          ctx.beginPath(); ctx.arc(rx + 60 + k * 9, by + 6 - (k % 3) * 5, 4 + (k % 3) * 2, 0, TAU); ctx.fill();
        }
      }
      A.drawPlayer(ctx, POSE.slide, { x: rx, y: by + 8, s: 1.1, face: 1, kit: KIT.SD, num: '23', headwear: 'helmet' });

      A.callout(ctx, bx - 52, by, 305, 290, '🧤 手套穩貼壘包前地上！', '#f59e0b', { size: 13.5 });
      A.callout(ctx, bx + 42, by + 4, 740, 290, '雙腳跨站壘包兩側不擋路', '#38bdf8', { size: 13.5 });
      if (prog > 0.92) A.stamp(ctx, 'TAG OUT! 觸殺出局！', '跑者自己滑進手套！雙手高舉給裁判看', '#f59e0b', { x: 755, y: 178, size: 30 });

      A.lowerThird(ctx, '🧤 二、三壘觸殺秘訣：「手套貼地等滑壘・絕不拿手套亂揮」', '跨站在壘包兩側，把手套放在壘包正前方地面，讓跑者的腳自己滑進手套最安全又最快！', '#f59e0b', { tag: '2B TAG PLAY', marginRight: 122 });
    }
  }

  // ------------------------------------------------------------------
  // 3A. BAT GRIP (DOOR-KNOCKING KNUCKLES) & RUN TO 1B BANANA CURVE
  // ------------------------------------------------------------------
  function renderBroadcastBatGrip() {
    const ctx = A.prep('batGripCanvas');
    if (!ctx) return;

    const mode = typeof batViewMode !== 'undefined' ? batViewMode : 'knuckles';

    if (mode === 'knuckles') {
      A.stadium(ctx, { horizon: 295, stripes: 'radial' });
      ctx.fillStyle = 'rgba(8, 16, 36, 0.62)';
      ctx.fillRect(0, 0, W, H);

      A.scorebug(ctx, '握棒黃金法則：敲門關節一直線', '右打者左手在下・右手在上・兩手緊靠不留縫', {
        team: 'LAD', tag: 'BAT GRIP LAB', accent: '#f59e0b'
      });
      A.liveTag(ctx, '雷射指節對齊剖析');

      // Giant 3D Pro Maple Bat (angled across left stage)
      const cx = 290, cy = 248;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.18);

      // Bat body (knob -> handle -> barrel)
      const batG = ctx.createLinearGradient(0, -34, 0, 34);
      batG.addColorStop(0, '#fde68a');
      batG.addColorStop(0.35, '#d97706');
      batG.addColorStop(0.75, '#92400e');
      batG.addColorStop(1, '#451a03');
      ctx.fillStyle = batG;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-225, -18);
      ctx.lineTo(-210, -24);
      ctx.lineTo(-200, -14);
      ctx.lineTo(40, -16);
      ctx.quadraticCurveTo(130, -32, 235, -34);
      ctx.quadraticCurveTo(252, 0, 235, 34);
      ctx.quadraticCurveTo(130, 32, 40, 16);
      ctx.lineTo(-200, 14);
      ctx.lineTo(-210, 24);
      ctx.lineTo(-225, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Grip tape on handle
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-195, -14, 180, 28);
      ctx.strokeStyle = '#005A9C'; ctx.lineWidth = 3;
      for (let x = -188; x < -20; x += 14) {
        ctx.beginPath(); ctx.moveTo(x, -14); ctx.lineTo(x + 8, 14); ctx.stroke();
      }

      // Left (Bottom) Batting Glove Hand & Knuckles
      const drawGripHand = (hx, gloveCol, accentCol) => {
        ctx.fillStyle = gloveCol; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.roundRect(hx, -28, 76, 56, 14); ctx.fill(); ctx.stroke();
        // 4 fingers wrapped
        for (let i = 0; i < 4; i++) {
          const fx = hx + 7 + i * 16.5;
          ctx.fillStyle = gloveCol;
          ctx.beginPath(); ctx.roundRect(fx, -24, 15, 48, 7); ctx.fill(); ctx.stroke();
          // Door-knocking second knuckle pad!
          ctx.fillStyle = accentCol;
          ctx.beginPath(); ctx.arc(fx + 7.5, -2, 5.5, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();
        }
      };
      drawGripHand(-182, '#1d4ed8', '#38bdf8'); // Bottom hand (Left for RHB)
      drawGripHand(-104, '#f8fafc', '#f59e0b'); // Top hand (Right for RHB)

      // Glowing RED LASER alignment line right through all 8 door-knocking knuckles!
      ctx.save();
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 14;
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(-215, -2); ctx.lineTo(25, -2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-215, -2); ctx.lineTo(25, -2); ctx.stroke();
      ctx.restore();

      ctx.restore();

      A.callout(ctx, 132, 265, 130, 128, '左手在下・手指根部扣握', '#38bdf8', { size: 13.5 });
      A.callout(ctx, 212, 250, 345, 120, '右手在上・兩手緊貼不留縫', '#f59e0b', { size: 13.5 });
      A.callout(ctx, 175, 272, 240, 378, '🔴 敲門關節雷射對齊成一直線！', '#ef4444', { size: 14 });

      // Right Comparison Panel
      A.panel(ctx, 566, 78, 376, 336, '⚡ 為什麼要對齊「敲門關節」？', '#f59e0b');
      A.statRows(ctx, 584, 132, 340, [
        ['✅ 手指根部扣握', '手腕能像甩鞭一樣翻轉', '#4ade80'],
        ['❌ 握太深進掌心', '手腕卡死・棒頭甩不快', '#f87171'],
        ['👊 怎麼檢查？', '對牆比出敲門的關節即可', '#facc15']
      ]);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.roundRect(584, 242, 340, 148, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(250,204,21,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#fde68a'; ctx.font = f(800, 14); ctx.textAlign = 'left';
      ctx.fillText('💡 小小職棒王口訣：', 602, 272);
      ctx.fillStyle = '#e2e8f0'; ctx.font = f(600, 13);
      ctx.fillText('1. 就像拿著一隻小鳥一樣放鬆！', 602, 302);
      ctx.fillText('2. 不要用力死捏球棒，啟動瞬間才握緊！', 602, 328);
      ctx.fillText('3. 揮棒前先敲敲門，確認兩手關節成直線！', 602, 354);

      A.lowerThird(ctx, '👊 握棒黃金法則：「敲門關節排成一直線」', '右打者左手在下、右手在上（左打者相反）！指關節對齊一直線，手腕才能順暢翻轉打出全壘打！', '#f59e0b', { tag: 'SLUGGER LAB' });

    } else {
      // 3D Aerial Broadcast View: Straight Sprint vs Banana Curve around 1B
      A.stadium(ctx, { horizon: 155, stripes: 'radial' });
      A.scorebug(ctx, '跑一壘路線：直線衝刺 vs 香蕉彎', '內野滾地衝前緣過壘・外野安打繞彎攻二壘', {
        team: 'LAD', tag: 'BASERUNNING 1B', accent: '#38bdf8'
      });
      A.liveTag(ctx, '1B 跑壘路線圖解');

      // Perspective 1st Base Diamond Sector
      const hp = [148, 416], b1 = [650, 315], b2 = [370, 200];
      // Dirt basepath
      ctx.save();
      ctx.strokeStyle = '#b8692f'; ctx.lineWidth = 44;
      ctx.beginPath(); ctx.moveTo(hp[0], hp[1]); ctx.lineTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
      // White foul line past 1B
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(hp[0], hp[1]); ctx.lineTo(890, 266); ctx.stroke();

      // Bases
      const drawBag = (p, label) => {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p[0], p[1] - 11); ctx.lineTo(p[0] + 18, p[1]); ctx.lineTo(p[0], p[1] + 11); ctx.lineTo(p[0] - 18, p[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#0f172a'; ctx.font = f(900, 11); ctx.textAlign = 'center';
        ctx.fillText(label, p[0], p[1] + 4);
      };
      drawBag(hp, 'H'); drawBag(b1, '1B'); drawBag(b2, '2B');

      // Path 1: Straight Sprint (Orange) through front edge -> turn right to foul territory
      const p1 = [[hp[0] + 18, hp[1] + 8], [b1[0] + 6, b1[1] + 4], [835, 290], [878, 326]];
      A.glowLine(ctx, p1, '#f97316', 5);
      A.arrowHead(ctx, 878, 326, 0.72, 13, '#f97316');

      // Path 2: Banana Curve (Sky Blue) swinging outside 3 steps before 1B, touching inside corner -> 2B
      const bananaPts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        let px, py;
        if (t < 0.52) {
          const u = t / 0.52;
          px = lerp(hp[0] + 12, b1[0] - 6, u) + Math.sin(u * Math.PI) * 52;
          py = lerp(hp[1] - 6, b1[1] - 6, u) + Math.sin(u * Math.PI) * 44;
        } else {
          const u = (t - 0.52) / 0.48;
          px = lerp(b1[0] - 6, b2[0] + 18, u) + Math.sin(u * Math.PI) * 28;
          py = lerp(b1[1] - 6, b2[1] + 10, u) - Math.sin(u * Math.PI) * 18;
        }
        bananaPts.push([px, py]);
      }
      A.glowLine(ctx, bananaPts, '#38bdf8', 5);
      A.arrowHead(ctx, b2[0] + 18, b2[1] + 10, -2.75, 13, '#38bdf8');

      // Draw #17 Dodgers Runners demonstrating both!
      A.drawPlayer(ctx, POSE.runA, { x: 750, y: 298, s: 0.54, face: 1, kit: KIT.LAD, num: '17', headwear: 'helmet' });
      A.drawPlayer(ctx, POSE.runB, { x: 485, y: 242, s: 0.54, face: -1, kit: KIT.LAD, num: '50', headwear: 'helmet' });
      ctx.restore();

      A.callout(ctx, 795, 298, 765, 175, '🟠 滾地球：全力衝刺踩前緣・過壘右轉', '#f97316', { size: 13 });
      A.callout(ctx, 646, 366, 610, 412, '🍌 提前外切香蕉彎・左腳踩內角！', '#38bdf8', { size: 13.5 });
      A.callout(ctx, 370, 200, 260, 148, '順暢轉彎直衝二壘！', '#38bdf8', { size: 13.5 });

      A.lowerThird(ctx, '🏃 跑一壘雙攻略：內野滾地直線衝 vs 外野安打香蕉彎', '滾地球絕不撲壘減速，過壘後往右側界外轉才不會被觸殺！外野安打提前外切繞香蕉彎加速搶二壘！', '#38bdf8', { tag: 'BASERUNNING 1B' });
    }
  }

  // ------------------------------------------------------------------
  // 3B. 75m STADIUM HIT & BOUNCE/ROLL PHYSICS SIMULATOR
  // ------------------------------------------------------------------
  function renderBroadcastHitSim() {
    const ctx = A.prep('hitSimCanvas');
    if (!ctx) return;

    if (typeof simulateLabHitPhysics === 'function' && (!hitLabPoints || hitLabPoints.length === 0)) {
      simulateLabHitPhysics();
    }

    const hKey = typeof currentHitType !== 'undefined' ? currentHitType : 'line';
    const info = (typeof hitTypesData !== 'undefined' && hitTypesData[hKey]) || {
      color: '#10b981', launchDeg: 14, exitVelo: 108, desc: ''
    };
    const pts = hitLabPoints || [];
    const bounces = hitLabBounces || [];
    const curIdx = clamp(typeof hitLabAnimIdx === 'number' ? hitLabAnimIdx : pts.length - 1, 0, Math.max(0, pts.length - 1));
    const lastPt = pts[pts.length - 1] || { dist: 65 };
    const carryM = (bounces && bounces.length > 0 ? bounces[0].dist : lastPt.dist);
    const totalM = Math.round(lastPt.dist);
    const rollM = Math.max(0, totalM - Math.round(carryM));

    // Sync external telemetry badges if present
    const tAng = document.getElementById('tele-hit-angle');
    const tVel = document.getElementById('tele-hit-velo');
    const tDist = document.getElementById('tele-hit-dist');
    if (tAng) tAng.textContent = `${info.launchDeg}°`;
    if (tVel) tVel.textContent = `${info.exitVelo} km/h`;
    if (tDist) tDist.textContent = `${totalM} m`;

    const groundY = 398;
    const mapX = d => 88 + (d / 88) * 805; // 0m -> 88, 75m wall -> 774
    const mapY = z => groundY - (z / 26) * 235;
    const wallX = mapX(75);
    const dirtEnd = mapX(26);

    // Dodger Stadium daytime sky & distant pavilion
    A.stadium(ctx, { horizon: 270, cx: 480, stripes: 'horiz' });

    // Ground layers: Infield Dirt (0..26m) + Striped Outfield Grass (26..88m)
    const dirtG = ctx.createLinearGradient(0, groundY - 4, 0, H);
    dirtG.addColorStop(0, '#c47a3d'); dirtG.addColorStop(1, '#8b4513');
    ctx.fillStyle = dirtG;
    ctx.fillRect(0, groundY, dirtEnd, H - groundY);

    const grassG = ctx.createLinearGradient(0, groundY - 4, 0, H);
    grassG.addColorStop(0, '#22c55e'); grassG.addColorStop(1, '#15803d');
    ctx.fillStyle = grassG;
    ctx.fillRect(dirtEnd, groundY, W - dirtEnd, H - groundY);
    for (let x = dirtEnd; x < W; x += 48) {
      if (Math.floor((x - dirtEnd) / 48) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x, groundY, 24, H - groundY);
      }
    }

    // 75m Padded Green Outfield Wall + Yellow Top Line
    ctx.fillStyle = '#14532d';
    ctx.fillRect(wallX - 6, groundY - 38, 12, 38);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(wallX - 7, groundY - 42, 14, 6);
    A.callout(ctx, wallX, groundY - 42, wallX, groundY - 78, '🏆 75m 少棒全壘打牆', '#facc15', { size: 12.5 });

    // Distance markers
    ctx.fillStyle = '#fef3c7'; ctx.font = f(800, 11.5); ctx.textAlign = 'center';
    [[0, '0m 本壘'], [26, '26m 紅土/草皮交界'], [50, '50m 外野'], [75, '75m HR牆']].forEach(([d, lbl]) => {
      const mx = mapX(d);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(mx, groundY); ctx.lineTo(mx, groundY + 10); ctx.stroke();
      ctx.fillText(lbl, mx, groundY + 24);
    });

    // #17 Dodgers Batter swinging at 0m
    const animFrac = pts.length > 1 ? curIdx / (pts.length - 1) : 1;
    const batPose = animFrac < 0.08 ? POSE.stance : POSE.follow;
    A.drawPlayer(ctx, batPose, {
      x: 78, y: groundY + 2, s: 0.72, face: 1, kit: KIT.LAD, num: '17',
      headwear: 'helmet', battingGloves: true,
      bat: animFrac < 0.08 ? { a: [-16, -152], b: [-62, -206] } : { a: [24, -172], b: [-36, -198] }
    });

    // Trajectory ribbon & ground bounces
    if (pts.length > 1) {
      const ribbon = [];
      for (let i = 0; i <= curIdx; i++) {
        ribbon.push([mapX(pts[i].dist), mapY(pts[i].z)]);
      }
      A.glowLine(ctx, ribbon, info.color, 4.2);

      const cur = pts[curIdx];
      bounces.forEach(b => {
        if (b.dist <= cur.dist) {
          const bx = mapX(b.dist);
          ctx.fillStyle = b.isDirt ? '#fbbf24' : '#86efac';
          ctx.beginPath(); ctx.arc(bx, groundY, 5, 0, TAU); ctx.fill();
        }
      });

      A.baseball(ctx, mapX(cur.dist), mapY(cur.z) - (cur.z <= 0.02 ? 6 : 0), 9.5, [curIdx * 0.45, 0.3, 0.4]);
    }

    // Top HUD & Statcast Panel
    const hName = { ground: '強勁滾地球', line: '平飛安打', homerun: '深遠全壘打', popup: '內野高飛球' }[hKey] || '擊球模擬';
    A.scorebug(ctx, hName, `仰角 ${info.launchDeg}° • 初速 ${info.exitVelo} km/h`, {
      team: 'LAD', tag: 'SLUGGER 75M', accent: info.color
    });
    A.panel(ctx, 686, 14, 258, 150, '📡 STATCAST 擊球追蹤', info.color);
    A.statRows(ctx, 700, 62, 230, [
      ['空中飛行距離', `${Math.round(carryM)} m`, '#38bdf8'],
      ['彈跳草皮滾動', `+${rollM} m`, '#4ade80'],
      ['總推進距離', `${totalM} m`, info.color],
      ['落地彈跳次數', `${bounces.length} 次`, '#facc15']
    ]);

    if (hKey === 'homerun' && animFrac > 0.55) {
      A.stamp(ctx, 'HOME RUN! 全壘打！', `飛越 75m 全壘打大牆 (${totalM}m)`, '#f59e0b', { x: 430, y: 170, size: 36 });
    }

    A.lowerThird(ctx, `${hName}：空中 ${Math.round(carryM)}m ＋ 滾動 ${rollM}m ＝ 總距離 ${totalM}m`, stripTags(info.desc), info.color, { tag: 'STATCAST 75M LAB', marginRight: 122 });
  }

  // ------------------------------------------------------------------
  // 4. 3D PANORAMIC DIAMOND BASERUNNING SIMULATOR
  // ------------------------------------------------------------------
  function renderBroadcastDiamond() {
    const ctx = A.prep('diamondCanvas');
    if (!ctx) return;

    const sc = typeof baseScenario !== 'undefined' ? baseScenario : 'force';
    const prog = typeof baseSimProgress === 'number' ? clamp(baseSimProgress, 0, 1) : 1;
    const ep = ease(prog);

    A.stadium(ctx, { horizon: 160, cx: W / 2, stripes: 'radial', markers: [[135, '330 FT'], [480, '395 FT'], [825, '330 FT']] });

    // Perspective projection of baseball field coords:
    // fx in [-1..1] (3B=-0.65, 1B=+0.65), fy in [0..1] (Home=0, 2B=0.58, Outfield=0.95)
    const proj = (fx, fy) => {
      const z = lerp(0.95, 0.34, fy);
      const x = W / 2 + fx * 420 * z;
      const y = lerp(422, 165, Math.pow(fy, 0.85));
      return [x, y, z];
    };

    const HP = proj(0, 0.04);
    const B1 = proj(0.62, 0.34);
    const B2 = proj(0, 0.60);
    const B3 = proj(-0.62, 0.34);
    const MOUND = proj(0, 0.31);

    // Outfield warning track & Infield dirt arc
    ctx.save();
    const infTop = proj(0, 0.72), infL = proj(-0.92, 0.40), infR = proj(0.92, 0.40);
    ctx.fillStyle = '#b8692f';
    ctx.beginPath();
    ctx.moveTo(HP[0], HP[1] + 22);
    ctx.lineTo(infL[0], infL[1]);
    ctx.quadraticCurveTo(infTop[0], infTop[1] - 28, infR[0], infR[1]);
    ctx.closePath();
    ctx.fill();

    // Inner grass diamond
    const gScale = (p, f) => mix([W / 2, (HP[1] + B2[1]) / 2], p, f);
    ctx.fillStyle = '#1fa34a';
    ctx.beginPath();
    const g0 = gScale(HP, 0.68), g1 = gScale(B1, 0.74), g2 = gScale(B2, 0.74), g3 = gScale(B3, 0.74);
    ctx.moveTo(g0[0], g0[1]); ctx.lineTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]); ctx.lineTo(g3[0], g3[1]);
    ctx.closePath(); ctx.fill();

    // White foul lines
    const lfCorner = proj(-1.12, 0.94), rfCorner = proj(1.12, 0.94);
    ctx.strokeStyle = 'rgba(255,255,255,0.88)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(HP[0], HP[1]); ctx.lineTo(lfCorner[0], lfCorner[1]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(HP[0], HP[1]); ctx.lineTo(rfCorner[0], rfCorner[1]); ctx.stroke();

    // Pitcher's mound
    A.dirtPatch(ctx, MOUND[0], MOUND[1], 36, 12);
    ctx.fillStyle = '#fff'; ctx.fillRect(MOUND[0] - 9, MOUND[1] - 2, 18, 4);

    // 3D Bases
    const drawBase = (p, lbl, glow) => {
      if (glow) {
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.ellipse(p[0], p[1], 24, 12, 0, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p[0], p[1] - 8); ctx.lineTo(p[0] + 15, p[1]); ctx.lineTo(p[0], p[1] + 8); ctx.lineTo(p[0] - 15, p[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.font = f(900, 10.5); ctx.textAlign = 'center';
      ctx.fillText(lbl, p[0], p[1] + 3.5);
    };
    drawBase(HP, 'H');
    drawBase(B1, '1B', sc === 'force' || sc === 'lead' ? 'rgba(56,189,248,0.45)' : null);
    drawBase(B2, '2B', sc === 'force' || sc === 'twoouts' ? 'rgba(250,204,21,0.45)' : null);
    drawBase(B3, '3B', sc === 'tagup' ? 'rgba(16,185,129,0.45)' : null);

    // Distant Padres Defenders (#23)
    const RF = proj(0.55, 0.84), CF = proj(0, 0.88), SS = proj(-0.26, 0.56);
    A.drawPlayer(ctx, POSE.ready, { x: RF[0], y: RF[1], s: 0.28, view: 'front', kit: KIT.SD, num: '23', noShadow: true });
    A.drawPlayer(ctx, POSE.ready, { x: CF[0], y: CF[1], s: 0.26, view: 'front', kit: KIT.SD, num: '3', noShadow: true });
    A.drawPlayer(ctx, POSE.ready, { x: SS[0], y: SS[1], s: 0.34, view: 'front', kit: KIT.SD, num: '7', noShadow: true });
    ctx.restore();

    // Scenario Logic & Animated Runners / Ball
    const scNames = {
      force: ['情境 1：一壘有人＋內野滾地 (強迫進壘)', '低頭全力衝二壘！滑壘破壞雙殺！', '#38bdf8'],
      tagup: ['情境 2：三壘有人＋高飛球 (Tag Up)', '先回三壘踩穩盯手套・接到瞬間衝本壘！', '#10b981'],
      twoouts: ['情境 3：兩出局 (2 Outs) 任何打擊', '球一打出去所有跑者不用猶豫全力狂奔！', '#ef4444'],
      lead: ['情境 4：側滑步離壘 ＆ 第二離壘', '面向本壘雙腳側滑步・隨時能衝能安全回壘！', '#f59e0b']
    };
    const [stTitle, stSub, accent] = scNames[sc] || scNames.force;
    A.scorebug(ctx, stTitle, stSub, { team: 'LAD', tag: 'BASEBALL IQ', accent });
    A.liveTag(ctx, sc === 'twoouts' ? '⚡ 2 OUTS 全速狂奔' : '3D 全景戰術模擬');

    const scDetail = (typeof scenarioDetails !== 'undefined' && scenarioDetails[sc]) || { title: stTitle, body: stSub };

    if (sc === 'force') {
      // Ground ball to SS, 1B runner sprints to 2B, Batter sprints to 1B
      A.glowLine(ctx, [B1, B2], '#38bdf8', 5);
      A.arrowHead(ctx, B2[0] + 12, B2[1] + 6, -2.55, 12, '#38bdf8');
      A.glowLine(ctx, [HP, B1], '#facc15', 4);

      const r1 = mix(B1, B2, ep);
      const rb = mix(HP, B1, ep);
      A.drawPlayer(ctx, ep > 0.85 ? POSE.slide : A.runPose(prog * 14), { x: r1[0], y: r1[1], s: 0.48, face: -1, kit: KIT.LAD, num: '17', headwear: 'helmet' });
      A.drawPlayer(ctx, A.runPose(prog * 14 + 1), { x: rb[0], y: rb[1], s: 0.52, face: 1, kit: KIT.LAD, num: '5', headwear: 'helmet' });

      // Ground ball bouncing toward SS
      const ballP = mix(HP, SS, clamp(ep * 1.3, 0, 1));
      const bounceZ = Math.abs(Math.sin(ep * Math.PI * 3)) * 18 * (1 - ep);
      A.glowLine(ctx, [HP, ballP], '#f97316', 3);
      A.baseball(ctx, ballP[0], ballP[1] - bounceZ, 7, [prog * 12, 0.3, 0.2]);

      A.callout(ctx, (B1[0] + B2[0]) / 2, (B1[1] + B2[1]) / 2, 745, 225, '⚡ 強迫進壘 Force Play：衝向二壘！', '#38bdf8', { size: 13.5 });

    } else if (sc === 'tagup') {
      // High fly ball to RF with altitude shadow!
      const catchT = clamp(ep / 0.56, 0, 1);
      const ballG = mix(HP, RF, catchT);
      const ballArc = Math.sin(catchT * Math.PI) * 145;
      ctx.fillStyle = 'rgba(15,23,42,0.38)';
      ctx.beginPath(); ctx.ellipse(ballG[0], ballG[1], 8, 3, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ballG[0], ballG[1]); ctx.lineTo(ballG[0], ballG[1] - ballArc); ctx.stroke(); ctx.setLineDash([]);
      A.baseball(ctx, ballG[0], ballG[1] - ballArc, 8.5, [prog * 10, 0.4, 0.2]);

      if (ep < 0.56) {
        // Runner returns & tags 3B firmly
        const r3 = mix(mix(B3, HP, 0.16), B3, ease(clamp(ep / 0.35, 0, 1)));
        A.drawPlayer(ctx, POSE.ready, { x: r3[0], y: r3[1], s: 0.5, view: 'front', kit: KIT.LAD, num: '17', headwear: 'helmet' });
        A.callout(ctx, B3[0], B3[1] - 42, 200, 185, '🛑 先踩穩三壘盯外野手手套！', '#10b981', { size: 13.5 });
      } else {
        // Catch made -> sprint home!
        const sprintT = ease((ep - 0.56) / 0.44);
        A.glowLine(ctx, [B3, HP], '#10b981', 5.5);
        A.arrowHead(ctx, HP[0] - 10, HP[1] - 8, 0.55, 13, '#10b981');
        const r3 = mix(B3, HP, sprintT);
        A.drawPlayer(ctx, A.runPose(prog * 16), { x: r3[0], y: r3[1], s: lerp(0.48, 0.62, sprintT), face: 1, kit: KIT.LAD, num: '17', headwear: 'helmet' });
        A.callout(ctx, r3[0], r3[1] - 42, 225, 225, '⚡ 接到瞬間全力衝回本壘得分！', '#facc15', { size: 14 });
        if (ep > 0.94) A.stamp(ctx, 'SAFE! 成功跑回一分！', '完美 Tag Up 戰術執行', '#10b981', { x: 710, y: 190, size: 30 });
      }

    } else if (sc === 'twoouts') {
      // Big 2 OUTS badge + all runners sprint immediately!
      A.panel(ctx, 745, 58, 198, 72, '⚡ 2 OUTS 狂奔法則', '#ef4444');
      ctx.fillStyle = '#fecaca'; ctx.font = f(900, 22); ctx.textAlign = 'center';
      ctx.fillText('● ● 兩出局！', 844, 114);

      A.glowLine(ctx, [B1, B2], '#ef4444', 5);
      A.glowLine(ctx, [B2, B3], '#ef4444', 5);
      A.glowLine(ctx, [B3, HP], '#facc15', 4.5);

      const r1 = mix(B1, B2, ep);
      const r2 = mix(B2, B3, ep);
      A.drawPlayer(ctx, A.runPose(prog * 16), { x: r1[0], y: r1[1], s: 0.48, face: -1, kit: KIT.LAD, num: '5', headwear: 'helmet' });
      A.drawPlayer(ctx, A.runPose(prog * 16 + 1.5), { x: r2[0], y: r2[1], s: 0.46, face: -1, kit: KIT.LAD, num: '17', headwear: 'helmet' });

      const flyG = mix(HP, CF, ep);
      A.baseball(ctx, flyG[0], flyG[1] - Math.sin(ep * Math.PI) * 120, 8, [prog * 10, 0.3, 0.1]);
      A.callout(ctx, r2[0], r2[1] - 42, 220, 185, '🔥 兩出局不用看球・一打就狂奔！', '#ef4444', { size: 14 });

    } else {
      // Lead-off & Secondary lead Shuffle Step near 1B
      const lead1 = mix(B1, B2, 0.22);
      const lead2 = mix(B1, B2, 0.38);
      // Primary lead line + secondary jump
      A.glowLine(ctx, [B1, lead1], '#f59e0b', 5);
      ctx.save();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(lead1[0], lead1[1]); ctx.lineTo(lead2[0], lead2[1]); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // Safe return arrow back to 1B
      ctx.save();
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lead1[0] - 8, lead1[1] + 18); ctx.quadraticCurveTo((B1[0] + lead1[0]) / 2, B1[1] + 32, B1[0] + 6, B1[1] + 12); ctx.stroke();
      A.arrowHead(ctx, B1[0] + 6, B1[1] + 12, 0.4, 10, '#ef4444');
      ctx.restore();

      const runnerPos = ep < 0.55 ? mix(B1, lead1, ease(ep / 0.55)) : mix(lead1, lead2, ease((ep - 0.55) / 0.45));
      A.drawPlayer(ctx, POSE.ready, { x: runnerPos[0], y: runnerPos[1], s: 0.54, view: 'front', kit: KIT.LAD, num: '17', headwear: 'helmet' });

      A.callout(ctx, lead1[0], lead1[1] - 48, 725, 195, '1️⃣ 側滑步離壘 2~3 步（雙腳不交叉）', '#f59e0b', { size: 13.5 });
      A.callout(ctx, lead2[0], lead2[1] - 48, 315, 155, '2️⃣ 球投出後小跳步「第二離壘」', '#38bdf8', { size: 13.5 });
      A.callout(ctx, B1[0] + 8, B1[1] + 22, 745, 360, '⚠️ 隨時準備撲回一壘不遭牽制！', '#ef4444', { size: 13.5 });
    }

    A.lowerThird(ctx, scDetail.title, stripTags(scDetail.body), accent, { tag: 'TACTICAL BASERUNNING', marginRight: 122 });
  }

  // ------------------------------------------------------------------
  // Bind interactive canvas events & override global draw functions
  // ------------------------------------------------------------------
  function bindInteractiveCanvasControls() {
    const pitchCanvas = document.getElementById('pitchSimCanvas');
    if (pitchCanvas && !pitchCanvas.dataset.acadBound) {
      pitchCanvas.dataset.acadBound = '1';
      pitchCanvas.addEventListener('click', ev => {
        if (!lastPitchZoneRect || typeof setAim !== 'function') return;
        const rect = pitchCanvas.getBoundingClientRect();
        const cx = ((ev.clientX - rect.left) / rect.width) * W;
        const cy = ((ev.clientY - rect.top) / rect.height) * H;
        const { zx, zy, zw, zh, dirtY, dirtH } = lastPitchZoneRect;
        if (cx >= zx && cx <= zx + zw && cy >= zy && cy <= zy + zh) {
          const col = clamp(Math.floor(((cx - zx) / zw) * 3), 0, 2);
          const row = clamp(Math.floor(((cy - zy) / zh) * 3), 0, 2);
          setAim(col, row);
        } else if (cx >= zx && cx <= zx + zw && cy >= dirtY && cy <= dirtY + dirtH) {
          setAim(1, 3);
        }
      });
    }

    const mechCanvas = document.getElementById('mechanicsCanvas');
    if (mechCanvas && !mechCanvas.dataset.acadBound) {
      mechCanvas.dataset.acadBound = '1';
      mechCanvas.style.cursor = 'pointer';
      mechCanvas.addEventListener('click', ev => {
        if (!lastMechStepPills.length || typeof setPitchStep !== 'function') return;
        const rect = mechCanvas.getBoundingClientRect();
        const cx = ((ev.clientX - rect.left) / rect.width) * W;
        const cy = ((ev.clientY - rect.top) / rect.height) * H;
        for (const p of lastMechStepPills) {
          if (cx >= p.x && cx <= p.x + p.w && cy >= p.y && cy <= p.y + p.h) {
            setPitchStep(p.idx);
            return;
          }
        }
        // Clicking right/left halves advances/rewinds step
        if (cx > W * 0.55 && typeof nextPitchStep === 'function') nextPitchStep();
        else if (cx < W * 0.45 && typeof prevPitchStep === 'function') prevPitchStep();
      });
    }
  }

  // Override global renderers cleanly
  window.drawGrip = renderBroadcastGrip;
  window.drawPitchSim = renderBroadcastPitchSim;
  window.drawMechanics = renderBroadcastMechanics;
  window.drawFieldingSkill = renderBroadcastFieldingSkill;
  window.drawBaseCover = renderBroadcastBaseCover;
  window.drawBatGrip = renderBroadcastBatGrip;
  window.drawHitSim = renderBroadcastHitSim;
  window.drawDiamond = renderBroadcastDiamond;

  // Re-render current tab after script loads and bind interactive listeners
  const initBroadcast = () => {
    bindInteractiveCanvasControls();
    if (A.visible('gripCanvas')) renderBroadcastGrip();
    if (A.visible('pitchSimCanvas')) renderBroadcastPitchSim();
    if (A.visible('mechanicsCanvas')) renderBroadcastMechanics();
    if (A.visible('fieldingSkillCanvas')) renderBroadcastFieldingSkill();
    if (A.visible('baseCoverCanvas')) renderBroadcastBaseCover();
    if (A.visible('batGripCanvas')) renderBroadcastBatGrip();
    if (A.visible('hitSimCanvas')) renderBroadcastHitSim();
    if (A.visible('diamondCanvas')) renderBroadcastDiamond();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initBroadcast, 60));
  } else {
    setTimeout(initBroadcast, 60);
  }

  // Subtle live pulse loop for LIVE tag & interactive canvases when visible
  setInterval(() => {
    if (A.visible('pitchSimCanvas') && (!window.pitchLabAnimId)) renderBroadcastPitchSim();
  }, 500);
})();
