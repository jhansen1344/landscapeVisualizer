import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
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

  const region = useDesignStore((s) => s.region);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  const deletePlant = useDesignStore((s) => s.deletePlant);
  const duplicatePlant = useDesignStore((s) => s.duplicatePlant);
  const selectedUid = useDesignStore((s) => s.selectedUid);

  // First-run: prompt for region if never set
  useEffect(() => {
    if (!region.ecoregion && !region.zone && !region.showAll) {
      setShowRegion(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="flex-1 flex min-h-0">
        <PlantPalette onOpenRegion={() => setShowRegion(true)} />
        <div ref={canvasWrapRef} className="flex-1 relative min-w-0">
          <DesignerCanvas width={size.w} height={size.h} stageRef={stageRef} />
          <Legend />
        </div>
        <Inspector />
      </div>
      {showRegion && <RegionPickerModal onClose={() => setShowRegion(false)} />}
      {showDesigns && <DesignsDrawer onClose={() => setShowDesigns(false)} />}
    </div>
  );
}
