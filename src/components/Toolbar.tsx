import {
  Undo2,
  Redo2,
  Grid3x3,
  Circle as CircleIcon,
  Share2,
  Download,
  FileImage,
  FileText,
  Upload,
  FolderOpen,
  Plus,
  View,
} from "lucide-react";
import type Konva from "konva";
import { useRef, useState } from "react";
import { useDesignStore } from "../store/useDesignStore";
import { encodeDesignToHash } from "../store/persistence";
import { useNavigate } from "react-router-dom";

export function Toolbar({
  stageRef,
  onOpenDesigns,
}: {
  stageRef: React.RefObject<Konva.Stage>;
  onOpenDesigns: () => void;
}) {
  const design = useDesignStore((s) => s.current());
  const setMode = useDesignStore((s) => s.setMode);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  const renameDesign = useDesignStore((s) => s.renameDesign);
  const createDesign = useDesignStore((s) => s.createDesign);
  const importDesign = useDesignStore((s) => s.importDesign);
  const duplicateCurrentAsEditable = useDesignStore((s) => s.duplicateCurrentAsEditable);
  const readOnly = useDesignStore((s) => s.readOnly);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  if (!design) return null;

  function copyShareLink() {
    if (!design) return;
    const hash = encodeDesignToHash(design);
    const url = `${window.location.origin}${window.location.pathname}#/s/${hash}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setShareLink(url);
    setTimeout(() => setShareLink(null), 3500);
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        importDesign(parsed);
      } catch {
        alert("Could not parse design JSON.");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  }

  return (
    <div className="h-12 border-b border-stone-200 bg-white flex items-center px-2 gap-1 relative z-40">
      <button
        onClick={onOpenDesigns}
        className="px-2 py-1.5 rounded-md hover:bg-stone-100 flex items-center gap-1.5 text-sm"
        title="My designs"
      >
        <FolderOpen className="h-4 w-4" />
        <span className="hidden md:inline">Designs</span>
      </button>
      <button
        onClick={() => createDesign()}
        className="px-2 py-1.5 rounded-md hover:bg-stone-100 flex items-center gap-1.5 text-sm"
        title="New design"
        disabled={readOnly}
      >
        <Plus className="h-4 w-4" />
      </button>

      <div className="mx-2 h-6 w-px bg-stone-200" />

      <input
        value={design.name}
        disabled={readOnly}
        onChange={(e) => renameDesign(design.id, e.target.value)}
        className="min-w-0 flex-1 max-w-sm px-2 py-1 text-sm rounded-md border border-transparent hover:border-stone-200 focus:border-brand-500 focus:outline-none bg-transparent font-medium"
      />

      {readOnly && (
        <span className="ml-1 px-2 py-0.5 text-[11px] rounded-full bg-amber-100 text-amber-900 border border-amber-200">
          Shared · read-only
        </span>
      )}
      {readOnly && (
        <button
          onClick={duplicateCurrentAsEditable}
          className="ml-2 text-xs px-2 py-1 rounded-md bg-brand-700 text-white hover:bg-brand-800"
        >
          Duplicate to edit
        </button>
      )}

      <div className="mx-2 h-6 w-px bg-stone-200" />

      <button
        onClick={undo}
        disabled={readOnly}
        title="Undo (Ctrl+Z)"
        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-40"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        onClick={redo}
        disabled={readOnly}
        title="Redo (Ctrl+Y)"
        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-40"
      >
        <Redo2 className="h-4 w-4" />
      </button>

      <div className="mx-2 h-6 w-px bg-stone-200" />

      <div className="rounded-md border border-stone-200 p-0.5 flex text-xs">
        <button
          onClick={() => setMode("plan")}
          className={`flex items-center gap-1 px-2 py-1 rounded ${
            design.mode === "plan"
              ? "bg-brand-700 text-white"
              : "text-stone-700 hover:bg-stone-100"
          }`}
          disabled={readOnly}
        >
          <CircleIcon className="h-3.5 w-3.5" /> Plan
        </button>
        <button
          onClick={() => setMode("grid")}
          className={`flex items-center gap-1 px-2 py-1 rounded ${
            design.mode === "grid"
              ? "bg-brand-700 text-white"
              : "text-stone-700 hover:bg-stone-100"
          }`}
          disabled={readOnly}
        >
          <Grid3x3 className="h-3.5 w-3.5" /> Grid
        </button>
      </div>

      <div className="flex-1" />

      <button
        onClick={() => navigate("/ar")}
        className="px-2 py-1.5 rounded-md bg-brand-700 text-white hover:bg-brand-800 flex items-center gap-1.5 text-sm"
        title="View in AR"
      >
        <View className="h-4 w-4" />
        <span className="hidden md:inline">AR View</span>
      </button>

      <div className="relative">
        <button
          onClick={copyShareLink}
          className="ml-1 px-2 py-1.5 rounded-md hover:bg-stone-100 flex items-center gap-1.5 text-sm"
          title="Copy share link"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden md:inline">Share</span>
        </button>
        {shareLink && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-stone-900 text-white text-xs rounded-md px-3 py-2 shadow-lg whitespace-nowrap">
            Copied to clipboard
          </div>
        )}
      </div>

      <ExportMenu stageRef={stageRef} />

      <button
        onClick={() => fileRef.current?.click()}
        className="px-2 py-1.5 rounded-md hover:bg-stone-100 flex items-center gap-1.5 text-sm"
        title="Import design JSON"
      >
        <Upload className="h-4 w-4" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onImportFile}
      />
    </div>
  );
}

function ExportMenu({ stageRef }: { stageRef: React.RefObject<Konva.Stage> }) {
  const [open, setOpen] = useState(false);
  const design = useDesignStore((s) => s.current());
  if (!design) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1.5 rounded-md hover:bg-stone-100 flex items-center gap-1.5 text-sm"
      >
        <Download className="h-4 w-4" />
        <span className="hidden md:inline">Export</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-44 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-50"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={async () => {
              if (stageRef.current) {
                const m = await import("../lib/export");
                m.exportPng(stageRef.current, design.name);
              }
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 flex items-center gap-2"
          >
            <FileImage className="h-4 w-4" /> PNG image
          </button>
          <button
            onClick={async () => {
              if (stageRef.current) {
                const m = await import("../lib/export");
                m.exportPdf(stageRef.current, design);
              }
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" /> Printable PDF
          </button>
          <button
            onClick={async () => {
              const m = await import("../lib/export");
              m.exportJson(design);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> JSON
          </button>
        </div>
      )}
    </div>
  );
}
