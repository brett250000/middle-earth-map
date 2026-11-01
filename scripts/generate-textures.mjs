/**
 * Generates PBR wood + detailed parchment map textures into public/
 * Run: node scripts/generate-textures.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pub = path.join(root, "public");

function clamp(v, a = 0, b = 255) {
  return Math.max(a, Math.min(b, v | 0));
}

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise2(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, oct = 5) {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    v += a * noise2(x * f, y * f);
    f *= 2;
    a *= 0.5;
  }
  return v;
}

async function writeRgb(name, w, h, fn) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fn(x, y, w, h);
      const i = (y * w + x) * 3;
      buf[i] = clamp(r);
      buf[i + 1] = clamp(g);
      buf[i + 2] = clamp(b);
    }
  }
  await sharp(buf, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toFile(path.join(pub, name));
  console.log("wrote", name);
}

async function writeGray(name, w, h, fn) {
  await writeRgb(name, w, h, (x, y, W, H) => {
    const g = fn(x, y, W, H);
    return [g, g, g];
  });
}

async function generateWood() {
  const w = 1024;
  const h = 1024;
  const height = new Float32Array(w * h);

  await writeRgb("wood-albedo.png", w, h, (x, y) => {
    const u = x / w;
    const v = y / h;
    // Ring-like grain along Y with wavy distortion
    const warp = fbm(u * 3, v * 8, 4) * 0.08;
    const rings = Math.sin((v + warp) * Math.PI * 42 + fbm(u * 2, v * 2, 3) * 2.5);
    const pore = fbm(u * 40, v * 12, 3);
    const stain = fbm(u * 1.5, v * 1.2, 4);
    const baseR = 96 + stain * 28 + rings * 18;
    const baseG = 58 + stain * 16 + rings * 10;
    const baseB = 32 + stain * 8 + rings * 5;
    const dark = pore > 0.72 ? -18 : 0;
    // Wear near edges of tile
    const wear = Math.pow(Math.min(u, 1 - u, v, 1 - v) * 4, 1.2);
    height[y * w + x] = rings * 0.5 + 0.5 + pore * 0.15;
    return [
      baseR + dark + wear * 8,
      baseG + dark + wear * 5,
      baseB + dark + wear * 3,
    ];
  });

  await writeGray("wood-roughness.png", w, h, (x, y) => {
    const u = x / w;
    const v = y / h;
    const grain = Math.abs(Math.sin((v + fbm(u * 2, v * 6, 3) * 0.05) * 50));
    const pore = fbm(u * 35, v * 14, 3);
    return 110 + grain * 70 + pore * 40;
  });

  // Normal from height field
  await writeRgb("wood-normal.png", w, h, (x, y) => {
    const i = (yy, xx) => height[((yy + h) % h) * w + ((xx + w) % w)];
    const dx = (i(y, x + 1) - i(y, x - 1)) * 4;
    const dy = (i(y + 1, x) - i(y - 1, x)) * 4;
    const nx = -dx;
    const ny = -dy;
    const nz = 1;
    const len = Math.hypot(nx, ny, nz) || 1;
    return [
      ((nx / len) * 0.5 + 0.5) * 255,
      ((ny / len) * 0.5 + 0.5) * 255,
      ((nz / len) * 0.5 + 0.5) * 255,
    ];
  });
}

async function generateParchmentBase(name, w, h) {
  await writeRgb(name, w, h, (x, y) => {
    const u = x / w;
    const v = y / h;
    const fiber = fbm(u * 28, v * 36, 5);
    const blot = fbm(u * 6, v * 5, 4);
    const edge =
      Math.pow(Math.min(u, 1 - u) * 8, 1.4) * Math.pow(Math.min(v, 1 - v) * 8, 1.4);
    const burn = (1 - edge) * (0.35 + blot * 0.5);
    const r = 214 - fiber * 22 - burn * 55 - blot * 12;
    const g = 196 - fiber * 24 - burn * 60 - blot * 14;
    const b = 158 - fiber * 20 - burn * 50 - blot * 10;
    return [r, g, b];
  });
}

async function generateParchmentNormal(w = 1024, h = 1024) {
  const height = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      height[y * w + x] =
        fbm(u * 40, v * 50, 5) * 0.65 + fbm(u * 8, v * 7, 3) * 0.35;
    }
  }
  await writeRgb("parchment-normal.png", w, h, (x, y) => {
    const i = (yy, xx) =>
      height[Math.max(0, Math.min(h - 1, yy)) * w + Math.max(0, Math.min(w - 1, xx))];
    const dx = (i(y, x + 1) - i(y, x - 1)) * 3.5;
    const dy = (i(y + 1, x) - i(y - 1, x)) * 3.5;
    const len = Math.hypot(-dx, -dy, 1) || 1;
    return [
      ((-dx / len) * 0.5 + 0.5) * 255,
      ((-dy / len) * 0.5 + 0.5) * 255,
      ((1 / len) * 0.5 + 0.5) * 255,
    ];
  });
}

function enrichSvg(srcPath, outPath, kind) {
  let svg = fs.readFileSync(srcPath, "utf8");
  // Strip invalid controls
  svg = svg.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "-");

  const extra =
    kind === "beleriand"
      ? `
  <g opacity="0.28" fill="none" stroke="#2a2418" stroke-width="0.8">
    ${Array.from({ length: 18 }, (_, i) => {
      const y = 320 + i * 70;
      return `<path d="M420 ${y} C700 ${y - 20}, 1100 ${y + 25}, 1700 ${y - 10}" />`;
    }).join("\n")}
  </g>
  <g fill="#1e1810" opacity="0.55" font-family="Georgia, serif" font-size="11" letter-spacing="0.12em">
    <text x="860" y="640">NARGOTHROND</text>
    <text x="1280" y="720">MENEGROTH</text>
    <text x="620" y="780">BRITHOMBAR</text>
    <text x="700" y="860">EGLAREST</text>
    <text x="1480" y="980">AMON EREB</text>
    <text x="980" y="1180">TOL SIRION</text>
  </g>
  <g fill="none" stroke="#3a3228" stroke-width="1.2" opacity="0.45">
    <path d="M640 700 C700 740, 760 800, 820 860" stroke-dasharray="4 3"/>
    <path d="M1000 600 C1080 680, 1180 760, 1240 860" stroke-dasharray="4 3"/>
    <path d="M1320 520 C1400 600, 1480 700, 1520 820" stroke-dasharray="4 3"/>
  </g>
  <g fill="#2c2418" opacity="0.35">
    ${Array.from({ length: 120 }, (_, i) => {
      const x = 900 + (i % 12) * 28 + ((i * 7) % 9);
      const y = 720 + Math.floor(i / 12) * 22 + ((i * 3) % 7);
      return `<circle cx="${x}" cy="${y}" r="1.2"/>`;
    }).join("")}
  </g>`
      : `
  <g opacity="0.25" fill="none" stroke="#2a2418" stroke-width="0.7">
    ${Array.from({ length: 16 }, (_, i) => {
      const y = 280 + i * 85;
      return `<path d="M280 ${y} C700 ${y + 15}, 1400 ${y - 20}, 2100 ${y + 8}" />`;
    }).join("\n")}
  </g>
  <g fill="#1e1810" opacity="0.55" font-family="Georgia, serif" font-size="11" letter-spacing="0.1em">
    <text x="480" y="640">HOBBITON</text>
    <text x="900" y="510">RIVENDELL</text>
    <text x="1080" y="840">LOTHLÓRIEN</text>
    <text x="1100" y="1190">EDORAS</text>
    <text x="1280" y="1430">MINAS TIRITH</text>
    <text x="1680" y="1390">ORODRUIN</text>
    <text x="1520" y="350">EREBOR</text>
  </g>
  <g fill="none" stroke="#3a3228" stroke-width="1.1" opacity="0.4" stroke-dasharray="5 4">
    <path d="M520 620 C700 580, 860 540, 940 500"/>
    <path d="M940 500 C1000 620, 1040 720, 1120 820"/>
    <path d="M1120 820 C1100 980, 1140 1120, 1320 1420"/>
    <path d="M1320 1420 C1500 1400, 1640 1380, 1720 1380"/>
  </g>
  <g fill="#2c2418" opacity="0.3">
    ${Array.from({ length: 160 }, (_, i) => {
      const x = 1180 + (i % 14) * 22 + ((i * 5) % 8);
      const y = 440 + Math.floor(i / 14) * 18 + ((i * 2) % 6);
      return `<circle cx="${x}" cy="${y}" r="1.1"/>`;
    }).join("")}
  </g>`;

  if (!svg.includes("</svg>")) throw new Error("bad svg " + srcPath);
  svg = svg.replace("</svg>", `${extra}\n</svg>`);
  fs.writeFileSync(outPath, svg);
}

async function rasterAndComposite(svgPath, parchmentPath, outName) {
  const tmpSvgPng = path.join(pub, `_tmp_${outName}.png`);
  execFileSync("rsvg-convert", ["-w", "2048", "-h", "1536", svgPath, "-o", tmpSvgPng], {
    stdio: "inherit",
  });

  // Bright parchment so multiply keeps map contrast
  const parchmentSoft = await sharp(parchmentPath)
    .resize(2048, 1536)
    .modulate({ brightness: 1.35, saturation: 0.9 })
    .linear(1.05, 12)
    .toBuffer();

  const fiberOverlay = await sharp(parchmentPath)
    .resize(2048, 1536)
    .greyscale()
    .modulate({ brightness: 1.2 })
    .linear(0.22, 40)
    .ensureAlpha(0.35)
    .toBuffer();

  await sharp(tmpSvgPng)
    .resize(2048, 1536)
    .modulate({ brightness: 1.05, saturation: 0.95 })
    .composite([
      { input: parchmentSoft, blend: "multiply" },
      { input: fiberOverlay, blend: "overlay" },
    ])
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(path.join(pub, outName));

  fs.unlinkSync(tmpSvgPng);
  console.log("wrote", outName);
}

async function main() {
  fs.mkdirSync(pub, { recursive: true });
  await generateWood();
  await generateParchmentBase("parchment-base.png", 2048, 1536);
  await generateParchmentNormal(1024, 1024);

  const belEnrich = path.join(pub, "_beleriand-enriched.svg");
  const midEnrich = path.join(pub, "_middle-earth-enriched.svg");
  enrichSvg(path.join(pub, "beleriand.svg"), belEnrich, "beleriand");
  enrichSvg(path.join(pub, "middle-earth.svg"), midEnrich, "middle-earth");

  await rasterAndComposite(
    belEnrich,
    path.join(pub, "parchment-base.png"),
    "beleriand.jpg",
  );
  await rasterAndComposite(
    midEnrich,
    path.join(pub, "parchment-base.png"),
    "middle-earth.jpg",
  );

  // Keep PNGs in sync for any leftover refs
  await sharp(path.join(pub, "beleriand.jpg")).png().toFile(path.join(pub, "beleriand.png"));
  await sharp(path.join(pub, "middle-earth.jpg"))
    .png()
    .toFile(path.join(pub, "middle-earth.png"));

  fs.unlinkSync(belEnrich);
  fs.unlinkSync(midEnrich);
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
