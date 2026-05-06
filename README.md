# Native Plant Landscape Visualizer

A web app for designing native-plant garden beds with a drag-and-drop scaled
plan view and a WebXR/three.js augmented-reality preview.

## Features

- **Region-filtered plant palette** — pick your USDA zone + ecoregion and see
  only natives that belong there (~40 curated species, easily extended in
  `src/data/plants.json`).
- **Plan-view designer** — Konva canvas with pan/zoom, editable bed polygon,
  scaled circles matching each plant's mature spread, cluster quantities,
  auto-generated legend, undo/redo.
- **Two modes** — freeform *Plan* mode or a 1 ft snap *Grid* mode.
- **Persistence** — designs autosave to `localStorage`, with an import/export
  JSON workflow. Share via compressed `#/s/…` URL hash (no backend).
- **Exports** — PNG, printable PDF with plant list, JSON.
- **AR preview** — WebXR immersive-AR on supported phones (Android Chrome);
  non-AR 3D orbit fallback elsewhere.

## Running locally

```bash
npm install
npm run dev
```

Open the printed URL. The designer lives at `#/design`, AR at `#/ar`.

> AR note: WebXR requires **HTTPS** on a real device. Run
> `npm run dev:https` to start Vite with a locally-trusted cert (via
> `vite-plugin-mkcert`). On first run it installs a dev CA — accept any
> prompts. Then open the printed `https://<your-lan-ip>:5173` URL on your
> phone (same Wi-Fi). Desktop browsers without WebXR drop into the 3D orbit
> fallback automatically.

## Build

```bash
npm run build
npm run preview
```

Deploys as a static site (Netlify, Vercel, GitHub Pages — hash routing so no
server rewrites required).

## Tech

Vite, React 18, TypeScript, Tailwind CSS, Zustand, react-konva, three.js,
@react-three/fiber, @react-three/xr, @react-three/drei, lz-string, jsPDF,
lucide-react.

## Adding plants

Edit `src/data/plants.json`. Each entry needs:

```jsonc
{
  "id": "genus-species",
  "commonName": "...",
  "scientificName": "Genus species",
  "habit": "forb | grass | shrub | tree",
  "sun": "full | part | shade",
  "moisture": "dry | medium | wet",
  "matureHeightFt": 3, "matureSpreadFt": 2,
  "bloomColor": "#hex", "bloomMonths": [6,7,8],
  "zoneMin": "4a", "zoneMax": "8b",
  "ecoregions": ["northeast","midwest"],
  "swatchColor": "#hex"
}
```

Optional:

- `notes` (string) — shown in the inspector.
- `modelUrl` (string) — path to a `.glb`/`.gltf` under `public/models/`.
  When set, AR view renders the real model (rescaled to `matureHeightFt`).
  Falls back to the procedural billboard if the model is missing or fails
  to load. See `public/models/README.md` for authoring conventions and
  free CC-licensed model sources.
