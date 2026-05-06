import { useDesignStore } from "../store/useDesignStore";
import { getPlant, plantInitials } from "../lib/plants";

export function Legend() {
  const design = useDesignStore((s) => s.current());
  if (!design) return null;

  const counts = new Map<string, number>();
  design.plants.forEach((pp) => {
    counts.set(pp.plantId, (counts.get(pp.plantId) || 0) + (pp.quantity || 1));
  });

  if (counts.size === 0) return null;

  return (
    <div className="absolute right-3 bottom-16 md:bottom-auto md:top-3 bg-white/95 backdrop-blur border border-stone-200 rounded-lg shadow-sm max-w-[16rem] md:max-w-xs max-h-[40%] md:max-h-[60%] overflow-y-auto">
      <div className="px-3 py-2 border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wide text-stone-600">
        Legend
      </div>
      <ul className="p-2 space-y-1">
        {Array.from(counts.entries()).map(([pid, count]) => {
          const plant = getPlant(pid);
          if (!plant) return null;
          return (
            <li key={pid} className="flex items-center gap-2 text-xs">
              <span
                className="inline-grid place-items-center h-5 w-5 rounded-full border border-stone-300 text-[9px] font-bold"
                style={{ background: plant.swatchColor, color: "#111" }}
              >
                {plantInitials(plant)}
              </span>
              <span className="flex-1 truncate">
                <span className="font-medium">{plant.commonName}</span>{" "}
                <span className="italic text-stone-500">
                  {plant.scientificName}
                </span>
              </span>
              <span className="text-stone-600 tabular-nums">×{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
