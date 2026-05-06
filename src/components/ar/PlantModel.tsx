import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { Plant } from "../../types";
import { ftToM } from "../../lib/units";

/**
 * Loads a glTF/GLB for a plant and scales it to the plant's mature size.
 * Expects the source model to be roughly unit-sized (~1 m tall, facing +Z).
 * Multiple instances share one parsed glTF via the drei/three cache; we clone
 * so transforms don't leak across copies.
 */
export function PlantModel({
  plant,
  position,
}: {
  plant: Plant;
  position: [number, number, number];
}) {
  if (!plant.modelUrl) return null;

  // useGLTF suspends while loading — parent Suspense handles the fallback.
  const { scene } = useGLTF(plant.modelUrl) as unknown as {
    scene: THREE.Object3D;
  };

  const instance = useMemo(() => {
    const clone = scene.clone(true);
    // Normalize: compute bounding box, then rescale so model height matches
    // matureHeightFt (in meters).
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const srcHeight = size.y || 1;
    const targetHeight = ftToM(plant.matureHeightFt);
    const scale = targetHeight / srcHeight;
    clone.scale.setScalar(scale);
    // Re-ground so the feet of the model sit at y=0.
    const box2 = new THREE.Box3().setFromObject(clone);
    clone.position.y -= box2.min.y;
    clone.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    return clone;
  }, [scene, plant.matureHeightFt]);

  return (
    <group position={position}>
      <primitive object={instance} />
      {/* Ground shadow disk (same as billboard) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[ftToM(plant.matureSpreadFt) * 0.5, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}
