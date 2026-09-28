import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox, useTexture, OrbitControls } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
const DESTINATION_NAME = 'PORT GELLHORN';
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

function Palm({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.12, 2.5, 7]} />
        <meshStandardMaterial color="#7b5336" roughness={0.95} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.48, 2.55, Math.sin(a) * 0.48]}
            rotation={[0.1, -a, a * 0.12]}
            castShadow
          >
            <boxGeometry args={[1.15, 0.055, 0.26]} />
            <meshStandardMaterial color={i % 2 ? '#2f7251' : '#3f875e'} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function ViceHouse({
  x,
  z,
  rot = 0,
  variant = 0,
}: {
  x: number;
  z: number;
  rot?: number;
  variant?: number;
}) {
  const walls = ['#e7c9ae', '#d8ddd5', '#c6d7d9', '#e6d8bc'][variant % 4];
  const accent = ['#d67d65', '#5b8190', '#c69b55', '#8c6e82'][variant % 4];

  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <RoundedBox args={[4.7, 2.5, 3.3]} radius={0.12} smoothness={3} position={[0, 1.25, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={walls} roughness={0.8} />
      </RoundedBox>

      <RoundedBox args={[2.1, 1.2, 0.2]} radius={0.06} smoothness={3} position={[0.65, 1.15, 1.68]}>
        <meshStandardMaterial color="#82afbd" metalness={0.1} roughness={0.25} />
      </RoundedBox>

      <mesh position={[-1.35, 0.95, 1.69]}>
        <boxGeometry args={[0.9, 1.9, 0.12]} />
        <meshStandardMaterial color="#233746" roughness={0.65} />
      </mesh>

      <mesh position={[0, 2.63, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[5.15, 0.22, 3.75]} />
        <meshStandardMaterial color={accent} roughness={0.85} />
      </mesh>

      <mesh position={[1.45, 2.85, -0.3]}>
        <boxGeometry args={[1.15, 0.16, 1.3]} />
        <meshStandardMaterial color="#1c2e3a" roughness={0.55} />
      </mesh>

      <mesh position={[0, 0.04, 2.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.6, 2.4]} />
        <meshStandardMaterial color="#c8b89b" roughness={1} />
      </mesh>

      <mesh position={[2.7, 0.6, 1.9]}>
        <boxGeometry args={[0.65, 1.2, 0.65]} />
        <meshStandardMaterial color="#4e8658" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Runway({ z, length = 250 }: { z: number; length?: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[52, length + 42]} />
        <meshStandardMaterial color="#7b9564" roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[6.4, length]} />
        <meshStandardMaterial color="#45484a" roughness={0.98} />
      </mesh>

      {[-3, 3].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, 0]}>
          <planeGeometry args={[0.09, length]} />
          <meshBasicMaterial color="#e5b64d" />
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

function Neighborhood({ destination = false }: { destination?: boolean }) {
  const baseZ = destination ? ROUTE_END_Z : 52;
  const houses = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        x: (i % 2 ? 1 : -1) * (10 + (i % 4) * 4.4),
        z: baseZ + 52 - Math.floor(i / 2) * 13,
        rot: i % 2 ? -Math.PI / 2 : Math.PI / 2,
        variant: i,
      })),
    [baseZ],
  );

  return (
    <group>
      {houses.map((h, i) => (
        <ViceHouse key={i} {...h} />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <Palm
          key={i}
          x={(i % 2 ? 1 : -1) * (7.5 + (i % 3) * 2)}
          z={baseZ + 66 - i * 7.4}
          s={0.82 + (i % 3) * 0.12}
        />
      ))}
    </group>
  );
}

function WorldEnvironment() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -330]} receiveShadow>
        <planeGeometry args={[280, 1180]} />
        <meshStandardMaterial color="#72905e" roughness={1} />
      </mesh>

      <Runway z={-45} length={270} />
      <Runway z={ROUTE_END_Z} length={290} />
      <Neighborhood />
      <Neighborhood destination />
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

function GameCharacter({
  gender,
  position,
  heading,
  walking,
}: {
  gender: Gender;
  position: THREE.Vector3;
  heading: number;
  walking: boolean;
}) {
  const t = useRef(0);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    t.current += dt * (walking ? 9 : 2);
    const swing = walking ? Math.sin(t.current) * 0.55 : Math.sin(t.current) * 0.035;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.7;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.7;
  });

  const female = gender === 'woman';

  return (
    <group position={position} rotation={[0, heading, 0]} scale={0.88}>
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.22, 18, 14]} />
        <meshStandardMaterial color={female ? '#ad7458' : '#81563e'} roughness={0.8} />
      </mesh>

      {female ? (
        <>
          <mesh position={[0, 1.78, 0.06]} castShadow>
            <sphereGeometry args={[0.235, 16, 12]} />
            <meshStandardMaterial color="#211713" roughness={0.92} />
          </mesh>
          <mesh position={[0, 1.53, 0.11]} castShadow>
            <boxGeometry args={[0.4, 0.48, 0.16]} />
            <meshStandardMaterial color="#211713" roughness={0.92} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 1.88, 0]} castShadow>
          <sphereGeometry args={[0.225, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#151312" roughness={0.95} />
        </mesh>
      )}

      <RoundedBox
        args={[female ? 0.48 : 0.58, 0.68, 0.28]}
        radius={0.08}
        smoothness={3}
        position={[0, 1.18, 0]}
        castShadow
      >
        <meshStandardMaterial color={female ? '#d5b36d' : '#f1eee5'} roughness={0.82} />
      </RoundedBox>

      {female && (
        <mesh position={[0, 1.2, 0.155]}>
          <boxGeometry args={[0.54, 0.34, 0.06]} />
          <meshStandardMaterial color="#142d4b" roughness={0.75} />
        </mesh>
      )}

      {[-1, 1].map((side) => (
        <group
          key={`arm-${side}`}
          ref={side === -1 ? leftArm : rightArm}
          position={[side * (female ? 0.31 : 0.36), 1.35, 0]}
        >
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.46, 5, 8]} />
            <meshStandardMaterial color={female ? '#ad7458' : '#81563e'} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group
          key={`leg-${side}`}
          ref={side === -1 ? leftLeg : rightLeg}
          position={[side * 0.14, 0.78, 0]}
        >
          <mesh position={[0, -0.34, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.52, 5, 8]} />
            <meshStandardMaterial color={female ? '#1e2530' : '#315273'} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.69, 0.08]} castShadow>
            <boxGeometry args={[0.22, 0.12, 0.38]} />
            <meshStandardMaterial color="#151719" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Homie({
  position,
  female = false,
  phaseOffset = 0,
}: {
  position: [number, number, number];
  female?: boolean;
  phaseOffset?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.45 + phaseOffset) * 0.7;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.22 + phaseOffset) * 0.45;
  });

  return (
    <group ref={ref} position={position} scale={0.78}>
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.22, 14, 10]} />
        <meshStandardMaterial color={female ? '#b8785b' : '#6f4b37'} roughness={0.85} />
      </mesh>
      {female ? (
        <mesh position={[0, 1.73, 0.06]} castShadow>
          <sphereGeometry args={[0.24, 14, 10]} />
          <meshStandardMaterial color="#2b1b18" roughness={0.95} />
        </mesh>
      ) : (
        <mesh position={[0, 1.88, 0]}>
          <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#171514" />
        </mesh>
      )}
      <RoundedBox args={[0.54, 0.7, 0.3]} radius={0.08} smoothness={2} position={[0, 1.18, 0]} castShadow>
        <meshStandardMaterial color={female ? '#b7646c' : '#263b56'} roughness={0.86} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.15, 0.48, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.55, 4, 7]} />
          <meshStandardMaterial color="#20262c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function GroundCrew({ arrival = false }: { arrival?: boolean }) {
  const z = arrival ? ROUTE_END_Z + 42 : 65;
  return (
    <>
      <Homie position={[-5.7, 0, z + 4.8]} phaseOffset={0.3} />
      <Homie position={[-7.1, 0, z + 1.8]} female phaseOffset={1.8} />
      <Homie position={[6.5, 0, z + 5.7]} female phaseOffset={3.1} />
      <Homie position={[7.8, 0, z + 2.1]} phaseOffset={4.4} />
    </>
  );
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
  playerPosition,
  setPlayerPosition,
  nearPlane,
  setNearPlane,
}: {
  phase: FlightPhase;
  setPhase: (p: FlightPhase) => void;
  onTelemetry: (t: Telemetry) => void;
  gender: Gender;
  playerPosition: THREE.Vector3;
  setPlayerPosition: (v: THREE.Vector3) => void;
  nearPlane: boolean;
  setNearPlane: (v: boolean) => void;
}) {
  const { liveries } = usePlaneStore();
  const aircraft = useRef<THREE.Group>(null);
  const orbit = useRef<any>(null);
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const player = useRef(playerPosition.clone());
  const heading = useRef(Math.PI);
  const walking = useRef(false);
  const speed = useRef(0);
  const z = useRef(65);
  const altitude = useRef(0.72);
  const pitch = useRef(0);
  const lastHud = useRef(0);

  useEffect(() => {
    player.current.copy(playerPosition);
  }, [playerPosition]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.045);
    const dist = Math.max(0, z.current - ROUTE_END_Z);

    const canWalk = phase === 'outside' || phase === 'exited';
    if (canWalk) {
      const dx =
        (keys.current['arrowright'] || keys.current['d'] ? 1 : 0) -
        (keys.current['arrowleft'] || keys.current['a'] ? 1 : 0);
      const dz =
        (keys.current['arrowdown'] || keys.current['s'] ? 1 : 0) -
        (keys.current['arrowup'] || keys.current['w'] ? 1 : 0);

      walking.current = dx !== 0 || dz !== 0;

      if (walking.current) {
        const len = Math.hypot(dx, dz) || 1;
        const moveSpeed = 3.25;
        player.current.x += (dx / len) * moveSpeed * d;
        player.current.z += (dz / len) * moveSpeed * d;
        heading.current = Math.atan2(dx, dz);

        const centerZ = phase === 'exited' ? ROUTE_END_Z + 42 : 65;
        player.current.x = THREE.MathUtils.clamp(player.current.x, -8.2, 8.2);
        player.current.z = THREE.MathUtils.clamp(player.current.z, centerZ - 10, centerZ + 11);
        setPlayerPosition(player.current.clone());
      }

      const planeZ = phase === 'exited' ? ROUTE_END_Z + 42 : 65;
      const proximity = Math.hypot(player.current.x - 2.4, player.current.z - (planeZ + 1.6)) < 2.7;
      if (proximity !== nearPlane) setNearPlane(proximity);
    } else {
      walking.current = false;
      if (nearPlane) setNearPlane(false);
    }

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
      speed.current = THREE.MathUtils.lerp(speed.current, 72, d * 0.8);
      z.current -= Math.max(7, speed.current / 11) * d;
      altitude.current = Math.max(0.72, altitude.current - 1.05 * d);
      pitch.current = THREE.MathUtils.lerp(pitch.current, 0.025, d * 2);
      if (altitude.current <= 0.725) {
        altitude.current = 0.72;
        z.current = ROUTE_END_Z + 42;
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

    const onFoot = phase === 'outside' || phase === 'exited';
    const arrivalView = ['landed', 'stopped'].includes(phase);

    let chase: THREE.Vector3;
    let target: THREE.Vector3;

    if (onFoot) {
      chase = new THREE.Vector3(
        player.current.x + 5.8,
        3.6,
        player.current.z + 7.4,
      );
      target = new THREE.Vector3(player.current.x, 1.1, player.current.z - 1.2);
    } else {
      chase = new THREE.Vector3(
        arrivalView ? 6.8 : 5.8,
        arrivalView ? 3.15 : 3.45,
        z.current + (arrivalView ? 7.6 : 9.2),
      );
      target = new THREE.Vector3(0, altitude.current + 0.5, z.current - (arrivalView ? 2.4 : 5));
    }

    if (!orbit.current?.__dragging) {
      camera.position.lerp(chase, 1 - Math.pow(0.003, d));
    }

    if (orbit.current) {
      orbit.current.target.lerp(target, 1 - Math.pow(0.002, d));
      orbit.current.update();
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      const speedRatio = THREE.MathUtils.clamp(speed.current / CRUISE_SPEED, 0, 1);
      const targetFov = onFoot ? 46 : 40 + speedRatio * 5;
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
      <color attach="background" args={['#91c8dc']} />
      <fog attach="fog" args={['#b7d8e4', 65, 350]} />
      <ambientLight intensity={0.86} />
      <hemisphereLight args={['#ffd6ad', '#45674f', 1.25]} />
      <directionalLight position={[8, 13, 6]} intensity={2.05} castShadow />

      <WorldEnvironment />
      <HighClouds />

      <group ref={aircraft} position={[0, 0.72, 65]}>
        <Plane liveries={liveries} />
      </group>

      {(phase === 'outside' || phase === 'parked' || phase === 'takeoff') && <GroundCrew />}
      {['landed', 'stopped', 'exited'].includes(phase) && <GroundCrew arrival />}

      {(phase === 'outside' || phase === 'exited') && (
        <GameCharacter
          gender={gender}
          position={player.current}
          heading={heading.current}
          walking={walking.current}
        />
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
  const [nearPlane, setNearPlane] = useState(false);
  const [playerPosition, setPlayerPosition] = useState(
    () => new THREE.Vector3(4.9, 0, 71.5),
  );
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
    if (phase === 'outside' && nearPlane) setPhase('parked');
  };

  const takeOff = () => {
    if (!flagsReady) return;
    audioRef.current?.play().catch(() => {});
    setPhase('takeoff');
  };

  const exitPlane = () => {
    if (phase !== 'stopped') return;
    setPlayerPosition(new THREE.Vector3(4.8, 0, ROUTE_END_Z + 48));
    setPhase('exited');
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.repeat || countdown > 0 || rideNotice) return;
      const k = e.key.toLowerCase();

      if (k === 'g' && phase === 'outside' && nearPlane) getIn();
      if (k === 't' && phase === 'parked') takeOff();
      if (k === 'e' && phase === 'stopped') exitPlane();
      if (k === 'm') toggleSound();
    };

    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [phase, flagsReady, countdown, rideNotice, nearPlane]);

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
    outside: [
      nearPlane ? 'PLANE IN RANGE' : 'WALK TO THE PLANE',
      nearPlane
        ? 'You’re close enough. Tap G and get in.'
        : 'Move around the strip, check the crew, then walk up to your plane.',
    ],
    parked: ['READY AT VICE CITY', 'You’re in. Hit T when you want the city behind you.'],
    takeoff: ['TAKEOFF ROLL', 'Rolling out of Vice City.'],
    climb: ['CLIMBING', 'Clearing the neighborhood and heading for the clouds.'],
    cruise: ['EN ROUTE', 'Autopilot locked for Port Gellhorn.'],
    approach: ['APPROACH', 'Port Gellhorn is coming up below.'],
    landing: ['FINAL APPROACH', 'Runway captured. Landing automatically.'],
    landed: ['TOUCHDOWN', 'Easy. Automatic braking is bringing us to a stop.'],
    stopped: ['PARKED', 'We made it. Tap E and step back outside.'],
    exited: ['WELCOME TO PORT GELLHORN', 'Your homies are outside. Walk around and check the place out.'],
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
          playerPosition={playerPosition}
          setPlayerPosition={setPlayerPosition}
          nearPlane={nearPlane}
          setNearPlane={setNearPlane}
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

      {phase === 'exited' && (
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

        {phase === 'outside' && nearPlane && (
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

        {(phase === 'outside' || phase === 'exited') && (
          <div className="walk-controls">
            <span><kbd>WASD</kbd><b>MOVE</b></span>
            <span><kbd>↑↓←→</kbd><b>MOVE</b></span>
            {phase === 'outside' && <span className={nearPlane ? 'hot' : ''}><kbd>G</kbd><b>GET IN</b></span>}
            <span><kbd>M</kbd><b>SOUND</b></span>
          </div>
        )}

        {!['outside', 'exited'].includes(phase) && (
          <div className="controls-visible">
            <span><kbd>T</kbd><b>TAKE OFF</b></span>
            <span><kbd>E</kbd><b>GET OUT</b></span>
            <span><kbd>M</kbd><b>SOUND</b></span>
            <span className="mouse"><b>DRAG MOUSE</b><small>ROTATE CAMERA</small></span>
          </div>
        )}
      </section>

      {phase === 'outside' && nearPlane && countdown === 0 && !rideNotice && (
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
              <p>Walk over to the plane. When you’re close, tap G and hop in.</p>
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
.open-another-door{position:absolute;z-index:9;left:24px;top:82px;display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;border:1px solid #d69b4355;border-radius:8px;background:#071a38df;color:#fff;backdrop-filter:blur(12px);cursor:pointer;box-shadow:0 14px 35px #00102045;text-align:left}.door-house{width:38px;height:38px;display:grid;place-items:center;border-radius:6px;background:#d69b43;color:#071a38;font-size:22px}.open-another-door small,.open-another-door b{display:block}.open-another-door small{font-size:5px;color:#ffffff70;letter-spacing:.12em}.open-another-door b{margin-top:2px;font-size:8px;letter-spacing:.11em}.open-another-door strong{color:#d69b43;font-size:16px;margin-left:4px}
.autopilot-pill{position:absolute;z-index:5;left:50%;top:104px;transform:translateX(-50%);padding:9px 13px;border:1px solid #ffffff2c;border-radius:999px;background:#06182ec9;font-size:8px;font-weight:950;letter-spacing:.14em}.autopilot-pill i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#7dd8a4;margin-right:7px}
.destination-beacon{display:flex;flex-direction:column;align-items:center;min-width:120px;padding:8px 12px;background:#071a38dd;border:1px solid #ffffff35;border-radius:5px;color:#fff;font-family:Inter}.destination-beacon b{font-size:9px;letter-spacing:.15em}.destination-beacon small{font-size:7px;color:#d69b43}
.fly-gate{display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#17385d,#06182e 62%)}.gate-card{width:min(560px,calc(100vw - 40px));padding:36px;border:1px solid #ffffff22;border-radius:12px;background:#071a38e8}.gate-card>span{font-size:8px;font-weight:950;letter-spacing:.2em;color:#d69b43}.gate-card h1{font-size:30px;margin:10px 0}.gate-card p{font-size:12px;color:#ffffff9b}.gate-card button{width:100%;height:50px;border:0;border-radius:7px;background:#fff;color:#071a38;padding:0 17px;display:flex;align-items:center;justify-content:space-between;font-weight:950}
.route-card-arrived{justify-content:center;min-width:260px}.route-card-arrived span{min-width:0;text-align:center!important}
.flight-countdown{position:absolute;inset:0;z-index:30;display:grid;place-items:center;background:radial-gradient(circle at 50% 44%,rgba(14,51,84,.9),rgba(2,12,25,.97) 58%);backdrop-filter:blur(8px)}.countdown-core{width:min(430px,calc(100vw - 40px));text-align:center}.countdown-core small{display:block;color:#d69b43;font-size:8px;font-weight:950;letter-spacing:.24em}.countdown-core strong{display:block;margin:12px 0 8px;font-size:108px}.countdown-core span{font-size:9px;letter-spacing:.15em}.countdown-core>i{display:block;width:180px;height:3px;margin:20px auto;background:#ffffff14}.countdown-core>i b{display:block;height:100%;background:#d69b43}
.ride-notice-backdrop{position:absolute;inset:0;z-index:20;display:grid;place-items:center;padding:24px;background:rgba(2,12,25,.34);backdrop-filter:blur(5px)}.ride-notice{width:min(440px,calc(100vw - 40px));display:grid;grid-template-columns:auto 1fr;gap:18px;padding:24px;border:1px solid #ffffff3d;border-radius:12px;background:linear-gradient(145deg,#051930fa,#082646f5);box-shadow:0 30px 90px #0008}.ride-notice-icon{width:48px;height:48px;display:grid;place-items:center;border:1px solid #d69b4366;border-radius:10px;background:#d69b4318;color:#d69b43;font-size:20px}.ride-notice-copy small{display:block;color:#d69b43;font-size:7px;font-weight:950;letter-spacing:.2em}.ride-notice-copy h2{margin:6px 0 0;font-size:25px}.ride-notice-copy p{margin:7px 0 0;color:#ffffffa6;font-size:12px}.ride-notice button{grid-column:1/-1;height:48px;border:0;border-radius:7px;background:#f5f6f7;color:#071a38;padding:0 16px;display:flex;align-items:center;justify-content:space-between;font-weight:950;letter-spacing:.12em}
@media(max-width:850px){.fly-hud{padding:12px}.flight-brand{display:none}.route-card{grid-column:1/3}.instruments{right:12px;top:78px;transform:scale(.86);transform-origin:top right}.nav-map{right:12px;bottom:12px;width:230px;transform:scale(.84);transform-origin:bottom right}.control-card{left:12px;bottom:12px;width:calc(100vw - 225px);padding:16px}.control-card.on-foot{width:min(390px,calc(100vw - 24px))}.open-another-door{left:12px;top:74px}}
@media(max-width:620px){.route-card{transform:scale(.82);transform-origin:top center}.instruments{display:none}.nav-map{display:none}.control-card,.control-card.on-foot{width:calc(100vw - 24px)}.control-card h1{font-size:20px}.open-another-door{top:70px}.proximity-prompt{bottom:205px}}
`;
