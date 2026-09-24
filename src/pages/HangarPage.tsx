import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Html,
  useTexture,
  RoundedBox,
  useGLTF,
  useAnimations,
} from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import {
  Suspense,
  useLayoutEffect,
  useRef,
  useMemo,
} from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { lazy } from 'react';

const LiveryEditor = lazy(() => import('../components/LiveryEditor'));
import { usePlaneStore, type Face } from '../store';

// ============================================================
// LIVERY SETUP
// ============================================================

const FACES: Face[] = [
  'top',
  'bottom',
  'left',
  'right',
  'flag',
];

const FLAG_LEFT_FALLBACK = '/templates/flag-left.svg';
const FLAG_RIGHT_FALLBACK = '/templates/flag-right.svg';
// Preload the pilot while the landing page is still on screen.
useGLTF.preload('/pilot-out.glb');

// ============================================================
// FLAG MATERIAL
// ONLY REMAINING LIVERY WRAPPER
// ============================================================

function FlagSkin({
  url,
  fallback,
}: {
  url: string | null;
  fallback: string;
}) {
  const map = useTexture(url ?? fallback);

  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.needsUpdate = true;
  }, [map]);

  return (
    <meshBasicMaterial
      map={map}
      color="#ffffff"
      side={THREE.DoubleSide}
      toneMapped={false}
      polygonOffset
      polygonOffsetFactor={-1}
      polygonOffsetUnits={-1}
    />
  );
}

// ============================================================
// SIMPLE TREE
// ============================================================

function Tree({
  x,
  z,
  s = 1,
}: {
  x: number;
  z: number;
  s?: number;
}) {
  return (
    <group
      position={[x, 0, z]}
      scale={s}
    >
      <mesh
        position={[0, 0.45, 0]}
      >
        <cylinderGeometry
          args={[0.06, 0.08, 0.9, 6]}
        />

        <meshStandardMaterial
          color="#6b4a2e"
          roughness={0.9}
        />
      </mesh>

      <mesh
        position={[0, 1.15, 0]}
      >
        <coneGeometry
          args={[0.55, 1.1, 6]}
        />

        <meshStandardMaterial
          color="#3d7a4a"
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// ROAD / HANGAR ENVIRONMENT
// ============================================================

function Road() {
  const zs = [
    -6,
    -3.5,
    -1,
    1.5,
    4,
    6.5,
  ];

  return (
    <group>
      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry
          args={[40, 40]}
        />

        <meshStandardMaterial
          color="#88aa66"
          roughness={1}
        />
      </mesh>

      {/* Road */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry
          args={[3.4, 22]}
        />

        <meshStandardMaterial
          color="#5a5348"
          roughness={1}
        />
      </mesh>

      {/* Road edge lines */}
      {[-1.62, 1.62].map((x) => (
        <mesh
          key={x}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.012, 0]}
        >
          <planeGeometry
            args={[0.07, 22]}
          />

          <meshStandardMaterial
            color="#ffe600"
            roughness={0.8}
          />
        </mesh>
      ))}

      {/* Road center markings */}
      {[-8, -5, -2, 1, 4, 7].map((z) => (
        <mesh
          key={z}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.013, z]}
        >
          <planeGeometry
            args={[0.16, 0.9]}
          />

          <meshStandardMaterial
            color="#f7f4ea"
            roughness={0.8}
          />
        </mesh>
      ))}

      {/* Trees */}
      {/* Moved farther away from the road to create a proper
          grass shoulder for the pilot. */}
      {zs.map((z, i) => (
        <group key={z}>
          <Tree
            x={-4.0}
            z={z}
            s={i % 2 ? 0.9 : 1}
          />

          <Tree
            x={4.0}
            z={z + 0.6}
            s={i % 2 ? 1.1 : 0.85}
          />
        </group>
      ))}
    </group>
  );
}

// ============================================================
// PILOT
// ============================================================

// if that path fails:
// import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const PILOT_HEIGHT = 1.25;

function HangarMan({
  position = [1.65, 0, 0.15] as [number, number, number],
}) {
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  const { scene, animations } = useGLTF('/pilot-out.glb');

  const man = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);

    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });

    clone.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const s = PILOT_HEIGHT / Math.max(size.y, 1e-6);
    clone.scale.multiplyScalar(s);
    clone.updateMatrixWorld(true);

    const fitted = new THREE.Box3().setFromObject(clone);
    const center = fitted.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= fitted.min.y;

    return clone;
  }, [scene]);

  // hook the mixer to the CLONE, not the original scene
  const { actions, mixer } = useAnimations(animations, man);

  useLayoutEffect(() => {
    const idle =
      actions.idle ||
      actions.Idle ||
      actions[Object.keys(actions)[0]];

    if (!idle) return;

    idle.reset();
    idle.setLoop(THREE.LoopRepeat, Infinity);
    idle.fadeIn(0.2);
    idle.play();

    return () => {
      idle.fadeOut(0.2);
    };
  }, [actions]);

  useFrame((_, delta) => {
    if (mixer) {
      mixer.update(delta);
      invalidate();
    }
  });

  return (
    <group ref={group} position={position} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={man} />
    </group>
  );
}// ============================================================
// COCKPIT SEAT
// ============================================================

function Seat({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Seat cushion */}
      <RoundedBox
        args={[0.30, 0.08, 0.27]}
        radius={0.035}
        smoothness={3}
        position={[0, -0.04, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#20252a"
          roughness={0.82}
        />
      </RoundedBox>

      {/* Seat back */}
      <RoundedBox
        args={[0.13, 0.36, 0.27]}
        radius={0.035}
        smoothness={3}
        position={[-0.08, 0.14, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#252a30"
          roughness={0.82}
        />
      </RoundedBox>

      {/* Head rest */}
      <RoundedBox
        args={[0.12, 0.09, 0.22]}
        radius={0.03}
        smoothness={3}
        position={[-0.09, 0.36, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#292e35"
          roughness={0.8}
        />
      </RoundedBox>
    </group>
  );
}

// ============================================================
// COCKPIT / CANOPY
// ============================================================

function Cockpit() {
  return (
    <group position={[0.42, 0.18, 0]}>
      {/* Dark cockpit floor */}
      <RoundedBox
        args={[0.96, 0.045, 0.64]}
        radius={0.025}
        smoothness={3}
        position={[0, -0.23, 0]}
      >
        <meshStandardMaterial
          color="#171a1d"
          roughness={0.9}
        />
      </RoundedBox>

      {/* Two seats */}
      <Seat
        position={[0.08, -0.08, 0.19]}
      />

      <Seat
        position={[0.08, -0.08, -0.19]}
      />

      {/* Pilot */}
      <RoundedBox
        args={[0.08, 0.27, 0.045]}
        radius={0.018}
        smoothness={2}
        position={[0.10, 0.03, 0]}
      >
        <meshStandardMaterial
          color="#30353b"
          roughness={0.75}
        />
      </RoundedBox>

      {/* Closed glass cockpit canopy */}
      <RoundedBox
        args={[0.98, 0.48, 0.72]}
        radius={0.20}
        smoothness={8}
        position={[0.02, 0.10, 0]}
        renderOrder={4}
      >
        <meshStandardMaterial
          color="#9ec2d2"
          transparent
          opacity={0.34}
          roughness={0.18}
          metalness={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </RoundedBox>

      {/* Thin canopy base frame */}
      <RoundedBox
        args={[0.90, 0.045, 0.65]}
        radius={0.018}
        smoothness={4}
        position={[0.02, -0.13, 0]}
      >
        <meshStandardMaterial
          color="#aeb6bd"
          metalness={0.45}
          roughness={0.38}
        />
      </RoundedBox>
    </group>
  );
}

// ============================================================
// CUSTOM CURVED WING
// ============================================================

function Wing({
  side,
}: {
  side: 1 | -1;
}) {
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const s = side;

    const vertices = new Float32Array([
      // TOP
      0.24, 0.03, 0,
      -0.35, 0.03, s * 0.65,
      -1.05, 0.07, s * 1.35,
      -1.45, 0.13, s * 1.78,

      // BOTTOM
      0.24, -0.04, 0,
      -0.35, -0.04, s * 0.65,
      -1.05, 0.00, s * 1.35,
      -1.45, 0.06, s * 1.78,
    ]);

    const indices = [
      // Top
      0, 1, 2,
      0, 2, 3,

      // Bottom
      4, 6, 5,
      4, 7, 6,

      // Front / leading edge
      0, 4, 5,
      0, 5, 1,

      // Outer section
      1, 5, 6,
      1, 6, 2,

      2, 6, 7,
      2, 7, 3,

      // Tip
      3, 7, 4,
      3, 4, 0,
    ];

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(vertices, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, [side]);

  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color="#d7dde2"
        metalness={0.35}
        roughness={0.45}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================
// TAIL
// ============================================================

function Tail() {
  return (
    <group
      position={[-0.93, 0.12, 0]}
    >
      {/* Vertical stabilizer */}
      <mesh
        position={[0, 0.34, 0]}
        rotation={[0, 0, -0.12]}
        castShadow
      >
        <RoundedBox
          args={[0.40, 0.64, 0.08]}
          radius={0.025}
          smoothness={3}
        >
          <meshStandardMaterial
            color="#cbd1d6"
            metalness={0.3}
            roughness={0.45}
          />
        </RoundedBox>
      </mesh>

      {/* Horizontal stabilizer */}
      <mesh
        position={[0, 0.03, 0]}
        castShadow
      >
        <RoundedBox
          args={[0.40, 0.055, 0.82]}
          radius={0.025}
          smoothness={3}
        >
          <meshStandardMaterial
            color="#d4d9de"
            metalness={0.3}
            roughness={0.45}
          />
        </RoundedBox>
      </mesh>

      {/* Tail tip */}
      <mesh
        position={[-0.17, 0.04, 0]}
      >
        <sphereGeometry
          args={[0.07, 16, 10]}
        />

        <meshStandardMaterial
          color="#c5cbd0"
          metalness={0.3}
          roughness={0.45}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// OVERHEAD PROPELLER
// ============================================================

function Propeller() {
  const propellerRef =
    useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, delta) => {
    if (propellerRef.current) {
      propellerRef.current.rotation.x +=
        delta * 8;
      invalidate();
    }
  });

  return (
    <group
      position={[0.05, 0.98, 0]}
    >
      {/* Left support */}
      <RoundedBox
        args={[0.12, 0.82, 0.11]}
        radius={0.025}
        smoothness={3}
        position={[0, -0.38, 0.25]}
        rotation={[0, 0, -0.04]}
        castShadow
      >
        <meshStandardMaterial
          color="#555d64"
          metalness={0.7}
          roughness={0.28}
        />
      </RoundedBox>

      {/* Right support */}
      <RoundedBox
        args={[0.12, 0.82, 0.11]}
        radius={0.025}
        smoothness={3}
        position={[0, -0.38, -0.25]}
        rotation={[0, 0, 0.04]}
        castShadow
      >
        <meshStandardMaterial
          color="#555d64"
          metalness={0.7}
          roughness={0.28}
        />
      </RoundedBox>

      {/* Upper crossbar */}
      <RoundedBox
        args={[0.14, 0.10, 0.58]}
        radius={0.03}
        smoothness={3}
        position={[0, 0.03, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#626a72"
          metalness={0.75}
          roughness={0.25}
        />
      </RoundedBox>

      {/* Rotating propeller */}
      <group ref={propellerRef}>
        {/* Hub */}
        <mesh castShadow>
          <sphereGeometry
            args={[0.105, 20, 16]}
          />

          <meshStandardMaterial
            color="#9ca4aa"
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>

        {/* Blade 1 */}
        <mesh
          position={[0, 0, 0.42]}
          castShadow
        >
          <RoundedBox
            args={[0.055, 0.13, 0.78]}
            radius={0.025}
            smoothness={3}
          >
            <meshStandardMaterial
              color="#171a1d"
              metalness={0.25}
              roughness={0.35}
            />
          </RoundedBox>
        </mesh>

        {/* Blade 2 */}
        <mesh
          position={[0, 0, -0.42]}
          castShadow
        >
          <RoundedBox
            args={[0.055, 0.13, 0.78]}
            radius={0.025}
            smoothness={3}
          >
            <meshStandardMaterial
              color="#171a1d"
              metalness={0.25}
              roughness={0.35}
            />
          </RoundedBox>
        </mesh>
      </group>
    </group>
  );
}

// ============================================================
// LANDING GEAR
// ============================================================

function LandingGear() {
  return (
    <group>
      {/* Left strut */}
      <mesh
        position={[0.25, -0.27, 0.19]}
        rotation={[0, 0, -0.25]}
        castShadow
      >
        <cylinderGeometry
          args={[0.025, 0.025, 0.28, 10]}
        />

        <meshStandardMaterial
          color="#545a60"
          metalness={0.65}
          roughness={0.3}
        />
      </mesh>

      {/* Right strut */}
      <mesh
        position={[0.25, -0.27, -0.19]}
        rotation={[0, 0, -0.25]}
        castShadow
      >
        <cylinderGeometry
          args={[0.025, 0.025, 0.28, 10]}
        />

        <meshStandardMaterial
          color="#545a60"
          metalness={0.65}
          roughness={0.3}
        />
      </mesh>

      {/* Left wheel */}
      <mesh
        position={[0.22, -0.40, 0.19]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.075, 0.075, 0.06, 18]}
        />

        <meshStandardMaterial
          color="#151719"
          roughness={0.85}
        />
      </mesh>

      {/* Right wheel */}
      <mesh
        position={[0.22, -0.40, -0.19]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.075, 0.075, 0.06, 18]}
        />

        <meshStandardMaterial
          color="#151719"
          roughness={0.85}
        />
      </mesh>

      {/* Rear wheel */}
      <mesh
        position={[-0.72, -0.28, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.055, 0.055, 0.05, 16]}
        />

        <meshStandardMaterial
          color="#151719"
          roughness={0.85}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// FLAG WRAPPER
//
// THIS IS THE ONLY LIVERY WRAPPER LEFT.
//
// It sits prominently on the rear/tail section,
// rather than floating on the main fuselage.
// ============================================================

function FlagPanel({
  livery,
  side,
}: {
  livery: string | null;
  side: 1 | -1;
}) {
  return (
    <group
      position={[-1.08, 0.30, side * 0.31]}
      rotation={[0, 0, 0]}
    >
      {/* Small raised mounting plate */}
      <RoundedBox
        args={[0.34, 0.56, 0.025]}
        radius={0.025}
        smoothness={4}
        position={[0, 0, 0]}
        renderOrder={2}
      >
        <meshStandardMaterial
          color="#b9c0c6"
          metalness={0.35}
          roughness={0.42}
        />
      </RoundedBox>

      {/* Actual flag artwork wrapper */}
      <mesh
        position={[0.005, 0, side * 0.018]}
        rotation={[0, side === 1 ? 0 : Math.PI, 0]}
        renderOrder={3}
      >
        <planeGeometry args={[0.30, 0.50]} />
        <FlagSkin url={livery} />
      </mesh>
    </group>
  );
}

// ============================================================
// MAIN PLANE
// ============================================================

function Plane({
  liveries,
}: {
  liveries: Record<Face, string | null>;
}) {
  return (
    <group
      position={[0, 0.72, 0]}
      rotation={[0, Math.PI / 2, 0]}
      scale={1.15}
    >
      {/* ==================================================
          MAIN FUSELAGE
         ================================================== */}

      <RoundedBox
        args={[2.05, 0.48, 0.52]}
        radius={0.18}
        smoothness={6}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#d7dce1"
          metalness={0.35}
          roughness={0.42}
        />
      </RoundedBox>

      {/* Nose */}
      <mesh
        position={[1.00, -0.01, 0]}
        scale={[1.05, 0.78, 0.95]}
        castShadow
      >
        <sphereGeometry
          args={[0.30, 28, 18]}
        />

        <meshStandardMaterial
          color="#d9dee3"
          metalness={0.32}
          roughness={0.42}
        />
      </mesh>

      {/* Dark nose underside */}
      <mesh
        position={[1.17, -0.11, 0]}
        scale={[0.65, 0.28, 0.78]}
      >
        <sphereGeometry
          args={[0.22, 20, 12]}
        />

        <meshStandardMaterial
          color="#24282d"
          metalness={0.15}
          roughness={0.55}
        />
      </mesh>

      {/* ==================================================
          WINGS
         ================================================== */}

      <Wing side={1} />
      <Wing side={-1} />

      {/* ==================================================
          COCKPIT
         ================================================== */}

      <Cockpit />

      {/* ==================================================
          OVERHEAD PROPELLER
         ================================================== */}

      <Propeller />

      {/* ==================================================
          TAIL
         ================================================== */}

      <Tail />

      {/* ==================================================
          LANDING GEAR
         ================================================== */}

      <LandingGear />

      {/* ==================================================
          ONLY LIVERY WRAPPER
          FLAG
         ================================================== */}
<FlagPanel
  livery={liveries['flag-left']}
  side={1}
/>

<FlagPanel
  livery={liveries['flag-right']}
  side={-1}
/>
    </group>
  );
}

// ============================================================
// HANGAR PAGE
// ============================================================

export default function HangarPage() {
  const go = useNavigate();

  const {
    activeFace,
    setActiveFace,
    liveries,
  } = usePlaneStore();

  const painted = FACES.every(
    (face) => Boolean(liveries[face])
  );

  return (
    <main className="launch-bay">
      <style>{LAUNCH_BAY_CSS}</style>


      <section className="launch-bay-layout">
        <aside className="launch-bay-editor">
          <div className="launch-bay-editor-head">
            <div>
              <p className="launch-bay-kicker">Aircraft preparation</p>
              <h1>Launch Bay</h1>
            </div>
            <span className="launch-bay-step">01 / 02</span>
          </div>

          <p className="launch-bay-copy">
            Finish the livery, check the aircraft, then take the crew somewhere unexpected.
          </p>

          <div className="launch-bay-faces">
            {FACES.map((face) => (
              <button
                key={face}
                type="button"
                onClick={() => setActiveFace(face)}
                className={`launch-bay-face ${
                  activeFace === face ? 'is-active' : ''
                } ${liveries[face] ? 'is-done' : ''}`}
              >
                <span>{face.toUpperCase()}</span>
                {liveries[face] && <span className="launch-bay-check">✓</span>}
              </button>
            ))}
          </div>

          <div className="launch-bay-editor-body">
            <Suspense
              fallback={
                <div className="launch-bay-editor-loading">
                  <span className="launch-bay-loading-dot" />
                  Loading editor…
                </div>
              }
            >
              <LiveryEditor />
            </Suspense>
          </div>

          <div className="launch-bay-footer">
            <span className="launch-bay-footer-dot" />
            Flight system ready
          </div>
        </aside>

        <section className="launch-bay-preview">
          <div className="launch-bay-preview-top">
            <div>
              <p className="launch-bay-kicker">Aircraft 01</p>
              <span className="launch-bay-preview-title">Ready for inspection</span>
            </div>

            <span className="launch-bay-destination">
              Destination unknown
            </span>
          </div>

          <div className="launch-bay-viewport">
            <Canvas
              shadows
              dpr={[1, 1.25]}
              frameloop="demand"
              gl={{
                antialias: false,
                powerPreference: 'high-performance',
                alpha: false,
                stencil: false,
              }}
              camera={{
                position: [3.4, 1.8, 3.4],
                fov: 38,
                near: 0.1,
                far: 40,
              }}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            >
              <color
                attach="background"
                args={['#edf2f5']}
              />

              <ambientLight intensity={0.65} />

              <directionalLight
                position={[5, 8, 5]}
                intensity={2}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />

              <directionalLight
                position={[-4, 3, -5]}
                intensity={0.7}
              />

              <Road />
              <Plane liveries={liveries} />

              <Suspense
                fallback={
                  <Html
                    center
                    style={{
                      color: '#071a38',
                      fontSize: '10px',
                      fontWeight: 900,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    rolling the bird out…
                  </Html>
                }
              >
                <HangarMan position={[1.3, 0, -0.2]} />
              </Suspense>

              <OrbitControls
                makeDefault
                enablePan={false}
                enableDamping
                dampingFactor={0.12}
                minDistance={2.6}
                maxDistance={8}
                maxPolarAngle={1.3}
                minPolarAngle={0.3}
                target={[0, 0.65, 0]}
              />
            </Canvas>

            <div className="launch-bay-viewport-label">
              <span>LIVE PREVIEW</span>
              <span>DRAG TO INSPECT</span>
            </div>
          </div>

          <div className="launch-bay-takeoff">
            <div className="launch-bay-readiness">
              <span
                className={`launch-bay-readiness-dot ${
                  painted ? 'is-ready' : ''
                }`}
              />
              <div>
                <strong>{painted ? 'Aircraft ready' : 'Livery incomplete'}</strong>
                <span>
                  {painted
                    ? 'All required panels are finished.'
                    : 'Complete every panel before departure.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (painted) {
                  go('/fly');
                }
              }}
              disabled={!painted}
              className={`launch-bay-takeoff-button ${
                painted ? 'is-ready' : ''
              }`}
            >
              <span>TAKE OFF</span>
              <span className="launch-bay-arrow">→</span>
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

const LAUNCH_BAY_CSS = `
  .launch-bay {
    min-height: 100vh;
    min-height: 100svh;
    position: relative;
    overflow: hidden;
    color: #071a38;
    background:
      radial-gradient(circle at 78% 22%, rgba(31, 71, 119, 0.055), transparent 27%),
      linear-gradient(135deg, #fbfcfc 0%, #f5f7f9 55%, #eef2f6 100%);
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .launch-bay::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.22;
    background-image:
      linear-gradient(rgba(7, 26, 56, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(7, 26, 56, 0.035) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: linear-gradient(to bottom, black, transparent 82%);
  }

  .launch-bay-header {
    position: relative;
    z-index: 20;
    height: 78px;
    padding: 0 clamp(22px, 5vw, 76px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(7, 26, 56, 0.08);
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.7),
      rgba(255, 255, 255, 0)
    );
  }

  .launch-bay-brand {
    display: flex;
    align-items: center;
    gap: 11px;
    font-size: 13px;
    font-weight: 950;
    letter-spacing: 0.2em;
  }

  .launch-bay-brand-dot,
  .launch-bay-footer-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #c58b3c;
    box-shadow: 0 0 0 4px rgba(197, 139, 60, 0.1);
  }

  .launch-bay-hud {
    display: flex;
    align-items: center;
    gap: 18px;
    color: rgba(7, 26, 56, 0.38);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.17em;
    text-transform: uppercase;
  }

  .launch-bay-status {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .launch-bay-status::before {
    content: "";
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #c58b3c;
  }

  .launch-bay-line {
    width: 32px;
    height: 1px;
    background: rgba(7, 26, 56, 0.14);
  }

  .launch-bay-layout {
    position: relative;
    z-index: 5;
    height: calc(100vh - 78px);
    height: calc(100svh - 78px);
    display: grid;
    grid-template-columns: minmax(330px, 0.72fr) minmax(560px, 1.28fr);
    max-width: 1680px;
    margin: 0 auto;
    padding: 24px clamp(22px, 5vw, 76px) 28px;
    gap: clamp(22px, 3vw, 52px);
  }

  .launch-bay-editor {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: clamp(4px, 1vw, 14px) 0;
  }

  .launch-bay-editor-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }

  .launch-bay-kicker {
    margin: 0 0 10px;
    color: rgba(7, 26, 56, 0.42);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .launch-bay-editor h1 {
    margin: 0;
    color: #071a38;
    font-size: clamp(48px, 5.5vw, 78px);
    line-height: 0.86;
    letter-spacing: -0.075em;
    font-weight: 950;
    text-transform: uppercase;
  }

  .launch-bay-step {
    color: rgba(7, 26, 56, 0.28);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.16em;
  }

  .launch-bay-copy {
    max-width: 420px;
    margin: 21px 0 22px;
    color: rgba(7, 26, 56, 0.52);
    font-size: 13px;
    line-height: 1.6;
  }

  .launch-bay-faces {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .launch-bay-face {
    min-width: 64px;
    padding: 9px 11px;
    border: 1px solid rgba(7, 26, 56, 0.1);
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.54);
    color: rgba(7, 26, 56, 0.48);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.13em;
    transition:
      color 150ms ease,
      background 150ms ease,
      border-color 150ms ease,
      transform 150ms ease;
  }

  .launch-bay-face:hover {
    transform: translateY(-2px);
    border-color: rgba(197, 139, 60, 0.45);
  }

  .launch-bay-face.is-active {
    border-color: #0a2850;
    background: #0a2850;
    color: #ffffff;
  }

  .launch-bay-face.is-done:not(.is-active) {
    border-color: rgba(52, 111, 83, 0.28);
    background: rgba(52, 111, 83, 0.08);
    color: #356d52;
  }

  .launch-bay-check {
    font-size: 10px;
  }

  .launch-bay-editor-body {
    min-height: 0;
    flex: 1;
    overflow: hidden;
    border-top: 1px solid rgba(7, 26, 56, 0.08);
    padding-top: 14px;
  }

  .launch-bay-editor-loading {
    min-height: 120px;
    display: flex;
    align-items: center;
    gap: 9px;
    color: rgba(7, 26, 56, 0.4);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.17em;
    text-transform: uppercase;
  }

  .launch-bay-loading-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #c58b3c;
    animation: launchBayPulse 900ms ease-in-out infinite alternate;
  }

  @keyframes launchBayPulse {
    from { opacity: 0.35; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  .launch-bay-footer {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 15px;
    color: rgba(7, 26, 56, 0.28);
    font-size: 8px;
    font-weight: 850;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .launch-bay-footer-dot {
    width: 5px;
    height: 5px;
    box-shadow: none;
  }

  .launch-bay-preview {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .launch-bay-preview-top {
    min-height: 52px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 5px 2px 13px;
  }

  .launch-bay-preview-title {
    display: block;
    color: #071a38;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .launch-bay-destination {
    margin-top: 17px;
    color: rgba(7, 26, 56, 0.26);
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .launch-bay-viewport {
    position: relative;
    min-height: 0;
    flex: 1;
    overflow: hidden;
    border: 1px solid rgba(7, 26, 56, 0.09);
    border-radius: 5px;
    background: #edf2f5;
    box-shadow:
      0 24px 60px rgba(7, 26, 56, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.48);
  }

  .launch-bay-viewport-label {
    position: absolute;
    z-index: 4;
    left: 17px;
    right: 17px;
    bottom: 14px;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    color: rgba(7, 26, 56, 0.3);
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.18em;
  }

  .launch-bay-takeoff {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-top: 13px;
  }

  .launch-bay-readiness {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .launch-bay-readiness-dot {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #b8bec5;
  }

  .launch-bay-readiness-dot.is-ready {
    background: #c58b3c;
    box-shadow: 0 0 0 4px rgba(197, 139, 60, 0.1);
  }

  .launch-bay-readiness strong,
  .launch-bay-readiness span {
    display: block;
  }

  .launch-bay-readiness strong {
    color: #071a38;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .launch-bay-readiness div > span {
    margin-top: 3px;
    color: rgba(7, 26, 56, 0.34);
    font-size: 8px;
  }

  .launch-bay-takeoff-button {
    min-width: 185px;
    padding: 15px 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border: 0;
    border-radius: 3px;
    background: #dfe4e8;
    color: rgba(7, 26, 56, 0.3);
    font-size: 10px;
    font-weight: 950;
    letter-spacing: 0.16em;
    cursor: not-allowed;
    transition:
      transform 150ms ease,
      background 150ms ease;
  }

  .launch-bay-takeoff-button.is-ready {
    background: #0a2850;
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 12px 25px rgba(7, 26, 56, 0.14);
  }

  .launch-bay-takeoff-button.is-ready:hover {
    transform: translateY(-2px);
    background: #123b6b;
  }

  .launch-bay-arrow {
    color: #d8a35c;
    font-size: 16px;
  }

  @media (max-width: 1050px) {
    .launch-bay-layout {
      grid-template-columns: 1fr;
      height: auto;
      min-height: calc(100svh - 78px);
      overflow: auto;
    }

    .launch-bay-editor {
      min-height: 430px;
    }

    .launch-bay-preview {
      min-height: 650px;
    }

    .launch-bay-viewport {
      min-height: 500px;
    }
  }

  @media (max-width: 650px) {
    .launch-bay-header {
      height: 67px;
      padding: 0 22px;
    }

    .launch-bay-hud {
      display: none;
    }

    .launch-bay-layout {
      padding: 22px 22px 30px;
      gap: 30px;
    }

    .launch-bay-editor {
      min-height: 440px;
    }

    .launch-bay-editor h1 {
      font-size: 52px;
    }

    .launch-bay-copy {
      font-size: 12px;
      margin-top: 17px;
    }

    .launch-bay-preview {
      min-height: 560px;
    }

    .launch-bay-preview-top {
      padding-top: 0;
    }

    .launch-bay-destination {
      display: none;
    }

    .launch-bay-viewport {
      min-height: 410px;
    }

    .launch-bay-takeoff {
      align-items: stretch;
      flex-direction: column;
    }

    .launch-bay-takeoff-button {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .launch-bay-loading-dot,
    .launch-bay-face,
    .launch-bay-takeoff-button {
      animation: none;
      transition: none;
    }
  }
`;
