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
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import LiveryEditor from '../components/LiveryEditor';
import { usePlaneStore, type RocketFace } from '../store';

// ============================================================
// ROCKET LIVERY — completely separate from the plane artwork.
// insu.svg = upper insignia
// insl.svg = lower insignia
// ============================================================

const FACES: RocketFace[] = ['insu', 'insl'];

const UPPER_PANEL_FALLBACK = '/templates/insu.svg';
const LOWER_PANEL_FALLBACK = '/templates/insl.svg';

useGLTF.preload('/astro.glb');

// ============================================================
// EDITABLE MISSION PANEL MATERIAL
// ============================================================

function MissionSkin({
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
      polygonOffsetFactor={-2}
      polygonOffsetUnits={-2}
    />
  );
}

// ============================================================
// ASTRO — MARS CREW MODEL
// ============================================================

const ASTRO_HEIGHT = 1.32;

function HangarMan({
  position = [1.7, 0, 0.55] as [number, number, number],
}) {
  const invalidate = useThree((state) => state.invalidate);
  const { scene, animations } = useGLTF('/astro.glb');

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
    const scale = ASTRO_HEIGHT / Math.max(size.y, 1e-6);

    clone.scale.multiplyScalar(scale);
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
    if (!mixer) return;
    mixer.update(delta);
    invalidate();
  });

  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={man} />
    </group>
  );
}

// ============================================================
// SCI-FI LAUNCH BAY ENVIRONMENT
// No trees. No fire. Rocket is parked for preparation.
// ============================================================

function GroundRing({
  radius,
  width = 0.025,
  opacity = 0.3,
}: {
  radius: number;
  width?: number;
  opacity?: number;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <ringGeometry args={[radius - width, radius, 96]} />
      <meshBasicMaterial
        color="#b78445"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function FloodLight({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.96, 10]} />
        <meshStandardMaterial
          color="#48535e"
          metalness={0.75}
          roughness={0.32}
        />
      </mesh>

      <RoundedBox
        args={[0.26, 0.16, 0.12]}
        radius={0.025}
        smoothness={3}
        position={[0, 0.94, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#17202a"
          metalness={0.6}
          roughness={0.32}
        />
      </RoundedBox>

      <mesh position={[0, 0.94, -0.065]}>
        <planeGeometry args={[0.19, 0.09]} />
        <meshBasicMaterial color="#fff0d8" toneMapped={false} />
      </mesh>
    </group>
  );
}

function EquipmentCrate({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox
        args={[0.62, 0.38, 0.48]}
        radius={0.045}
        smoothness={4}
        position={[0, 0.19, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#273440"
          metalness={0.45}
          roughness={0.55}
        />
      </RoundedBox>

      <mesh position={[0, 0.2, 0.246]}>
        <planeGeometry args={[0.34, 0.08]} />
        <meshBasicMaterial color="#d79a46" toneMapped={false} />
      </mesh>
    </group>
  );
}

function ScienceConsole({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox
        args={[0.72, 0.46, 0.36]}
        radius={0.055}
        smoothness={4}
        position={[0, 0.23, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#25323d"
          metalness={0.55}
          roughness={0.42}
        />
      </RoundedBox>

      <mesh position={[0, 0.31, -0.186]}>
        <planeGeometry args={[0.47, 0.19]} />
        <meshBasicMaterial color="#ffd6a0" toneMapped={false} />
      </mesh>

      {[-0.2, 0, 0.2].map((x, index) => (
        <mesh key={x} position={[x, 0.11, -0.19]}>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial
            color={index === 1 ? '#d79a46' : '#8fd6e9'}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function LaunchBayEnvironment() {
  return (
    <group>
      {/* Main concrete / composite pad */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.015, 0]}
        receiveShadow
      >
        <circleGeometry args={[6.8, 96]} />
        <meshStandardMaterial
          color="#aeb7bd"
          roughness={0.88}
          metalness={0.05}
        />
      </mesh>

      {/* Dark center launch platform */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        receiveShadow
      >
        <cylinderGeometry args={[1.35, 1.42, 0.07, 64]} />
        <meshStandardMaterial
          color="#505b65"
          roughness={0.72}
          metalness={0.25}
        />
      </mesh>

      <GroundRing radius={1.75} width={0.035} opacity={0.42} />
      <GroundRing radius={2.55} width={0.018} opacity={0.25} />
      <GroundRing radius={4.45} width={0.014} opacity={0.17} />

      {/* Radial technical markings */}
      {Array.from({ length: 12 }).map((_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        const x = Math.sin(angle) * 2.15;
        const z = Math.cos(angle) * 2.15;

        return (
          <mesh
            key={index}
            rotation={[-Math.PI / 2, 0, -angle]}
            position={[x, 0.016, z]}
          >
            <planeGeometry args={[0.035, 0.46]} />
            <meshBasicMaterial
              color={index % 3 === 0 ? '#d79a46' : '#61788e'}
              transparent
              opacity={0.65}
            />
          </mesh>
        );
      })}

      {/* Science / launch equipment */}
      <ScienceConsole
        position={[-2.55, 0, -1.45]}
        rotation={[0, 0.55, 0]}
      />
      <ScienceConsole
        position={[2.65, 0, -1.25]}
        rotation={[0, -0.55, 0]}
      />

      <EquipmentCrate position={[-3.2, 0, 1.2]} scale={0.88} />
      <EquipmentCrate position={[3.15, 0, 1.55]} scale={0.8} />

      <FloodLight
        position={[-3.8, 0, -2.4]}
        rotation={[0, 0.55, 0]}
      />
      <FloodLight
        position={[3.8, 0, -2.4]}
        rotation={[0, -0.55, 0]}
      />
      <FloodLight
        position={[-3.9, 0, 2.5]}
        rotation={[0, 2.55, 0]}
      />
      <FloodLight
        position={[3.9, 0, 2.5]}
        rotation={[0, -2.55, 0]}
      />

      {/* Small perimeter bollards */}
      {Array.from({ length: 10 }).map((_, index) => {
        const angle = (index / 10) * Math.PI * 2 + 0.2;
        const radius = 4.8;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        return (
          <group key={`bollard-${index}`} position={[x, 0, z]}>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.045, 0.06, 0.28, 12]} />
              <meshStandardMaterial
                color="#485660"
                metalness={0.65}
                roughness={0.35}
              />
            </mesh>

            <mesh position={[0, 0.29, 0]}>
              <sphereGeometry args={[0.055, 12, 8]} />
              <meshBasicMaterial
                color={index % 2 ? '#8fd6e9' : '#d79a46'}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ============================================================
// ROCKET COMPONENTS
// ============================================================

function Porthole({ y }: { y: number }) {
  return (
    <group position={[0, y, 0.391]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.105, 0.025, 12, 32]} />
        <meshStandardMaterial
          color="#24313c"
          metalness={0.82}
          roughness={0.25}
        />
      </mesh>

      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[0.08, 28]} />
        <meshStandardMaterial
          color="#16384d"
          metalness={0.35}
          roughness={0.18}
          emissive="#17394a"
          emissiveIntensity={0.18}
        />
      </mesh>
    </group>
  );
}

function RocketFin({
  angle,
}: {
  angle: number;
}) {
  return (
    <group rotation={[0, angle, 0]}>
      <mesh
        position={[0, 0.63, 0.56]}
        rotation={[0, 0, 0]}
        castShadow
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                -0.03, 0.62, 0,
                 0.03, 0.62, 0,
                 0.03, -0.58, 0,
                -0.03, -0.58, 0,

                -0.03, 0.62, 0.04,
                 0.03, 0.62, 0.04,
                 0.03, -0.58, 0.04,
                -0.03, -0.58, 0.04,
              ]),
              3,
            ]}
          />
          <bufferAttribute
            attach="index"
            args={[
              new Uint16Array([
                0, 1, 2, 0, 2, 3,
                4, 6, 5, 4, 7, 6,
                0, 4, 5, 0, 5, 1,
                1, 5, 6, 1, 6, 2,
                2, 6, 7, 2, 7, 3,
                3, 7, 4, 3, 4, 0,
              ]),
              1,
            ]}
          />
        </bufferGeometry>
        <meshStandardMaterial
          color="#173554"
          metalness={0.48}
          roughness={0.36}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* outer fin shape, deliberately simple */}
      <mesh position={[0, 0.42, 0.72]} castShadow>
        <coneGeometry args={[0.28, 0.92, 3]} />
        <meshStandardMaterial
          color="#173554"
          metalness={0.48}
          roughness={0.36}
        />
      </mesh>
    </group>
  );
}

function LandingLeg({
  angle,
}: {
  angle: number;
}) {
  return (
    <group rotation={[0, angle, 0]}>
      <mesh
        position={[0, 0.42, 0.56]}
        rotation={[0.42, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.028, 0.035, 0.72, 12]} />
        <meshStandardMaterial
          color="#66727c"
          metalness={0.85}
          roughness={0.24}
        />
      </mesh>

      <mesh position={[0, 0.08, 0.71]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.055, 20]} />
        <meshStandardMaterial
          color="#343d44"
          metalness={0.55}
          roughness={0.42}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// EDITABLE MISSION PANELS
// ============================================================

function MissionPanel({
  livery,
  position,
  fallback,
}: {
  livery: string | null;
  position: [number, number, number];
  fallback: string;
}) {
  return (
    <group position={position}>
      {/* Bright white physical wrapper, intentionally visible even before editing */}
      <RoundedBox
        args={[0.46, 0.30, 0.035]}
        radius={0.035}
        smoothness={4}
        renderOrder={2}
        castShadow
      >
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.08}
          metalness={0.02}
          roughness={0.30}
        />
      </RoundedBox>

      {/* The saved editor result is drawn directly over the white wrapper */}
      <mesh position={[0, 0, 0.021]} renderOrder={3}>
        <planeGeometry args={[0.405, 0.245]} />
        <MissionSkin url={livery} fallback={fallback} />
      </mesh>
    </group>
  );
}

// ============================================================
// MAIN ROCKET
// ============================================================

function Rocket({
  liveries,
}: {
  liveries: Record<RocketFace, string | null>;
}) {
  return (
    <group position={[0, 0.08, 0]} scale={1.12}>
      {/* lower engine skirt */}
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.66, 0.66, 40]} />
        <meshStandardMaterial
          color="#9da8b0"
          metalness={0.72}
          roughness={0.3}
        />
      </mesh>

      {/* dark lower band */}
      <mesh position={[0, 0.79, 0]} castShadow>
        <cylinderGeometry args={[0.505, 0.53, 0.17, 40]} />
        <meshStandardMaterial
          color="#173554"
          metalness={0.5}
          roughness={0.32}
        />
      </mesh>

      {/* main body */}
      <mesh position={[0, 1.82, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.51, 1.95, 48]} />
        <meshStandardMaterial
          color="#e4e8eb"
          metalness={0.38}
          roughness={0.34}
        />
      </mesh>

      {/* upper shoulder */}
      <mesh position={[0, 2.87, 0]} castShadow>
        <cylinderGeometry args={[0.39, 0.48, 0.25, 48]} />
        <meshStandardMaterial
          color="#e2e7ea"
          metalness={0.38}
          roughness={0.34}
        />
      </mesh>

      {/* nose cone */}
      <mesh position={[0, 3.48, 0]} castShadow>
        <coneGeometry args={[0.39, 1.02, 48]} />
        <meshStandardMaterial
          color="#f1f3f4"
          metalness={0.34}
          roughness={0.3}
        />
      </mesh>

      {/* navy nose cap */}
      <mesh position={[0, 3.88, 0]} castShadow>
        <coneGeometry args={[0.20, 0.32, 40]} />
        <meshStandardMaterial
          color="#173554"
          metalness={0.52}
          roughness={0.27}
        />
      </mesh>

      {/* small structural rings */}
      {[0.91, 2.73, 3.02].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <torusGeometry args={[0.495, 0.026, 12, 48]} />
          <meshStandardMaterial
            color="#73808a"
            metalness={0.75}
            roughness={0.25}
          />
        </mesh>
      ))}

      {/* front windows */}
      <Porthole y={2.43} />
      <Porthole y={2.10} />
      <Porthole y={1.77} />

      {/* Rocket-only insignias. These never share the plane's livery keys. */}
      <MissionPanel
        livery={liveries.insu}
        fallback={UPPER_PANEL_FALLBACK}
        position={[0, 2.56, 0.435]}
      />
      <MissionPanel
        livery={liveries.insl}
        fallback={LOWER_PANEL_FALLBACK}
        position={[0, 1.28, 0.495]}
      />

      {/* stabilizer fins */}
      <RocketFin angle={0} />
      <RocketFin angle={(Math.PI * 2) / 3} />
      <RocketFin angle={(Math.PI * 4) / 3} />

      {/* landing legs */}
      <LandingLeg angle={Math.PI / 3} />
      <LandingLeg angle={Math.PI} />
      <LandingLeg angle={(Math.PI * 5) / 3} />

      {/* engine bells - NO FIRE in hangar */}
      {[-0.18, 0, 0.18].map((x) => (
        <mesh
          key={x}
          position={[x, 0.11, 0]}
          rotation={[Math.PI, 0, 0]}
          castShadow
        >
          <coneGeometry args={[0.11, 0.25, 20]} />
          <meshStandardMaterial
            color="#343d44"
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
// SOUND
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
      className="rocket-bay-sound-toggle"
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
    >
      {muted ? (
        <svg viewBox="0 0 576 512" width="15" height="15" fill="currentColor">
          <path d="M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z" />
        </svg>
      ) : (
        <svg viewBox="0 0 576 512" width="15" height="15" fill="currentColor">
          <path d="M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425.6 88.3C476 138.7 512 209.2 512 288s-36 149.3-86.4 199.7c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9C435.6 410.9 464 353.3 464 288s-28.4-122.9-72.3-165.8c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0zM356.1 174.6C384 202.5 400 240.6 400 288s-16 85.5-43.9 113.4c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6-33.9 0C339.5 350.1 352 320.5 352 288s-12.5-62.1-29.7-79.4c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z" />
        </svg>
      )}
    </button>
  );
}

// ============================================================
// LABEL HELPERS
// ============================================================

function faceLabel(face: RocketFace) {
  if (face === 'insu') return 'UPPER INSIGNIA';
  if (face === 'insl') return 'LOWER INSIGNIA';
  return String(face).toUpperCase();
}


const TAKEOFF_SCORE = 80;

function loadCoverageImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load paint image: ${src}`));
    image.src = src;
  });
}

async function getPaintCoverage(
  editedUrl: string | null,
  fallbackUrl: string,
): Promise<number> {
  if (!editedUrl) return 0;

  const [edited, original] = await Promise.all([
    loadCoverageImage(editedUrl),
    loadCoverageImage(fallbackUrl),
  ]);

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(original, 0, 0, size, size);
  const base = ctx.getImageData(0, 0, size, size).data;

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(edited, 0, 0, size, size);
  const changed = ctx.getImageData(0, 0, size, size).data;

  let paintable = 0;
  let painted = 0;

  for (let i = 0; i < base.length; i += 4) {
    // Only score pixels that belong to the original SVG artwork/panel.
    if (base[i + 3] < 12) continue;
    paintable += 1;

    const delta =
      Math.abs(base[i] - changed[i]) +
      Math.abs(base[i + 1] - changed[i + 1]) +
      Math.abs(base[i + 2] - changed[i + 2]) +
      Math.abs(base[i + 3] - changed[i + 3]);

    // Small antialiasing/export differences do not count as paint.
    if (delta > 54) painted += 1;
  }

  if (!paintable) return 0;
  return Math.max(0, Math.min(100, Math.round((painted / paintable) * 100)));
}

// ============================================================
// ROCKHANGAR PAGE
// ============================================================

export default function RockHangar() {
  const go = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [introOpen, setIntroOpen] = useState(true);
  const [markHelpOpen, setMarkHelpOpen] = useState(false);

  const {
    activeFace,
    setActiveFace,
    liveries,
  } = usePlaneStore();

  const rocketLiveries: Record<RocketFace, string | null> = {
    insu: liveries.insu,
    insl: liveries.insl,
  };

  const rocketActiveFace: RocketFace =
    activeFace === 'insu' || activeFace === 'insl' ? activeFace : 'insu';

  const [paintScores, setPaintScores] = useState<Record<RocketFace, number>>({
    insu: 0,
    insl: 0,
  });

  useEffect(() => {
    if (activeFace !== 'insu' && activeFace !== 'insl') {
      setActiveFace('insu');
    }
  }, [activeFace, setActiveFace]);

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

    if (!audio.muted) {
      audio.play().catch(() => {});
    }
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getPaintCoverage(rocketLiveries.insu, UPPER_PANEL_FALLBACK),
      getPaintCoverage(rocketLiveries.insl, LOWER_PANEL_FALLBACK),
    ])
      .then(([upper, lower]) => {
        if (!cancelled) setPaintScores({ insu: upper, insl: lower });
      })
      .catch(() => {
        if (!cancelled) setPaintScores({ insu: 0, insl: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [rocketLiveries.insu, rocketLiveries.insl]);

  const paintScore = Math.round((paintScores.insu + paintScores.insl) / 2);
  const painted =
    paintScores.insu >= TAKEOFF_SCORE &&
    paintScores.insl >= TAKEOFF_SCORE;

  return (
    <main className="rocket-bay">
      <style>{ROCKET_BAY_CSS}</style>

      {markHelpOpen && (
        <div
          className="mark-help-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="How to mark"
        >
          <div className="mark-help-card">
            <button
              type="button"
              className="mark-help-close"
              onClick={() => setMarkHelpOpen(false)}
              aria-label="Close how to mark"
            >
              ×
            </button>

            <span className="mark-help-kicker">HOW TO MARK</span>
            <h2>Mark it faster. ✏️</h2>
            <p>
              Tap <strong>Draw ✏️</strong>, and increase the size of the draw paint
              so you can mark the insignia faster.
            </p>
          </div>
        </div>
      )}

      {introOpen && (
        <div className="mars-mission-intro">
          <div className="mars-mission-card">
            <span className="mars-mission-kicker">MARSHOUT / MARS TRANSFER BRIEFING</span>

            <h1>
              Your Mars seat is <em>cleared.</em>
            </h1>

            <p>
              Transfer fare is zero. Before departure, mission protocol requires
              both the <strong>upper</strong> and <strong>lower insignias</strong>
              to be flight-marked to at least {TAKEOFF_SCORE}% coverage.
            </p>

            <div className="mars-mission-tip">
              <span className="mars-orbit-icon">◉</span>
              <div>
                <b>COMPLETE BOTH VEHICLE MARKINGS.</b>
                <small>
                  Use the <strong>Draw</strong> tool on each insignia. Preserve
                  the panel geometry; apply your markings directly to the surface.
                </small>
              </div>
            </div>

            <button
              type="button"
              className="mars-mission-ok"
              onClick={() => setIntroOpen(false)}
            >
              <span>BEGIN PRE-FLIGHT MARKING</span>
              <b>→</b>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="mark-help-top"
        onClick={() => setMarkHelpOpen(true)}
      >
        HOW TO MARK <span>✏️</span>
      </button>

      <header className="rocket-hangar-topbar">
        <button
          type="button"
          className="rocket-top-door"
          onClick={() => go('/')}
        >
          <span className="rocket-top-door-icon" aria-hidden="true">
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

        <div className="rocket-hangar-title">
          <small>MARSHOUT / MARS LAUNCH BAY</small>
          <strong>MARK THE INSIGNIAS</strong>
        </div>

        <SoundToggle muted={muted} onToggle={toggleSound} />
      </header>

      <section className="rocket-bay-layout">
        <aside className="rocket-bay-editor">
          <div className="rocket-bay-editor-head">
            <p className="rocket-bay-prompt">
              Flight marking protocol: complete the upper and lower insignias before Mars departure.
            </p>

            <div className="rocket-bay-faces">
              {FACES.map((face) => (
                <button
                  key={face}
                  type="button"
                  onClick={() => setActiveFace(face)}
                  className={`rocket-bay-face ${
                    rocketActiveFace === face ? 'is-active' : ''
                  } ${paintScores[face] >= TAKEOFF_SCORE ? 'is-done' : ''}`}
                >
                  <span>{faceLabel(face)}</span>
                  <b>{paintScores[face]}%</b>
                  {paintScores[face] >= TAKEOFF_SCORE && (
                    <span className="rocket-bay-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rocket-bay-editor-body">
            <LiveryEditor />
          </div>
        </aside>

        <section className="rocket-bay-preview">
          <div className="rocket-bay-preview-top">
            <span
              className={`rocket-bay-readiness-dot ${
                painted ? 'is-ready' : ''
              }`}
            />

            <span className="rocket-bay-status">
              {painted ? 'MARS VEHICLE READY' : `PAINT COVERAGE ${paintScore}% / ${TAKEOFF_SCORE}%`}
            </span>

            <div className="rocket-bay-score" aria-label={`Paint coverage ${paintScore}%`}>
              <span style={{ width: `${paintScore}%` }} />
            </div>

            <div className="rocket-insignia-scores" aria-label="Individual insignia coverage">
              <span>UPPER <b>{paintScores.insu}%</b></span>
              <i />
              <span>LOWER <b>{paintScores.insl}%</b></span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (painted) {
                  go('/fly-rocket');
                }
              }}
              disabled={!painted}
              className={`rocket-bay-launch-button ${
                painted ? 'is-ready' : ''
              }`}
            >
              <span>{painted ? 'LAUNCH TO MARS' : `PAINT TO ${TAKEOFF_SCORE}% · ${paintScore}%`}</span>
              <span className="rocket-bay-arrow">→</span>
            </button>
          </div>

          <div className="rocket-bay-viewport">
            <Canvas
              shadows
              dpr={[1, 1.35]}
              frameloop="demand"
              gl={{
                antialias: true,
                powerPreference: 'high-performance',
                alpha: false,
                stencil: false,
              }}
camera={{
  position: [6.5, 3.2, 7.2],
  fov: 36,
  near: 0.1,
  far: 60,
}}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            >
              <color
                attach="background"
                args={['#17243a']}
              />

              <fog attach="fog" args={['#17243a', 9, 24]} />

              <ambientLight intensity={0.46} />

              <hemisphereLight
                intensity={0.65}
                color="#ffcf9f"
                groundColor="#18222e"
              />

              <directionalLight
                position={[5, 9, 5]}
                intensity={2.35}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />

              <directionalLight
                position={[-5, 4, -5]}
                intensity={0.72}
              />

              <pointLight
                position={[-3.4, 2.2, 2.8]}
                color="#ff8f5a"
                intensity={15}
                distance={8}
                decay={2}
              />
              <pointLight
                position={[3.5, 2.4, -2.4]}
                color="#6ca9df"
                intensity={10}
                distance={8}
                decay={2}
              />

              <pointLight
                position={[0, 4.8, 1.8]}
                color="#d79a46"
                intensity={5}
                distance={10}
                decay={2}
              />

              <LaunchBayEnvironment />
              <Rocket liveries={rocketLiveries} />

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
                    ASTRO RUNNING PRE-FLIGHT…
                  </Html>
                }
              >
                <HangarMan position={[1.7, 0, 0.7]} />
              </Suspense>

              <OrbitControls
                makeDefault
                enablePan={false}
                enableDamping
                dampingFactor={0.1}
                minDistance={3.6}
                maxDistance={10}
                maxPolarAngle={1.48}
                minPolarAngle={0.18}
                target={[0, 1.65, 0]}
              />
            </Canvas>

            <div className="rocket-bay-viewport-label">
              <span>DRAG TO INSPECT • SCROLL TO ZOOM • MARS VEHICLE 01</span>
            </div>

            <div className="rocket-bay-corner">
              <span>VICE CITY / MARS TRANSFER VEHICLE</span>
              <strong>01</strong>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

// ============================================================
// STYLES
// ============================================================

const ROCKET_BAY_CSS = `
  .rocket-bay {
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

  .rocket-bay::before {
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

  .rocket-bay-layout {
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

  .rocket-bay-editor,
  .rocket-bay-preview {
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .rocket-bay-editor-head {
    min-height: 64px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .rocket-bay-prompt {
    margin: 0;
    color: #071a38;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .rocket-bay-faces {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .rocket-bay-face {
    min-width: 112px;
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

  .rocket-bay-face:hover {
    transform: translateY(-2px);
    border-color: rgba(197, 139, 60, 0.45);
  }

  .rocket-bay-face.is-active {
    border-color: #0a2850;
    background: #0a2850;
    color: #ffffff;
  }

  .rocket-bay-face.is-done:not(.is-active) {
    border-color: rgba(52, 111, 83, 0.28);
    background: rgba(52, 111, 83, 0.08);
    color: #356d52;
  }

  .rocket-bay-check {
    font-size: 10px;
  }

  .rocket-bay-editor-body {
    flex: 1 1 auto;
    min-height: 520px;
    max-height: 72vh;
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

  .rocket-bay-editor-body > * {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    height: 100%;
  }

  .rocket-bay-preview-top {
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 12px;
  }

  .rocket-bay-readiness-dot {
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #b8bec5;
  }

  .rocket-bay-readiness-dot.is-ready {
    background: #c58b3c;
    box-shadow: 0 0 0 4px rgba(197, 139, 60, 0.1);
  }

  .rocket-bay-status {
    margin-right: auto;
    color: rgba(7, 26, 56, 0.42);
    font-size: 8px;
    font-weight: 950;
    letter-spacing: 0.14em;
  }


  .rocket-bay-score {
    width: 88px;
    height: 5px;
    flex: 0 0 auto;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(7, 26, 56, 0.10);
  }

  .rocket-bay-score span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #c58b3c;
    transition: width 220ms ease;
  }

  .rocket-bay-door-button {
    height: 46px;
    padding: 0 14px;
    flex: 0 0 auto;
    border: 1px solid rgba(7, 26, 56, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.72);
    color: #071a38;
    cursor: pointer;
    font-size: 8px;
    font-weight: 950;
    letter-spacing: 0.12em;
    white-space: nowrap;
    transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
  }

  .rocket-bay-door-button:hover {
    transform: translateY(-2px);
    border-color: rgba(197, 139, 60, 0.48);
    background: #ffffff;
  }

  .rocket-bay-sound-toggle {
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

  .rocket-bay-sound-toggle:hover {
    color: #0a2850;
    border-color: rgba(197, 139, 60, 0.45);
    transform: translateY(-2px);
  }

  .rocket-bay-launch-button {
    min-width: 205px;
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
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.13em;
    cursor: not-allowed;
    transition:
      transform 150ms ease,
      background 150ms ease;
  }

  .rocket-bay-launch-button.is-ready {
    background: #0a2850;
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 12px 25px rgba(7, 26, 56, 0.14);
  }

  .rocket-bay-launch-button.is-ready:hover {
    transform: translateY(-2px);
    background: #123b6b;
  }

  .rocket-bay-arrow {
    color: #d8a35c;
    font-size: 16px;
  }

  .rocket-bay-viewport {
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

  .rocket-bay-viewport-label {
    position: absolute;
    left: 14px;
    bottom: 14px;
    color: rgba(7, 26, 56, 0.42);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    pointer-events: none;
  }

  .rocket-bay-corner {
    position: absolute;
    right: 14px;
    bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(7, 26, 56, 0.32);
    pointer-events: none;
  }

  .rocket-bay-corner span {
    font-size: 7px;
    font-weight: 950;
    letter-spacing: 0.16em;
  }

  .rocket-bay-corner strong {
    font-size: 11px;
    color: #c58b3c;
  }


  .rocket-hangar-topbar {
    position: relative;
    z-index: 20;
    height: 84px;
    padding: 12px clamp(18px, 3vw, 46px);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 18px;
    border-bottom: 1px solid rgba(7, 26, 56, 0.1);
    background: rgba(248, 245, 238, 0.96);
    backdrop-filter: blur(16px);
  }

  .rocket-top-door {
    justify-self: start;
    min-height: 58px;
    padding: 7px 12px 7px 8px;
    border: 1px solid rgba(192, 139, 67, 0.55);
    border-radius: 9px;
    background: #071a38;
    color: #fff;
    display: grid;
    grid-template-columns: 43px auto 18px;
    align-items: center;
    gap: 11px;
    text-align: left;
    cursor: pointer;
    box-shadow: 0 12px 28px rgba(7, 26, 56, 0.16);
    transition: 150ms ease;
  }

  .rocket-top-door:hover {
    transform: translateY(-2px);
    border-color: #d3a252;
  }

  .rocket-top-door-icon {
    width: 43px;
    height: 43px;
    border-radius: 7px;
    background: #d3a252;
    color: #071a38;
    display: grid;
    place-items: center;
  }

  .rocket-top-door-icon svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .rocket-top-door small,
  .rocket-top-door strong {
    display: block;
  }

  .rocket-top-door small {
    color: rgba(255,255,255,.48);
    font-size: 6px;
    font-weight: 950;
    letter-spacing: .13em;
  }

  .rocket-top-door strong {
    margin-top: 3px;
    font-size: 9px;
    letter-spacing: .1em;
  }

  .rocket-top-door > b {
    color: #d3a252;
    font-size: 17px;
  }

  .rocket-hangar-title {
    text-align: center;
  }

  .rocket-hangar-title small,
  .rocket-hangar-title strong {
    display: block;
  }

  .rocket-hangar-title small {
    color: #b77e38;
    font-size: 7px;
    font-weight: 950;
    letter-spacing: .18em;
  }

  .rocket-hangar-title strong {
    margin-top: 3px;
    font-size: 18px;
    letter-spacing: -.03em;
  }

  .rocket-hangar-topbar .rocket-bay-sound-toggle {
    justify-self: end;
    background: #fff;
  }

  .mars-mission-intro {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 24px;
    background:
      radial-gradient(circle at 50% 35%, rgba(211, 162, 82, .16), transparent 28%),
      rgba(4, 13, 29, .82);
    backdrop-filter: blur(12px);
  }

  .mars-mission-card {
    width: min(520px, 100%);
    padding: 34px;
    border: 1px solid rgba(211, 162, 82, .55);
    border-radius: 12px;
    color: #f8f3e8;
    background:
      linear-gradient(145deg, rgba(18, 42, 72, .98), rgba(5, 20, 43, .99));
    box-shadow:
      0 30px 90px rgba(0,0,0,.46),
      inset 0 0 0 1px rgba(255,255,255,.035);
  }

  .mars-mission-kicker {
    color: #d3a252;
    font-size: 8px;
    font-weight: 950;
    letter-spacing: .2em;
  }

  .mars-mission-card h1 {
    margin: 12px 0 10px;
    max-width: 420px;
    font-size: clamp(32px, 5vw, 54px);
    line-height: .92;
    letter-spacing: -.055em;
  }

  .mars-mission-card h1 em {
    color: #d3a252;
    font-style: italic;
  }

  .mars-mission-card > p {
    margin: 0;
    color: rgba(248,243,232,.72);
    font-size: 13px;
    line-height: 1.65;
  }

  .mars-mission-card > p strong {
    color: #fff;
  }

  .mars-mission-tip {
    margin: 24px 0 18px;
    padding: 14px;
    display: grid;
    grid-template-columns: 42px 1fr;
    gap: 12px;
    align-items: center;
    border: 1px solid rgba(211,162,82,.22);
    border-radius: 8px;
    background: rgba(255,255,255,.045);
  }

  .mars-orbit-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(211,162,82,.38);
    border-radius: 50%;
    color: #d3a252;
    font-size: 18px;
  }

  .mars-mission-tip b,
  .mars-mission-tip small {
    display: block;
  }

  .mars-mission-tip b {
    color: #fff;
    font-size: 9px;
    letter-spacing: .11em;
  }

  .mars-mission-tip small {
    margin-top: 5px;
    color: rgba(248,243,232,.58);
    font-size: 10px;
    line-height: 1.45;
  }

  .mars-mission-tip strong {
    color: #d3a252;
  }

  .mars-mission-ok {
    width: 100%;
    height: 52px;
    padding: 0 16px;
    border: 0;
    border-radius: 8px;
    background: #d3a252;
    color: #071a38;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    font-size: 9px;
    font-weight: 950;
    letter-spacing: .12em;
  }

  .mars-mission-ok b {
    font-size: 18px;
  }

  .rocket-bay-viewport::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(to top, rgba(3, 12, 26, .22), transparent 34%),
      radial-gradient(circle at 76% 22%, rgba(255, 132, 82, .10), transparent 28%);
    mix-blend-mode: screen;
  }

  @media (max-width: 1050px) {
    .rocket-bay-layout {
      grid-template-columns: 1fr;
      height: auto;
      min-height: 100svh;
      overflow: auto;
    }

    .rocket-bay-editor,
    .rocket-bay-preview {
      height: auto;
    }

    .rocket-bay-editor-body {
      min-height: 420px;
    }

    .rocket-bay-viewport {
      min-height: 580px;
    }
  }

  @media (max-width: 650px) {
    .rocket-hangar-topbar {
      height: auto;
      padding: 10px 12px;
      grid-template-columns: 1fr auto;
    }

    .rocket-hangar-title {
      display: none;
    }

    .rocket-top-door {
      min-height: 52px;
    }

    .rocket-top-door small {
      display: none;
    }

    .mars-mission-card {
      padding: 26px 22px;
    }


    .rocket-bay-layout {
      padding: 22px 22px 30px;
      gap: 26px;
    }

    .rocket-bay-prompt {
      font-size: 17px;
    }

    .rocket-bay-preview-top {
      flex-wrap: wrap;
    }

    .rocket-bay-status {
      width: calc(100% - 20px);
    }

    .rocket-bay-score {
      width: 72px;
    }

    .rocket-bay-door-button {
      order: 3;
    }

    .rocket-bay-launch-button {
      flex: 1;
      min-width: 180px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rocket-bay-face,
    .rocket-bay-sound-toggle,
    .rocket-bay-launch-button {
      transition: none;
    }
  }

  .rocket-bay-face b {
    color: #c58b3c;
    font-size: 10px;
  }

  .rocket-insignia-scores {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 9px;
    height: 30px;
    border: 1px solid rgba(7, 26, 56, 0.09);
    border-radius: 6px;
    background: rgba(255,255,255,.58);
    color: rgba(7,26,56,.48);
    font-size: 7px;
    font-weight: 950;
    letter-spacing: .08em;
    white-space: nowrap;
  }

  .rocket-insignia-scores b {
    color: #c58b3c;
  }

  .rocket-insignia-scores i {
    width: 1px;
    height: 13px;
    background: rgba(7,26,56,.12);
  }

  .mark-help-top {
    position: fixed;
    top: 10px;
    left: 50%;
    z-index: 95;
    transform: translateX(-50%);
    height: 34px;
    padding: 0 14px;
    border: 1px solid rgba(211,162,82,.65);
    border-radius: 999px;
    background: #071a38;
    color: #fff;
    box-shadow: 0 9px 24px rgba(7,26,56,.18);
    cursor: pointer;
    font-size: 8px;
    font-weight: 950;
    letter-spacing: .12em;
    white-space: nowrap;
  }

  .mark-help-top span {
    margin-left: 5px;
  }

  .mark-help-overlay {
    position: fixed;
    inset: 0;
    z-index: 140;
    padding: 20px;
    display: grid;
    place-items: center;
    background: rgba(5,12,22,.78);
    backdrop-filter: blur(9px);
  }

  .mark-help-card {
    position: relative;
    width: min(430px, 100%);
    padding: 30px 30px 28px;
    border: 1px solid rgba(211,162,82,.5);
    border-radius: 10px;
    background: #f3eee4;
    color: #071a38;
    box-shadow: 0 32px 85px rgba(0,0,0,.34);
  }

  .mark-help-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 34px;
    height: 34px;
    border: 1px solid rgba(7,26,56,.12);
    border-radius: 50%;
    background: #fff;
    color: #071a38;
    display: grid;
    place-items: center;
    cursor: pointer;
    font-size: 22px;
    line-height: 1;
  }

  .mark-help-kicker {
    color: #b77e38;
    font-size: 7px;
    font-weight: 950;
    letter-spacing: .18em;
  }

  .mark-help-card h2 {
    margin: 10px 42px 10px 0;
    font-size: clamp(28px, 5vw, 42px);
    line-height: .95;
    letter-spacing: -.05em;
    text-transform: uppercase;
  }

  .mark-help-card p {
    margin: 0;
    max-width: 350px;
    color: rgba(7,26,56,.7);
    font-size: 13px;
    line-height: 1.6;
  }

  .mark-help-card strong {
    color: #b77e38;
  }

  @media (max-width: 900px) {
    .rocket-insignia-scores {
      display: none;
    }

    .mark-help-top {
      top: 7px;
      height: 30px;
      font-size: 7px;
    }
  }

`;
