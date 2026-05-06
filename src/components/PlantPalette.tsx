import { useMemo, useState } from "react";
import { Search, Sun, CloudRain, Leaf, Settings2, X } from "lucide-react";
import { useDesignStore } from "../store/useDesignStore";
import { filterPlants } from "../lib/plants";
import type { Plant } from "../types";

const SUN_OPTS = [
  { id: "", label: "Any sun" },
  { id: "full", label: "Full" },
  { id: "part", label: "Part" },
  { id: "shade", label: "Shade" },
];
const MOIST_OPTS = [
  { id: "", label: "Any moisture" },
  { id: "dry", label: "Dry" },
  { id: "medium", label: "Medium" },
  { id: "wet", label: "Wet" },
];
const HABIT_OPTS = [
  { id: "", label: "Any habit" },
  { id: "forb", label: "Forb" },
  { id: "grass", label: "Grass" },
  { id: "shrub", label: "Shrub" },
  { id: "tree", label: "Tree" },
];

export function PlantPalette({
  onOpenRegion,
  onPickedOnMobile,
}: {
  onOpenRegion: () => void;
  onPickedOnMobile?: () => void;
}) {
  const region = useDesignStore((s) => s.region);
  const armedPlantId = useDesignStore((s) => s.armedPlantId);
  const setArmedPlant = useDesignStore((s) => s.setArmedPlant);
  const readOnly = useDesignStore((s) => s.readOnly);
  const [q, setQ] = useState("");
  const [sun, setSun] = useState("");
  const [moisture, setMoisture] = useState("");
  const [habit, setHabit] = useState("");

  const plants = useMemo(
    () => filterPlants(region, q, { sun, moisture, habit }),
    [region, q, sun, moisture, habit]
  );

  function onDragStart(e: React.DragEvent, p: Plant) {
    e.dataTransfer.setData("text/plant-id", p.id);
    e.dataTransfer.effectAllowed = "copy";
  }

  function onPick(p: Plant) {
    if (readOnly) return;
    // Toggle: tapping the armed plant again disarms it.
    if (armedPlantId === p.id) {
      setArmedPlant(null);
      return;
    }
    setArmedPlant(p.id);
    // On mobile, dismiss the drawer so the user can see the canvas.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      onPickedOnMobile?.();
    }
  }

  return (
    <aside className="w-72 shrink-0 border-r border-stone-200 bg-white flex flex-col h-full">
      <div className="p-3 border-b border-stone-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-stone-700">Plant palette</h2>
          <button
            onClick={onOpenRegion}
            className="text-xs text-brand-700 hover:underline flex items-center gap-1"
            title="Change region"
          >
            <Settings2 className="h-3.5 w-3.5" /> Region
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plants…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-1 mt-2">
          <FilterSelect icon={<Sun className="h-3 w-3" />} value={sun} onChange={setSun} opts={SUN_OPTS} />
          <FilterSelect icon={<CloudRain className="h-3 w-3" />} value={moisture} onChange={setMoisture} opts={MOIST_OPTS} />
          <FilterSelect icon={<Leaf className="h-3 w-3" />} value={habit} onChange={setHabit} opts={HABIT_OPTS} />
        </div>
        <div className="mt-2 text-[11px] text-stone-500">
          {plants.length} plants{region.showAll ? " (all regions)" : ""}
        </div>
      </div>
      {armedPlantId && (
        <div className="px-3 py-2 bg-brand-50 border-b border-brand-100 flex items-center gap-2 text-xs">
          <span className="flex-1 text-brand-900">
            <span className="font-semibold">Tap canvas to place.</span> Tap again to place more.
          </span>
          <button
            onClick={() => setArmedPlant(null)}
            className="p-1 rounded hover:bg-brand-100 text-brand-700"
            title="Cancel placement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {plants.map((p) => {
          const armed = armedPlantId === p.id;
          return (
          <button
            key={p.id}
            type="button"
            draggable={!readOnly}
            onDragStart={(e) => onDragStart(e, p)}
            onClick={() => onPick(p)}
            className={`group w-full text-left flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-grab active:cursor-grabbing ${
              armed
                ? "bg-brand-100 border-brand-500 ring-2 ring-brand-300"
                : "border-transparent hover:bg-brand-50 hover:border-brand-200"
            }`}
            title={`Tap to arm, or drag onto the canvas\n${p.scientificName} · ${p.matureSpreadFt} ft spread`}
          >
            <div
              className="h-7 w-7 rounded-full border border-stone-300 shrink-0"
              style={{ background: p.swatchColor }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-stone-800 truncate">
                {p.commonName}
              </div>
              <div className="text-[11px] italic text-stone-500 truncate">
                {p.scientificName}
              </div>
            </div>
            <div className="text-[10px] text-stone-500 text-right shrink-0">
              <div>{p.matureHeightFt}′H</div>
              <div>{p.matureSpreadFt}′W</div>
            </div>
          </button>
          );
        })}
        {plants.length === 0 && (
          <div className="p-4 text-center text-xs text-stone-500">
            No plants match. Try clearing filters or changing region.
          </div>
        )}
      </div>
    </aside>
  );
}

function FilterSelect({
  icon,
  value,
  onChange,
  opts,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  opts: { id: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-md px-1.5 py-1 text-[11px] text-stone-700">
      <span className="text-stone-400">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent flex-1 outline-none"
      >
        {opts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
