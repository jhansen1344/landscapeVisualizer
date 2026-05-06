import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Leaf, Info, X } from "lucide-react";
import { Toolbar } from "../components/Toolbar";
import { PlantPalette } from "../components/PlantPalette";
import { DesignerCanvas } from "../components/DesignerCanvas";
import { Inspector } from "../components/Inspector";
import { Legend } from "../components/Legend";
import { RegionPickerModal } from "../components/RegionPickerModal";
import { DesignsDrawer } from "../components/DesignsDrawer";
import { useDesignStore } from "../store/useDesignStore";

export function Designer() {
  const stageRef = useRef<Konva.Stage>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [showRegion, setShowRegion] = useState(false);
  const [showDesigns, setShowDesigns] = useState(false);

  // Responsive: palette + inspector are always visible on md+, drawers on mobile.
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
  );
  const [paletteOpen, setPaletteOpen] = useState(!isMobile);
  const [inspectorOpen, setInspectorOpen] = useState(!isMobile);

  const region = useDesignStore((s) => s.region);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  const deletePlant = useDesignStore((s) => s.deletePlant);
  const duplicatePlant = useDesignStore((s) => s.duplicatePlant);
  const selectedUid = useDesignStore((s) => s.selectedUid);
  const armedPlantId = useDesignStore((s) => s.armedPlantId);

  // First-run: prompt for region if never set
  useEffect(() => {
    if (!region.ecoregion && !region.zone && !region.showAll) {
      setShowRegion(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track viewport size to switch between drawer and column layouts.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    function update() {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (!mobile) {
        setPaletteOpen(true);
        setInspectorOpen(true);
      } else {
        setPaletteOpen(false);
        setInspectorOpen(false);
      }
    }
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // On mobile: auto-open the inspector when something is selected.
  useEffect(() => {
    if (isMobile && selectedUid) setInspectorOpen(true);
  }, [selectedUid, isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA"))
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        if (selectedUid) {
          e.preventDefault();
          duplicatePlant(selectedUid);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedUid) {
          e.preventDefault();
          deletePlant(selectedUid);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deletePlant, duplicatePlant, selectedUid]);

  // Measure canvas area
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <Toolbar stageRef={stageRef} onOpenDesigns={() => setShowDesigns(true)} />
      <div className="flex-1 flex min-h-0 relative">
        {/* Palette: column on desktop, slide-in drawer on mobile */}
        <div
          className={
            isMobile
              ? `absolute inset-y-0 left-0 z-30 transform transition-transform duration-200 ${
                  paletteOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : ""
          }
        >
          <div className="relative h-full">
            {isMobile && paletteOpen && (
              <button
                onClick={() => setPaletteOpen(false)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 border border-stone-200 shadow"
                title="Close palette"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <PlantPalette
              onOpenRegion={() => setShowRegion(true)}
              onPickedOnMobile={() => setPaletteOpen(false)}
            />
          </div>
        </div>

        {/* Backdrop when a drawer is open on mobile */}
        {isMobile && (paletteOpen || inspectorOpen) && (
          <div
            className="absolute inset-0 z-20 bg-black/30"
            onClick={() => {
              setPaletteOpen(false);
              setInspectorOpen(false);
            }}
          />
        )}

        <div ref={canvasWrapRef} className="flex-1 relative min-w-0">
          <DesignerCanvas width={size.w} height={size.h} stageRef={stageRef} />
          <Legend />

          {/* Mobile FABs to open palette/inspector */}
          {isMobile && !paletteOpen && (
            <button
              onClick={() => setPaletteOpen(true)}
              className={`absolute left-3 top-3 z-10 rounded-full px-3 py-2 shadow-md flex items-center gap-1.5 text-sm font-medium ${
                armedPlantId
                  ? "bg-brand-700 text-white"
                  : "bg-white text-stone-800 border border-stone-200"
              }`}
            >
              <Leaf className="h-4 w-4" />
              Plants
            </button>
          )}
          {isMobile && !inspectorOpen && (
            <button
              onClick={() => setInspectorOpen(true)}
              className="absolute right-3 top-3 z-10 rounded-full px-3 py-2 bg-white text-stone-800 border border-stone-200 shadow-md flex items-center gap-1.5 text-sm font-medium"
            >
              <Info className="h-4 w-4" />
              {selectedUid ? "Selection" : "Summary"}
            </button>
          )}
        </div>

        {/* Inspector: column on desktop, slide-in drawer on mobile */}
        <div
          className={
            isMobile
              ? `absolute inset-y-0 right-0 z-30 transform transition-transform duration-200 ${
                  inspectorOpen ? "translate-x-0" : "translate-x-full"
                }`
              : ""
          }
        >
          <div className="relative h-full">
            {isMobile && inspectorOpen && (
              <button
                onClick={() => setInspectorOpen(false)}
                className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-white/90 border border-stone-200 shadow"
                title="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Inspector />
          </div>
        </div>
      </div>
      {showRegion && <RegionPickerModal onClose={() => setShowRegion(false)} />}
      {showDesigns && <DesignsDrawer onClose={() => setShowDesigns(false)} />}
    </div>
  );
}
