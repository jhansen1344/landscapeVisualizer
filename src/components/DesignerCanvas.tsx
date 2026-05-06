import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Line, Circle, Text, Group, Rect, Label, Tag } from "react-konva";
import type Konva from "konva";
import { useDesignStore } from "../store/useDesignStore";
import { getPlant, plantInitials } from "../lib/plants";
import { DEFAULT_PX_PER_FT } from "../lib/units";

interface Props {
  width: number;
  height: number;
  stageRef?: React.RefObject<Konva.Stage>;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

export function DesignerCanvas({ width, height, stageRef }: Props) {
  const design = useDesignStore((s) => s.current());
  const selectedUid = useDesignStore((s) => s.selectedUid);
  const readOnly = useDesignStore((s) => s.readOnly);
  const setSelected = useDesignStore((s) => s.setSelected);
  const addPlant = useDesignStore((s) => s.addPlant);
  const movePlant = useDesignStore((s) => s.movePlant);
  const setBedPoints = useDesignStore((s) => s.setBedPoints);

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 40, y: 40 });
  const [editingBed, setEditingBed] = useState(false);
  const [drawingBed, setDrawingBed] = useState(false);
  const [draftPts, setDraftPts] = useState<{ x: number; y: number }[]>([]);
  const [cursorFt, setCursorFt] = useState<{ x: number; y: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CLOSE_SNAP_FT = 1; // clicking within 1 ft of the first point closes polygon

  function startDrawing() {
    setEditingBed(false);
    setSelected(null);
    setDraftPts([]);
    setCursorFt(null);
    setDrawingBed(true);
  }
  function cancelDrawing() {
    setDrawingBed(false);
    setDraftPts([]);
    setCursorFt(null);
  }
  function finishDrawing() {
    if (draftPts.length >= 3) {
      setBedPoints(draftPts);
    }
    cancelDrawing();
  }

  // Keyboard: Enter/Escape while drawing
  useEffect(() => {
    if (!drawingBed) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelDrawing();
      } else if (e.key === "Enter") {
        e.preventDefault();
        finishDrawing();
      } else if ((e.key === "Backspace" || e.key === "Delete") && draftPts.length > 0) {
        e.preventDefault();
        setDraftPts((pts) => pts.slice(0, -1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingBed, draftPts]);

  const pxPerFt = DEFAULT_PX_PER_FT * scale;
  const mode = design?.mode || "plan";

  // Convert screen (container) coords to feet in design space
  const screenToFt = (sx: number, sy: number) => ({
    x: (sx - pos.x) / pxPerFt,
    y: (sy - pos.y) / pxPerFt,
  });

  const snapFt = (v: number) =>
    mode === "grid" ? Math.round(v) : Math.round(v * 10) / 10;

  function onWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const oldScale = scale;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1 + direction * 0.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, oldScale * factor));
    const newPxPerFt = DEFAULT_PX_PER_FT * newScale;
    // Zoom toward pointer
    const ftX = (pointer.x - pos.x) / (DEFAULT_PX_PER_FT * oldScale);
    const ftY = (pointer.y - pos.y) / (DEFAULT_PX_PER_FT * oldScale);
    setPos({
      x: pointer.x - ftX * newPxPerFt,
      y: pointer.y - ftY * newPxPerFt,
    });
    setScale(newScale);
  }

  // DOM drag/drop from palette
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onDragOver(e: DragEvent) {
      if (!e.dataTransfer) return;
      if (Array.from(e.dataTransfer.types).includes("text/plant-id")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        const rect = (el as HTMLDivElement).getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const pt = screenToFt(sx, sy);
        setDragPreview({ x: snapFt(pt.x), y: snapFt(pt.y) });
      }
    }
    function onDrop(e: DragEvent) {
      if (!e.dataTransfer) return;
      const id = e.dataTransfer.getData("text/plant-id");
      if (!id) return;
      e.preventDefault();
      const rect = (el as HTMLDivElement).getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const pt = screenToFt(sx, sy);
      addPlant(id, snapFt(pt.x), snapFt(pt.y));
      setDragPreview(null);
    }
    function onLeave() {
      setDragPreview(null);
    }
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    el.addEventListener("dragleave", onLeave);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
      el.removeEventListener("dragleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.x, pos.y, scale, mode]);

  // Grid lines (in screen space, regenerated on pan/zoom)
  const gridLines = useMemo(() => {
    const lines: number[][] = [];
    if (pxPerFt < 6) return lines;
    const step = pxPerFt; // 1 ft
    const startX = pos.x % step;
    const startY = pos.y % step;
    for (let x = startX; x < width; x += step) {
      lines.push([x, 0, x, height]);
    }
    for (let y = startY; y < height; y += step) {
      lines.push([0, y, width, y]);
    }
    return lines;
  }, [pos.x, pos.y, pxPerFt, width, height]);

  // 10 ft grid lines (bolder)
  const gridLines10 = useMemo(() => {
    const lines: number[][] = [];
    const step = pxPerFt * 10;
    if (step < 30) return lines;
    const startX = pos.x % step;
    const startY = pos.y % step;
    for (let x = startX; x < width; x += step) {
      lines.push([x, 0, x, height]);
    }
    for (let y = startY; y < height; y += step) {
      lines.push([0, y, width, y]);
    }
    return lines;
  }, [pos.x, pos.y, pxPerFt, width, height]);

  if (!design) return null;

  const bedPxPoints = design.bed.points.flatMap((p) => [
    p.x * pxPerFt + pos.x,
    p.y * pxPerFt + pos.y,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-stone-100 overflow-hidden"
    >
      <Stage
        ref={stageRef as any}
        width={width}
        height={height}
        onWheel={onWheel}
        draggable={!drawingBed}
        x={0}
        y={0}
        onDragEnd={(e) => {
          // We use draggable stage to pan; since we control pos manually,
          // translate the stage delta into pos and reset stage.
          const stage = e.target;
          const sx = stage.x();
          const sy = stage.y();
          if (sx === 0 && sy === 0) return;
          setPos({ x: pos.x + sx, y: pos.y + sy });
          stage.position({ x: 0, y: 0 });
        }}
        onMouseMove={(e) => {
          if (!drawingBed) return;
          const p = e.target.getStage()?.getPointerPosition();
          if (!p) return;
          const ft = screenToFt(p.x, p.y);
          setCursorFt({ x: snapFt(ft.x), y: snapFt(ft.y) });
        }}
        onMouseDown={(e) => {
          if (drawingBed) {
            const stage = e.target.getStage();
            const p = stage?.getPointerPosition();
            if (!p) return;
            const ft = screenToFt(p.x, p.y);
            const snap = { x: snapFt(ft.x), y: snapFt(ft.y) };
            // Close if clicking near first point
            if (
              draftPts.length >= 3 &&
              Math.hypot(snap.x - draftPts[0].x, snap.y - draftPts[0].y) <
                CLOSE_SNAP_FT
            ) {
              finishDrawing();
              return;
            }
            setDraftPts((pts) => [...pts, snap]);
            return;
          }
          if (e.target === e.target.getStage()) setSelected(null);
        }}
        onDblClick={() => {
          if (drawingBed) finishDrawing();
        }}
        onDblTap={() => {
          if (drawingBed) finishDrawing();
        }}
      >
        <Layer listening={false}>
          {/* Base white card behind bed area for contrast */}
          <Rect x={0} y={0} width={width} height={height} fill="#f5f5f4" />
          {/* Minor grid */}
          {gridLines.map((l, i) => (
            <Line key={`g-${i}`} points={l} stroke="#e7e5e4" strokeWidth={1} />
          ))}
          {/* 10ft grid */}
          {gridLines10.map((l, i) => (
            <Line
              key={`G-${i}`}
              points={l}
              stroke="#d6d3d1"
              strokeWidth={1}
            />
          ))}
        </Layer>

        <Layer>
          {/* Bed outline */}
          <Line
            points={bedPxPoints}
            closed
            stroke="#78350f"
            strokeWidth={2}
            dash={editingBed ? [6, 4] : undefined}
            fill="rgba(217,119,6,0.08)"
          />
          {/* Bed vertex handles when editing */}
          {editingBed &&
            design.bed.points.map((p, idx) => (
              <Circle
                key={idx}
                x={p.x * pxPerFt + pos.x}
                y={p.y * pxPerFt + pos.y}
                radius={6}
                fill="#fff"
                stroke="#b45309"
                strokeWidth={2}
                draggable
                onDragMove={(e) => {
                  const pts = design.bed.points.slice();
                  pts[idx] = {
                    x: snapFt((e.target.x() - pos.x) / pxPerFt),
                    y: snapFt((e.target.y() - pos.y) / pxPerFt),
                  };
                  setBedPoints(pts);
                }}
              />
            ))}

          {/* Draft bed polyline while drawing */}
          {drawingBed && draftPts.length > 0 && (
            <>
              <Line
                points={[
                  ...draftPts.flatMap((p) => [
                    p.x * pxPerFt + pos.x,
                    p.y * pxPerFt + pos.y,
                  ]),
                  ...(cursorFt
                    ? [cursorFt.x * pxPerFt + pos.x, cursorFt.y * pxPerFt + pos.y]
                    : []),
                ]}
                stroke="#0f766e"
                strokeWidth={2}
                dash={[6, 4]}
              />
              {draftPts.map((p, idx) => (
                <Circle
                  key={`draft-${idx}`}
                  x={p.x * pxPerFt + pos.x}
                  y={p.y * pxPerFt + pos.y}
                  radius={idx === 0 ? 7 : 4}
                  fill={idx === 0 ? "#fef3c7" : "#fff"}
                  stroke="#0f766e"
                  strokeWidth={2}
                />
              ))}
            </>
          )}

          {/* Drag preview ghost */}
          {dragPreview && (
            <Circle
              x={dragPreview.x * pxPerFt + pos.x}
              y={dragPreview.y * pxPerFt + pos.y}
              radius={12}
              fill="rgba(22,163,74,0.25)"
              stroke="#16a34a"
              dash={[4, 4]}
              listening={false}
            />
          )}

          {/* Placed plants */}
          {design.plants.map((pp) => {
            const plant = getPlant(pp.plantId);
            if (!plant) return null;
            const r = (plant.matureSpreadFt / 2) * pxPerFt;
            const isSel = pp.uid === selectedUid;
            return (
              <Group
                key={pp.uid}
                x={pp.x * pxPerFt + pos.x}
                y={pp.y * pxPerFt + pos.y}
                draggable={!readOnly}
                onClick={() => setSelected(pp.uid)}
                onTap={() => setSelected(pp.uid)}
                onDragEnd={(e) => {
                  const nx = snapFt((e.target.x() - pos.x) / pxPerFt);
                  const ny = snapFt((e.target.y() - pos.y) / pxPerFt);
                  movePlant(pp.uid, nx, ny);
                  // snap visual
                  e.target.position({
                    x: nx * pxPerFt + pos.x,
                    y: ny * pxPerFt + pos.y,
                  });
                }}
              >
                <Circle
                  radius={r}
                  fill={plant.swatchColor}
                  opacity={0.55}
                  stroke={isSel ? "#0f172a" : "#44403c"}
                  strokeWidth={isSel ? 2 : 1}
                  shadowEnabled={isSel}
                  shadowBlur={8}
                  shadowColor="#000"
                  shadowOpacity={0.2}
                />
                <Circle radius={3} fill="#1c1917" />
                <Text
                  text={plantInitials(plant)}
                  fontSize={Math.max(10, Math.min(14, r * 0.6))}
                  fontStyle="bold"
                  fill="#1c1917"
                  align="center"
                  verticalAlign="middle"
                  x={-40}
                  y={-40}
                  width={80}
                  height={80}
                  listening={false}
                />
                {(pp.quantity || 0) > 1 && (
                  <Label x={r - 6} y={-r}>
                    <Tag fill="#0f172a" cornerRadius={8} />
                    <Text
                      text={`×${pp.quantity}`}
                      fill="#fff"
                      padding={3}
                      fontSize={11}
                    />
                  </Label>
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {/* Overlay controls */}
      <div className="absolute left-2 bottom-2 bg-white/90 backdrop-blur rounded-lg shadow border border-stone-200 text-xs px-3 py-2 flex items-center gap-3">
        <span className="font-mono">{Math.round(scale * 100)}%</span>
        <span className="text-stone-500">·</span>
        <span className="text-stone-500">1 sq = 1 ft</span>
        <button
          className="ml-2 px-2 py-0.5 rounded border border-stone-300 hover:bg-stone-100"
          onClick={() => {
            setScale(1);
            setPos({ x: 40, y: 40 });
          }}
        >
          Reset view
        </button>
        <button
          className={`ml-1 px-2 py-0.5 rounded border ${
            editingBed
              ? "bg-amber-100 border-amber-400 text-amber-900"
              : "border-stone-300 hover:bg-stone-100"
          }`}
          onClick={() => {
            if (drawingBed) cancelDrawing();
            setEditingBed((v) => !v);
          }}
          disabled={readOnly || drawingBed}
        >
          {editingBed ? "Done editing bed" : "Edit bed outline"}
        </button>
        <button
          className={`ml-1 px-2 py-0.5 rounded border ${
            drawingBed
              ? "bg-teal-100 border-teal-400 text-teal-900"
              : "border-stone-300 hover:bg-stone-100"
          }`}
          onClick={() => (drawingBed ? finishDrawing() : startDrawing())}
          disabled={readOnly}
          title="Click to add vertices. Click first point, double-click, or press Enter to finish. Escape to cancel. Backspace removes last vertex."
        >
          {drawingBed
            ? `Finish bed (${draftPts.length} pts)`
            : "Draw new bed"}
        </button>
        {drawingBed && (
          <button
            className="ml-1 px-2 py-0.5 rounded border border-stone-300 hover:bg-stone-100 text-stone-600"
            onClick={cancelDrawing}
          >
            Cancel
          </button>
        )}
      </div>
      {drawingBed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-teal-900/90 text-white text-xs rounded-md px-3 py-1.5 shadow">
          Click to add vertices · click the first point or press Enter to finish · Esc to cancel · Backspace removes last
        </div>
      )}
    </div>
  );
}
