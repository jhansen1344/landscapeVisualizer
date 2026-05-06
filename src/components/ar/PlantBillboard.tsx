import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Plant } from "../../types";
import { ftToM } from "../../lib/units";

/**
 * A cheap, texture-free representation of a plant: a tapered bush silhouette
 * made from colored cones/spheres sized to the plant's mature height/spread.
 * Billboards the "label" disk toward the camera so it reads from any angle.
 */
export function PlantBillboard({
  plant,
  position,
}: {
  plant: Plant;
  position: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const height = Math.max(0.2, ftToM(plant.matureHeightFt));
  const spread = Math.max(0.1, ftToM(plant.matureSpreadFt));
  const color = plant.swatchColor;
  const bloom = plant.bloomColor;

  // Generate a small, deterministic set of foliage blobs.
  const blobs = useMemo(() => {
    const seed = hashString(plant.id);
    const rand = mulberry32(seed);
    const arr: { pos: [number, number, number]; r: number; c: string }[] = [];
    const blobCount =
      plant.habit === "tree" ? 6 : plant.habit === "shrub" ? 5 : 4;
    for (let i = 0; i < blobCount; i++) {
      const t = i / blobCount;
      const r = spread * (0.35 + rand() * 0.25);
      const theta = rand() * Math.PI * 2;
      const radial = rand() * spread * 0.35;
      arr.push({
        pos: [
          Math.cos(theta) * radial,
          height * (0.4 + t * 0.55),
          Math.sin(theta) * radial,
        ],
        r,
        c: color,
      });
    }
    return arr;
  }, [plant.id, height, spread, color]);

  // Sway lightly for life
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.getElapsedTime();
      group.current.rotation.z =
        Math.sin(t * 1.2 + hashString(plant.id) * 0.01) * 0.02;
    }
  });

  const hasStem = plant.habit === "tree" || plant.habit === "shrub";
  const stemH = hasStem ? height * 0.4 : 0;

  return (
    <group position={position} ref={group}>
      {hasStem && (
        <mesh position={[0, stemH / 2, 0]}>
          <cylinderGeometry
            args={[spread * 0.03, spread * 0.05, stemH, 8]}
          />
          <meshStandardMaterial color="#6b4423" roughness={0.9} />
        </mesh>
      )}
      {blobs.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <sphereGeometry args={[b.r, 10, 8]} />
          <meshStandardMaterial color={b.c} roughness={0.8} />
        </mesh>
      ))}
      {/* Bloom accent: a small bright sphere on top */}
      {plant.bloomMonths.length > 0 && (
        <mesh position={[0, height * 0.95, 0]}>
          <sphereGeometry args={[spread * 0.18, 8, 6]} />
          <meshStandardMaterial color={bloom} emissive={bloom} emissiveIntensity={0.2} />
        </mesh>
      )}
      {/* Ground shadow disk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[spread * 0.5, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
