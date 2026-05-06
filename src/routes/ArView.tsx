import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ARButton, XR, Controllers, useHitTest } from "@react-three/xr";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { useDesignStore } from "../store/useDesignStore";
import { BedScene } from "../components/ar/BedScene";

export function ArView() {
  const design = useDesignStore((s) => s.current());
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);
  const [placed, setPlaced] = useState<THREE.Matrix4 | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const xr = (navigator as any).xr;
    if (!xr || !xr.isSessionSupported) {
      setXrSupported(false);
      return;
    }
    xr.isSessionSupported("immersive-ar")
      .then((ok: boolean) => setXrSupported(ok))
      .catch(() => setXrSupported(false));
  }, []);

  if (!design) {
    return (
      <div className="min-h-screen grid place-items-center text-stone-600">
        No design loaded.{" "}
        <button
          className="ml-2 text-brand-700 underline"
          onClick={() => navigate("/design")}
        >
          Open designer
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black">
      <Canvas
        camera={{ position: [4, 3, 6], fov: 60 }}
        shadows
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        onCreated={({ gl, scene }) => {
          // Transparent clear so the WebXR AR compositor can show the camera
          // feed through the canvas. Without this the scene paints solid black
          // over the camera pass-through.
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
      >
        <XR referenceSpace="local-floor">
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 3]} intensity={1.2} castShadow />
          {xrSupported ? (
            <ArPlacementController
              placed={placed}
              onPlace={(m) => {
                setPlaced(m);
                setShowHelp(false);
              }}
            >
              <BedScene design={design} />
            </ArPlacementController>
          ) : (
            <>
              {/* Non-AR orbit fallback — add env lighting + ground plane */}
              <Environment preset="park" />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#d6d3d1" />
              </mesh>
              <BedScene design={design} />
              <OrbitControls makeDefault target={[2, 0.5, 2]} />
            </>
          )}
          <Controllers />
        </XR>
      </Canvas>

      {/* Top-left back button */}
      <Link
        to="/design"
        className="absolute top-3 left-3 z-30 bg-white/90 hover:bg-white rounded-full p-2 shadow"
        title="Back to designer"
      >
        <ArrowLeft className="h-5 w-5 text-stone-800" />
      </Link>

      {/* XR entry button + fallback banner */}
      <div className="absolute bottom-5 left-0 right-0 z-30 flex justify-center px-4">
        {xrSupported ? (
          <ARButton
            sessionInit={{
              requiredFeatures: ["hit-test"],
              optionalFeatures: ["dom-overlay", "local-floor"],
              domOverlay: { root: document.body },
            }}
            style={{
              position: "relative",
              fontSize: 14,
              padding: "12px 20px",
              background: "#15803d",
              color: "white",
              border: "none",
              borderRadius: 999,
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              cursor: "pointer",
            }}
          />
        ) : xrSupported === false ? (
          <div className="bg-white/95 rounded-lg shadow px-4 py-3 max-w-md text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Info className="h-4 w-4 text-amber-600" />
              AR not available on this device
            </div>
            <p className="text-xs text-stone-600 mt-1">
              WebXR requires Android Chrome or a WebXR-capable browser. You're
              seeing a 3D preview instead — drag to orbit, scroll to zoom.
            </p>
          </div>
        ) : null}
      </div>

      {showHelp && xrSupported && placed === null && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-white/95 rounded-lg shadow px-4 py-2 text-sm text-stone-800 max-w-sm text-center">
          After entering AR, move your phone slowly to scan the ground, then tap
          where you want the bed to be placed.
        </div>
      )}
    </div>
  );
}

/** Shows a reticle on detected surfaces; on tap, anchors the children. */
function ArPlacementController({
  placed,
  onPlace,
  children,
}: {
  placed: THREE.Matrix4 | null;
  onPlace: (m: THREE.Matrix4) => void;
  children: React.ReactNode;
}) {
  const reticleRef = useRef<THREE.Mesh>(null);
  const latestHit = useRef<THREE.Matrix4 | null>(null);

  useHitTest((hitMatrix) => {
    latestHit.current = hitMatrix.clone();
    if (reticleRef.current && !placed) {
      hitMatrix.decompose(
        reticleRef.current.position,
        reticleRef.current.quaternion,
        reticleRef.current.scale
      );
      reticleRef.current.visible = true;
    }
  });

  useEffect(() => {
    function onSelect() {
      if (!placed && latestHit.current) {
        onPlace(latestHit.current.clone());
      }
    }
    const sess = (window as any).__xrSession;
    // Listen via window for simplicity; react-three/xr also exposes events.
    window.addEventListener("xrselect", onSelect);
    return () => window.removeEventListener("xrselect", onSelect);
  }, [placed, onPlace]);

  // Use the XR session's "select" event
  useEffect(() => {
    const gl = (window as any).__xrGl;
    void gl;
    // react-three/xr forwards "select" to the onSelect prop of <Interactive>;
    // we use an alternate approach: listen at the canvas for touchend when no
    // object is placed.
    function onTouch() {
      if (!placed && latestHit.current) {
        onPlace(latestHit.current.clone());
      }
    }
    window.addEventListener("touchend", onTouch);
    return () => window.removeEventListener("touchend", onTouch);
  }, [placed, onPlace]);

  return (
    <>
      {/* Reticle */}
      {!placed && (
        <mesh ref={reticleRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.12, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
      {placed &&
        (() => {
          const p = new THREE.Vector3();
          const q = new THREE.Quaternion();
          const s = new THREE.Vector3();
          placed.decompose(p, q, s);
          return (
            <group position={p} quaternion={q}>
              {children}
            </group>
          );
        })()}
    </>
  );
}
