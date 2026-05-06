import { Component, Suspense, useMemo } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import type { Design, Plant } from "../../types";
import { getPlant } from "../../lib/plants";
import { ftToM } from "../../lib/units";
import { PlantBillboard } from "./PlantBillboard";
import { PlantModel } from "./PlantModel";

interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}
interface BoundaryState {
  errored: boolean;
}
/** Per-instance error boundary so a bad glTF falls back silently. */
class ModelBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { errored: false };
  static getDerivedStateFromError(): BoundaryState {
    return { errored: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("Plant model failed to load; using billboard.", err);
  }
  render() {
    if (this.state.errored) return this.props.fallback;
    return this.props.children;
  }
}

function PlantInstance({
  plant,
  position,
}: {
  plant: Plant;
  position: [number, number, number];
}) {
  const billboard = <PlantBillboard plant={plant} position={position} />;
  if (!plant.modelUrl) return billboard;
  return (
    <ModelBoundary fallback={billboard}>
      <Suspense fallback={billboard}>
        <PlantModel plant={plant} position={position} />
      </Suspense>
    </ModelBoundary>
  );
}

/**
 * Renders the entire design in 3D space, with (0,0,0) at the bed origin.
 * Y is up (meters). Design uses (x,y) in feet with +y meaning "south" in
 * plan view; we map that to -z in 3D so that "forward" in the plan is away
 * from the viewer.
 */
export function BedScene({ design }: { design: Design }) {
  const bedShape = useMemo(() => {
    if (design.bed.points.length < 3) return null;
    const shape = new THREE.Shape();
    design.bed.points.forEach((p, i) => {
      const x = ftToM(p.x);
      const z = ftToM(p.y);
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    });
    shape.closePath();
    return shape;
  }, [design.bed.points]);

  return (
    <group>
      {/* Ground bed */}
      {bedShape && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <shapeGeometry args={[bedShape]} />
          <meshStandardMaterial color="#6b4423" roughness={1} />
        </mesh>
      )}
      {/* Plants */}
      {design.plants.map((pp) => {
        const plant = getPlant(pp.plantId);
        if (!plant) return null;
        return (
          <PlantInstance
            key={pp.uid}
            plant={plant}
            position={[ftToM(pp.x), 0, ftToM(pp.y)]}
          />
        );
      })}
    </group>
  );
}
