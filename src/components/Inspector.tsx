import { Copy, Trash2, RotateCw } from "lucide-react";
import { useDesignStore } from "../store/useDesignStore";
import { getPlant } from "../lib/plants";
import { polygonAreaSqFt } from "../lib/geometry";

export function Inspector() {
  const design = useDesignStore((s) => s.current());
  const selectedUid = useDesignStore((s) => s.selectedUid);
  const deletePlant = useDesignStore((s) => s.deletePlant);
  const duplicatePlant = useDesignStore((s) => s.duplicatePlant);
  const rotateSelected = useDesignStore((s) => s.rotateSelected);
  const updateQty = useDesignStore((s) => s.updatePlantQuantity);
  const readOnly = useDesignStore((s) => s.readOnly);

  if (!design) return null;

  const placed = selectedUid
    ? design.plants.find((p) => p.uid === selectedUid)
    : null;
  const plant = placed ? getPlant(placed.plantId) : null;

  // Bed summary
  const area = polygonAreaSqFt(design.bed);
  const counts = new Map<string, number>();
  design.plants.forEach((p) => {
    counts.set(p.plantId, (counts.get(p.plantId) || 0) + (p.quantity || 1));
  });
  const totalPlants = Array.from(counts.values()).reduce((a, b) => a + b, 0);

  // Sun/moisture mix
  const sunMix = new Map<string, number>();
  const moistMix = new Map<string, number>();
  design.plants.forEach((pp) => {
    const pl = getPlant(pp.plantId);
    if (!pl) return;
    sunMix.set(pl.sun, (sunMix.get(pl.sun) || 0) + 1);
    moistMix.set(pl.moisture, (moistMix.get(pl.moisture) || 0) + 1);
  });

  return (
    <aside className="w-80 shrink-0 border-l border-stone-200 bg-white flex flex-col h-full">
      <div className="p-3 border-b border-stone-100">
        <h2 className="text-sm font-semibold text-stone-700">
          {plant ? "Selection" : "Bed summary"}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {plant && placed ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-full border border-stone-300"
                style={{ background: plant.swatchColor }}
              />
              <div className="min-w-0">
                <div className="font-semibold truncate">{plant.commonName}</div>
                <div className="text-xs italic text-stone-500 truncate">
                  {plant.scientificName}
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-stone-500">Habit</dt>
              <dd className="capitalize">{plant.habit}</dd>
              <dt className="text-stone-500">Sun</dt>
              <dd className="capitalize">{plant.sun}</dd>
              <dt className="text-stone-500">Moisture</dt>
              <dd className="capitalize">{plant.moisture}</dd>
              <dt className="text-stone-500">Mature size</dt>
              <dd>
                {plant.matureHeightFt}′H × {plant.matureSpreadFt}′W
              </dd>
              <dt className="text-stone-500">Zones</dt>
              <dd>
                {plant.zoneMin} – {plant.zoneMax}
              </dd>
              <dt className="text-stone-500">Bloom</dt>
              <dd>
                {plant.bloomMonths.length
                  ? plant.bloomMonths
                      .map((m) =>
                        new Date(2024, m - 1, 1).toLocaleString("en", {
                          month: "short",
                        })
                      )
                      .join(", ")
                  : "—"}
              </dd>
            </dl>
            {plant.notes && (
              <p className="text-xs text-stone-600 italic">{plant.notes}</p>
            )}
            <div>
              <label className="block text-xs text-stone-600">
                Quantity (cluster)
              </label>
              <input
                type="number"
                min={1}
                value={placed.quantity || 1}
                disabled={readOnly}
                onChange={(e) =>
                  updateQty(placed.uid, Math.max(1, parseInt(e.target.value) || 1))
                }
                className="mt-1 w-24 rounded-md border border-stone-300 px-2 py-1 text-sm"
              />
            </div>
            {!readOnly && (
              <div className="flex gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => rotateSelected(Math.PI / 12)}
                  className="flex-1 text-xs flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-stone-100 hover:bg-stone-200"
                >
                  <RotateCw className="h-3.5 w-3.5" /> Rotate
                </button>
                <button
                  onClick={() => duplicatePlant(placed.uid)}
                  className="flex-1 text-xs flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-stone-100 hover:bg-stone-200"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button
                  onClick={() => deletePlant(placed.uid)}
                  className="flex-1 text-xs flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4 text-sm">
            <div>
              <div className="text-stone-500 text-xs">Bed area</div>
              <div className="text-xl font-semibold">
                {area.toFixed(0)} sq ft
              </div>
            </div>
            <div>
              <div className="text-stone-500 text-xs">Plants placed</div>
              <div className="text-xl font-semibold">{totalPlants}</div>
            </div>
            {sunMix.size > 0 && (
              <div>
                <div className="text-stone-500 text-xs mb-1">Sun mix</div>
                <MixBar mix={sunMix} />
              </div>
            )}
            {moistMix.size > 0 && (
              <div>
                <div className="text-stone-500 text-xs mb-1">Moisture mix</div>
                <MixBar mix={moistMix} />
              </div>
            )}
            <p className="text-xs text-stone-500 pt-2 border-t border-stone-100">
              Tip: drag plants from the palette onto the canvas. Click a plant
              to inspect it.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

function MixBar({ mix }: { mix: Map<string, number> }) {
  const total = Array.from(mix.values()).reduce((a, b) => a + b, 0) || 1;
  const colors: Record<string, string> = {
    full: "#f59e0b",
    part: "#a3a3a3",
    shade: "#4b5563",
    dry: "#fbbf24",
    medium: "#60a5fa",
    wet: "#2563eb",
  };
  return (
    <div>
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-stone-100">
        {Array.from(mix.entries()).map(([k, v]) => (
          <div
            key={k}
            title={`${k}: ${v}`}
            style={{
              width: `${(v / total) * 100}%`,
              background: colors[k] || "#9ca3af",
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-stone-600">
        {Array.from(mix.entries()).map(([k, v]) => (
          <span key={k}>
            <span
              className="inline-block h-2 w-2 rounded-sm mr-1"
              style={{ background: colors[k] || "#9ca3af" }}
            />
            {k} {v}
          </span>
        ))}
      </div>
    </div>
  );
}
