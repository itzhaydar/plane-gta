import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox, useTexture, OrbitControls } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { usePlaneStore, type Face } from '../store';

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


function Seat({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
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

      <Seat
        position={[0.08, -0.08, 0.19]}
      />

      <Seat
        position={[0.08, -0.08, -0.19]}
      />

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
      0.24, 0.03, 0,
      -0.35, 0.03, s * 0.65,
      -1.05, 0.07, s * 1.35,
      -1.45, 0.13, s * 1.78,

      0.24, -0.04, 0,
      -0.35, -0.04, s * 0.65,
      -1.05, 0.00, s * 1.35,
      -1.45, 0.06, s * 1.78,
    ]);

    const indices = [
      0, 1, 2,
      0, 2, 3,

      4, 6, 5,
      4, 7, 6,

      0, 4, 5,
      0, 5, 1,

      1, 5, 6,
      1, 6, 2,

      2, 6, 7,
      2, 7, 3,

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

      <group ref={propellerRef}>
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

      <mesh
        position={[0.005, 0, side * 0.018]}
        rotation={[0, side === 1 ? 0 : Math.PI, 0]}
        renderOrder={3}
      >
        <planeGeometry args={[0.30, 0.50]} />
<FlagSkin
  url={livery}
  fallback={side === 1 ? '/templates/flag-right.svg' : '/templates/flag-left.svg'}
/>      </mesh>
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

      <Wing side={1} />
      <Wing side={-1} />

      <Cockpit />

      <Propeller />

      <Tail />

      <LandingGear />

<FlagPanel
  livery={liveries['flag-left']}
  side={-1}
/>

<FlagPanel
  livery={liveries['flag-right']}
  side={1}
/>
    </group>
  );
}




const CRUISE_SPEED = 235;
const ROUTE_END_Z = -720;
const LANDING_STOP_Z = ROUTE_END_Z + 42;
const DESTINATION_NAME = 'PORT GELLHORN';
const CHARACTER_START = new THREE.Vector3(0, 0, 0);

const START_NAME = 'VICE CITY';

type FlightPhase =
  | 'outside'
  | 'parked'
  | 'takeoff'
  | 'climb'
  | 'cruise'
  | 'approach'
  | 'landing'
  | 'landed'
  | 'stopped'
  | 'exited';

type Telemetry = {
  speed: number;
  altitude: number;
  distance: number;
  progress: number;
};

type Gender = 'man' | 'woman';

function CityBuilding({
  x,
  z,
  rotationY = 0,
  label = '',
  variant = 0,
  scale = 1,
}: {
  x: number;
  z: number;
  rotationY?: number;
  label?: string;
  variant?: number;
  scale?: number;
}) {
  const styles = [
    { wall: '#f1eee7', trim: '#d3a34f', dark: '#111c33', height: 8.2, width: 10.8, depth: 5.8, window: '#f5f1e8' },
    { wall: '#102848', trim: '#f4f0e8', dark: '#07162b', height: 11.0, width: 10.4, depth: 5.6, window: '#f0e7d2' },
    { wall: '#e7e3db', trim: '#d3a34f', dark: '#13213a', height: 9.6, width: 11.2, depth: 6.0, window: '#fff4d5' },
    { wall: '#b9c8c8', trim: '#f0c778', dark: '#102334', height: 7.4, width: 9.5, depth: 5.4, window: '#f5ead0' },
    { wall: '#d8b8a5', trim: '#8f493e', dark: '#17233b', height: 8.8, width: 10.2, depth: 5.9, window: '#f6e3c5' },
    { wall: '#c9c0d7', trim: '#d3a34f', dark: '#0c1c35', height: 10.3, width: 9.8, depth: 5.7, window: '#f4e8ce' },
  ];
  const st = styles[variant % styles.length];
  const floors = Math.max(2, Math.floor((st.height - 2.6) / 1.65));
  const windowRows = Array.from({ length: floors }, (_, i) => 3.25 + i * 1.55).filter((y) => y < st.height - 0.65);
  const frontZ = st.depth / 2 + 0.055;

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, st.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[st.width, st.height, st.depth]} />
        <meshStandardMaterial color={st.wall} roughness={0.75} />
      </mesh>

      <mesh position={[0, st.height + 0.18, 0]} castShadow>
        <boxGeometry args={[st.width + 0.55, 0.36, st.depth + 0.5]} />
        <meshStandardMaterial color={st.dark} metalness={0.25} roughness={0.58} />
      </mesh>

      {[-0.42, 0.42].map((ratio) => (
        <mesh key={ratio} position={[st.width * ratio, st.height / 2, frontZ]}>
          <boxGeometry args={[0.14, st.height - 0.5, 0.16]} />
          <meshStandardMaterial color={st.trim} emissive={st.trim} emissiveIntensity={0.24} />
        </mesh>
      ))}

      {windowRows.map((y, row) =>
        [-0.30, -0.10, 0.10, 0.30].map((ratio, col) => (
          <mesh key={`${row}-${col}`} position={[st.width * ratio, y, frontZ + 0.02]}>
            <boxGeometry args={[1.05, 0.92, 0.08]} />
            <meshStandardMaterial
              color={st.window}
              emissive={row % 2 === col % 2 ? '#d3a34f' : '#f4f0e8'}
              emissiveIntensity={0.34 + ((row + col) % 3) * 0.10}
              roughness={0.45}
            />
          </mesh>
        )),
      )}

      <mesh position={[0, 1.12, frontZ + 0.07]} castShadow>
        <boxGeometry args={[2.05, 2.24, 0.16]} />
        <meshStandardMaterial color={st.dark} metalness={0.52} roughness={0.26} />
      </mesh>
      <mesh position={[0, 1.14, frontZ + 0.18]}>
        <boxGeometry args={[1.68, 1.88, 0.06]} />
        <meshStandardMaterial color="#c7d4da" emissive={st.trim} emissiveIntensity={0.18} roughness={0.22} />
      </mesh>
      <mesh position={[0, 2.62, frontZ + 0.43]} castShadow>
        <boxGeometry args={[4.2, 0.22, 1.25]} />
        <meshStandardMaterial color={st.dark} roughness={0.7} />
      </mesh>

      <mesh position={[0, st.height - 0.62, frontZ + 0.08]}>
        <boxGeometry args={[st.width * 0.78, 0.82, 0.14]} />
        <meshStandardMaterial color={st.dark} roughness={0.72} />
      </mesh>

      {variant % 3 === 0 && (
        <>
          <mesh position={[-st.width * 0.28, st.height + 0.65, 0]} castShadow>
            <boxGeometry args={[1.45, 0.95, 1.3]} />
            <meshStandardMaterial color={st.dark} roughness={0.68} />
          </mesh>
          <mesh position={[st.width * 0.25, st.height + 0.46, 0]} castShadow>
            <boxGeometry args={[2.1, 0.55, 1.6]} />
            <meshStandardMaterial color={st.trim} roughness={0.72} />
          </mesh>
        </>
      )}

      {variant % 3 === 1 && (
        <>
          <mesh position={[-st.width * 0.34, st.height * 0.53, frontZ + 0.28]} castShadow>
            <boxGeometry args={[1.35, st.height * 0.72, 0.42]} />
            <meshStandardMaterial color={st.dark} roughness={0.68} />
          </mesh>
          <mesh position={[st.width * 0.34, st.height * 0.53, frontZ + 0.28]} castShadow>
            <boxGeometry args={[1.35, st.height * 0.72, 0.42]} />
            <meshStandardMaterial color={st.dark} roughness={0.68} />
          </mesh>
        </>
      )}

      {variant % 3 === 2 && (
        <>
          <mesh position={[0, st.height + 0.58, 0]} castShadow>
            <cylinderGeometry args={[1.25, 1.45, 0.78, 8]} />
            <meshStandardMaterial color={st.dark} roughness={0.64} />
          </mesh>
          <mesh position={[0, st.height + 1.18, 0]}>
            <sphereGeometry args={[0.22, 12, 8]} />
            <meshStandardMaterial color={st.trim} emissive={st.trim} emissiveIntensity={1.1} />
          </mesh>
        </>
      )}

      <pointLight position={[0, 2.8, frontZ + 1.0]} intensity={2.8} distance={8} color={st.trim} />

      {label && (
        <Html position={[0, st.height + 1.5, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
          <div className="city-world-label">{label}</div>
        </Html>
      )}
    </group>
  );
}

function CityPalm({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 2.25, 0]} rotation={[0, 0, -0.06]} castShadow>
        <cylinderGeometry args={[0.12, 0.24, 4.5, 9]} />
        <meshStandardMaterial color="#6d5944" roughness={0.9} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 4.45, 0]} rotation={[0.1, (i * Math.PI * 2) / 8, 0.72]}>
          <coneGeometry args={[0.34, 3.3, 5]} />
          <meshStandardMaterial color={i % 2 ? '#173b35' : '#244b40'} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

type CityLook = { skin: string; top: string; bottom: string; hair: string; accent: string };

function CityHomie({
  position,
  look,
  female = false,
  rotationY = 0,
  phaseOffset = 0,
  direction = 1,
  speed = 0.50,
  range = 18,
}: {
  position: [number, number, number];
  look: CityLook;
  female?: boolean;
  rotationY?: number;
  phaseOffset?: number;
  direction?: 1 | -1;
  speed?: number;
  range?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const g = ref.current;
    if (!g) return;

    // Same boulevard behavior as the landing page: these homies actually
    // walk past the scene instead of standing in place and only swinging limbs.
    g.position.z += direction * speed * Math.min(delta, 0.05) * 2.4;
    const minZ = position[2] - range;
    const maxZ = position[2] + range;
    if (direction > 0 && g.position.z > maxZ) g.position.z = minZ;
    if (direction < 0 && g.position.z < minZ) g.position.z = maxZ;

    // Face the direction of travel along the sidewalk.
    g.rotation.y = direction > 0 ? 0 : Math.PI;

    const t = clock.elapsedTime * 8.2 + phaseOffset;
    const swing = Math.sin(t) * 0.52;
    const bob = Math.abs(Math.sin(t)) * 0.025;
    if (torso.current) torso.current.position.y = bob;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.72;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.72;
  });

  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]} scale={0.50}>
      <group ref={torso}>
        <mesh position={[0, 1.48, 0]} castShadow>
          <boxGeometry args={[female ? 0.64 : 0.70, 0.86, female ? 0.36 : 0.38]} />
          <meshStandardMaterial color={look.top} roughness={0.84} />
        </mesh>
        <mesh position={[0, 1.49, 0.205]}>
          <boxGeometry args={[0.10, 0.78, 0.025]} />
          <meshStandardMaterial color={look.accent} />
        </mesh>
        <mesh position={[0, 1.98, 0]} castShadow>
          <boxGeometry args={[0.20, 0.20, 0.20]} />
          <meshStandardMaterial color={look.skin} />
        </mesh>
        <mesh position={[0, 2.27, 0]} castShadow>
          <boxGeometry args={[0.48, 0.47, 0.42]} />
          <meshStandardMaterial color={look.skin} roughness={0.9} />
        </mesh>

        {female ? (
          <>
            <mesh position={[0, 2.51, -0.035]} castShadow><boxGeometry args={[0.51, 0.15, 0.43]} /><meshStandardMaterial color={look.hair} /></mesh>
            <mesh position={[-0.21, 2.30, -0.08]} castShadow><boxGeometry args={[0.11, 0.48, 0.24]} /><meshStandardMaterial color={look.hair} /></mesh>
            <mesh position={[0.21, 2.30, -0.08]} castShadow><boxGeometry args={[0.11, 0.48, 0.24]} /><meshStandardMaterial color={look.hair} /></mesh>
            <mesh position={[0, 2.18, -0.20]} castShadow><boxGeometry args={[0.34, 0.36, 0.12]} /><meshStandardMaterial color={look.hair} /></mesh>
          </>
        ) : (
          <>
            <mesh position={[0, 2.53, -0.01]} castShadow><boxGeometry args={[0.49, 0.13, 0.42]} /><meshStandardMaterial color={look.hair} /></mesh>
            {[-0.15, -0.05, 0.05, 0.15].map((x, i) => (
              <mesh key={x} position={[x, 2.595 + (i % 2) * 0.012, 0.015]}>
                <boxGeometry args={[0.085, 0.065, 0.085]} />
                <meshStandardMaterial color={look.hair} />
              </mesh>
            ))}
          </>
        )}

        {[-0.10, 0.10].map((x) => (
          <mesh key={x} position={[x, 2.31, 0.219]}>
            <boxGeometry args={[0.04, 0.024, 0.016]} />
            <meshStandardMaterial color="#171719" />
          </mesh>
        ))}
        <mesh position={[0, 2.245, 0.23]}><boxGeometry args={[0.065, 0.09, 0.05]} /><meshStandardMaterial color={look.skin} /></mesh>
        <mesh position={[0, 2.16, 0.219]}><boxGeometry args={[0.17, 0.03, 0.016]} /><meshStandardMaterial color="#633f32" /></mesh>
      </group>

      <group ref={leftArm} position={[-0.43, 1.70, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow><capsuleGeometry args={[0.095, 0.53, 6, 10]} /><meshStandardMaterial color={look.skin} /></mesh>
        <mesh position={[0, -0.65, 0.02]}><boxGeometry args={[0.17, 0.19, 0.17]} /><meshStandardMaterial color={look.skin} /></mesh>
      </group>
      <group ref={rightArm} position={[0.43, 1.70, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow><capsuleGeometry args={[0.095, 0.53, 6, 10]} /><meshStandardMaterial color={look.skin} /></mesh>
        <mesh position={[0, -0.65, 0.02]}><boxGeometry args={[0.17, 0.19, 0.17]} /><meshStandardMaterial color={look.skin} /></mesh>
      </group>
      <group ref={leftLeg} position={[female ? -0.14 : -0.16, 1.05, 0]}>
        <mesh position={[0, -0.46, 0]} castShadow><capsuleGeometry args={[0.12, 0.69, 6, 10]} /><meshStandardMaterial color={look.bottom} /></mesh>
        <mesh position={[0, -0.90, 0.10]}><boxGeometry args={[0.26, 0.16, 0.45]} /><meshStandardMaterial color="#17181c" /></mesh>
      </group>
      <group ref={rightLeg} position={[female ? 0.14 : 0.16, 1.05, 0]}>
        <mesh position={[0, -0.46, 0]} castShadow><capsuleGeometry args={[0.12, 0.69, 6, 10]} /><meshStandardMaterial color={look.bottom} /></mesh>
        <mesh position={[0, -0.90, 0.10]}><boxGeometry args={[0.26, 0.16, 0.45]} /><meshStandardMaterial color="#17181c" /></mesh>
      </group>
    </group>
  );
}

function Boulevard({ z, length = 116 }: { z: number; length?: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[15.5, length]} />
        <meshStandardMaterial color="#080b10" roughness={0.98} />
      </mesh>

      {[-7.1, 7.1].map((x) => (
        <mesh key={`edge-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.026, 0]}>
          <planeGeometry args={[0.10, length]} />
          <meshBasicMaterial color="#d3a34f" />
        </mesh>
      ))}

      {Array.from({ length: Math.floor(length / 7) }, (_, i) => -length / 2 + 3.5 + i * 7).map((dz) => (
        <mesh key={dz} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, dz]}>
          <planeGeometry args={[0.16, 2.4]} />
          <meshBasicMaterial color="#f4f0e8" />
        </mesh>
      ))}

      {[-10.4, 10.4].map((x) => (
        <mesh key={`walk-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.018, 0]} receiveShadow>
          <planeGeometry args={[5.0, length]} />
          <meshStandardMaterial color="#d9d4ca" roughness={1} />
        </mesh>
      ))}

      {[-7.85, 7.85].map((x) => (
        <mesh key={`curb-${x}`} position={[x, 0.12, 0]} receiveShadow>
          <boxGeometry args={[0.34, 0.24, length]} />
          <meshStandardMaterial color="#bdb8ae" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function CityBlock({ arrival = false }: { arrival?: boolean }) {
  const centerZ = arrival ? ROUTE_END_Z + 42 : 65;
  const name = arrival ? DESTINATION_NAME : START_NAME;
  const buildingOffsets = [-42, -27, -12, 4, 20, 36];
  const looks: CityLook[] = [
    { skin: '#70472f', top: '#d9c7a5', bottom: '#3b4558', hair: '#111317', accent: '#9b5a42' },
    { skin: '#a96f52', top: '#a94f58', bottom: '#34394b', hair: '#251914', accent: '#e2bf77' },
    { skin: '#5f3d2c', top: '#627550', bottom: '#293a50', hair: '#0e1014', accent: '#d7b26a' },
    { skin: '#c88767', top: '#4d7180', bottom: '#6c5146', hair: '#2c1b17', accent: '#e7d2a6' },
    { skin: '#8a5b42', top: '#c48a52', bottom: '#283548', hair: '#181311', accent: '#f0d59a' },
    { skin: '#5b3b2d', top: '#7a5579', bottom: '#303a46', hair: '#111317', accent: '#d6ad63' },
    { skin: '#b77958', top: '#315f68', bottom: '#493c3a', hair: '#2b1b18', accent: '#e9c37b' },
    { skin: '#6f4935', top: '#9a4f45', bottom: '#27384b', hair: '#171514', accent: '#d9c7a5' },
  ];

  return (
    <group>
      <Boulevard z={centerZ} />

      {buildingOffsets.map((offset, i) => (
        <CityBuilding
          key={`left-${offset}`}
          x={-17.2 - (i % 2) * 1.0}
          z={centerZ + offset}
          rotationY={Math.PI / 2}
          variant={i}
          scale={0.78 + (i % 3) * 0.05}
        />
      ))}

      {buildingOffsets.map((offset, i) => (
        <CityBuilding
          key={`right-${offset}`}
          x={17.2 + ((i + 1) % 2) * 1.0}
          z={centerZ + offset + 5}
          rotationY={-Math.PI / 2}
          variant={i + 2}
          scale={0.78 + ((i + 1) % 3) * 0.05}
        />
      ))}

      <Html position={[0, 9.2, centerZ - 8]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
        <div className="city-world-label">{name}</div>
      </Html>

      {[-1, 1].flatMap((side) =>
        [-34, -18, -2, 15, 31].map((offset, i) => (
          <CityPalm
            key={`p-${side}-${offset}`}
            x={side * (13.4 + (i % 2) * 0.6)}
            z={centerZ + offset}
            s={0.70 + (i % 3) * 0.06}
          />
        )),
      )}

      <CityHomie position={[-9.5, 0, centerZ + 8]} look={looks[0]} direction={1} speed={0.50} range={34} phaseOffset={0.3} />
      <CityHomie position={[-11.1, 0, centerZ - 3]} look={looks[1]} female direction={1} speed={0.46} range={34} phaseOffset={1.8} />
      <CityHomie position={[-9.1, 0, centerZ - 19]} look={looks[2]} direction={1} speed={0.54} range={34} phaseOffset={3.1} />
      <CityHomie position={[-10.7, 0, centerZ + 26]} look={looks[3]} female direction={1} speed={0.43} range={34} phaseOffset={4.4} />
      <CityHomie position={[9.7, 0, centerZ + 13]} look={looks[4]} direction={-1} speed={0.51} range={34} phaseOffset={2.3} />
      <CityHomie position={[10.8, 0, centerZ - 8]} look={looks[5]} female direction={-1} speed={0.47} range={34} phaseOffset={3.7} />
      <CityHomie position={[9.3, 0, centerZ - 26]} look={looks[6]} female direction={-1} speed={0.44} range={34} phaseOffset={5.1} />
      <CityHomie position={[11.0, 0, centerZ + 31]} look={looks[7]} direction={-1} speed={0.55} range={34} phaseOffset={6.2} />
    </group>
  );
}

function Runway({ z, length = 250 }: { z: number; length?: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, length + 42]} />
        <meshStandardMaterial color="#071427" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[8.6, length]} />
        <meshStandardMaterial color="#111b2b" roughness={0.98} />
      </mesh>
      {[-4.0, 4.0].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, 0]}>
          <planeGeometry args={[0.09, length]} />
          <meshBasicMaterial color="#d3a34f" />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(length / 7) }, (_, i) => -length / 2 + 4 + i * 7).map((v) => (
        <mesh key={v} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, v]}>
          <planeGeometry args={[0.18, 2.35]} />
          <meshBasicMaterial color="#f7f2e7" />
        </mesh>
      ))}
    </group>
  );
}

function WorldEnvironment() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -330]} receiveShadow>
        <planeGeometry args={[280, 1180]} />
        <meshStandardMaterial color="#071427" roughness={1} />
      </mesh>

      {/* Open runway between the two cities. The city ends themselves are proper boulevards. */}
      <Runway z={-310} length={560} />
      <CityBlock />
      <CityBlock arrival />
    </group>
  );
}

function HighClouds() {
  const clouds = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        x: (i % 2 ? 1 : -1) * (10 + (i % 6) * 5.5),
        y: 20 + (i % 5) * 2,
        z: -120 - i * 14,
        s: 1.5 + (i % 4) * 0.4,
      })),
    [],
  );

  return (
    <group>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {[
            [-0.9, 0, 0],
            [0, 0.22, 0],
            [0.9, 0, 0],
            [0.2, -0.08, 0.55],
            [-0.35, 0.05, -0.45],
          ].map((q, j) => (
            <mesh key={j} position={q as [number, number, number]}>
              <sphereGeometry args={[1.2, 10, 8]} />
              <meshStandardMaterial color="#fff" transparent opacity={0.72} roughness={1} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function FlyMalePlayer({ position }: { position: MutableRefObject<THREE.Vector3> }) {
  const group = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.copy(position.current);
    group.current.rotation.set(0, Math.PI, 0);
  });

  const skin = '#b47a52';
  const hair = '#241b16';
  const stubble = '#8a5f42';
  const olive = '#0b274b';
  const vest = '#f5f2eb';
  const gold = '#d3a34f';
  const denim = '#071a38';
  const shoes = '#10151d';

  return (
    <group ref={group} position={CHARACTER_START.toArray()} scale={0.58}>
      <group ref={torso}>
        {/* Smooth blocky torso: pale vest under an open olive sleeveless shirt */}
        <mesh position={[0, 1.48, 0]} castShadow>
          <boxGeometry args={[0.76, 0.92, 0.40]} />
          <meshStandardMaterial color={vest} roughness={0.8} />
        </mesh>

        {/* open olive shirt panels */}
        <mesh position={[-0.265, 1.49, 0.222]} castShadow>
          <boxGeometry args={[0.23, 0.90, 0.055]} />
          <meshStandardMaterial color={olive} roughness={0.84} />
        </mesh>
        <mesh position={[0.265, 1.49, 0.222]} castShadow>
          <boxGeometry args={[0.23, 0.90, 0.055]} />
          <meshStandardMaterial color={olive} roughness={0.84} />
        </mesh>
        <mesh position={[-0.33, 1.52, -0.02]} rotation={[0,0,-0.05]} castShadow>
          <boxGeometry args={[0.17, 0.88, 0.43]} />
          <meshStandardMaterial color={olive} roughness={0.84} />
        </mesh>
        <mesh position={[0.33, 1.52, -0.02]} rotation={[0,0,0.05]} castShadow>
          <boxGeometry args={[0.17, 0.88, 0.43]} />
          <meshStandardMaterial color={olive} roughness={0.84} />
        </mesh>

        {/* blocky neck + rounded/blocky head */}
        <mesh position={[0, 2.00, 0]} castShadow>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.28, 0]} castShadow>
          <boxGeometry args={[0.50, 0.48, 0.44]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>

        {/* cropped dark hair, clean silhouette */}
        <mesh position={[0, 2.55, -0.01]} castShadow>
          <boxGeometry args={[0.51, 0.13, 0.43]} />
          <meshStandardMaterial color={hair} roughness={1} />
        </mesh>
        {[-0.18,-0.06,0.06,0.18].map((x, i) => (
          <mesh key={x} position={[x, 2.62 + (i % 2) * .015, 0.02]}>
            <boxGeometry args={[0.10, 0.08, 0.10]} />
            <meshStandardMaterial color={hair} roughness={1} />
          </mesh>
        ))}

        {/* simple face: brows, eyes, nose, stubble; no glasses */}
        {[-0.105,0.105].map((x) => <mesh key={`b${x}`} position={[x,2.36,0.229]}><boxGeometry args={[0.105,.025,.018]} /><meshStandardMaterial color={hair} /></mesh>)}
        {[-0.105,0.105].map((x) => <mesh key={`e${x}`} position={[x,2.32,0.233]}><boxGeometry args={[0.045,.025,.018]} /><meshStandardMaterial color="#171719" /></mesh>)}
        <mesh position={[0,2.25,0.245]}><boxGeometry args={[0.07,.10,.06]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0,2.13,0.229]}><boxGeometry args={[0.31,.11,.022]} /><meshStandardMaterial color={stubble} roughness={1} /></mesh>
        <mesh position={[0,2.20,0.237]}><boxGeometry args={[0.18,.035,.018]} /><meshStandardMaterial color="#633f32" /></mesh>

        {/* thin gold chain */}
        <mesh position={[0,1.91,0.226]} rotation={[Math.PI/2,0,0]}>
          <torusGeometry args={[0.15,0.012,6,22,Math.PI]} />
          <meshStandardMaterial color={gold} metalness={0.9} roughness={0.22} />
        </mesh>
      </group>

      {/* bare arms from cut-off sleeves */}
      <group ref={leftArm} position={[-0.47,1.73,0]}>
        <mesh position={[0,-0.31,0]} castShadow><capsuleGeometry args={[0.105,0.55,6,10]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
        <mesh position={[0,-0.66,0.02]}><boxGeometry args={[0.18,.20,.18]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      <group ref={rightArm} position={[0.47,1.73,0]}>
        <mesh position={[0,-0.31,0]} castShadow><capsuleGeometry args={[0.105,0.55,6,10]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
        <mesh position={[0,-0.66,0.02]}><boxGeometry args={[0.18,.20,.18]} /><meshStandardMaterial color={skin} /></mesh>
      </group>

      {/* dark denim + black shoes */}
      <group ref={leftLeg} position={[-0.18,1.06,0]}>
        <mesh position={[0,-0.47,0]} castShadow><capsuleGeometry args={[0.13,0.72,6,10]} /><meshStandardMaterial color={denim} roughness={0.9} /></mesh>
        <mesh position={[0,-0.93,0.10]}><boxGeometry args={[0.28,.17,.48]} /><meshStandardMaterial color={shoes} roughness={0.88} /></mesh>
      </group>
      <group ref={rightLeg} position={[0.18,1.06,0]}>
        <mesh position={[0,-0.47,0]} castShadow><capsuleGeometry args={[0.13,0.72,6,10]} /><meshStandardMaterial color={denim} roughness={0.9} /></mesh>
        <mesh position={[0,-0.93,0.10]}><boxGeometry args={[0.28,.17,.48]} /><meshStandardMaterial color={shoes} roughness={0.88} /></mesh>
      </group>
    </group>
  );
}


function FlyFemalePlayer({ position }: { position: MutableRefObject<THREE.Vector3> }) {
  const group = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.copy(position.current);
    group.current.rotation.set(0, Math.PI, 0);
  });

  const skin = '#a96f52';
  const hair = '#241914';
  const navy = '#0b274b';
  const cream = '#f5f2eb';
  const gold = '#d3a34f';
  const denim = '#17223a';
  const shoes = '#10151d';

  return (
    <group ref={group} position={CHARACTER_START.toArray()} scale={0.56}>
      <group ref={torso}>
        {/* Female main character: same polished blocky world, clearly different silhouette. */}
        <mesh position={[0, 1.48, 0]} castShadow>
          <boxGeometry args={[0.64, 0.88, 0.36]} />
          <meshStandardMaterial color={cream} roughness={0.8} />
        </mesh>

        {/* Cropped navy jacket panels */}
        <mesh position={[-0.225, 1.55, 0.205]} castShadow>
          <boxGeometry args={[0.19, 0.67, 0.05]} />
          <meshStandardMaterial color={navy} roughness={0.82} />
        </mesh>
        <mesh position={[0.225, 1.55, 0.205]} castShadow>
          <boxGeometry args={[0.19, 0.67, 0.05]} />
          <meshStandardMaterial color={navy} roughness={0.82} />
        </mesh>

        <mesh position={[0, 1.99, 0]} castShadow>
          <boxGeometry args={[0.19, 0.20, 0.19]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>

        <mesh position={[0, 2.28, 0]} castShadow>
          <boxGeometry args={[0.46, 0.47, 0.41]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>

        {/* Long dark hair: side sections + back section, no glasses. */}
        <mesh position={[0, 2.54, -0.025]} castShadow>
          <boxGeometry args={[0.50, 0.14, 0.42]} />
          <meshStandardMaterial color={hair} roughness={1} />
        </mesh>
        <mesh position={[-0.205, 2.28, -0.07]} castShadow>
          <boxGeometry args={[0.11, 0.52, 0.22]} />
          <meshStandardMaterial color={hair} roughness={1} />
        </mesh>
        <mesh position={[0.205, 2.28, -0.07]} castShadow>
          <boxGeometry args={[0.11, 0.52, 0.22]} />
          <meshStandardMaterial color={hair} roughness={1} />
        </mesh>
        <mesh position={[0, 2.18, -0.205]} castShadow>
          <boxGeometry args={[0.35, 0.46, 0.11]} />
          <meshStandardMaterial color={hair} roughness={1} />
        </mesh>

        {/* Face */}
        {[-0.10, 0.10].map((x) => (
          <mesh key={`fe${x}`} position={[x, 2.32, 0.216]}>
            <boxGeometry args={[0.042, 0.024, 0.016]} />
            <meshStandardMaterial color="#171719" />
          </mesh>
        ))}
        <mesh position={[0, 2.25, 0.226]}>
          <boxGeometry args={[0.062, 0.09, 0.048]} />
          <meshStandardMaterial color={skin} />
        </mesh>
        <mesh position={[0, 2.18, 0.216]}>
          <boxGeometry args={[0.15, 0.028, 0.016]} />
          <meshStandardMaterial color="#704238" />
        </mesh>

        {/* MARSHOUT gold chain */}
        <mesh position={[0, 1.91, 0.205]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.011, 6, 22, Math.PI]} />
          <meshStandardMaterial color={gold} metalness={0.9} roughness={0.22} />
        </mesh>
      </group>

      <group ref={leftArm} position={[-0.40, 1.70, 0]}>
        <mesh position={[0, -0.30, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.52, 6, 10]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.64, 0.02]}>
          <boxGeometry args={[0.16, 0.18, 0.16]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>

      <group ref={rightArm} position={[0.40, 1.70, 0]}>
        <mesh position={[0, -0.30, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.52, 6, 10]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.64, 0.02]}>
          <boxGeometry args={[0.16, 0.18, 0.16]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>

      {/* Slimmer dark trousers and low-profile shoes */}
      <group ref={leftLeg} position={[-0.145, 1.05, 0]}>
        <mesh position={[0, -0.46, 0]} castShadow>
          <capsuleGeometry args={[0.115, 0.71, 6, 10]} />
          <meshStandardMaterial color={denim} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.91, 0.10]}>
          <boxGeometry args={[0.25, 0.16, 0.43]} />
          <meshStandardMaterial color={shoes} roughness={0.88} />
        </mesh>
      </group>

      <group ref={rightLeg} position={[0.145, 1.05, 0]}>
        <mesh position={[0, -0.46, 0]} castShadow>
          <capsuleGeometry args={[0.115, 0.71, 6, 10]} />
          <meshStandardMaterial color={denim} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.91, 0.10]}>
          <boxGeometry args={[0.25, 0.16, 0.43]} />
          <meshStandardMaterial color={shoes} roughness={0.88} />
        </mesh>
      </group>
    </group>
  );
}

function GameCharacter({ gender, position }: { gender: Gender; position: THREE.Vector3 }) {
  const staticPosition = useRef(position);
  staticPosition.current.copy(position);
  return gender === 'woman'
    ? <FlyFemalePlayer position={staticPosition} />
    : <FlyMalePlayer position={staticPosition} />;
}

function DestinationBeacon({ distance }: { distance: number }) {
  return (
    <group position={[0, 13, ROUTE_END_Z]}>
      <Html center distanceFactor={16} style={{ pointerEvents: 'none' }}>
        <div className="destination-beacon">
          <span />
          <b>{DESTINATION_NAME}</b>
          <small>{Math.max(0, Math.round(distance))} KM</small>
        </div>
      </Html>
    </group>
  );
}

function FlightWorld({
  phase,
  setPhase,
  onTelemetry,
  gender,
}: {
  phase: FlightPhase;
  setPhase: (p: FlightPhase) => void;
  onTelemetry: (t: Telemetry) => void;
  gender: Gender;
}) {
  const { liveries } = usePlaneStore();
  const aircraft = useRef<THREE.Group>(null);
  const orbit = useRef<any>(null);
  const speed = useRef(0);
  const altitude = useRef(0.72);
  const z = useRef(65);
  const pitch = useRef(0);
  const lastHud = useRef(0);
  const { camera } = useThree();
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.045);
    const dist = Math.max(0, z.current - ROUTE_END_Z);


    if (phase === 'takeoff') {
      speed.current = Math.min(150, speed.current + 30 * d);
      z.current -= Math.max(5, speed.current / 10) * d;
      if (speed.current > 108) {
        altitude.current = Math.min(5, altitude.current + 1.25 * d);
        pitch.current = THREE.MathUtils.lerp(pitch.current, 0.13, d * 2);
      }
      if (altitude.current >= 4.9) setPhase('climb');
    } else if (phase === 'climb') {
      speed.current = Math.min(CRUISE_SPEED, speed.current + 20 * d);
      z.current -= (speed.current / 10) * d;
      altitude.current = Math.min(23, altitude.current + 1.9 * d);
      pitch.current = THREE.MathUtils.lerp(pitch.current, 0.07, d * 2);
      if (altitude.current >= 22.8) setPhase('cruise');
    } else if (phase === 'cruise') {
      speed.current = THREE.MathUtils.lerp(speed.current, CRUISE_SPEED, d);
      z.current -= (speed.current / 10) * d;
      pitch.current = THREE.MathUtils.lerp(pitch.current, 0, d * 2);
      if (dist < 190) setPhase('approach');
    } else if (phase === 'approach') {
      speed.current = THREE.MathUtils.lerp(speed.current, 145, d * 0.7);
      z.current -= (speed.current / 10) * d;
      const target = THREE.MathUtils.mapLinear(
        THREE.MathUtils.clamp(dist, 35, 190),
        35,
        190,
        3.2,
        22,
      );
      altitude.current = THREE.MathUtils.lerp(altitude.current, target, d * 0.85);
      pitch.current = THREE.MathUtils.lerp(pitch.current, -0.045, d * 2);
      if (dist < 45) setPhase('landing');
    } else if (phase === 'landing') {
      // Bring the aircraft onto the actual touchdown point instead of flying
      // past the city and snapping it backwards after the wheels touch.
      const remaining = Math.max(0, z.current - LANDING_STOP_Z);
      const landingSpeed = THREE.MathUtils.mapLinear(
        THREE.MathUtils.clamp(remaining, 0, 45),
        0,
        45,
        18,
        72,
      );

      speed.current = THREE.MathUtils.lerp(speed.current, landingSpeed, d * 1.8);

      const forwardStep = Math.max(2.2, speed.current / 11) * d;
      z.current = Math.max(LANDING_STOP_Z, z.current - forwardStep);

      const altitudeTarget = THREE.MathUtils.mapLinear(
        THREE.MathUtils.clamp(remaining, 0, 45),
        0,
        45,
        0.72,
        3.2,
      );
      altitude.current = THREE.MathUtils.lerp(altitude.current, altitudeTarget, d * 2.8);
      pitch.current = THREE.MathUtils.lerp(
        pitch.current,
        remaining > 10 ? -0.025 : 0,
        d * 2.6,
      );

      if (remaining <= 0.35 && altitude.current <= 0.79) {
        z.current = LANDING_STOP_Z;
        altitude.current = 0.72;
        pitch.current = 0;
        setPhase('landed');
      }
    } else if (phase === 'landed') {
      speed.current = Math.max(0, speed.current - 18 * d);
      z.current -= (speed.current / 13) * d;
      pitch.current = THREE.MathUtils.lerp(pitch.current, 0, d * 3);
      if (speed.current <= 0.5) {
        speed.current = 0;
        setPhase('stopped');
      }
    } else if (phase === 'stopped' || phase === 'exited') {
      speed.current = 0;
    }

    if (aircraft.current) {
      aircraft.current.position.set(0, altitude.current, z.current);
      aircraft.current.rotation.set(pitch.current, 0, 0);
    }

    const onGround = phase === 'outside' || phase === 'exited';
    const arrivalView = ['landed', 'stopped', 'exited'].includes(phase);
    const groundZ = phase === 'exited' ? LANDING_STOP_Z : 65;

    const chase = onGround
      ? new THREE.Vector3(6.9, 3.7, groundZ + 8.8)
      : new THREE.Vector3(
          arrivalView ? 6.8 : 5.8,
          arrivalView ? 3.15 : 3.45,
          z.current + (arrivalView ? 7.6 : 9.2),
        );

    const target = onGround
      ? new THREE.Vector3(0.8, 1.05, groundZ - 0.8)
      : new THREE.Vector3(0, altitude.current + 0.5, z.current - (arrivalView ? 2.4 : 5));

    if (!orbit.current?.__dragging) {
      camera.position.lerp(chase, 1 - Math.pow(0.003, d));
    }

    if (orbit.current) {
      orbit.current.target.lerp(target, 1 - Math.pow(0.002, d));
      orbit.current.update();
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      const speedRatio = THREE.MathUtils.clamp(speed.current / CRUISE_SPEED, 0, 1);
      const targetFov = onGround ? 44 : 40 + speedRatio * 5;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.pow(0.025, d));
      camera.updateProjectionMatrix();
    }

    if (state.clock.elapsedTime - lastHud.current > 0.08) {
      onTelemetry({
        speed: Math.round(speed.current),
        altitude: Math.max(0, Math.round((altitude.current - 0.72) * 120)),
        distance: Math.round(Math.max(0, dist)),
        progress: THREE.MathUtils.clamp(1 - dist / 785, 0, 1),
      });
      lastHud.current = state.clock.elapsedTime;
    }
  });

  return (
    <>
      <color attach="background" args={['#07162b']} />
      <fog attach="fog" args={['#0a1c35', 65, 350]} />
      <ambientLight intensity={0.85} color="#dce4ef" />
      <hemisphereLight intensity={1.05} color="#f6f1e7" groundColor="#071427" />
      <directionalLight position={[-12, 18, 10]} intensity={2.3} color="#f0c778" castShadow />

      <WorldEnvironment />
      <HighClouds />

      <group ref={aircraft} position={[0, 0.72, 65]}>
        <Plane liveries={liveries} />
      </group>

      {phase === 'outside' && (
        <GameCharacter gender={gender} position={new THREE.Vector3(0.95, 0, 65.55)} />
      )}
      {phase === 'exited' && (
        <GameCharacter gender={gender} position={new THREE.Vector3(0.95, 0, LANDING_STOP_Z + 0.55)} />
      )}

      {!['outside', 'parked', 'takeoff'].includes(phase) && (
        <DestinationBeacon distance={Math.max(0, z.current - ROUTE_END_Z)} />
      )}

      <OrbitControls
        ref={orbit}
        enablePan={false}
        enableZoom
        minDistance={4.2}
        maxDistance={18}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={0.35}
        onStart={() => {
          if (orbit.current) orbit.current.__dragging = true;
        }}
        onEnd={() => {
          if (orbit.current) orbit.current.__dragging = false;
        }}
      />
    </>
  );
}

function SoundButton({ muted, onClick }: { muted: boolean; onClick: () => void }) {
  return (
    <button className="fly-sound" onClick={onClick} aria-label={muted ? 'Unmute' : 'Mute'}>
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

export default function FlyPage() {
  const go = useNavigate();
  const { liveries, gender: savedGender } = usePlaneStore();
  const gender: Gender = savedGender === 'woman' ? 'woman' : 'man';
  const flagsReady = Boolean(liveries['flag-left'] && liveries['flag-right']);

  const [phase, setPhase] = useState<FlightPhase>('outside');
  const [muted, setMuted] = useState(true);
  const [rideNotice, setRideNotice] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    speed: 0,
    altitude: 0,
    distance: 785,
    progress: 0,
  });

  useEffect(() => {
    const a = new Audio('/boot.mp3');
    a.loop = true;
    a.volume = 0.35;
    a.muted = true;
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = '';
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(
      () => setCountdown((v) => Math.max(0, v - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const toggleSound = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
    if (!a.muted) a.play().catch(() => {});
  };

  const getIn = () => {
    if (phase === 'outside') setPhase('parked');
  };

  const takeOff = () => {
    if (!flagsReady) return;
    audioRef.current?.play().catch(() => {});
    setPhase('takeoff');
  };

  const exitPlane = () => {
    if (phase !== 'stopped') return;
    setPhase('exited');
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.repeat || countdown > 0 || rideNotice) return;
      const k = e.key.toLowerCase();

      if (k === 'g' && phase === 'outside') getIn();
      if (k === 't' && phase === 'parked') takeOff();
      if (k === 'e' && phase === 'stopped') exitPlane();
      if (k === 'm') toggleSound();
    };

    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [phase, flagsReady, countdown, rideNotice]);

  if (!flagsReady) {
    return (
      <main className="fly-gate">
        <style>{FLY_CSS}</style>
        <div className="gate-card">
          <span>MARSHOUT FLIGHT</span>
          <h1>Paint them flags, dawg, then we out.</h1>
          <p>Your aircraft needs both flags painted before it can leave Vice City.</p>
          <button onClick={() => go('/hangar')}>
            GO TO HANGAR <b>→</b>
          </button>
        </div>
      </main>
    );
  }

  const current =
    phase === 'landed' || phase === 'stopped' || phase === 'exited'
      ? DESTINATION_NAME
      : START_NAME;

  const status: Record<FlightPhase, [string, string]> = {
    outside: ['YOUR RIDE IS READY', 'That’s your character by the plane. Tap G and get in.'],
    parked: ['READY AT VICE CITY', 'You’re in. Hit T when you want the city behind you.'],
    takeoff: ['TAKEOFF ROLL', 'Rolling out of Vice City.'],
    climb: ['CLIMBING', 'Clearing the neighborhood and heading for the clouds.'],
    cruise: ['EN ROUTE', 'Autopilot locked for Port Gellhorn.'],
    approach: ['APPROACH', 'Port Gellhorn is coming up below.'],
    landing: ['FINAL APPROACH', 'Runway captured. Landing automatically.'],
    landed: ['TOUCHDOWN', 'Easy. Automatic braking is bringing us to a stop.'],
    stopped: ['PARKED', 'We made it. Tap E and step back outside.'],
    exited: ['WELCOME TO PORT GELLHORN', 'Touchdown. Your homies are outside and the next door is waiting.'],
  };

  const [title, desc] = status[phase];
  const mapProgress = ['landing', 'landed', 'stopped', 'exited'].includes(phase)
    ? 1
    : telemetry.progress;
  const mapLeft = 22 + mapProgress * 67 + Math.sin(mapProgress * Math.PI) * 15;
  const mapTop = 12 + mapProgress * 77;

  return (
    <main className="fly-page">
      <style>{FLY_CSS}</style>

      <Canvas
        shadows
        dpr={[1, 1.3]}
        camera={{ position: [5.8, 3.8, 74.2], fov: 40, near: 0.1, far: 1200 }}
        gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
      >
        <FlightWorld
          phase={phase}
          setPhase={setPhase}
          onTelemetry={setTelemetry}
          gender={gender}
        />
      </Canvas>

      <div className="fly-vignette" />

      <header className="fly-hud">
        <div className="flight-brand">
          <i />
          MARSHOUT <b>FLIGHT</b>
        </div>

        {['landed', 'stopped', 'exited'].includes(phase) ? (
          <div className="route-card route-card-arrived">
            <span>
              <small>CURRENT LOCATION</small>
              <b>{DESTINATION_NAME}</b>
            </span>
          </div>
        ) : (
          <div className="route-card">
            <span>
              <small>CURRENT LOCATION</small>
              <b>{current}</b>
            </span>
            <em>→</em>
            <span>
              <small>DESTINATION</small>
              <b>{DESTINATION_NAME}</b>
            </span>
          </div>
        )}

        <SoundButton muted={muted} onClick={toggleSound} />
      </header>

      {(
        <button className="open-another-door" onClick={() => go('/')}>
          <span className="door-house">⌂</span>
          <span>
            <small>DONE WITH THIS TRIP?</small>
            <b>OPEN ANOTHER DOOR</b>
          </span>
          <strong>↗</strong>
        </button>
      )}

      {!['outside', 'exited'].includes(phase) && (
        <aside className="instruments">
          <div className="speed">
            <small>AIRSPEED</small>
            <strong>{String(telemetry.speed).padStart(3, '0')}</strong>
            <em> KM/H</em>
            <i>
              <b style={{ width: `${Math.min(100, (telemetry.speed / CRUISE_SPEED) * 100)}%` }} />
            </i>
          </div>

          <div className="stat">
            <small>ALTITUDE</small>
            <b>{telemetry.altitude.toLocaleString()} FT</b>
          </div>

          <div className="stat">
            <small>AUTOPILOT</small>
            <b>{phase === 'parked' ? 'STANDBY' : phase === 'exited' ? 'COMPLETE' : 'ENGAGED'}</b>
          </div>
        </aside>
      )}

      {!['outside', 'exited'].includes(phase) && (
        <aside className={`nav-map ${mapProgress > 0.72 ? 'is-approach' : ''}`}>
          <div className="map-title">
            <span>NAV / AUTOPILOT</span>
            <b>{telemetry.distance} KM</b>
          </div>

          <div className="map-sub">
            <span>VCY 024°</span>
            <i>LIVE</i>
            <span>PGH 204°</span>
          </div>

          <div className="map-grid">
            <svg className="map-land" viewBox="0 0 220 230" preserveAspectRatio="none" aria-hidden="true">
              <path className="coast coast-a" d="M-8 30 C28 17 39 41 62 48 C81 54 83 75 69 91 C52 110 30 108 8 125 L-8 130Z" />
              <path className="coast coast-b" d="M228 104 C195 93 181 112 169 132 C157 151 174 166 157 184 C142 200 155 219 183 236 L228 236Z" />
              <path className="district" d="M6 58 L54 71 L31 111 M177 135 L213 153 L171 177 L205 201" />
              <path className="water-line" d="M82 0 C75 50 98 72 90 110 C81 151 102 179 96 230" />
            </svg>

            <div className="map-route-curve" />
            <i className="radar r1" />
            <i className="radar r2" />
            <i className="radar r3" />
            <span className="waypoint wp1">VC-01</span>
            <span className="waypoint wp2">MAR-7</span>
            <span className="waypoint wp3">PG-APP</span>
            <span className="city vc"><i />VICE CITY</span>
            <span className="city ls"><i />PORT GELLHORN</span>
            <span className="approach-cone" />
            <span className="runway-map">RWY 24</span>
            <span
              className="plane-dot"
              style={{
                top: `${mapTop}%`,
                left: `${mapLeft}%`,
                transform: `translate(-50%,-50%) rotate(${18 + mapProgress * 18}deg)`,
              }}
            >
              ▲
            </span>
            <span className="map-track" style={{ height: `${Math.max(3, mapProgress * 76)}%` }} />
          </div>

          <div className="map-data">
            <span><small>ALT</small><b>{telemetry.altitude.toLocaleString()} FT</b></span>
            <span><small>SPD</small><b>{telemetry.speed} KM/H</b></span>
            <span><small>ETA</small><b>{telemetry.distance === 0 ? 'ARRIVED' : `${Math.max(1, Math.ceil(telemetry.distance / 95))} MIN`}</b></span>
          </div>

          <div className="map-progress">
            <i><b style={{ width: `${Math.round(telemetry.progress * 100)}%` }} /></i>
            <span>{Math.round(telemetry.progress * 100)}% ROUTE</span>
          </div>
        </aside>
      )}

      <section className={`control-card ${phase === 'outside' || phase === 'exited' ? 'on-foot' : ''}`}>
        <div className="phase">{title}</div>
        <h1>{phase === 'exited' ? 'TOUCH DOWN. STEP OUT.' : phase === 'outside' ? 'YOUR RIDE’S RIGHT THERE.' : 'FLIGHT CONTROL'}</h1>
        <p>{desc}</p>

        {phase === 'outside' && (
          <button className="primary" onClick={getIn}>
            <span><kbd>G</kbd> GET IN</span><b>→</b>
          </button>
        )}

        {phase === 'parked' && (
          <button className="primary" onClick={takeOff}>
            <span><kbd>T</kbd> TAKE OFF</span><b>→</b>
          </button>
        )}

        {phase === 'stopped' && (
          <button className="primary" onClick={exitPlane}>
            <span><kbd>E</kbd> GET OUT</span><b>→</b>
          </button>
        )}

        {!['outside', 'exited'].includes(phase) && (
          <div className="controls-visible">
            <span><kbd>T</kbd><b>TAKE OFF</b></span>
            <span><kbd>E</kbd><b>GET OUT</b></span>
            <span><kbd>M</kbd><b>SOUND</b></span>
            <span className="mouse"><b>DRAG MOUSE</b><small>ROTATE CAMERA</small></span>
          </div>
        )}
        {phase === 'outside' && (
          <div className="controls-visible">
            <span><kbd>G</kbd><b>GET IN</b></span>
            <span><kbd>M</kbd><b>SOUND</b></span>
            <span className="mouse"><b>DRAG MOUSE</b><small>ROTATE CAMERA</small></span>
          </div>
        )}
      </section>

      {phase === 'outside' && countdown === 0 && !rideNotice && (
        <div className="proximity-prompt">
          <kbd>G</kbd>
          <span><small>PLANE IN RANGE</small><b>GET IN</b></span>
        </div>
      )}

      {!['parked', 'landed', 'stopped', 'exited', 'outside'].includes(phase) && (
        <div className="autopilot-pill">
          <i /> AUTOPILOT · {DESTINATION_NAME}
        </div>
      )}

      {countdown > 0 && (
        <div className="flight-countdown">
          <div className="countdown-core">
            <small>MARSHOUT FLIGHT SYSTEMS</small>
            <strong>{countdown}</strong>
            <span>OPENING VICE CITY AIRSTRIP</span>
            <i><b style={{ width: `${(4 - countdown) * 33.333}%` }} /></i>
          </div>
        </div>
      )}

      {countdown === 0 && rideNotice && (
        <div className="ride-notice-backdrop">
          <div className="ride-notice">
            <div className="ride-notice-icon"><span>✦</span></div>
            <div className="ride-notice-copy">
              <small>MARSHOUT / VICE CITY</small>
              <h2>Your ride’s outside.</h2>
              <p>That’s you by the plane, homie. Tap G, hop in, and we out.</p>
            </div>
            <button type="button" onClick={() => setRideNotice(false)}>
              LET’S MOVE <b>→</b>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const FLY_CSS = `
.city-world-label{padding:9px 14px;background:#071a38e8;border:1px solid #d3a34f88;color:#f5f2eb;font:950 12px Inter;letter-spacing:.18em;white-space:nowrap;box-shadow:0 12px 30px #00102066;text-transform:uppercase}
*{box-sizing:border-box}
.fly-page,.fly-gate{position:fixed;left:0;right:0;top:48px;bottom:0;overflow:hidden;font-family:Inter,ui-sans-serif,system-ui;color:#fff;background:#91c8dc;z-index:1}
.fly-page canvas{position:absolute!important;inset:0}
.fly-vignette{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(180deg,rgba(4,15,30,.2),transparent 28%,transparent 58%,rgba(3,12,25,.58)),radial-gradient(circle at center,transparent 48%,rgba(4,13,25,.22))}
.fly-hud{position:absolute;z-index:7;left:0;right:0;top:0;padding:18px 24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:start;pointer-events:none}
.flight-brand{font-size:10px;font-weight:950;letter-spacing:.18em;padding-top:13px;text-shadow:0 2px 12px #0008}
.flight-brand i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#d69b43;margin-right:9px;box-shadow:0 0 0 5px #d69b4322}
.flight-brand b{color:#d69b43}
.route-card{display:flex;align-items:center;gap:18px;background:#06182ee8;border:1px solid #ffffff2b;border-radius:9px;padding:11px 17px;backdrop-filter:blur(14px);box-shadow:0 14px 36px #00102038}
.route-card span{min-width:130px;display:flex;flex-direction:column;gap:3px}
.route-card span:last-child{text-align:right}
.route-card small,.speed small,.stat small{font-size:7px;letter-spacing:.17em;color:#ffffff7b;font-weight:900}
.route-card b{font-size:11px;letter-spacing:.1em}.route-card em{font-style:normal;color:#d69b43}
.fly-sound{pointer-events:auto;justify-self:end;width:48px;height:48px;border:1px solid #ffffff35;border-radius:9px;background:#06182ee8;color:#fff;font-size:17px;cursor:pointer;box-shadow:0 12px 30px #00102038}
.instruments{position:absolute;z-index:6;right:24px;top:91px;width:178px;display:grid;gap:8px}
.speed,.stat{background:#06182ee8;border:1px solid #ffffff28;border-radius:9px;padding:14px 16px;backdrop-filter:blur(14px);box-shadow:0 15px 35px #00102035}
.speed strong{font-size:39px;line-height:1;font-variant-numeric:tabular-nums}.speed>em{font-style:normal;font-size:8px;color:#d69b43;font-weight:900}
.speed>i{display:block;height:4px;margin-top:10px;background:#ffffff18;overflow:hidden}.speed>i b{display:block;height:100%;background:#d69b43;transition:width .15s}
.stat{display:flex;align-items:center;justify-content:space-between}.stat b{font-size:10px;letter-spacing:.07em}
.nav-map{position:absolute;z-index:6;right:24px;bottom:24px;width:286px;padding:13px;background:linear-gradient(180deg,#031426f2,#061b31f2);border:1px solid #ffffff2b;border-radius:11px;backdrop-filter:blur(16px);box-shadow:0 22px 55px #00102066;overflow:hidden}
.map-title,.map-sub,.map-data,.map-progress{position:relative;z-index:2}.map-title{display:flex;justify-content:space-between;font-size:8px;font-weight:950;letter-spacing:.12em}.map-title span{color:#ffffff8c}.map-title b{color:#d69b43}
.map-sub{display:flex;align-items:center;justify-content:space-between;margin-top:7px;color:#ffffff52;font-size:6px;font-weight:900;letter-spacing:.13em}.map-sub i{font-style:normal;color:#78e0aa}
.map-grid{position:relative;height:230px;margin:9px 0 10px;border:1px solid #ffffff16;overflow:hidden;background-color:#061a2e;background-image:linear-gradient(#ffffff09 1px,transparent 1px),linear-gradient(90deg,#ffffff09 1px,transparent 1px);background-size:27px 27px}
.map-land{position:absolute;inset:0;width:100%;height:100%;z-index:0}.coast{fill:#183b3d;stroke:#4d8d79;stroke-width:1.2;opacity:.7}.district{fill:none;stroke:#ffffff13;stroke-width:1}.water-line{fill:none;stroke:#54a8c055;stroke-width:1;stroke-dasharray:3 3}
.map-route-curve{position:absolute;z-index:1;left:36%;top:13%;width:31%;height:72%;border-right:2px solid #d69b43;border-radius:0 75% 75% 0;transform:rotate(-5deg)}
.radar{position:absolute;left:50%;top:50%;border:1px solid #ffffff0d;border-radius:50%;transform:translate(-50%,-50%)}.r1{width:78px;height:78px}.r2{width:140px;height:140px}.r3{width:205px;height:205px}
.city{position:absolute;z-index:4;padding:4px 6px;background:#031426e8;border:1px solid #ffffff31;font-size:6px;font-weight:950}.city.vc{left:16%;top:8%}.city.ls{right:7%;bottom:7%;color:#efb45d}
.waypoint{position:absolute;z-index:3;color:#ffffff55;font-size:5px;font-weight:900}.wp1{left:37%;top:30%}.wp2{left:58%;top:49%}.wp3{right:19%;bottom:24%}
.approach-cone{position:absolute;right:9%;bottom:9%;width:50px;height:78px;background:linear-gradient(to top,#d69b4325,transparent);clip-path:polygon(43% 100%,57% 100%,100% 0,0 0)}
.runway-map{position:absolute;right:5%;bottom:2%;color:#d69b43;font-size:5px;font-weight:950}.plane-dot{position:absolute;z-index:7;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#f4f7f9;color:#071a38;font-size:11px}.map-track{position:absolute;left:35%;top:13%;width:1px;background:#ffffff8c}
.map-data{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.map-data span{padding:7px 6px;background:#ffffff08;border:1px solid #ffffff0d;border-radius:5px}.map-data small{display:block;color:#ffffff4e;font-size:5px}.map-data b{font-size:7px}.map-progress{display:flex;align-items:center;gap:8px;margin-top:8px}.map-progress>i{display:block;flex:1;height:3px;background:#ffffff12}.map-progress>i b{display:block;height:100%;background:#d69b43}.map-progress>span{font-size:5px;color:#ffffff58}
.control-card{position:absolute;z-index:6;left:24px;bottom:24px;width:min(510px,calc(100vw - 330px));padding:22px;background:#041529ed;border:1px solid #ffffff2a;border-radius:11px;backdrop-filter:blur(15px);box-shadow:0 22px 55px #00102055}
.control-card.on-foot{width:min(430px,calc(100vw - 48px));background:linear-gradient(145deg,#071a38ed,#0a2945e8)}
.phase{font-size:8px;font-weight:950;letter-spacing:.2em;color:#d69b43}.control-card h1{margin:7px 0 5px;font-size:25px;letter-spacing:-.035em}.control-card p{margin:0 0 15px;color:#ffffffb0;font-size:12px;line-height:1.5}
.primary{width:100%;height:50px;border:0;border-radius:7px;background:#f5f6f7;color:#071a38;padding:0 16px;display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:950;letter-spacing:.13em;cursor:pointer}.primary>b{font-size:20px;color:#c58b3c}.primary kbd{background:#071a38;color:#fff;border:0}
.controls-visible,.walk-controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.controls-visible>span,.walk-controls>span{min-width:76px;height:42px;padding:6px 8px;border:1px solid #ffffff20;border-radius:6px;background:#ffffff0b;display:flex;align-items:center;gap:7px}
.controls-visible kbd,.walk-controls kbd{min-width:27px;height:27px;padding:0 6px;display:grid;place-items:center;background:#ffffff15;border:1px solid #ffffff35;border-radius:4px;color:#fff;font:950 9px Inter}.controls-visible b,.walk-controls b{font-size:7px;letter-spacing:.09em}.walk-controls .hot{border-color:#d69b43;background:#d69b4320}
.proximity-prompt{position:absolute;z-index:8;left:50%;bottom:34px;transform:translateX(-50%);display:flex;align-items:center;gap:11px;padding:9px 14px 9px 9px;background:#06182eee;border:1px solid #d69b4366;border-radius:9px;box-shadow:0 15px 40px #00102066}.proximity-prompt kbd{width:40px;height:40px;display:grid;place-items:center;border-radius:6px;background:#f5f6f7;color:#071a38;font-weight:950}.proximity-prompt small,.proximity-prompt b{display:block}.proximity-prompt small{font-size:6px;color:#d69b43;letter-spacing:.13em}.proximity-prompt b{font-size:10px;letter-spacing:.1em}
.open-another-door{transform:scale(.84);transform-origin:top left;position:absolute;z-index:9;left:24px;top:82px;display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;border:1px solid #d69b4355;border-radius:8px;background:#071a38df;color:#fff;backdrop-filter:blur(12px);cursor:pointer;box-shadow:0 14px 35px #00102045;text-align:left}.door-house{width:38px;height:38px;display:grid;place-items:center;border-radius:6px;background:#d69b43;color:#071a38;font-size:22px}.open-another-door small,.open-another-door b{display:block}.open-another-door small{font-size:5px;color:#ffffff70;letter-spacing:.12em}.open-another-door b{margin-top:2px;font-size:8px;letter-spacing:.11em}.open-another-door strong{color:#d69b43;font-size:16px;margin-left:4px}
.autopilot-pill{position:absolute;z-index:5;left:50%;top:104px;transform:translateX(-50%);padding:9px 13px;border:1px solid #ffffff2c;border-radius:999px;background:#06182ec9;font-size:8px;font-weight:950;letter-spacing:.14em}.autopilot-pill i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#7dd8a4;margin-right:7px}
.destination-beacon{display:flex;flex-direction:column;align-items:center;min-width:120px;padding:8px 12px;background:#071a38dd;border:1px solid #ffffff35;border-radius:5px;color:#fff;font-family:Inter}.destination-beacon b{font-size:9px;letter-spacing:.15em}.destination-beacon small{font-size:7px;color:#d69b43}
.fly-gate{display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#17385d,#06182e 62%)}.gate-card{width:min(560px,calc(100vw - 40px));padding:36px;border:1px solid #ffffff22;border-radius:12px;background:#071a38e8}.gate-card>span{font-size:8px;font-weight:950;letter-spacing:.2em;color:#d69b43}.gate-card h1{font-size:30px;margin:10px 0}.gate-card p{font-size:12px;color:#ffffff9b}.gate-card button{width:100%;height:50px;border:0;border-radius:7px;background:#fff;color:#071a38;padding:0 17px;display:flex;align-items:center;justify-content:space-between;font-weight:950}
.route-card-arrived{justify-content:center;min-width:260px}.route-card-arrived span{min-width:0;text-align:center!important}
.flight-countdown{position:absolute;inset:0;z-index:30;display:grid;place-items:center;background:radial-gradient(circle at 50% 44%,rgba(14,51,84,.9),rgba(2,12,25,.97) 58%);backdrop-filter:blur(8px)}.countdown-core{width:min(430px,calc(100vw - 40px));text-align:center}.countdown-core small{display:block;color:#d69b43;font-size:8px;font-weight:950;letter-spacing:.24em}.countdown-core strong{display:block;margin:12px 0 8px;font-size:108px}.countdown-core span{font-size:9px;letter-spacing:.15em}.countdown-core>i{display:block;width:180px;height:3px;margin:20px auto;background:#ffffff14}.countdown-core>i b{display:block;height:100%;background:#d69b43}
.ride-notice-backdrop{position:absolute;inset:0;z-index:20;display:grid;place-items:center;padding:24px;background:rgba(2,12,25,.34);backdrop-filter:blur(5px)}.ride-notice{width:min(440px,calc(100vw - 40px));display:grid;grid-template-columns:auto 1fr;gap:18px;padding:24px;border:1px solid #ffffff3d;border-radius:12px;background:linear-gradient(145deg,#051930fa,#082646f5);box-shadow:0 30px 90px #0008}.ride-notice-icon{width:48px;height:48px;display:grid;place-items:center;border:1px solid #d69b4366;border-radius:10px;background:#d69b4318;color:#d69b43;font-size:20px}.ride-notice-copy small{display:block;color:#d69b43;font-size:7px;font-weight:950;letter-spacing:.2em}.ride-notice-copy h2{margin:6px 0 0;font-size:25px}.ride-notice-copy p{margin:7px 0 0;color:#ffffffa6;font-size:12px}.ride-notice button{grid-column:1/-1;height:48px;border:0;border-radius:7px;background:#f5f6f7;color:#071a38;padding:0 16px;display:flex;align-items:center;justify-content:space-between;font-weight:950;letter-spacing:.12em}
@media(max-width:850px){.fly-hud{padding:12px}.flight-brand{display:none}.route-card{grid-column:1/3}.instruments{right:12px;top:78px;transform:scale(.86);transform-origin:top right}.nav-map{right:12px;bottom:12px;width:230px;transform:scale(.84);transform-origin:bottom right}.control-card{left:12px;bottom:12px;width:calc(100vw - 225px);padding:16px}.control-card.on-foot{width:min(390px,calc(100vw - 24px))}.open-another-door{transform:scale(.84);transform-origin:top left;left:12px;top:74px}}
@media(max-width:620px){.route-card{transform:scale(.82);transform-origin:top center}.instruments{display:none}.nav-map{display:none}.control-card,.control-card.on-foot{width:calc(100vw - 24px)}.control-card h1{font-size:20px}.open-another-door{transform:scale(.84);transform-origin:top left;top:70px}.proximity-prompt{bottom:205px}}
`;
