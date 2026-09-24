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

// ============================================================
// HANGAR PAGE
// ============================================================

export default function HangarPage() {
  const go = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  const {
    activeFace,
    setActiveFace,
    liveries,
  } = usePlaneStore();

useEffect(() => {
  const audio = new Audio('/boot.mp3');
  audio.loop = true;      // repeat forever
  audio.volume = 0.35;    // 0 = silent, 1 = max. 0.3–0.45 is good for hangar music
  audioRef.current = audio;

  audio.play().catch(() => {
    const playOnce = () => {
      audio.play().catch(() => {});
      window.removeEventListener('pointerdown', playOnce);
    };
    window.addEventListener('pointerdown', playOnce, { once: true });
  });

  return () => {
    audio.pause();
    audio.src = '';
    audioRef.current = null;
  };
}, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(audioRef.current.muted);
  };

  const painted = FACES.every(
    (face) => Boolean(liveries[face])
  );

  return (
    <main className="launch-bay">
      <style>{LAUNCH_BAY_CSS}</style>

      <section className="launch-bay-layout">
        <aside className="launch-bay-editor">
          <div className="launch-bay-editor-head">
            <p className="launch-bay-prompt">
              Yo dawg, paint them flags so we can bounce outta here!
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
          </div>

          <div className="launch-bay-editor-body">
            <LiveryEditor />
          </div>
        </aside>

        <section className="launch-bay-preview">
          <div className="launch-bay-preview-top">
            <span
              className={`launch-bay-readiness-dot ${
                painted ? 'is-ready' : ''
              }`}
            />

            <SoundToggle muted={muted} onToggle={toggleSound} />

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
              <span>Move your pc mouse to move around the plane</span>
            </div>
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

  .launch-bay-layout {
    position: relative;
    z-index: 5;
    height: 100svh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
    max-width: 1680px;
    margin: 0 auto;
    padding: 24px clamp(22px, 5vw, 76px);
    gap: 20px;
  }

  .launch-bay-editor,
  .launch-bay-preview {
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .launch-bay-editor-head {
    min-height: 64px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .launch-bay-prompt {
    margin: 0;
    color: #071a38;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .launch-bay-faces {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
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
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(7, 26, 56, 0.09);
    border-radius: 8px;
    background: #edf2f5;
    box-shadow:
      0 24px 60px rgba(7, 26, 56, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.48);
  }

  .launch-bay-editor-body > * {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    height: 100%;
  }

  .launch-bay-preview-top {
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 14px;
    margin-bottom: 12px;
  }

  .launch-bay-readiness-dot {
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #b8bec5;
    margin-right: auto;
  }

  .launch-bay-readiness-dot.is-ready {
    background: #c58b3c;
    box-shadow: 0 0 0 4px rgba(197, 139, 60, 0.1);
  }

  .launch-bay-sound-toggle {
    width: 46px;
    height: 46px;
    flex: 0 0 auto;
    border: 1px solid rgba(7, 26, 56, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.7);
    color: rgba(7, 26, 56, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(7, 26, 56, 0.06);
    transition:
      color 150ms ease,
      border-color 150ms ease,
      transform 150ms ease,
      background 150ms ease;
  }

  .launch-bay-sound-toggle:hover {
    color: #0a2850;
    border-color: rgba(197, 139, 60, 0.45);
    transform: translateY(-2px);
  }

  .launch-bay-takeoff-button {
    min-width: 185px;
    height: 46px;
    padding: 0 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border: 0;
    border-radius: 8px;
    background: #dfe4e8;
    color: rgba(7, 26, 56, 0.3);
    font-size: 12px;
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

  .launch-bay-viewport {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    border: 1px solid rgba(7, 26, 56, 0.09);
    border-radius: 8px;
    background: #edf2f5;
    box-shadow:
      0 24px 60px rgba(7, 26, 56, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.48);
  }

  .launch-bay-viewport-label {
    position: absolute;
    left: 14px;
    bottom: 14px;
    color: rgba(7, 26, 56, 0.42);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    pointer-events: none;
  }

  @media (max-width: 1050px) {
    .launch-bay-layout {
      grid-template-columns: 1fr;
      height: auto;
      min-height: 100svh;
      overflow: auto;
    }

    .launch-bay-editor,
    .launch-bay-preview {
      height: auto;
    }

    .launch-bay-editor-body {
      min-height: 420px;
    }

    .launch-bay-viewport {
      min-height: 480px;
    }
  }

  @media (max-width: 650px) {
    .launch-bay-layout {
      padding: 22px 22px 30px;
      gap: 26px;
    }

    .launch-bay-prompt {
      font-size: 18px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .launch-bay-face,
    .launch-bay-sound-toggle,
    .launch-bay-takeoff-button {
      transition: none;
    }
  }
`;
