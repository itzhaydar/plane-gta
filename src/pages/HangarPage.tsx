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
  useEffect,
  useState,
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
  'flag-right', 
  'flag-left',
];


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
// ROAD / HANGAR ENVIRONMENT
// ============================================================

function Road() {
  return (
    <group>
      {/* Concrete hangar floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 24]} />
        <meshStandardMaterial color="#9a9388" roughness={0.96} />
      </mesh>

      {/* Dark service lane beneath the aircraft */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[7.6, 15]} />
        <meshStandardMaterial color="#34363a" roughness={0.94} />
      </mesh>

      {/* Gold taxi / maintenance markings */}
      {[-2.75, 2.75].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.019, 0]}>
          <planeGeometry args={[0.075, 15]} />
          <meshStandardMaterial color="#d2a24d" roughness={0.78} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, -3.7]}>
        <planeGeometry args={[5.6, 0.08]} />
        <meshStandardMaterial color="#eee7d9" roughness={0.8} />
      </mesh>

      {/* Rear hangar wall */}
      <mesh position={[0, 3.0, -6.3]} receiveShadow>
        <boxGeometry args={[15, 6, 0.22]} />
        <meshStandardMaterial color="#17202b" roughness={0.86} />
      </mesh>

      {/* Open door / warm Leonida daylight */}
      <mesh position={[0, 2.7, -6.16]}>
        <planeGeometry args={[7.8, 4.6]} />
        <meshBasicMaterial color="#e7b06e" />
      </mesh>
      <mesh position={[0, 1.55, -6.10]}>
        <planeGeometry args={[7.7, 2.25]} />
        <meshBasicMaterial color="#7fa7b4" />
      </mesh>

      {/* Hangar ribs */}
      {[-6.8, -4.6, 4.6, 6.8].map((x) => (
        <mesh key={x} position={[x, 2.9, -5.95]} castShadow>
          <boxGeometry args={[0.22, 5.8, 0.36]} />
          <meshStandardMaterial color="#252c34" metalness={0.35} roughness={0.65} />
        </mesh>
      ))}

      {/* Tool cabinets / airport clutter */}
      {[
        [-4.3, 0.45, -2.8, '#8d3f2f'],
        [4.15, 0.45, -2.45, '#d0a24f'],
        [4.65, 0.34, 2.6, '#26394e'],
      ].map(([x, y, z, color], i) => (
        <group key={i} position={[x as number, y as number, z as number]}>
          <RoundedBox args={[1.15, 0.8, 0.55]} radius={0.06} smoothness={2} castShadow>
            <meshStandardMaterial color={color as string} roughness={0.78} metalness={0.18} />
          </RoundedBox>
          {[0.18, 0, -0.18].map((yy) => (
            <mesh key={yy} position={[0, yy, 0.286]}>
              <boxGeometry args={[0.76, 0.025, 0.018]} />
              <meshBasicMaterial color="#171b21" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ceiling strip lights */}
      {[-4.4, 0, 4.4].map((x) => (
        <mesh key={x} position={[x, 4.75, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 0.13]} />
          <meshBasicMaterial color="#f6dfb0" />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
// PILOT
// ============================================================

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
}

// ============================================================
// COCKPIT SEAT
// ============================================================

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

// ============================================================
// SOUND TOGGLE (FA3-style volume icon)
// ============================================================

function SoundToggle({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="launch-bay-sound-toggle"
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
    >
      {muted ? (
        <svg viewBox="0 0 576 512" width="15" height="15" fill="currentColor">
          <path d="M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z" />
        </svg>
      ) : (
        <svg viewBox="0 0 576 512" width="15" height="15" fill="currentColor">
          <path d="M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425.6 88.3C476 138.7 512 209.2 512 288s-36 149.3-86.4 199.7c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9C435.6 410.9 464 353.3 464 288s-28.4-122.9-72.3-165.8c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0zM356.1 174.6C384 202.5 400 240.6 400 288s-16 85.5-43.9 113.4c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9C339.5 350.1 352 320.5 352 288s-12.5-62.1-29.7-79.4c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z" />
        </svg>
      )}
    </button>
  );
}


const TAKEOFF_SCORE = 80;

function loadCoverageImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function getPaintCoverage(edited: string | null, fallback: string) {
  if (!edited) return 0;
  try {
    const [painted, base] = await Promise.all([
      loadCoverageImage(edited),
      loadCoverageImage(fallback),
    ]);
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(base, 0, 0, size, size);
    const baseData = ctx.getImageData(0, 0, size, size).data;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(painted, 0, 0, size, size);
    const editData = ctx.getImageData(0, 0, size, size).data;

    let paintable = 0;
    let changed = 0;
    for (let i = 0; i < baseData.length; i += 4) {
      if (baseData[i + 3] < 12) continue;
      paintable++;
      const delta =
        Math.abs(baseData[i] - editData[i]) +
        Math.abs(baseData[i + 1] - editData[i + 1]) +
        Math.abs(baseData[i + 2] - editData[i + 2]) +
        Math.abs(baseData[i + 3] - editData[i + 3]);
      if (delta > 54) changed++;
    }
    return paintable ? Math.min(100, Math.round((changed / paintable) * 100)) : 0;
  } catch {
    return 0;
  }
}

// ============================================================
// HANGAR PAGE
// ============================================================

export default function HangarPage() {
  const go = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [introOpen, setIntroOpen] = useState(true);
  const [scores, setScores] = useState<Record<'flag-left' | 'flag-right', number>>({
    'flag-left': 0,
    'flag-right': 0,
  });

  const {
    activeFace,
    setActiveFace,
    liveries,
  } = usePlaneStore();

  useEffect(() => {
    const audio = new Audio('/boot.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    if (!audio.muted) audio.play().catch(() => {});
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getPaintCoverage(liveries['flag-left'], '/templates/flag-left.svg'),
      getPaintCoverage(liveries['flag-right'], '/templates/flag-right.svg'),
    ]).then(([left, right]) => {
      if (!cancelled) {
        setScores({
          'flag-left': left,
          'flag-right': right,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [liveries['flag-left'], liveries['flag-right']]);

  const bothReady =
    scores['flag-left'] >= TAKEOFF_SCORE &&
    scores['flag-right'] >= TAKEOFF_SCORE;

  const overallScore = Math.round(
    (scores['flag-left'] + scores['flag-right']) / 2,
  );

  return (
    <main className="launch-bay">
      <style>{LAUNCH_BAY_CSS}</style>

      {introOpen && (
        <div className="mission-intro">
          <div className="mission-card">
            <span className="mission-kicker">MARSHOUT / FREE FLIGHT</span>

            <h1>
              Yo, the ride’s <em>on me.</em>
            </h1>

            <p>
              Just paint both flags up nice, homie. Hit 80% on each side
              and we out.
            </p>

            <div className="mission-tip">
              <span className="pen-icon">✏️</span>

              <div>
                <b>DRAW ON IT. DON’T CROP IT.</b>
                <small>
                  Keep the flag shape and use the <strong>Draw</strong> tool
                  to paint it.
                </small>
              </div>
            </div>

            <button
              type="button"
              className="mission-ok"
              onClick={() => setIntroOpen(false)}
            >
              <span>BET, LET’S PAINT</span>
              <b>→</b>
            </button>
          </div>
        </div>
      )}

      <header className="hangar-topbar">
        <button
          type="button"
          className="top-door"
          onClick={() => go('/')}
        >
          <span className="top-door-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M3 11.2 12 4l9 7.2" />
              <path d="M5.5 10.2V21h13V10.2" />
              <path d="M9.5 21v-6.7h5V21" />
              <path d="M14.5 14.3h2.2" />
            </svg>
          </span>

          <span>
            <small>BACK TO THE BOULEVARD</small>
            <strong>OPEN ANOTHER DOOR</strong>
          </span>

          <b>↗</b>
        </button>

        <div className="hangar-title">
          <small>MARSHOUT / PLANE HANGAR</small>
          <strong>PAINT THE FLAGS</strong>
        </div>

        <SoundToggle
          muted={muted}
          onToggle={toggleSound}
        />
      </header>

      <section className="launch-bay-layout">
        <aside className="launch-bay-editor">
          <div className="launch-bay-editor-head">
            <div>
              <span className="panel-kicker">01 / PAINT SHOP</span>
              <p className="launch-bay-prompt">
                Paint them flags, homie, then we out.
              </p>
            </div>

            <div className="launch-bay-faces">
              {FACES.map((face) => {
                const score =
                  face === 'flag-left' || face === 'flag-right'
                    ? scores[face]
                    : 0;

                return (
                  <button
                    key={face}
                    type="button"
                    onClick={() => setActiveFace(face)}
                    className={`launch-bay-face ${
                      activeFace === face ? 'is-active' : ''
                    } ${score >= TAKEOFF_SCORE ? 'is-done' : ''}`}
                  >
                    <span>
                      {face === 'flag-left' ? 'LEFT FLAG' : 'RIGHT FLAG'}
                    </span>

                    <b>{score}%</b>

                    {score >= TAKEOFF_SCORE && (
                      <span className="launch-bay-check">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="draw-notice">
            <span>✏️</span>
            <p>
              <b>DON’T CROP THE FLAG.</b>
              <br />
              Paint it using the <strong>Draw</strong> tool.
            </p>
          </div>

          <div className="launch-bay-editor-body">
            <LiveryEditor />
          </div>
        </aside>

        <section className="launch-bay-preview">
          <div className="launch-bay-preview-top">
            <div className="preview-status">
              <span
                className={`launch-bay-readiness-dot ${
                  bothReady ? 'is-ready' : ''
                }`}
              />

              <div>
                <small>FLIGHT PREP</small>
                <strong>
                  {bothReady
                    ? 'BOTH FLAGS READY'
                    : `${overallScore}% COMBINED`}
                </strong>
              </div>
            </div>

            <SoundToggle
              muted={muted}
              onToggle={toggleSound}
            />

            <button
              type="button"
              disabled={!bothReady}
              className={`launch-bay-takeoff-button ${
                bothReady ? 'is-ready' : ''
              }`}
              onClick={() => {
                if (bothReady) go('/fly');
              }}
            >
              <span>
                {bothReady ? 'TAKE OFF' : 'BOTH FLAGS NEED 80%'}
              </span>
              <span className="launch-bay-arrow">→</span>
            </button>
          </div>

          <div className="preview-spacer" aria-hidden="true" />

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
                position: [4.6, 2.6, 4.8],
                fov: 40,
                near: 0.1,
                far: 50,
              }}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            >
              <color attach="background" args={['#202b38']} />
              <fog attach="fog" args={['#202b38', 12, 27]} />

              <hemisphereLight
                args={['#f5d7aa', '#27313a', 1.1]}
              />

              <directionalLight
                position={[5, 8, 5]}
                intensity={2.3}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />

              <pointLight
                position={[-4, 2.4, 1]}
                color="#e59b5b"
                intensity={13}
                distance={8}
              />

              <pointLight
                position={[4, 2.6, -1]}
                color="#6e9fc6"
                intensity={9}
                distance={8}
              />

              <Road />
              <Plane liveries={liveries} />

              <Suspense
                fallback={
                  <Html
                    center
                    style={{
                      color: '#f4d8a7',
                      fontSize: '9px',
                      fontWeight: 900,
                      letterSpacing: '.16em',
                    }}
                  >
                    PILOT CLOCKING IN…
                  </Html>
                }
              >
                <HangarMan position={[1.75, 0, -0.35]} />
              </Suspense>

              <OrbitControls
                makeDefault
                enablePan={false}
                enableDamping
                dampingFactor={0.12}
                minDistance={3.2}
                maxDistance={8}
                maxPolarAngle={1.3}
                minPolarAngle={0.35}
                target={[0, 0.7, 0]}
              />
            </Canvas>

            <div className="hangar-legend">
              <span>
                LEFT <b>{scores['flag-left']}%</b>
              </span>

              <i />

              <span>
                RIGHT <b>{scores['flag-right']}%</b>
              </span>
            </div>

            <div className="launch-bay-viewport-label">
              Drag to look around the plane
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

const LAUNCH_BAY_CSS = `
* { box-sizing: border-box; }

.launch-bay {
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  color: #071a38;
  background:
    radial-gradient(circle at 78% 18%, rgba(211, 162, 82, .12), transparent 27%),
    #f3f0e9;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.launch-bay button { font: inherit; }

.hangar-topbar {
  height: 84px;
  padding: 12px clamp(18px, 3vw, 46px);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid rgba(7, 26, 56, .1);
  background: rgba(248, 245, 238, .96);
}

.top-door {
  justify-self: start;
  min-height: 58px;
  padding: 7px 12px 7px 8px;
  border: 1px solid rgba(192, 139, 67, .55);
  border-radius: 9px;
  background: #071a38;
  color: white;
  display: grid;
  grid-template-columns: 43px auto 18px;
  align-items: center;
  gap: 11px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(7, 26, 56, .16);
  transition: 150ms ease;
}

.top-door:hover {
  transform: translateY(-2px);
  border-color: #d3a252;
}

.top-door-icon {
  width: 43px;
  height: 43px;
  border-radius: 7px;
  background: #d3a252;
  color: #071a38;
  display: grid;
  place-items: center;
}

.top-door-icon svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.top-door small,
.top-door strong {
  display: block;
}

.top-door small {
  color: rgba(255,255,255,.48);
  font-size: 6px;
  font-weight: 950;
  letter-spacing: .13em;
}

.top-door strong {
  margin-top: 3px;
  font-size: 9px;
  letter-spacing: .1em;
}

.top-door > b {
  color: #d3a252;
  font-size: 17px;
}

.hangar-title {
  text-align: center;
}

.hangar-title small,
.hangar-title strong {
  display: block;
}

.hangar-title small {
  color: #b77e38;
  font-size: 7px;
  font-weight: 950;
  letter-spacing: .18em;
}

.hangar-title strong {
  margin-top: 3px;
  font-size: 18px;
  letter-spacing: -.03em;
}

.launch-bay-sound-toggle {
  justify-self: end;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(7,26,56,.12);
  border-radius: 8px;
  background: white;
  color: #071a38;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.launch-bay-layout {
  height: calc(100svh - 84px);
  max-width: 1720px;
  margin: 0 auto;
  padding: 18px clamp(18px, 3vw, 46px) 26px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.launch-bay-editor,
.launch-bay-preview {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: 68px 48px minmax(0, 1fr);
  gap: 10px;
}

.launch-bay-preview {
  grid-template-rows: 68px 48px minmax(0, 1fr);
}

.launch-bay-editor-head,
.launch-bay-preview-top {
  min-height: 68px;
}

.launch-bay-editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.panel-kicker {
  color: #b77e38;
  font-size: 7px;
  font-weight: 950;
  letter-spacing: .15em;
}

.launch-bay-prompt {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 850;
  letter-spacing: -.02em;
}

.launch-bay-faces {
  display: flex;
  gap: 7px;
}

.launch-bay-face {
  min-width: 112px;
  min-height: 48px;
  padding: 8px 10px;
  border: 1px solid rgba(7,26,56,.11);
  border-radius: 7px;
  background: rgba(255,255,255,.65);
  color: rgba(7,26,56,.55);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 7px;
  font-weight: 950;
  letter-spacing: .09em;
}

.launch-bay-face b {
  color: #b77e38;
  font-size: 10px;
}

.launch-bay-face.is-active {
  background: #071a38;
  border-color: #071a38;
  color: white;
}

.launch-bay-face.is-done:not(.is-active) {
  border-color: rgba(52,111,83,.4);
  color: #356d52;
}

.launch-bay-check {
  font-size: 10px;
}

.draw-notice {
  min-height: 48px;
  margin: 0;
  padding: 8px 12px;
  border: 1px solid rgba(197,139,60,.3);
  border-radius: 7px;
  background: #fff8ea;
  display: flex;
  align-items: center;
  gap: 10px;
}

.draw-notice > span {
  font-size: 18px;
}

.draw-notice p {
  margin: 0;
  font-size: 8px;
  line-height: 1.45;
  letter-spacing: .04em;
}

.launch-bay-editor-body,
.launch-bay-viewport {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(7,26,56,.1);
  border-radius: 9px;
  background: #e7ebed;
  box-shadow: 0 22px 55px rgba(7,26,56,.09);
}

.launch-bay-editor-body {
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.launch-bay-editor-body > * {
  flex: 1 0 100%;
  width: 100%;
  min-width: 0;
  min-height: 620px;
  height: 100%;
}

/* Keep the Unlayer image-editor controls visible instead of clipping
   the lower Draw/Text/Shapes/Sticker/Frame controls. */
.launch-bay-editor-body > div {
  overflow: visible !important;
}

.preview-spacer {
  width: 100%;
  height: 48px;
  visibility: hidden;
}

.launch-bay-preview-top {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 11px;
}

.preview-status {
  margin-right: auto;
  display: flex;
  align-items: center;
  gap: 9px;
}

.preview-status small,
.preview-status strong {
  display: block;
}

.preview-status small {
  color: rgba(7,26,56,.42);
  font-size: 6px;
  font-weight: 950;
  letter-spacing: .13em;
}

.preview-status strong {
  margin-top: 2px;
  font-size: 9px;
  letter-spacing: .08em;
}

.launch-bay-readiness-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #aeb5bb;
}

.launch-bay-readiness-dot.is-ready {
  background: #3e805d;
  box-shadow: 0 0 0 4px rgba(62,128,93,.1);
}

.launch-bay-takeoff-button {
  min-width: 210px;
  height: 46px;
  padding: 0 15px;
  border: 0;
  border-radius: 7px;
  background: #d5d5d0;
  color: rgba(7,26,56,.34);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  font-size: 8px;
  font-weight: 950;
  letter-spacing: .1em;
  cursor: not-allowed;
}

.launch-bay-takeoff-button.is-ready {
  background: #071a38;
  color: white;
  cursor: pointer;
  box-shadow: 0 12px 25px rgba(7,26,56,.17);
}

.launch-bay-arrow {
  color: #d3a252;
  font-size: 17px;
}

.launch-bay-viewport {
  position: relative;
  background: #202b38;
}

.hangar-legend {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 8px 10px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 6px;
  background: rgba(7,17,29,.76);
  color: rgba(255,255,255,.62);
  display: flex;
  align-items: center;
  gap: 9px;
  backdrop-filter: blur(8px);
  font-size: 7px;
  font-weight: 950;
  letter-spacing: .1em;
}

.hangar-legend b {
  color: #d3a252;
}

.hangar-legend i {
  width: 1px;
  height: 14px;
  background: rgba(255,255,255,.15);
}

.launch-bay-viewport-label {
  position: absolute;
  left: 14px;
  bottom: 14px;
  padding: 7px 9px;
  border-radius: 5px;
  background: rgba(7,17,29,.65);
  color: rgba(255,255,255,.6);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: .07em;
  pointer-events: none;
}

.mission-intro {
  position: fixed;
  inset: 0;
  z-index: 100;
  padding: 20px;
  background: rgba(5,12,22,.84);
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
}

.mission-card {
  width: min(530px, 100%);
  padding: 34px;
  border: 1px solid rgba(211,162,82,.45);
  border-radius: 10px;
  background: #f3eee4;
  color: #071a38;
  box-shadow: 0 35px 90px rgba(0,0,0,.35);
}

.mission-kicker {
  color: #b77e38;
  font-size: 7px;
  font-weight: 950;
  letter-spacing: .18em;
}

.mission-card h1 {
  margin: 14px 0 15px;
  font-size: clamp(40px,5vw,61px);
  line-height: .9;
  letter-spacing: -.06em;
  text-transform: uppercase;
}

.mission-card h1 em {
  color: #bd8240;
  font-family: Georgia, serif;
  font-weight: 400;
  text-transform: none;
}

.mission-card > p {
  margin: 0;
  max-width: 420px;
  color: rgba(7,26,56,.67);
  font-size: 13px;
  line-height: 1.55;
}

.mission-tip {
  margin: 22px 0;
  padding: 13px;
  border: 1px solid rgba(197,139,60,.3);
  border-radius: 7px;
  background: #fff8e9;
  display: flex;
  gap: 12px;
}

.pen-icon {
  font-size: 22px;
}

.mission-tip b,
.mission-tip small {
  display: block;
}

.mission-tip b {
  font-size: 9px;
  letter-spacing: .1em;
}

.mission-tip small {
  margin-top: 3px;
  color: rgba(7,26,56,.6);
  font-size: 9px;
}

.mission-ok {
  width: 100%;
  height: 54px;
  padding: 0 16px;
  border: 0;
  border-radius: 7px;
  background: #071a38;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 9px;
  font-weight: 950;
  letter-spacing: .12em;
}

.mission-ok b {
  color: #d3a252;
  font-size: 18px;
}

@media (max-width: 820px) {
  .launch-bay {
    overflow: auto;
  }

  .launch-bay-layout {
    height: auto;
    min-height: calc(100svh - 84px);
    grid-template-columns: 1fr;
  }

  .launch-bay-editor,
  .launch-bay-preview {
    display: flex;
    flex-direction: column;
  }

  .preview-spacer {
    display: none;
  }

  .launch-bay-editor-body {
    min-height: 620px;
  }

  .launch-bay-viewport {
    min-height: 620px;
  }
}

@media (max-width: 650px) {
  .hangar-topbar {
    height: auto;
    padding: 10px 12px;
    grid-template-columns: 1fr auto;
  }

  .hangar-title {
    display: none;
  }

  .top-door {
    min-height: 52px;
  }

  .top-door small {
    display: none;
  }

  .launch-bay-layout {
    padding: 14px 12px 24px;
  }

  .launch-bay-editor-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .launch-bay-faces {
    width: 100%;
  }

  .launch-bay-face {
    flex: 1;
    min-width: 0;
  }

  .launch-bay-preview-top {
    flex-wrap: wrap;
  }

  .preview-status {
    width: 100%;
  }

  .launch-bay-takeoff-button {
    flex: 1;
    min-width: 0;
  }

  .mission-card {
    padding: 26px 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .top-door {
    transition: none;
  }
}
`;
