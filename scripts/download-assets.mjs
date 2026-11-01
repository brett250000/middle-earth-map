/**
 * Downloads CC0 Poly Haven assets into public/assets/
 * License: https://polyhaven.com/license (CC0)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outRoot = path.join(root, "public", "assets");
const UA = "MiddleEarthMap/1.0 (local asset fetch; CC0)";

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function download(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log("skip", path.relative(root, dest));
    return;
  }
  console.log("get ", url.split("/").slice(-2).join("/"));
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log("wrote", path.relative(root, dest), `(${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function downloadModel(id, res = "1k") {
  const files = await getJson(`https://api.polyhaven.com/files/${id}`);
  const gltf = files.gltf?.[res]?.gltf;
  if (!gltf?.url) throw new Error(`No gltf for ${id} ${res}`);
  const baseDir = path.join(outRoot, "models", id);
  await download(gltf.url, path.join(baseDir, path.basename(gltf.url)));
  const includes = gltf.include || {};
  for (const [rel, meta] of Object.entries(includes)) {
    const url = typeof meta === "string" ? meta : meta.url;
    await download(url, path.join(baseDir, rel));
  }
}

async function downloadTextureSet(id, destName, res = "2k") {
  const files = await getJson(`https://api.polyhaven.com/files/${id}`);
  const dir = path.join(outRoot, destName);
  const maps = [
    ["Diffuse", "diff"],
    ["nor_gl", "nor"],
    ["Rough", "rough"],
    ["arm", "arm"],
    ["AO", "ao"],
  ];
  for (const [key, suffix] of maps) {
    const url = files[key]?.[res]?.jpg?.url;
    if (!url) continue;
    await download(url, path.join(dir, `${suffix}.jpg`));
  }
}

async function downloadHdri(id, res = "2k") {
  const files = await getJson(`https://api.polyhaven.com/files/${id}`);
  const url = files.hdri?.[res]?.hdr?.url;
  if (!url) throw new Error(`No HDRI ${id}`);
  await download(url, path.join(outRoot, "hdri", `${id}_${res}.hdr`));
}

async function main() {
  fs.mkdirSync(outRoot, { recursive: true });
  await downloadHdri("cowboy_town_saloon", "2k");
  await downloadTextureSet("wood_table_001", "wood-table", "2k");
  await downloadTextureSet("dark_wooden_planks", "wood-floor", "2k");
  await downloadTextureSet("weathered_brown_planks", "wood-wall", "2k");
  await downloadModel("WoodenTable_02", "2k");
  await downloadModel("brass_candleholders", "1k");
  await downloadModel("wine_bottles_01", "1k");
  await downloadModel("wooden_stool_01", "1k");

  fs.writeFileSync(
    path.join(outRoot, "LICENSES.md"),
    `# Asset licenses

All assets under \`public/assets/\` are from [Poly Haven](https://polyhaven.com/) and are licensed **CC0** (public domain dedication).

See https://polyhaven.com/license

Downloaded:
- HDRI: cowboy_town_saloon
- Textures: wood_table_001, dark_wooden_planks, weathered_brown_planks
- Models: WoodenTable_02, brass_candleholders, wine_bottles_01, wooden_stool_01
`,
  );
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
