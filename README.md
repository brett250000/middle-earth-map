# Middle-earth — Atlas of the Ages

A cinematic 3D atlas: maps rest on a wooden table. Watch **Beleriand** drown in rain and flood after the War of Wrath, then explore the **Middle-earth** that remained.

Original stylized SVG maps (not official Tolkien Estate art). Built with Next.js, React Three Fiber, and GSAP.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — serve the production build

## Experience

1. The scene opens on Beleriand (First Age) on a candlelit wooden table.
2. Click **Witness the drowning** for rain, flood, and the transition to Middle-earth.
3. Afterward, click golden markers for a few key places. **Replay the flood** to run it again.

## Assets (CC0)

Photoreal tavern materials/models/HDRI are from [Poly Haven](https://polyhaven.com/) (**CC0**). See `public/assets/LICENSES.md`.

```bash
npm run assets    # re-download Poly Haven table/candle/room assets
npm run textures  # regenerate map parchment composites
```
