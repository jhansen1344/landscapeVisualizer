import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ARButton, XR, Controllers, useHitTest } from "@react-three/xr";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Info, ArrowDown, ArrowUp } from "lucide-react";
import { useDesignStore } from "../store/useDesignStore";
import { BedScene } from "../components/ar/BedScene";

export function ArView() {
  const design = useDesignStore((s) => s.current());
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);
  const [placed, setPlaced] = useState<THREE.Matrix4 | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [yOffset, setYOffset] = useState(0); // user-controllable height nudge (m)
  const [debug, setDebug] = useState<{ camY: number; anchorY: number } | null>(
    null
  );
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [overlayReady, setOverlayReady] = useState(false);

  useEffect(() => {
    // ARButton reads domOverlay.root at click-time, so the ref must exist
    // before the user taps. We force a re-render once the div is mounted.
    setOverlayReady(true);
  }, []);

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
    // No bg-black here: during AR, the DOM overlay is composited on top of
    // the camera feed, so any opaque background here would cover it.
    <div className="relative h-screen w-screen">
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
        {/*
         * "local" reference space avoids the unreliable floor-height estimate
         * that "local-floor" produces on most phones. Hit-test still gives us
         * the actual surface position, so we don't need a global floor Y.
         */}
        <XR referenceSpace="local">
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 3]} intensity={1.2} castShadow />
          {xrSupported ? (
            <ArPlacementController
              placed={placed}
              yOffset={yOffset}
              onPlace={(m) => {
                setPlaced(m);
                setShowHelp(false);
              }}
              onDebug={setDebug}
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

      {/*
       * Dedicated DOM-overlay root. Only the elements inside this div will
       * be composited over the camera during the AR session. Keep it
       * pointer-events:none so taps pass through to the XR session, and
       * re-enable pointer events selectively on interactive children.
       */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-30 pointer-events-none"
      >
        <Link
          to="/design"
          className="pointer-events-auto absolute top-3 left-3 bg-white/90 hover:bg-white rounded-full p-2 shadow"
          title="Back to designer"
        >
          <ArrowLeft className="h-5 w-5 text-stone-800" />
        </Link>

        <div className="pointer-events-auto absolute bottom-5 left-0 right-0 flex justify-center px-4">
          {xrSupported && overlayReady ? (
            <ARButton
              sessionInit={{
                requiredFeatures: ["hit-test"],
                optionalFeatures: [
                  "dom-overlay",
                  "local-floor",
                  "anchors",
                ],
                domOverlay: { root: overlayRef.current ?? document.body },
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
                WebXR requires Android Chrome or a WebXR-capable browser.
                You're seeing a 3D preview instead — drag to orbit, scroll to
                zoom.
              </p>
            </div>
          ) : null}
        </div>

        {showHelp && xrSupported && placed === null && (
          <div className="pointer-events-auto absolute top-14 left-1/2 -translate-x-1/2 bg-white/95 rounded-lg shadow px-4 py-2 text-sm text-stone-800 max-w-sm text-center">
            After entering AR, move your phone slowly to scan the ground, then
            tap where you want the bed to be placed.
          </div>
        )}

        {/* Height nudge controls + diagnostic readout, visible after placement */}
        {placed && xrSupported && (
          <div className="pointer-events-auto absolute top-3 right-3 flex flex-col items-stretch gap-2">
            <div className="bg-white/95 rounded-lg shadow px-3 py-2 text-xs text-stone-700 text-center">
              <div className="font-semibold mb-1">Bed height</div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setYOffset((v) => v - 0.1)}
                  className="flex-1 py-1.5 rounded border border-stone-300 hover:bg-stone-100 flex items-center justify-center"
                  title="Lower by 10cm"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setYOffset(0)}
                  className="px-2 py-1.5 rounded border border-stone-300 hover:bg-stone-100 text-[10px] tabular-nums"
                  title="Reset offset"
                >
                  {yOffset >= 0 ? "+" : ""}
                  {yOffset.toFixed(1)}m
                </button>
                <button
                  onClick={() => setYOffset((v) => v + 0.1)}
                  className="flex-1 py-1.5 rounded border border-stone-300 hover:bg-stone-100 flex items-center justify-center"
                  title="Raise by 10cm"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
            {debug && (
              <div className="bg-stone-900/80 text-white rounded-md px-2 py-1 text-[10px] tabular-nums text-center">
                cam {debug.camY.toFixed(2)}m · anchor {debug.anchorY.toFixed(2)}m
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Shows a reticle on detected surfaces; on tap, creates an XRAnchor at the
 * hit pose and parents the children to it so they stay glued to the real
 * world as WebXR's tracking refines itself. Falls back to a static pose
 * snapshot when the session doesn't grant the "anchors" feature.
 */
function ArPlacementController({
  placed,
  yOffset,
  onPlace,
  onDebug,
  children,
}: {
  placed: THREE.Matrix4 | null;
  yOffset: number;
  onPlace: (m: THREE.Matrix4) => void;
  onDebug: (info: { camY: number; anchorY: number }) => void;
  children: React.ReactNode;
}) {
  const reticleRef = useRef<THREE.Mesh>(null);
  const anchoredGroupRef = useRef<THREE.Group>(null);
  const latestHit = useRef<THREE.Matrix4 | null>(null);
  const latestHitResult = useRef<XRHitTestResult | null>(null);
  const anchorRef = useRef<XRAnchor | null>(null);

  useHitTest((hitMatrix, hit) => {
    latestHit.current = hitMatrix.clone();
    latestHitResult.current = hit ?? null;
    if (reticleRef.current && !placed) {
      hitMatrix.decompose(
        reticleRef.current.position,
        reticleRef.current.quaternion,
        reticleRef.current.scale
      );
      reticleRef.current.visible = true;
    }
  });

  // Every frame, if we have an anchor, resolve its current pose and update
  // the group. This is what keeps the bed glued to the floor as the device's
  // world tracking drifts/corrects.
  useFrame((state, _delta, xrFrame) => {
    const anchor = anchorRef.current;
    const group = anchoredGroupRef.current;
    if (!anchor || !group || !xrFrame) return;
    const refSpace = state.gl.xr.getReferenceSpace();
    if (!refSpace) return;
    const pose = xrFrame.getPose(
      (anchor as unknown as { anchorSpace: XRSpace }).anchorSpace,
      refSpace
    );
    if (!pose) return;
    const m = pose.transform.matrix;
    group.position.set(m[12], m[13] + yOffset, m[14]);
    // Intentionally ignore rotation so the bed stays flat (see earlier fix).

    // Periodically report camera/anchor Y so the operator can see whether
    // the placement matches reality.
    const camY = state.camera.position.y;
    const anchorY = m[13];
    if (state.clock.elapsedTime % 0.5 < 0.02) {
      onDebug({ camY, anchorY });
    }
  });

  useEffect(() => {
    async function place() {
      if (placed) return;
      const hit = latestHitResult.current;
      const mat = latestHit.current;
      if (!mat) return;

      // Preferred path: create a real XRAnchor so the system tracks it.
      if (hit && typeof (hit as XRHitTestResult).createAnchor === "function") {
        try {
          const anchor = await (hit as XRHitTestResult).createAnchor!();
          if (anchor) {
            anchorRef.current = anchor;
            onPlace(mat.clone()); // flips `placed` + hides help
            return;
          }
        } catch (err) {
          console.warn("XRAnchor creation failed; using static pose.", err);
        }
      }
      // Fallback: static matrix snapshot (will drift).
      onPlace(mat.clone());
    }
    function onTouch() {
      void place();
    }
    window.addEventListener("touchend", onTouch);
    return () => window.removeEventListener("touchend", onTouch);
  }, [placed, onPlace]);

  // Clear the anchor when placement is reset (e.g. if we add a "reset" button
  // later). Today this just runs once on unmount.
  useEffect(() => {
    return () => {
      anchorRef.current = null;
    };
  }, []);

  const hasAnchor = anchorRef.current !== null;

  return (
    <>
      {/* Reticle */}
      {!placed && (
        <mesh ref={reticleRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.12, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
      {placed && hasAnchor && (
        // Anchor-tracked group: position is overwritten each frame.
        <group ref={anchoredGroupRef}>{children}</group>
      )}
      {placed && !hasAnchor &&
        (() => {
          // Fallback path: no anchor available, use the captured pose.
          const p = new THREE.Vector3();
          const q = new THREE.Quaternion();
          const s = new THREE.Vector3();
          placed.decompose(p, q, s);
          return (
            <group position={[p.x, p.y + yOffset, p.z]}>{children}</group>
          );
        })()}
    </>
  );
}
