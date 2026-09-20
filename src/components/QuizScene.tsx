import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";

/**
 * How far the world slides past the camera across the whole quiz.
 * Nothing here animates on a clock - every value is a pure function of
 * `progress`, so the scene only moves when the student scrolls.
 */
const TRAVEL = 36;

/** Deterministic pseudo-random so particles are stable between renders. */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Geometry emerges from the distance as it travels toward the viewer:
 * 0 far away (invisible), 1 right in front of the camera.
 */
function visibility(z: number) {
  return Math.min(1, Math.max(0, (z + 34) / 34));
}

type ShapeKind = "icosahedron" | "octahedron" | "dodecahedron" | "tetrahedron";

function Polyhedron({
  kind,
  args,
}: {
  kind: ShapeKind;
  args: [number, number];
}) {
  switch (kind) {
    case "icosahedron":
      return <icosahedronGeometry args={args} />;
    case "octahedron":
      return <octahedronGeometry args={args} />;
    case "dodecahedron":
      return <dodecahedronGeometry args={args} />;
    case "tetrahedron":
      return <tetrahedronGeometry args={args} />;
  }
}

// Three layers travel at different speeds, which is what produces parallax.
const FAR_SPEED = 0.55;
const MID_SPEED = 1;
const NEAR_SPEED = 1.55;

const FAR_SHAPES: Array<{
  kind: ShapeKind;
  args: [number, number];
  x: number;
  y: number;
  z: number;
  color: string;
}> = [
  { kind: "icosahedron", args: [0.8, 1], x: 4.2, y: 1.4, z: -8, color: "#1e3a5f" },
  { kind: "octahedron", args: [0.6, 0], x: -4.4, y: -1.2, z: -16, color: "#0d9488" },
  { kind: "dodecahedron", args: [0.5, 0], x: 3.4, y: -2, z: -34, color: "#1e40af" },
];

const MID_RINGS: Array<{
  x: number;
  y: number;
  z: number;
  radius: number;
  tube: number;
  color: string;
  dir: 1 | -1;
}> = [
  { x: 3.2, y: 1.6, z: -6, radius: 2.6, tube: 0.02, color: "#1e3a5f", dir: 1 },
  { x: -3.6, y: -0.9, z: -14, radius: 1.9, tube: 0.016, color: "#0d9488", dir: -1 },
  { x: 0.4, y: 2.2, z: -22, radius: 3.2, tube: 0.024, color: "#1e40af", dir: 1 },
  { x: -2.2, y: 1.1, z: -30, radius: 1.3, tube: 0.012, color: "#0f766e", dir: -1 },
];

const MID_SHAPES: Array<{
  kind: ShapeKind;
  args: [number, number];
  x: number;
  y: number;
  z: number;
  color: string;
}> = [
  { kind: "tetrahedron", args: [0.42, 0], x: -1.6, y: 1.9, z: -10, color: "#0f766e" },
  { kind: "icosahedron", args: [0.34, 1], x: 2.4, y: -2.1, z: -18, color: "#334155" },
  { kind: "octahedron", args: [0.48, 0], x: -4, y: 0.8, z: -26, color: "#1e3a5f" },
];

const NEAR_RINGS: Array<{
  x: number;
  y: number;
  z: number;
  radius: number;
  tube: number;
  color: string;
  dir: 1 | -1;
}> = [
  { x: 2.6, y: -1.4, z: -11, radius: 2, tube: 0.014, color: "#0f766e", dir: -1 },
  { x: -3, y: 1.2, z: -26, radius: 2.4, tube: 0.018, color: "#1e3a5f", dir: 1 },
];

/** Floor grids that pass beneath the camera as the quiz advances. */
const GRID_Z = [-4, -12, -20];

/** Small repeated sway so the motion never feels like a straight rail. */
function sway(p: number, phase: number) {
  return Math.sin(p * Math.PI * 2 + phase);
}

/** Respect the user's reduced-motion preference. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/** Lighter scene on small screens. */
function useIsSmallScreen() {
  const [small, setSmall] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent) => setSmall(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return small;
}

/**
 * The camera itself is a function of scroll position: it dollies forward,
 * drifts sideways, rolls slightly and widens its field of view as the student
 * moves through the quiz. Because nothing is driven by a clock, the sense of
 * travelling through the scene only exists while scrolling.
 */
function CameraRig({ progress }: { progress: number }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const p = progress;

    /* eslint-disable react-hooks/immutability -- the three.js camera lives
       outside React state; positioning it directly from scroll progress is the
       standard react-three-fiber way to move a camera without a render loop. */

    // Push in and back out again over the length of the quiz. At p = 0 this is
    // exactly the camera declared on the Canvas, so the journey starts still.
    camera.position.set(
      Math.sin(p * Math.PI * 2) * 1.4,
      Math.sin(p * Math.PI) * 1.2,
      6 - p * 3.2,
    );
    camera.rotation.z = Math.sin(p * Math.PI * 2) * 0.05;
    camera.rotation.x = Math.sin(p * Math.PI * 1.5) * 0.035;

    const perspective = camera as PerspectiveCamera;
    if (perspective.isPerspectiveCamera) {
      const nextFov = 50 + Math.sin(p * Math.PI) * 8;
      if (Math.abs(perspective.fov - nextFov) > 0.01) {
        perspective.fov = nextFov;
        perspective.updateProjectionMatrix();
      }
    }
    /* eslint-enable react-hooks/immutability */
  }, [camera, progress]);

  return null;
}

export function QuizScene({ progress }: { progress: number }) {
  const reducedMotion = usePrefersReducedMotion();
  const isSmall = useIsSmallScreen();

  // With reduced motion the scene stays still; scrolling still works normally.
  const p = reducedMotion ? 0 : progress;

  const particleCount = isSmall ? 55 : 130;
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (seededRandom(i * 3 + 1) - 0.5) * 22;
      positions[i * 3 + 1] = (seededRandom(i * 3 + 2) - 0.5) * 14;
      positions[i * 3 + 2] = -2 - seededRandom(i * 3 + 3) * 38;
    }
    return positions;
  }, [particleCount]);

  const turn = p * Math.PI * 2;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ filter: "saturate(0.85)" }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <CameraRig progress={p} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.3} color="#e2e8f0" />
        <pointLight position={[-3, 2, -2]} intensity={0.18} color="#0d9488" />
        <pointLight position={[3, -1, -6]} intensity={0.12} color="#1e3a5f" />

        {/* FAR LAYER - slowest, sits deepest in the fog */}
        <group
          position={[
            sway(p, 0) * 0.4,
            Math.cos(p * Math.PI * 1.6) * 0.3,
            p * TRAVEL * FAR_SPEED,
          ]}
        >
          {GRID_Z.map((z) => {
            const worldZ = z + p * TRAVEL * FAR_SPEED;
            return (
              <gridHelper
                key={z}
                args={[40, 40, "#1e3a5f", "#0f2942"]}
                position={[0, -3, z]}
                material-transparent
                material-opacity={0.2 * visibility(worldZ)}
              />
            );
          })}
          {FAR_SHAPES.map((shape, i) => {
            const worldZ = shape.z + p * TRAVEL * FAR_SPEED;
            return (
              <mesh
                key={`far-${i}`}
                position={[shape.x, shape.y, shape.z]}
                rotation={[turn * 0.6 + i, turn * 0.4, 0]}
              >
                <Polyhedron kind={shape.kind} args={shape.args} />
                <meshBasicMaterial
                  color={shape.color}
                  wireframe
                  transparent
                  opacity={0.3 * visibility(worldZ)}
                />
              </mesh>
            );
          })}
        </group>

        {/* MID LAYER - the reference speed */}
        <group
          position={[
            sway(p, 1.2) * 0.7,
            Math.cos(p * Math.PI * 1.3 + 1) * 0.45,
            p * TRAVEL * MID_SPEED,
          ]}
        >
          {MID_RINGS.map((ring, i) => {
            const worldZ = ring.z + p * TRAVEL * MID_SPEED;
            return (
              <mesh
                key={`mid-ring-${i}`}
                position={[ring.x, ring.y, ring.z]}
                rotation={[
                  turn * 0.5 * ring.dir + i * 0.4,
                  turn * ring.dir,
                  turn * 0.3,
                ]}
              >
                <torusGeometry args={[ring.radius, ring.tube, 16, 48]} />
                <meshBasicMaterial
                  color={ring.color}
                  wireframe
                  transparent
                  opacity={0.34 * visibility(worldZ)}
                />
              </mesh>
            );
          })}
          {MID_SHAPES.map((shape, i) => {
            const worldZ = shape.z + p * TRAVEL * MID_SPEED;
            return (
              <mesh
                key={`mid-shape-${i}`}
                position={[shape.x, shape.y, shape.z]}
                rotation={[turn * 0.8 + i, turn * 0.5, turn * 0.2]}
              >
                <Polyhedron kind={shape.kind} args={shape.args} />
                <meshBasicMaterial
                  color={shape.color}
                  wireframe
                  transparent
                  opacity={0.32 * visibility(worldZ)}
                />
              </mesh>
            );
          })}

          {/* Particle field shares this layer's travel, so it streams past */}
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[particles, 3]} />
            </bufferGeometry>
            <pointsMaterial
              size={0.05}
              color="#94a3b8"
              transparent
              opacity={0.55}
              sizeAttenuation
              depthWrite={false}
            />
          </points>
        </group>

        {/* NEAR LAYER - fastest, sweeps right past the camera */}
        <group
          position={[
            sway(p, 2.4) * 1.1,
            Math.cos(p * Math.PI * 1.8 + 2) * 0.7,
            p * TRAVEL * NEAR_SPEED,
          ]}
        >
          {NEAR_RINGS.map((ring, i) => {
            const worldZ = ring.z + p * TRAVEL * NEAR_SPEED;
            return (
              <mesh
                key={`near-ring-${i}`}
                position={[ring.x, ring.y, ring.z]}
                rotation={[turn * 0.9 * ring.dir, turn * 1.2 * ring.dir, turn * 0.5]}
              >
                <torusGeometry args={[ring.radius, ring.tube, 16, 48]} />
                <meshBasicMaterial
                  color={ring.color}
                  wireframe
                  transparent
                  opacity={0.5 * visibility(worldZ)}
                />
              </mesh>
            );
          })}
        </group>
      </Canvas>
    </div>
  );
}
