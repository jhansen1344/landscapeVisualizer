# Plant models

Drop `.glb` or `.gltf` files here and reference them from `src/data/plants.json`
via a `modelUrl` field, e.g.:

```json
{
  "id": "echinacea-purpurea",
  "modelUrl": "/models/echinacea-purpurea.glb",
  ...
}
```

## Model conventions

- **Up axis**: +Y up (glTF default).
- **Forward**: +Z (doesn't really matter for plants, but pick a convention).
- **Origin**: at the base of the plant (roots / ground contact at y=0).
  The loader re-grounds to y=0 automatically, but a clean origin helps.
- **Scale**: the loader rescales the model so its bounding-box height matches
  the plant's `matureHeightFt`. You can author the model at any size.
- **Formats**: `.glb` preferred (single file, smaller). Draco/meshopt
  compression is fine — drei's `useGLTF` handles both.
- **Textures**: baked-in or embedded. External image files alongside the
  `.gltf` also work.
- **Size budget**: keep each model ≤ 500 KB for smooth mobile AR. Aim for
  < 5k triangles per plant.

## Where to get free plant models

- [Quaternius "Ultimate Nature Pack"](https://quaternius.com/) (CC0)
- [Kenney Nature Kit](https://kenney.nl/assets/nature-kit) (CC0)
- [Poly Pizza](https://poly.pizza/) — searchable CC-BY / CC0 library
- [Sketchfab](https://sketchfab.com/) — filter by "Downloadable" + license
- [PolyHaven](https://polyhaven.com/models) (CC0) — has a few trees/shrubs

Attribute CC-BY assets in the app's footer or a separate `CREDITS.md`.

## Fallback behavior

If `modelUrl` is missing, fails to load, or 404s, the AR view falls back to
the procedural `PlantBillboard` for that species — so you can ship partial
model coverage without breaking anything.
