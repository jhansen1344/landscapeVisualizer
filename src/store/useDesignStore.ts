import { create } from "zustand";
import type {
  Design,
  DesignMode,
  PlacedPlant,
  RegionSelection,
} from "../types";
import {
  loadCurrentDesignId,
  loadDesigns,
  loadRegion,
  saveCurrentDesignId,
  saveDesigns,
  saveRegion,
} from "./persistence";

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function newDesign(name = "Untitled design"): Design {
  const now = Date.now();
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    mode: "plan",
    bed: {
      points: [
        { x: 2, y: 2 },
        { x: 30, y: 2 },
        { x: 30, y: 20 },
        { x: 2, y: 20 },
      ],
    },
    plants: [],
  };
}

interface HistoryEntry {
  bed: Design["bed"];
  plants: PlacedPlant[];
  mode: DesignMode;
}

interface State {
  designs: Design[];
  currentId: string | null;
  region: RegionSelection;
  selectedUid: string | null;
  readOnly: boolean;
  past: HistoryEntry[];
  future: HistoryEntry[];

  // selectors
  current: () => Design | null;

  // mutations
  setRegion: (r: RegionSelection) => void;
  setReadOnly: (v: boolean) => void;
  loadSharedDesign: (d: Design) => void;
  createDesign: (name?: string) => void;
  duplicateCurrentAsEditable: () => void;
  selectDesign: (id: string) => void;
  renameDesign: (id: string, name: string) => void;
  deleteDesign: (id: string) => void;
  duplicateDesign: (id: string) => void;
  importDesign: (d: Design) => void;

  setMode: (m: DesignMode) => void;
  setBedPoints: (pts: { x: number; y: number }[]) => void;
  addPlant: (plantId: string, x: number, y: number) => void;
  movePlant: (uid: string, x: number, y: number) => void;
  deletePlant: (uid: string) => void;
  duplicatePlant: (uid: string) => void;
  setSelected: (uid: string | null) => void;
  rotateSelected: (deltaRad: number) => void;
  updatePlantQuantity: (uid: string, quantity: number) => void;

  undo: () => void;
  redo: () => void;
}

function snapshot(d: Design): HistoryEntry {
  return {
    bed: JSON.parse(JSON.stringify(d.bed)),
    plants: JSON.parse(JSON.stringify(d.plants)),
    mode: d.mode,
  };
}

const persistDesigns = (designs: Design[], currentId: string | null) => {
  saveDesigns(designs);
  saveCurrentDesignId(currentId);
};

export const useDesignStore = create<State>((set, get) => {
  const initialDesigns = loadDesigns();
  const initialCurrent = loadCurrentDesignId();
  const region = loadRegion() || { showAll: true };
  let designs = initialDesigns;
  let currentId = initialCurrent;
  if (designs.length === 0) {
    const d = newDesign();
    designs = [d];
    currentId = d.id;
    persistDesigns(designs, currentId);
  } else if (!currentId || !designs.find((d) => d.id === currentId)) {
    currentId = designs[0].id;
    saveCurrentDesignId(currentId);
  }

  const withCurrent = (
    updater: (d: Design) => Design,
    recordHistory = true
  ) => {
    const state = get();
    if (state.readOnly) return;
    const cur = state.designs.find((d) => d.id === state.currentId);
    if (!cur) return;
    const before = recordHistory ? snapshot(cur) : null;
    const next = { ...updater(cur), updatedAt: Date.now() };
    const designs = state.designs.map((d) => (d.id === cur.id ? next : d));
    set({
      designs,
      past: before ? [...state.past, before].slice(-50) : state.past,
      future: recordHistory ? [] : state.future,
    });
    persistDesigns(designs, state.currentId);
  };

  return {
    designs,
    currentId,
    region,
    selectedUid: null,
    readOnly: false,
    past: [],
    future: [],

    current: () => {
      const s = get();
      return s.designs.find((d) => d.id === s.currentId) || null;
    },

    setRegion: (r) => {
      set({ region: r });
      saveRegion(r);
    },

    setReadOnly: (v) => set({ readOnly: v }),

    loadSharedDesign: (d) => {
      // Do not persist a shared design into the user's designs list.
      set({
        designs: [...get().designs.filter((x) => x.id !== d.id), d],
        currentId: d.id,
        readOnly: true,
        past: [],
        future: [],
        selectedUid: null,
      });
    },

    createDesign: (name) => {
      const d = newDesign(name);
      const designs = [...get().designs, d];
      set({ designs, currentId: d.id, past: [], future: [], readOnly: false });
      persistDesigns(designs, d.id);
    },

    duplicateCurrentAsEditable: () => {
      const cur = get().current();
      if (!cur) return;
      const copy: Design = {
        ...JSON.parse(JSON.stringify(cur)),
        id: uid(),
        name: cur.name + " (copy)",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const designs = [...get().designs.filter((d) => d.id !== cur.id), copy];
      set({
        designs,
        currentId: copy.id,
        readOnly: false,
        past: [],
        future: [],
      });
      persistDesigns(designs, copy.id);
    },

    selectDesign: (id) => {
      set({
        currentId: id,
        past: [],
        future: [],
        selectedUid: null,
        readOnly: false,
      });
      saveCurrentDesignId(id);
    },

    renameDesign: (id, name) => {
      const designs = get().designs.map((d) =>
        d.id === id ? { ...d, name, updatedAt: Date.now() } : d
      );
      set({ designs });
      persistDesigns(designs, get().currentId);
    },

    deleteDesign: (id) => {
      const designs = get().designs.filter((d) => d.id !== id);
      let currentId = get().currentId;
      if (currentId === id) {
        if (designs.length === 0) {
          const d = newDesign();
          designs.push(d);
          currentId = d.id;
        } else {
          currentId = designs[0].id;
        }
      }
      set({ designs, currentId, past: [], future: [] });
      persistDesigns(designs, currentId);
    },

    duplicateDesign: (id) => {
      const src = get().designs.find((d) => d.id === id);
      if (!src) return;
      const copy: Design = {
        ...JSON.parse(JSON.stringify(src)),
        id: uid(),
        name: src.name + " (copy)",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const designs = [...get().designs, copy];
      set({ designs });
      persistDesigns(designs, get().currentId);
    },

    importDesign: (d) => {
      const copy: Design = {
        ...d,
        id: uid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const designs = [...get().designs, copy];
      set({ designs, currentId: copy.id, past: [], future: [] });
      persistDesigns(designs, copy.id);
    },

    setMode: (m) => withCurrent((d) => ({ ...d, mode: m })),
    setBedPoints: (pts) =>
      withCurrent((d) => ({ ...d, bed: { points: pts } })),

    addPlant: (plantId, x, y) =>
      withCurrent((d) => ({
        ...d,
        plants: [...d.plants, { uid: uid(), plantId, x, y }],
      })),

    movePlant: (plantUid, x, y) =>
      withCurrent((d) => ({
        ...d,
        plants: d.plants.map((p) =>
          p.uid === plantUid ? { ...p, x, y } : p
        ),
      })),

    deletePlant: (plantUid) =>
      withCurrent((d) => ({
        ...d,
        plants: d.plants.filter((p) => p.uid !== plantUid),
      })),

    duplicatePlant: (plantUid) =>
      withCurrent((d) => {
        const p = d.plants.find((x) => x.uid === plantUid);
        if (!p) return d;
        return {
          ...d,
          plants: [
            ...d.plants,
            { ...p, uid: uid(), x: p.x + 1, y: p.y + 1 },
          ],
        };
      }),

    setSelected: (plantUid) => set({ selectedUid: plantUid }),

    rotateSelected: (deltaRad) =>
      withCurrent((d) => {
        const sel = get().selectedUid;
        if (!sel) return d;
        return {
          ...d,
          plants: d.plants.map((p) =>
            p.uid === sel
              ? { ...p, rotation: (p.rotation || 0) + deltaRad }
              : p
          ),
        };
      }),

    updatePlantQuantity: (plantUid, quantity) =>
      withCurrent((d) => ({
        ...d,
        plants: d.plants.map((p) =>
          p.uid === plantUid ? { ...p, quantity } : p
        ),
      })),

    undo: () => {
      const s = get();
      if (s.readOnly) return;
      const cur = s.current();
      if (!cur) return;
      const past = [...s.past];
      const prev = past.pop();
      if (!prev) return;
      const present = snapshot(cur);
      const next: Design = {
        ...cur,
        bed: prev.bed,
        plants: prev.plants,
        mode: prev.mode,
        updatedAt: Date.now(),
      };
      const designs = s.designs.map((d) => (d.id === cur.id ? next : d));
      set({ designs, past, future: [...s.future, present] });
      persistDesigns(designs, s.currentId);
    },
    redo: () => {
      const s = get();
      if (s.readOnly) return;
      const cur = s.current();
      if (!cur) return;
      const future = [...s.future];
      const nxt = future.pop();
      if (!nxt) return;
      const present = snapshot(cur);
      const next: Design = {
        ...cur,
        bed: nxt.bed,
        plants: nxt.plants,
        mode: nxt.mode,
        updatedAt: Date.now(),
      };
      const designs = s.designs.map((d) => (d.id === cur.id ? next : d));
      set({ designs, past: [...s.past, present], future });
      persistDesigns(designs, s.currentId);
    },
  };
});
