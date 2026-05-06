import { Copy, Trash2, X } from "lucide-react";
import { useDesignStore } from "../store/useDesignStore";

export function DesignsDrawer({ onClose }: { onClose: () => void }) {
  const designs = useDesignStore((s) => s.designs);
  const currentId = useDesignStore((s) => s.currentId);
  const selectDesign = useDesignStore((s) => s.selectDesign);
  const deleteDesign = useDesignStore((s) => s.deleteDesign);
  const duplicateDesign = useDesignStore((s) => s.duplicateDesign);
  const createDesign = useDesignStore((s) => s.createDesign);

  const sorted = [...designs].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-80 h-full bg-white shadow-xl border-l border-stone-200 flex flex-col">
        <div className="h-12 px-3 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold">My designs</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-2">
          <button
            onClick={() => {
              createDesign();
              onClose();
            }}
            className="w-full text-sm px-3 py-2 rounded-md bg-brand-700 text-white hover:bg-brand-800"
          >
            + New design
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {sorted.map((d) => (
            <div
              key={d.id}
              className={`group rounded-md border px-2 py-2 text-sm cursor-pointer ${
                d.id === currentId
                  ? "border-brand-500 bg-brand-50"
                  : "border-stone-200 hover:bg-stone-50"
              }`}
              onClick={() => {
                selectDesign(d.id);
                onClose();
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{d.name}</div>
                  <div className="text-[11px] text-stone-500">
                    {d.plants.length} plants ·{" "}
                    {new Date(d.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateDesign(d.id);
                  }}
                  className="p-1 rounded hover:bg-stone-200 opacity-0 group-hover:opacity-100"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${d.name}"?`)) deleteDesign(d.id);
                  }}
                  className="p-1 rounded hover:bg-red-100 text-red-600 opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
