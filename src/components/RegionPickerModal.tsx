import { useState } from "react";
import regionsJson from "../data/regions.json";
import { useDesignStore } from "../store/useDesignStore";
import { MapPin } from "lucide-react";

const ECOREGIONS = regionsJson.ecoregions;
const ZONES = regionsJson.zones;

export function RegionPickerModal({ onClose }: { onClose: () => void }) {
  const setRegion = useDesignStore((s) => s.setRegion);
  const region = useDesignStore((s) => s.region);
  const [ecoregion, setEcoregion] = useState(region.ecoregion || "");
  const [zone, setZone] = useState(region.zone || "");
  const [showAll, setShowAll] = useState(!!region.showAll);

  function save() {
    setRegion({
      ecoregion: ecoregion || undefined,
      zone: zone || undefined,
      showAll: !ecoregion && !zone ? true : showAll,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-stone-200">
        <div className="p-6 border-b border-stone-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-800 grid place-items-center">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Pick your region</h2>
            <p className="text-sm text-stone-600">
              We'll filter the plant palette to species native to your area.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Ecoregion
            </span>
            <select
              value={ecoregion}
              onChange={(e) => setEcoregion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 bg-white"
            >
              <option value="">— Any —</option>
              {ECOREGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              USDA hardiness zone
            </span>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 bg-white"
            >
              <option value="">— Any —</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  Zone {z}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            Show all plants regardless of region
          </label>
        </div>
        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-stone-700 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 rounded-lg bg-brand-700 text-white hover:bg-brand-800"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
