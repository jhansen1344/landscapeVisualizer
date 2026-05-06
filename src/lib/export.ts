import type Konva from "konva";
import jsPDF from "jspdf";
import type { Design } from "../types";
import { getPlant } from "./plants";
import { polygonAreaSqFt } from "./geometry";

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportPng(stage: Konva.Stage, name: string) {
  const url = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
  downloadDataUrl(url, `${safeName(name)}.png`);
}

export function exportJson(design: Design) {
  const blob = new Blob([JSON.stringify(design, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${safeName(design.name)}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportPdf(stage: Konva.Stage, design: Design) {
  const img = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 36;

  pdf.setFontSize(16);
  pdf.text(design.name, margin, margin);
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(
    `Bed area: ${polygonAreaSqFt(design.bed).toFixed(0)} sq ft  ·  ${
      design.plants.length
    } plants  ·  Mode: ${design.mode}`,
    margin,
    margin + 14
  );
  pdf.setTextColor(0);

  const imgW = pageW - margin * 2;
  const imgH = pageH * 0.55;
  pdf.addImage(img, "PNG", margin, margin + 24, imgW, imgH);

  // Legend
  let y = margin + 24 + imgH + 20;
  pdf.setFontSize(12);
  pdf.text("Plant list", margin, y);
  y += 12;
  pdf.setFontSize(9);

  const counts = new Map<string, number>();
  design.plants.forEach((pp) =>
    counts.set(pp.plantId, (counts.get(pp.plantId) || 0) + (pp.quantity || 1))
  );
  Array.from(counts.entries()).forEach(([pid, count]) => {
    const p = getPlant(pid);
    if (!p) return;
    if (y > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(
      `${count.toString().padStart(3)} × ${p.commonName}  (${p.scientificName})  — ${p.sun} sun, ${p.moisture} moisture, ${p.matureHeightFt}′H × ${p.matureSpreadFt}′W`,
      margin,
      y
    );
    y += 12;
  });

  pdf.save(`${safeName(design.name)}.pdf`);
}

function safeName(n: string) {
  return n.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "design";
}
