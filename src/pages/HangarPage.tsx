import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
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

import LiveryEditor from '../components/LiveryEditor';
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

const FLAG_FALLBACK = '/templates/plane-flag.svg';

// ============================================================
// FLAG MATERIAL
// ONLY REMAINING LIVERY WRAPPER
// ============================================================

function FlagSkin({
  url,
}: {
  url: string | null;
}) {
  const map = useTexture(url ?? FLAG_FALLBACK);

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
        castShadow
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
        castShadow
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

  const { scene, animations } = useGLTF('/pilot-out.glb');

  const man = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);

    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.frustumCulled = false;
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

  useFrame((_, delta) => mixer?.update(delta));

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
        <meshPhysicalMaterial
          color="#9ec2d2"
          transmission={0.86}
          transparent
          opacity={0.30}
          roughness={0.06}
          metalness={0.05}
          thickness={0.08}
          ior={1.45}
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
    new THREE.BufferAttribute(
      vertices,
      3
    )
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

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

  useFrame((_, delta) => {
    if (propellerRef.current) {
      propellerRef.current.rotation.x +=
        delta * 8;
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
}: {
  livery: string | null;
}) {
  return (
    <group
      position={[-1.08, 0.30, 0]}
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
        position={[0.005, 0, 0.018]}
        renderOrder={3}
      >
        <planeGeometry
          args={[0.30, 0.50]}
        />

        <FlagSkin
          url={livery}
        />
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
        livery={liveries.flag}
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
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 0.85fr',
        height: 'calc(100vh - 52px)',
        overflow: 'hidden',
      }}
    >
      {/* ==================================================
          LEFT: LIVERY EDITOR
         ================================================== */}

      <section
        style={{
          padding: 16,
          borderRight: '1px solid #2a1638',
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            color: '#c9b8e0',
            letterSpacing: '0.06em',
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          Stamp every panel. No half-done birds leave this hangar.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 12,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {FACES.map((face) => (
            <button
              key={face}
              type="button"
              onClick={() => setActiveFace(face)}
              style={{
                padding: '8px 14px',
                border: 0,
                cursor: 'pointer',
                letterSpacing: '0.12em',
                background:
                  activeFace === face
                    ? '#ff2bd6'
                    : liveries[face]
                      ? '#1e4a3a'
                      : '#2b1c3d',
                color:
                  activeFace === face
                    ? '#12081c'
                    : '#f4f0ff',
              }}
            >
              {face.toUpperCase()}
              {liveries[face] ? ' ✓' : ''}
            </button>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <LiveryEditor />
        </div>
      </section>

      {/* ==================================================
          RIGHT: 3D AIRCRAFT PREVIEW
         ================================================== */}

      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Takeoff button */}
        <button
          type="button"
          onClick={() => {
            if (painted) {
              go('/fly');
            }
          }}
          disabled={!painted}
          style={{
            margin: 12,
            padding: '16px 20px',
            border: 0,
            flexShrink: 0,
            background:
              painted
                ? '#ffe600'
                : '#3a3044',
            color:
              painted
                ? '#12081c'
                : '#8a7a98',
            letterSpacing: '0.18em',
            fontWeight: 800,
            fontSize: painted ? 18 : 13,
            cursor:
              painted
                ? 'pointer'
                : 'not-allowed',
            boxShadow:
              painted
                ? '0 0 0 3px #ff2bd6'
                : 'none',
          }}
        >
          {painted
            ? 'TAKE OFF'
            : "WE CAN'T TAKE OFF WITHOUT A CAMOUFLAGE, YOU DAWG."}
        </button>

        {/* 3D viewport */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: '#87CEEB',
          }}
        >
          <Canvas
            shadows
            dpr={[1, 1.25]}
            frameloop="always"
            gl={{
              antialias: true,
              powerPreference: 'high-performance',
              alpha: false,
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
            {/* Sky */}
            <color
              attach="background"
              args={['#87CEEB']}
            />

            {/* ==================================================
                LIGHTING
               ================================================== */}

            <ambientLight
              intensity={0.65}
            />

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

            {/* ==================================================
                WORLD + PLANE
               ================================================== */}

            <Suspense fallback={null}>
              <Road />

              {/* Plane stays completely independent */}
              <Plane
                liveries={liveries}
              />

              {/* Pilot is completely independent and stands
                  on the grass shoulder beside the road */}
<HangarMan position={[1.5, 0, 1.1]} /></Suspense>

            {/* ==================================================
                CAMERA CONTROL
               ================================================== */}

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
        </div>
      </aside>
    </main>
  );
}
