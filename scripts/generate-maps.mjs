/**
 * Classic parchment atlas style: cream sheet + ink coastlines + feature washes.
 * No solid green/brown land “blob” filling half the frame.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../public");
const W = 4096;
const H = 3072;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function forest(rng, cx, cy, rw, rh, count) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const x = cx + (rng() - 0.5) * rw;
    const y = cy + (rng() - 0.5) * rh;
    const r = 1.6 + rng() * 3.4;
    const ht = 6 + rng() * 10;
    s += `<path d="M${x.toFixed(1)} ${(y + 2).toFixed(1)} l${(-r).toFixed(1)} ${(-ht).toFixed(1)} l${(r * 2).toFixed(1)} 0 z" fill="#2a4028" opacity="${(0.45 + rng() * 0.4).toFixed(2)}"/>`;
  }
  return s;
}

function hills(rng, cx, cy, rw, rh, count) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const x = cx + (rng() - 0.5) * rw;
    const y = cy + (rng() - 0.5) * rh;
    const w = 12 + rng() * 26;
    s += `<path d="M${(x - w).toFixed(1)} ${y.toFixed(1)} q${(w / 2).toFixed(1)} ${(-7 - rng() * 9).toFixed(1)} ${w.toFixed(1)} 0" fill="none" stroke="#6a5a40" stroke-width="1.15" opacity="0.4"/>`;
  }
  return s;
}

function mountains(rng, points) {
  let s = "";
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const peak = 12 + rng() * 24;
    const half = 9 + rng() * 12;
    s += `<path d="M${(x - half).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y - peak).toFixed(1)} L${(x + half).toFixed(1)} ${y.toFixed(1)}" fill="#f2ead8" stroke="#3a3530" stroke-width="1.1" opacity="0.92"/>`;
    if (rng() > 0.4) {
      s += `<path d="M${x.toFixed(1)} ${(y - peak).toFixed(1)} L${(x + half * 0.4).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)}" fill="#9a9488" opacity="0.4"/>`;
    }
  }
  return s;
}

function resampleSpine(points, spacing) {
  if (!points.length) return [];
  const out = [points[0]];
  let walked = 0;
  let nextAt = spacing;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    while (walked + len >= nextAt - 1e-4) {
      const t = (nextAt - walked) / len;
      out.push([a[0] + dx * t, a[1] + dy * t]);
      nextAt += spacing;
    }
    walked += len;
  }
  return out;
}

/** Engraved range: overlapping ink peaks, hatched shadow face, lighter face, ridgeline behind. */
function engravedRange(rng, points, scale = 1) {
  const ink = "#161310";
  const paper = "#e4d6b4";
  const spine = resampleSpine(points, 34 * scale);
  const summits = [];

  const drawPeak = (cx, cy, half, h) => {
    const ax = cx - half;
    const ay = cy;
    const bx = cx + half * 0.92;
    const by = cy + 2;
    const sx = cx - half * 0.05;
    const sy = cy - h;
    const lx = ax + half * 0.32;
    const ly = cy - h * 0.58;
    const rx = sx + half * 0.26;
    const ry = sy + h * 0.36;
    const d = `M${ax.toFixed(1)} ${ay.toFixed(1)} L${lx.toFixed(1)} ${ly.toFixed(1)} L${sx.toFixed(1)} ${sy.toFixed(1)} L${rx.toFixed(1)} ${ry.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)} Z`;
    summits.push([sx, sy]);
    let hatch = "";
    const steps = 7;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x1 = sx + (cx - sx) * t;
      const y1 = sy + (cy - sy) * t;
      const x2 = x1 + (rx - sx) * 0.55 + half * 0.08;
      const y2 = y1 + h * 0.16;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      if (len < 4) continue;
      hatch += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(x2 - (dx / len) * 1.2).toFixed(1)}" y2="${(y2 - (dy / len) * 1.2).toFixed(1)}" stroke="${ink}" stroke-width="1.15" opacity="0.78"/>`;
    }
    let light = "";
    for (const t of [0.34, 0.55]) {
      const x1 = sx + (cx - sx) * t;
      const y1 = sy + (cy - sy) * t;
      const x2 = sx + (lx - sx) * t;
      const y2 = sy + (ly - sy) * t;
      light += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(x1 + (x2 - x1) * 0.42).toFixed(1)}" y2="${(y1 + (y2 - y1) * 0.42).toFixed(1)}" stroke="${ink}" stroke-width="0.7" opacity="0.4"/>`;
    }
    return `<path d="${d}" fill="${paper}"/>${hatch}${light}<path d="${d}" fill="none" stroke="${ink}" stroke-width="1.35" stroke-linejoin="miter"/>`;
  };

  let body = "";
  for (const [cx, cy] of spine) {
    const tall = rng() > 0.72;
    const half = (24 + rng() * 16) * scale;
    const h = (tall ? 96 : 52 + rng() * 40) * scale;
    body += drawPeak(cx, cy, half * 0.72, h * 0.46);
    body += drawPeak(cx + half * 0.28, cy - 1 * scale, half, h);
  }

  let ridge = "";
  if (summits.length > 1) {
    ridge = `<path d="${summits.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")}" fill="none" stroke="${ink}" stroke-width="0.9" opacity="0.4"/>`;
  }
  return ridge + body;
}

function river(d, width = 3.5) {
  return `<path d="${d}" fill="none" stroke="#4a7080" stroke-width="${width}" stroke-linecap="round" opacity="0.7"/>
<path d="${d}" fill="none" stroke="#7aa8b4" stroke-width="${width * 0.35}" stroke-linecap="round" opacity="0.55"/>`;
}

function label(x, y, text, size = 17, anchor = "start") {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="#2a2218" font-family="Palatino Linotype, Book Antiqua, Georgia, serif" font-size="${size}" opacity="0.9">${text}</text>`;
}

function region(x, y, text, size = 28) {
  return `<text x="${x}" y="${y}" text-anchor="middle" fill="#5a4830" font-family="Palatino Linotype, Georgia, serif" font-size="${size}" letter-spacing="0.28em" opacity="0.38" font-style="italic">${text}</text>`;
}

function town(x, y, name, major = false) {
  const r = major ? 4.2 : 2.8;
  return `<g>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#2a2014"/>
    ${label(x + 8, y + 4, name, major ? 16 : 13)}
  </g>`;
}

function road(d) {
  return `<path d="${d}" fill="none" stroke="#6a5538" stroke-width="1.6" stroke-dasharray="5 4" opacity="0.4"/>`;
}

function coast(d) {
  // Ink coastline only — no filled land shape (that was the brown blob).
  return `<path fill="none" stroke="#3a3228" stroke-width="2.4" d="${d}"/>
<path fill="none" stroke="#5a6a58" stroke-width="7" opacity="0.1" d="${d}"/>`;
}

function defs() {
  return `<defs>
  <pattern id="paper" patternUnits="userSpaceOnUse" width="200" height="200">
    <rect width="200" height="200" fill="#e4d6b4"/>
    <circle cx="24" cy="36" r="1.2" fill="#cfc0a0" opacity="0.5"/>
    <circle cx="110" cy="80" r="0.9" fill="#c4b492" opacity="0.4"/>
    <circle cx="160" cy="150" r="1.5" fill="#d0c09a" opacity="0.35"/>
    <circle cx="60" cy="170" r="1" fill="#b8a888" opacity="0.35"/>
  </pattern>
  <pattern id="ash" width="7" height="7" patternUnits="userSpaceOnUse">
    <path d="M0 7 L7 0" stroke="#5a5048" stroke-width="0.55" opacity="0.3"/>
  </pattern>
  <radialGradient id="seaDepth" cx="0.02" cy="0.98" r="0.92">
    <stop offset="0" stop-color="#6e9d94"/>
    <stop offset="0.42" stop-color="#9fc4bb"/>
    <stop offset="1" stop-color="#d7ebe4" stop-opacity="0"/>
  </radialGradient>
</defs>`;
}

function sheet() {
  return `<rect width="${W}" height="${H}" fill="url(#paper)"/>
<rect x="56" y="56" width="${W - 112}" height="${H - 112}" fill="none" stroke="#5a4a30" stroke-width="2.2" opacity="0.35"/>
<rect x="68" y="68" width="${W - 136}" height="${H - 136}" fill="none" stroke="#5a4a30" stroke-width="1" opacity="0.2"/>`;
}

function seaName(x, y, text, size = 26, subtitle) {
  let s = `<text x="${x}" y="${y}" text-anchor="middle" fill="#102830" font-family="Palatino Linotype, Georgia, serif" font-size="${size}" letter-spacing="0.22em" opacity="0.78" font-style="italic">${text}</text>`;
  if (subtitle) {
    const sub = Math.max(11, Math.round(size * 0.46));
    s += `<text x="${x}" y="${y + sub + 6}" text-anchor="middle" fill="#102830" font-family="Palatino Linotype, Georgia, serif" font-size="${sub}" letter-spacing="0.04em" opacity="0.68" font-style="italic">${subtitle}</text>`;
  }
  return s;
}

/** Pale chart-wash for Belegaer and the Bay of Balar. Land is punched out so the shore is the coastline. */
function ocean(land, seaPath) {
  const rng = mulberry32(97);
  // West and south run off the sheet and meet the page edge. The eastern
  // limit is a single curve into the land, so no corner sits beside the coast.
  const sea =
    seaPath ||
    `
    M 40,80
    L 40,3048
    L 4060,3048
    C 4060,2480 3620,1980 3140,1780
    C 2700,1600 2420,1440 2080,1260
    C 1580,980 980,440 520,210
    C 360,130 180,80 40,80
    Z`;
  let waves = "";
  const step = 30;
  for (let y = 120; y < 3020; y += step) {
    const stagger = ((y / step) % 2) * (step * 0.5);
    for (let x = 60 + stagger; x < 4000; x += step) {
      const jx = x + (rng() - 0.5) * 10;
      const jy = y + (rng() - 0.5) * 8;
      const west = 1 - Math.min(1, Math.max(0, (jx - 80) / 1500));
      const south = 1 - Math.min(1, Math.max(0, (2300 - jy) / 1100));
      const open = Math.max(west, south);
      if (rng() > 0.28 + open * 0.7) continue;
      const w = 6 + rng() * 8;
      const lift = 1.1 + rng() * 1.8;
      const op = (0.22 + open * 0.28 + rng() * 0.12).toFixed(2);
      if (rng() > 0.72) {
        waves += `<line x1="${jx.toFixed(1)}" y1="${jy.toFixed(1)}" x2="${(jx + w * 0.65).toFixed(1)}" y2="${jy.toFixed(1)}" stroke="#3d5c56" stroke-width="0.6" opacity="${op}"/>`;
      } else {
        waves += `<path d="M${jx.toFixed(1)} ${jy.toFixed(1)} q${(w * 0.5).toFixed(1)} ${(-lift).toFixed(1)} ${w.toFixed(1)} 0" fill="none" stroke="#3a5852" stroke-width="0.65" opacity="${op}"/>`;
      }
    }
  }
  const graticule = [520, 1280, 2060]
    .map(
      (y) =>
        `<line x1="50" y1="${y}" x2="3980" y2="${y}" stroke="#7a9e96" stroke-width="0.7" opacity="0.14"/>`,
    )
    .join("");
  return `<mask id="ocean" maskUnits="userSpaceOnUse">
    <rect width="${W}" height="${H}" fill="black"/>
    <path d="${sea}" fill="white"/>
    <path d="${land}" fill="black"/>
  </mask>
  <g mask="url(#ocean)">
    <rect width="${W}" height="${H}" fill="#d4e7e1"/>
    <rect width="${W}" height="${H}" fill="url(#seaDepth)" opacity="0.72"/>
    <path d="${land}" fill="none" stroke="#e7f3ee" stroke-width="36" stroke-linejoin="round" stroke-linecap="round" opacity="0.5"/>
    <path d="${land}" fill="none" stroke="#f4faf7" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" opacity="0.8"/>
    ${graticule}
    ${waves}
  </g>`;
}

function compass(x, y) {
  return `<g transform="translate(${x},${y})" opacity="0.8">
  <circle r="46" fill="#e8dcc0" stroke="#5a4a30" stroke-width="1.8"/>
  <path d="M0 -34 L8 0 L0 34 L-8 0 Z" fill="#8a6a28"/>
  <path d="M-34 0 L0 -8 L34 0 L0 8 Z" fill="#6a7a5a" opacity="0.65"/>
  <text y="-50" text-anchor="middle" fill="#5a4a30" font-family="Georgia, serif" font-size="13" letter-spacing="0.2em">N</text>
</g>`;
}

/**
 * Walk a geographic outline and nick the edges. `amp` on each anchor is the
 * roughness of the edge that leaves it. Large bays are drawn in the outline
 * itself; this only keeps the ink from looking ruled.
 */
function roughCoast(anchors, rng) {
  const samples = [];
  const amps = [];
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    const b = anchors[(i + 1) % anchors.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.round(len / 48));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      samples.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      amps.push(a[2]);
    }
  }
  const n = samples.length;
  let cx = 0;
  let cy = 0;
  for (const p of samples) {
    cx += p[0];
    cy += p[1];
  }
  cx /= n;
  cy /= n;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const prev = samples[(i - 1 + n) % n];
    const next = samples[(i + 1) % n];
    let tx = next[0] - prev[0];
    let ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    let nx = ty;
    let ny = -tx;
    const p = samples[i];
    if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const amp = amps[i];
    const jag = rng() > 0.72 ? amp * (0.35 + rng() * 0.9) : amp * rng() * 0.35;
    const sign = rng() < 0.58 ? -1 : 1;
    pts.push([
      p[0] + nx * sign * jag + tx * (rng() - 0.5) * amp * 0.25,
      p[1] + ny * sign * jag + ty * (rng() - 0.5) * amp * 0.25,
    ]);
  }
  return pts;
}

/** Firth of Drengist, the Falas, Cape Balar, and a bay that reaches the Mouths of Sirion. */
function beleriandCoast(rng) {
  return roughCoast(
    [
      [520, 360, 12],
      [780, 230, 10],
      [1120, 185, 8],
      [1500, 220, 8],
      [1860, 260, 7],
      [2140, 350, 6],
      [2340, 520, 6],
      [2520, 760, 6],
      [2560, 1040, 6],
      [2460, 1340, 6],
      [2280, 1600, 10],
      [2080, 1760, 16],
      [1900, 1900, 20],
      [1720, 2060, 22],
      [1560, 2220, 22],
      [1400, 2060, 24],
      [1260, 1900, 22],
      [1140, 1800, 18],
      [1040, 1745, 16],
      [940, 1800, 18],
      [820, 1960, 22],
      [700, 2140, 22],
      [580, 2300, 22],
      [470, 2420, 18],
      [390, 2280, 18],
      [330, 2100, 20],
      [280, 1920, 22],
      [240, 1740, 20],
      [310, 1580, 18],
      [230, 1420, 22],
      [290, 1260, 18],
      [220, 1100, 20],
      [280, 960, 16],
      [220, 940, 16],
      [250, 860, 8],
      [430, 830, 7],
      [640, 800, 6],
      [560, 690, 7],
      [390, 660, 8],
      [240, 600, 12],
      [300, 470, 14],
      [390, 380, 12],
    ],
    rng,
  );
}

function middleEarthCoast(rng) {
  return roughCoast(
    [
      [640, 300, 14],
      [480, 380, 16],
      [360, 500, 18],
      [460, 620, 16],
      [340, 720, 16],
      [270, 800, 14],
      [340, 860, 8],
      [300, 930, 8],
      [240, 1000, 16],
      [250, 1200, 20],
      [330, 1400, 18],
      [240, 1600, 22],
      [300, 1820, 18],
      [240, 2060, 22],
      [160, 2220, 18],
      [120, 2380, 16],
      [240, 2520, 20],
      [480, 2460, 24],
      [740, 2340, 24],
      [980, 2220, 22],
      [1200, 2300, 22],
      [1440, 2460, 20],
      [1600, 2600, 18],
      [1420, 2700, 16],
      [1680, 2760, 14],
      [2040, 2680, 12],
      [2360, 2520, 10],
      [2580, 2280, 8],
      [2720, 1980, 8],
      [2840, 1600, 8],
      [2920, 1180, 8],
      [2860, 820, 8],
      [2640, 520, 8],
      [2280, 360, 10],
      [1840, 260, 10],
      [1380, 230, 12],
      [980, 270, 14],
    ],
    rng,
  );
}

function ringPath(pts) {
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  return `${d} Z`;
}

function pointInRing(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0001) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function generateBeleriand() {
  const rng = mulberry32(11);
  const coastPts = beleriandCoast(mulberry32(41));
  const land = ringPath(coastPts);
  const onLand = [
    ["Hithlum", 980, 600],
    ["Dorthonion", 1580, 540],
    ["Doriath", 1480, 1300],
    ["Nevrast", 700, 860],
    ["Barad Eithel", 980, 580],
    ["Vinyamar", 720, 680],
    ["Gondolin", 1480, 800],
    ["Mouths of Sirion", 1000, 1695],
    ["Belegost", 2360, 1080],
    ["Nogrod", 2400, 1320],
    ["Angband", 1720, 420],
  ];
  for (const [name, x, y] of onLand) {
    if (!pointInRing(coastPts, x, y)) console.warn(`off the land: ${name}`);
  }
  if (pointInRing(coastPts, 190, 1120)) console.warn("BELEGAER label is on land");
  if (pointInRing(coastPts, 1240, 1980)) console.warn("Bay label is on land");

  let b = "";
  b += ocean(land);
  b += `<clipPath id="landClip"><path d="${land}"/></clipPath>`;
  b += `<g clip-path="url(#landClip)">`;

  b += hills(rng, 1200, 1000, 1600, 1200, 240);
  b += forest(rng, 1480, 1240, 580, 420, 480);
  b += forest(rng, 1000, 1320, 260, 200, 140);
  b += forest(rng, 1420, 1960, 600, 220, 220);
  b += forest(rng, 2260, 1280, 180, 460, 160);

  const eredLuin = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    eredLuin.push([2320 + Math.sin(t * 5) * 18, 620 + t * 860]);
  }
  b += engravedRange(rng, eredLuin, 1.05);
  const north = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    north.push([720 + t * 1360, 540 + Math.sin(t * 5) * 12]);
  }
  b += engravedRange(rng, north, 0.92);
  b += engravedRange(
    rng,
    [
      [1280, 640],
      [1380, 610],
      [1480, 630],
      [1580, 600],
      [1680, 640],
    ],
    0.72,
  );
  b += engravedRange(
    rng,
    [
      [1320, 820],
      [1420, 790],
      [1520, 810],
      [1600, 800],
    ],
    0.62,
  );

  b += river(
    "M 1460 700 C 1440 880, 1480 1060, 1400 1260 C 1320 1460, 1240 1600, 1140 1700 C 1080 1740, 1020 1760, 990 1805",
    5.5,
  );
  b += river("M 980 760 C 1120 840, 1260 920, 1380 1040", 2.8);
  b += river("M 920 1280 C 1060 1340, 1220 1420, 1340 1560", 3);
  b += river("M 1720 860 C 1640 980, 1540 1120, 1440 1240", 2.8);
  b += river("M 2160 1080 C 2080 1240, 1960 1460, 1800 1680 C 1680 1820, 1480 1960, 1280 2060", 3.5);

  b += road("M 900 640 C 1100 720, 1320 820, 1480 940");
  b += road("M 1480 940 C 1400 1140, 1280 1380, 1160 1580");
  b += `</g>`;

  b += `<path fill="none" stroke="#1a1612" stroke-width="2.6" stroke-linejoin="miter" stroke-miterlimit="2.2" d="${land}"/>`;

  b += region(980, 600, "HITHLUM", 30);
  b += region(1580, 540, "DORTHONION", 24);
  b += region(1480, 1300, "DORIATH", 34);
  b += region(1000, 1400, "WEST BELERIAND", 20);
  b += region(2260, 1400, "OSSIRIAND", 24);
  b += region(700, 860, "NEVRAST", 20);
  b += seaName(1180, 2620, "BAY OF BALAR", 20);
  b += seaName(190, 1100, "BELEGAER", 24, "(The Great Sea)");
  b += label(560, 2268, "Cape Balar", 13);
  b += label(300, 790, "Firth of Drengist", 12);

  b += town(980, 580, "Barad Eithel", true);
  b += town(720, 680, "Vinyamar");
  b += town(1480, 800, "Gondolin", true);
  b += town(1640, 680, "Himring");
  b += town(1360, 1120, "Menegroth", true);
  b += town(1080, 1380, "Nargothrond", true);
  b += town(1240, 1640, "Brethil");
  b += town(2040, 1200, "Sarn Athrad");
  b += town(2360, 1080, "Belegost");
  b += town(2400, 1320, "Nogrod");
  b += town(1000, 1695, "Mouths of Sirion", true);
  b += town(1520, 620, "Tol Sirion");
  b += town(1720, 420, "Angband", true);

  const islePath = ringPath(
    roughCoast(
      [
        [1135, 2168, 8],
        [1225, 2142, 9],
        [1310, 2195, 10],
        [1355, 2288, 9],
        [1290, 2365, 11],
        [1348, 2435, 10],
        [1295, 2525, 8],
        [1195, 2568, 9],
        [1105, 2495, 10],
        [1065, 2405, 9],
        [1115, 2325, 10],
        [1055, 2245, 9],
        [1105, 2188, 8],
      ],
      mulberry32(77),
    ),
  );
  b += `<path d="${islePath}" fill="none" stroke="#d5ebe4" stroke-width="14" stroke-linejoin="round" opacity="0.9"/>`;
  b += `<path d="${islePath}" fill="#e4d6b4" stroke="#1a1612" stroke-width="2.15" stroke-linejoin="round"/>`;
  b += `<path d="M 1478 2372 L 1516 2344 L 1544 2378 L 1506 2408 L 1472 2392 Z" fill="#e4d6b4" stroke="#1a1612" stroke-width="1.3" stroke-linejoin="miter"/>`;
  b += `<path d="M 972 2472 L 1008 2444 L 1036 2476 L 1004 2508 L 964 2488 Z" fill="#e4d6b4" stroke="#1a1612" stroke-width="1.2" stroke-linejoin="miter"/>`;
  b += label(1124, 2340, "Isle of Balar", 14);

  b += `<text x="1080" y="128" fill="#3a2e1c" font-family="Palatino Linotype, Georgia, serif" font-size="28" letter-spacing="0.2em" opacity="0.65">BELERIAND</text>`;
  b += compass(3720, 380);
  b += `<rect x="56" y="56" width="${W - 112}" height="${H - 112}" fill="none" stroke="#5a4a30" stroke-width="2.2" opacity="0.4"/>
<rect x="68" y="68" width="${W - 136}" height="${H - 136}" fill="none" stroke="#5a4a30" stroke-width="1" opacity="0.25"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${defs()}${sheet()}${b}
</svg>`;
}

function generateMiddleEarth() {
  const rng = mulberry32(23);
  const coastPts = middleEarthCoast(mulberry32(23));
  const land = ringPath(coastPts);
  const sea = `
    M 20,160
    L 20,2980
    L 1900,2980
    L 1700,2500
    L 1100,2100
    L 700,1400
    L 620,400
    L 280,160
    Z`;
  for (const [name, x, y] of [
    ["Grey Havens", 460, 880],
    ["Hobbiton", 860, 960],
    ["Lindon", 480, 980],
    ["Minas Tirith", 2040, 2160],
    ["Erebor", 2460, 560],
  ]) {
    if (!pointInRing(coastPts, x, y)) console.warn(`off Middle-earth: ${name}`);
  }

  let b = "";
  b += ocean(land, sea);
  b += `<clipPath id="meLand"><path d="${land}"/></clipPath>`;
  b += `<g clip-path="url(#meLand)">`;

  b += hills(rng, 1200, 1200, 1800, 1400, 260);
  b += forest(rng, 900, 980, 280, 180, 90); // Shire woods
  b += forest(rng, 2080, 1000, 520, 460, 420); // Mirkwood
  b += forest(rng, 1680, 1500, 200, 160, 90); // Fangorn
  b += forest(rng, 1820, 1320, 160, 120, 60); // Lórien

  // Mordor — light hatch only, no brown disc
  b += `<path fill="url(#ash)" fill-opacity="0.55" stroke="#4a4038" stroke-width="1.2" opacity="0.7" d="
    M 2280,1820 C 2480,1760 2680,1840 2760,2000
    C 2800,2120 2740,2260 2580,2340
    C 2400,2440 2180,2360 2120,2180
    C 2080,2040 2140,1900 2280,1820 Z"/>`;
  b += `<circle cx="2480" cy="2100" r="28" fill="#c45c2a" opacity="0.18"/>`;
  b += `<path d="M2480 2060 L2510 2125 L2450 2125 Z" fill="#3a2a28"/>`;
  b += `<path d="M2480 2072 L2496 2118 L2464 2118 Z" fill="#c45c2a" opacity="0.75"/>`;

  const misty = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    misty.push([1620 + Math.sin(t * 12) * 22, 360 + t * 1500]);
  }
  b += mountains(rng, misty);
  b += mountains(rng, [
    [2400, 520],
    [2460, 500],
    [2520, 520],
  ]);
  const white = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    white.push([1680 + t * 520, 1920 + Math.sin(t * 6) * 26]);
  }
  b += mountains(rng, white);

  b += river(
    "M 1840 400 C 1880 620, 1780 860, 1860 1100 C 1940 1340, 1840 1580, 1900 1820 C 1940 1980, 1980 2160, 1900 2360 C 1840 2480, 1720 2580, 1580 2640",
    6,
  );
  b += river("M 880 960 C 980 1020, 1060 1120, 1100 1240", 2.8);
  b += river("M 1520 1540 C 1640 1640, 1760 1740, 1880 1880", 3);
  b += river("M 2160 780 C 2100 920, 2000 1060, 1880 1180", 2.8);

  b += road("M 860 980 C 1140 1020, 1420 1080, 1640 1160");
  b += road("M 1640 1160 C 1760 1400, 1860 1680, 1960 1960");
  b += `</g>`;

  b += `<path fill="none" stroke="#1a1612" stroke-width="2.6" stroke-linejoin="miter" stroke-miterlimit="2.2" d="${land}"/>`;

  b += region(900, 820, "ERIADOR", 32);
  b += region(900, 980, "THE SHIRE", 18);
  b += region(2140, 980, "RHOVANION", 26);
  b += region(1720, 1780, "ROHAN", 30);
  b += region(1960, 2240, "GONDOR", 28);
  b += region(2480, 2200, "MORDOR", 24);
  b += region(560, 1040, "LINDON", 20);
  b += seaName(150, 1500, "BELEGAER", 22, "(The Great Sea)");
  b += seaName(780, 2480, "BAY OF BELFALAS", 16);
  b += seaName(175, 910, "GULF OF LUNE", 13);
  b += region(2080, 1420, "MIRKWOOD", 20);

  b += town(860, 960, "Hobbiton", true);
  b += town(1080, 940, "Bree", true);
  b += town(1240, 880, "Weathertop");
  b += town(1520, 800, "Rivendell", true);
  b += town(460, 880, "Grey Havens", true);
  b += town(1640, 1160, "Moria", true);
  b += town(1820, 1320, "Lothlórien", true);
  b += town(2460, 560, "Erebor", true);
  b += town(1560, 1560, "Isengard", true);
  b += town(1760, 1780, "Edoras", true);
  b += town(1640, 1720, "Helm's Deep");
  b += town(2040, 2160, "Minas Tirith", true);
  b += town(2160, 2140, "Osgiliath");
  b += town(2320, 2080, "Minas Morgul");
  b += town(2480, 2100, "Mount Doom", true);
  b += town(2620, 2000, "Barad-dûr", true);
  b += town(2340, 1920, "Black Gate");

  b += `<text x="160" y="150" fill="#3a2e1c" font-family="Palatino Linotype, Georgia, serif" font-size="26" letter-spacing="0.18em" opacity="0.65">MIDDLE-EARTH</text>`;
  b += compass(3720, 380);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${defs()}${sheet()}${b}
</svg>`;
}

fs.writeFileSync(path.join(outDir, "beleriand.svg"), generateBeleriand());
fs.writeFileSync(path.join(outDir, "middle-earth.svg"), generateMiddleEarth());
console.log("Wrote classic parchment atlases");
