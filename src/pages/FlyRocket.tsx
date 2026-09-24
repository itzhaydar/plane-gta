import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox, useGLTF, useTexture } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { usePlaneStore, type Face } from '../store';

const LEFT_PANEL_FALLBACK = '/templates/flag-left.svg';
const RIGHT_PANEL_FALLBACK = '/templates/flag-right.svg';
const MAX_SPEED = 28500;

type RocketPhase =
  | 'parked'
  | 'launch'
  | 'clouds'
  | 'space'
  | 'mars-approach'
  | 'landing'
  | 'landed'
  | 'exited';

type Telemetry = {
  speed: number;
  altitude: number;
  progress: number;
  distance: number;
};

useGLTF.preload('/astro.glb');

function MissionSkin({ url, fallback }: { url: string | null; fallback: string }) {
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
      <RoundedBox args={[0.46, 0.3, 0.035]} radius={0.035} smoothness={4} renderOrder={2}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.08} metalness={0.02} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0, 0.021]} renderOrder={3}>
        <planeGeometry args={[0.405, 0.245]} />
        <MissionSkin url={livery} fallback={fallback} />
      </mesh>
    </group>
  );
}

function Porthole({ y }: { y: number }) {
  return (
    <group position={[0, y, 0.478]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.025, 24]} />
        <meshStandardMaterial color="#263746" metalness={0.65} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.018]}>
        <circleGeometry args={[0.078, 24]} />
        <meshStandardMaterial color="#78a8bd" emissive="#244f64" emissiveIntensity={0.35} metalness={0.2} roughness={0.18} />
      </mesh>
    </group>
  );
}

function RocketFin({ angle }: { angle: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -0.06, 0.15, 0.42,
      -0.06, 0.82, 0.42,
      -0.06, 0.12, 0.98,
       0.06, 0.15, 0.42,
       0.06, 0.82, 0.42,
       0.06, 0.12, 0.98,
    ]);
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    g.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4]);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[0, angle, 0]} castShadow>
      <meshStandardMaterial color="#173554" metalness={0.48} roughness={0.34} side={THREE.DoubleSide} />
    </mesh>
  );
}

function LandingLeg({ angle }: { angle: number }) {
  return (
    <group rotation={[0, angle, 0]}>
      <mesh position={[0, 0.42, 0.56]} rotation={[0.42, 0, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.035, 0.72, 12]} />
        <meshStandardMaterial color="#66727c" metalness={0.85} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.08, 0.71]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.055, 20]} />
        <meshStandardMaterial color="#343d44" metalness={0.55} roughness={0.42} />
      </mesh>
    </group>
  );
}

function EngineFire() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 28) * 0.09;
    group.current.scale.set(1, pulse, 1);
  });

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      {[-0.18, 0, 0.18].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, -0.34, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.12, 0.72, 20]} />
            <meshBasicMaterial color="#ff9a2f" transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.24, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.065, 0.46, 18]} />
            <meshBasicMaterial color="#fff1b3" transparent opacity={0.95} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, -0.45, 0]} color="#ff9a35" intensity={4.5} distance={8} />
    </group>
  );
}

function Rocket({ liveries, enginesOn = false }: { liveries: Record<Face, string | null>; enginesOn?: boolean }) {
  return (
    <group scale={1.12}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.66, 0.66, 40]} />
        <meshStandardMaterial color="#9da8b0" metalness={0.72} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.79, 0]} castShadow>
        <cylinderGeometry args={[0.505, 0.53, 0.17, 40]} />
        <meshStandardMaterial color="#173554" metalness={0.5} roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.82, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.51, 1.95, 48]} />
        <meshStandardMaterial color="#e4e8eb" metalness={0.38} roughness={0.34} />
      </mesh>
      <mesh position={[0, 2.87, 0]} castShadow>
        <cylinderGeometry args={[0.39, 0.48, 0.25, 48]} />
        <meshStandardMaterial color="#e2e7ea" metalness={0.38} roughness={0.34} />
      </mesh>
      <mesh position={[0, 3.48, 0]} castShadow>
        <coneGeometry args={[0.39, 1.02, 48]} />
        <meshStandardMaterial color="#f1f3f4" metalness={0.34} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.88, 0]} castShadow>
        <coneGeometry args={[0.2, 0.32, 40]} />
        <meshStandardMaterial color="#173554" metalness={0.52} roughness={0.27} />
      </mesh>
      {[0.91, 2.73, 3.02].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <torusGeometry args={[0.495, 0.026, 12, 48]} />
          <meshStandardMaterial color="#73808a" metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
      <Porthole y={2.43} />
      <Porthole y={2.1} />
      <Porthole y={1.77} />
      <MissionPanel livery={liveries['flag-left']} fallback={LEFT_PANEL_FALLBACK} position={[0, 2.56, 0.435]} />
      <MissionPanel livery={liveries['flag-right']} fallback={RIGHT_PANEL_FALLBACK} position={[0, 1.28, 0.495]} />
      <RocketFin angle={0} />
      <RocketFin angle={(Math.PI * 2) / 3} />
      <RocketFin angle={(Math.PI * 4) / 3} />
      <LandingLeg angle={Math.PI / 3} />
      <LandingLeg angle={Math.PI} />
      <LandingLeg angle={(Math.PI * 5) / 3} />
      {[-0.18, 0, 0.18].map((x) => (
        <mesh key={x} position={[x, 0.11, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.11, 0.25, 20]} />
          <meshStandardMaterial color="#343d44" metalness={0.85} roughness={0.22} />
        </mesh>
      ))}
      {enginesOn && <EngineFire />}
    </group>
  );
}

function CityBuilding({ x, z, h, w }: { x: number; z: number; h: number; w: number }) {
  return (
    <group position={[x, h / 2, z]}>
      <RoundedBox args={[w, h, w * 0.82]} radius={0.08} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={h > 8 ? '#6e8292' : '#8c9ca8'} roughness={0.74} />
      </RoundedBox>
      {Array.from({ length: Math.max(2, Math.floor(h / 1.1)) }, (_, i) => (
        <mesh key={i} position={[0, h / 2 - 0.65 - i * 0.9 - h / 2, w * 0.415 + 0.006]}>
          <planeGeometry args={[w * 0.58, 0.15]} />
          <meshBasicMaterial color="#cce8f4" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function EarthLaunchSite({ lift }: { lift: number }) {
  const buildings = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({
      x: (i % 2 ? 1 : -1) * (5.2 + (i % 5) * 2.3),
      z: -8 + (i % 9) * 4.2,
      h: 3.5 + (i % 7) * 1.6,
      w: 1.1 + (i % 3) * 0.45,
    })),
    [],
  );

  return (
    <group position={[0, -lift, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#667b62" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[4.8, 64]} />
        <meshStandardMaterial color="#9da7ad" roughness={0.9} />
      </mesh>
      {[2.1, 3.25, 4.25].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
          <ringGeometry args={[r - 0.035, r, 64]} />
          <meshBasicMaterial color="#d8a35c" />
        </mesh>
      ))}
      {buildings.map((b, i) => <CityBuilding key={i} {...b} />)}
    </group>
  );
}

function CloudLayer({ offset }: { offset: number }) {
  const clouds = useMemo(
    () => Array.from({ length: 38 }, (_, i) => ({
      x: (i % 2 ? 1 : -1) * (2.5 + (i % 7) * 1.7),
      y: 8 + (i % 6) * 2.2 - offset,
      z: -7 + (i % 9) * 2.1,
      s: 0.8 + (i % 4) * 0.22,
    })),
    [offset],
  );

  return (
    <group>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {[[-0.8, 0, 0], [0, 0.22, 0], [0.85, 0, 0], [0.2, -0.08, 0.5], [-0.35, 0.05, -0.45]].map((p, j) => (
            <mesh key={j} position={p as [number, number, number]}>
              <sphereGeometry args={[1.15, 10, 8]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.72} roughness={1} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function EarthGlobe({ position = [8, 1, -14] as [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[5.5, 48, 32]} />
        <meshStandardMaterial color="#2f78b7" roughness={0.78} />
      </mesh>
      <mesh position={[0.8, 0.6, 5.05]} rotation={[0.2, 0, -0.25]}>
        <circleGeometry args={[1.8, 7]} />
        <meshStandardMaterial color="#70a56d" roughness={1} />
      </mesh>
      <mesh position={[-2.0, -1.2, 4.75]} rotation={[0.2, 0, 0.5]}>
        <circleGeometry args={[1.25, 6]} />
        <meshStandardMaterial color="#80aa70" roughness={1} />
      </mesh>
    </group>
  );
}

function SpaceScene({ progress }: { progress: number }) {
  const stars = useMemo(
    () => Array.from({ length: 180 }, (_, i) => ({
      x: ((i * 37) % 100) / 2 - 25,
      y: ((i * 53) % 80) / 2 - 18,
      z: -8 - ((i * 29) % 80),
      s: i % 7 === 0 ? 0.055 : 0.025,
    })),
    [],
  );

  const marsZ = THREE.MathUtils.lerp(-48, -9, THREE.MathUtils.clamp((progress - 0.55) / 0.28, 0, 1));

  return (
    <group>
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}>
          <sphereGeometry args={[s.s, 5, 5]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
      <EarthGlobe position={[10, -2, 8]} />
      <mesh position={[-18, 10, -32]}>
        <sphereGeometry args={[3.6, 36, 24]} />
        <meshBasicMaterial color="#ffd36d" toneMapped={false} />
        <pointLight color="#ffd58a" intensity={5} distance={90} />
      </mesh>
      <mesh position={[-10, -5, -26]}>
        <sphereGeometry args={[1.6, 28, 20]} />
        <meshStandardMaterial color="#c7b59a" roughness={0.9} />
      </mesh>
      <mesh position={[12, 7, -38]}>
        <sphereGeometry args={[2.1, 28, 20]} />
        <meshStandardMaterial color="#9aa7ba" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, marsZ]}>
        <sphereGeometry args={[6.2, 48, 32]} />
        <meshStandardMaterial color="#b85f37" roughness={1} />
      </mesh>
      <mesh position={[-1.7, 1.2, marsZ + 5.7]} rotation={[0.1, 0, -0.3]}>
        <circleGeometry args={[1.2, 12]} />
        <meshStandardMaterial color="#8d422d" roughness={1} />
      </mesh>
    </group>
  );
}

function MarsGround() {
  const rocks = useMemo(
    () => Array.from({ length: 35 }, (_, i) => ({
      x: ((i * 17) % 40) - 20,
      z: ((i * 29) % 38) - 20,
      s: 0.18 + (i % 5) * 0.12,
    })),
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#a95734" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[4.7, 64]} />
        <meshStandardMaterial color="#8e4b35" roughness={1} />
      </mesh>
      {[2.4, 3.5, 4.4].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[r - 0.035, r, 64]} />
          <meshBasicMaterial color="#d49b62" />
        </mesh>
      ))}
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, r.s * 0.45, r.z]} scale={[r.s * 1.4, r.s, r.s]} rotation={[0, i * 0.7, 0]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 3 ? '#7d3d2b' : '#93472f'} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Astronaut({ visible }: { visible: boolean }) {
  const { scene } = useGLTF('/astro.glb');
  const astronaut = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    c.scale.multiplyScalar(1.55 / Math.max(size.y, 1e-6));
    c.updateMatrixWorld(true);
    const fitted = new THREE.Box3().setFromObject(c);
    const center = fitted.getCenter(new THREE.Vector3());
    c.position.x -= center.x;
    c.position.z -= center.z;
    c.position.y -= fitted.min.y;
    return c;
  }, [scene]);

  if (!visible) return null;
  return (
    <group position={[1.7, 0, 0.9]} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={astronaut} />
    </group>
  );
}

function RocketWorld({
  phase,
  setPhase,
  onTelemetry,
}: {
  phase: RocketPhase;
  setPhase: (phase: RocketPhase) => void;
  onTelemetry: (t: Telemetry) => void;
}) {
  const { liveries } = usePlaneStore();
  const rocketRef = useRef<THREE.Group>(null);
  const orbit = useRef<any>(null);
  const { camera, scene } = useThree();
  const progress = useRef(0);
  const speed = useRef(0);
  const lastHud = useRef(0);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.045);

    if (phase === 'parked') {
      speed.current = 0;
      progress.current = 0;
    } else if (phase === 'launch') {
      speed.current = Math.min(4200, speed.current + 1500 * d);
      progress.current += 0.027 * d;
      if (progress.current >= 0.08) setPhase('clouds');
    } else if (phase === 'clouds') {
      speed.current = Math.min(12500, speed.current + 2800 * d);
      progress.current += 0.04 * d;
      if (progress.current >= 0.24) setPhase('space');
    } else if (phase === 'space') {
      speed.current = Math.min(MAX_SPEED, speed.current + 3200 * d);
      progress.current += 0.022 * d;
      if (progress.current >= 0.72) setPhase('mars-approach');
    } else if (phase === 'mars-approach') {
      speed.current = THREE.MathUtils.lerp(speed.current, 7200, d * 0.7);
      progress.current += 0.027 * d;
      if (progress.current >= 0.86) setPhase('landing');
    } else if (phase === 'landing') {
      speed.current = Math.max(0, speed.current - 4100 * d);
      progress.current = Math.min(1, progress.current + 0.026 * d);
      if (progress.current >= 1 && speed.current <= 25) {
        speed.current = 0;
        setPhase('landed');
      }
    } else {
      speed.current = 0;
      progress.current = 1;
    }

    const p = progress.current;
    const earthMode = p < 0.24;
    const marsMode = p >= 0.86;

    if (rocketRef.current) {
      if (earthMode) {
        rocketRef.current.position.set(0, Math.min(8, p * 34), 0);
        rocketRef.current.rotation.set(0, 0, 0);
      } else if (marsMode) {
        const landingT = THREE.MathUtils.clamp((p - 0.86) / 0.14, 0, 1);
        rocketRef.current.position.set(0, THREE.MathUtils.lerp(8, 0.08, landingT), 0);
        rocketRef.current.rotation.set(0, 0, 0);
      } else {
        rocketRef.current.position.set(0, 1.1, 0);
        rocketRef.current.rotation.set(0, 0, -0.035);
      }
    }

    const targetY = rocketRef.current?.position.y ?? 1.5;
    const desired = earthMode
      ? new THREE.Vector3(7.5, targetY + 3.3, 9.5)
      : marsMode
        ? new THREE.Vector3(7.4, targetY + 3.4, 9.2)
        : new THREE.Vector3(7.8, 4.2, 10.5);

    if (!orbit.current?.__dragging) camera.position.lerp(desired, 1 - Math.pow(0.004, d));
    if (orbit.current) {
      orbit.current.target.lerp(new THREE.Vector3(0, targetY + 1.6, 0), 1 - Math.pow(0.003, d));
      orbit.current.update();
    }

    scene.background = new THREE.Color(earthMode ? '#8fc5df' : marsMode ? '#c9784f' : '#020711');
    scene.fog = earthMode ? new THREE.Fog('#a9d5e5', 28, 115) : marsMode ? new THREE.Fog('#c9784f', 30, 105) : null;

    if (state.clock.elapsedTime - lastHud.current > 0.08) {
      onTelemetry({
        speed: Math.round(speed.current),
        altitude: marsMode ? Math.round(Math.max(0, (1 - (p - 0.86) / 0.14) * 48000)) : Math.round(p * 410000),
        progress: p,
        distance: Math.max(0, Math.round((1 - p) * 225000000)),
      });
      lastHud.current = state.clock.elapsedTime;
    }
  });

  const p = progress.current;
  const earthMode = phase === 'parked' || phase === 'launch' || phase === 'clouds';
  const marsMode = phase === 'landing' || phase === 'landed' || phase === 'exited';
  const enginesOn = !['parked', 'landed', 'exited'].includes(phase);

  return (
    <>
      <ambientLight intensity={earthMode ? 0.82 : marsMode ? 0.72 : 0.38} />
      <directionalLight position={[8, 13, 7]} intensity={earthMode ? 1.8 : 1.2} castShadow />
      {earthMode && <EarthLaunchSite lift={phase === 'parked' ? 0 : p * 30} />}
      {(phase === 'launch' || phase === 'clouds') && <CloudLayer offset={p * 30} />}
      {!earthMode && !marsMode && <SpaceScene progress={p} />}
      {marsMode && <MarsGround />}

      <group ref={rocketRef} position={[0, 0.08, 0]}>
        <Rocket liveries={liveries} enginesOn={enginesOn} />
      </group>

      <Astronaut visible={phase === 'exited'} />

      {phase === 'space' && (
        <Html position={[0, 6.2, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div className="space-tag">EARTH ORBIT CLEARED</div>
        </Html>
      )}

      <OrbitControls
        ref={orbit}
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={5.2}
        maxDistance={19}
        minPolarAngle={0.28}
        maxPolarAngle={Math.PI * 0.49}
        onStart={() => { if (orbit.current) orbit.current.__dragging = true; }}
        onEnd={() => { if (orbit.current) orbit.current.__dragging = false; }}
      />
    </>
  );
}

function SoundButton({ muted, onClick }: { muted: boolean; onClick: () => void }) {
  return (
    <button className="rocket-sound" onClick={onClick} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

export default function FlyRocket() {
  const go = useNavigate();
  const { liveries } = usePlaneStore();
  const missionReady = Boolean(liveries['flag-left'] && liveries['flag-right']);
  const [phase, setPhase] = useState<RocketPhase>('parked');
  const [muted, setMuted] = useState(true);
  const [rideNotice, setRideNotice] = useState(true);
  const [telemetry, setTelemetry] = useState<Telemetry>({ speed: 0, altitude: 0, progress: 0, distance: 225000000 });
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const takeOff = () => {
    if (!missionReady || phase !== 'parked') return;
    audioRef.current?.play().catch(() => {});
    setPhase('launch');
  };

  const getOut = () => {
    if (phase === 'landed') setPhase('exited');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (key === 't' && phase === 'parked' && !rideNotice) takeOff();
      if (key === 'e' && phase === 'landed') getOut();
      if (key === 'm') toggleSound();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, missionReady, rideNotice]);

  if (!missionReady) {
    return (
      <main className="rocket-gate">
        <style>{FLY_ROCKET_CSS}</style>
        <div className="gate-card">
          <span>MARSHOUT MARS PROGRAM</span>
          <h1>Finish both mission insignias first.</h1>
          <p>Your rocket carries the exact designs saved in the rocket hangar.</p>
          <button onClick={() => go('/rock-hangar')}>RETURN TO ROCKET HANGAR <b>→</b></button>
        </div>
      </main>
    );
  }

  const currentLocation =
    phase === 'parked' || phase === 'launch' || phase === 'clouds'
      ? 'EARTH'
      : phase === 'landing' || phase === 'landed' || phase === 'exited'
        ? 'MARS'
        : 'DEEP SPACE';

  const status: Record<RocketPhase, [string, string]> = {
    parked: ['READY ON EARTH', 'Autopilot is standing by. Start the Mars transfer when ready.'],
    launch: ['LIFTOFF', 'Main engines firing. The rocket is climbing automatically.'],
    clouds: ['ATMOSPHERIC ASCENT', 'Passing through the cloud layer and clearing Earth.'],
    space: ['MARS TRANSFER', 'Earth is behind us. Autopilot is cruising through deep space.'],
    'mars-approach': ['MARS APPROACH', 'Autopilot is reducing speed and lining up for entry.'],
    landing: ['MARS DESCENT', 'Final descent is automatic. Engines are controlling the landing.'],
    landed: ['LANDED ON MARS', 'Speed is zero. The rocket is secure. You can get out.'],
    exited: ['WELCOME TO MARS', 'Mission complete. Astronaut is outside the vehicle.'],
  };

  const [title, description] = status[phase];
  const routePct = Math.round(telemetry.progress * 100);
  const rocketMapLeft = 13 + telemetry.progress * 73;

  return (
    <main className="fly-rocket-page">
      <style>{FLY_ROCKET_CSS}</style>

      <Canvas
        shadows
        dpr={[1, 1.3]}
        camera={{ position: [7.5, 4.3, 10], fov: 43, near: 0.1, far: 1600 }}
        gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
      >
        <RocketWorld phase={phase} setPhase={setPhase} onTelemetry={setTelemetry} />
      </Canvas>

      <div className="rocket-vignette" />

      <header className="rocket-hud">
        <div className="rocket-brand"><i /> MARSHOUT <b>MARS</b></div>
        <div className="route-card">
          <span><small>CURRENT LOCATION</small><b>{currentLocation}</b></span>
          <em>→</em>
          <span><small>DESTINATION</small><b>MARS</b></span>
        </div>
        <SoundButton muted={muted} onClick={toggleSound} />
      </header>

      <aside className="rocket-instruments">
        <div className="speed">
          <small>SPEED</small>
          <strong>{telemetry.speed.toLocaleString()}</strong>
          <em> KM/H</em>
          <i><b style={{ width: `${Math.min(100, telemetry.speed / MAX_SPEED * 100)}%` }} /></i>
        </div>
        <div className="stat"><small>ALTITUDE</small><b>{telemetry.altitude.toLocaleString()} M</b></div>
        <div className="stat"><small>AUTOPILOT</small><b>{phase === 'parked' ? 'STANDBY' : phase === 'exited' ? 'COMPLETE' : 'ENGAGED'}</b></div>
      </aside>

      <aside className="space-map">
        <div className="map-title"><span>INTERPLANETARY NAV</span><b>{routePct}%</b></div>
        <div className="map-sub"><span>EARTH</span><i>LIVE</i><span>MARS</span></div>
        <div className="map-space">
          <span className="orbit-line" />
          <span className="planet earth"><i /><b>EARTH</b></span>
          <span className="planet mars"><i /><b>MARS</b></span>
          <span className="sun"><i /></span>
          <span className="map-rocket" style={{ left: `${rocketMapLeft}%` }}>▲</span>
          <span className="route-fill" style={{ width: `${Math.max(2, telemetry.progress * 73)}%` }} />
        </div>
        <div className="map-data">
          <span><small>FROM</small><b>EARTH</b></span>
          <span><small>TO</small><b>MARS</b></span>
          <span><small>STATUS</small><b>{phase === 'landed' || phase === 'exited' ? 'ARRIVED' : 'EN ROUTE'}</b></span>
        </div>
        <div className="map-progress"><i><b style={{ width: `${routePct}%` }} /></i><span>{routePct}% ROUTE</span></div>
      </aside>

      <section className="control-card">
        <div className="phase">{title}</div>
        <h1>{phase === 'exited' ? 'MARS SURFACE' : 'MISSION CONTROL'}</h1>
        <p>{description}</p>

        {phase === 'parked' && (
          <button className="primary" onClick={takeOff} disabled={rideNotice}>
            <span><kbd>T</kbd> TAKE OFF</span><b>→</b>
          </button>
        )}
        {phase === 'landed' && (
          <button className="primary" onClick={getOut}>
            <span><kbd>E</kbd> GET OUT</span><b>→</b>
          </button>
        )}
        {phase === 'exited' && (
          <button className="primary" onClick={() => go('/')}>
            <span>HOME</span><b>→</b>
          </button>
        )}

        <div className="controls-visible">
          <span><kbd>T</kbd><b>TAKE OFF</b></span>
          <span><kbd>E</kbd><b>GET OUT</b></span>
          <span><kbd>M</kbd><b>SOUND</b></span>
          <span className="mouse"><b>DRAG MOUSE</b><small>ROTATE CAMERA</small></span>
        </div>
      </section>

      {!['parked', 'landed', 'exited'].includes(phase) && (
        <div className="autopilot-pill"><i /> AUTOPILOT · EARTH → MARS</div>
      )}

      {rideNotice && (
        <div className="ride-notice-backdrop">
          <div className="ride-notice">
            <div className="ride-notice-icon"><span>✦</span></div>
            <div className="ride-notice-copy">
              <small>MARSHOUT AUTOPILOT</small>
              <h2>This is a self-driving rocket.</h2>
              <p>After takeoff, guidance, cruise, Mars approach and landing are automatic.</p>
            </div>
            <button type="button" onClick={() => setRideNotice(false)}>OK <b>→</b></button>
          </div>
        </div>
      )}
    </main>
  );
}

const FLY_ROCKET_CSS = `
*{box-sizing:border-box}.fly-rocket-page,.rocket-gate{position:fixed;left:0;right:0;top:48px;bottom:0;overflow:hidden;font-family:Inter,ui-sans-serif,system-ui;color:#fff;background:#06101c;z-index:1}.fly-rocket-page canvas{position:absolute!important;inset:0}.rocket-vignette{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(180deg,rgba(1,7,16,.18),transparent 28%,transparent 62%,rgba(1,8,18,.58)),radial-gradient(circle at center,transparent 48%,rgba(1,8,18,.22))}.rocket-hud{position:absolute;z-index:7;left:0;right:0;top:0;padding:18px 24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:start;pointer-events:none}.rocket-brand{font-size:10px;font-weight:950;letter-spacing:.18em;padding-top:13px;text-shadow:0 2px 12px #0008}.rocket-brand i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#d69b43;margin-right:9px;box-shadow:0 0 0 5px #d69b4322}.rocket-brand b{color:#d69b43}.route-card{display:flex;align-items:center;gap:18px;background:#06182ee8;border:1px solid #ffffff2b;border-radius:9px;padding:11px 17px;backdrop-filter:blur(14px);box-shadow:0 14px 36px #00102038}.route-card span{min-width:130px;display:flex;flex-direction:column;gap:3px}.route-card span:last-child{text-align:right}.route-card small,.speed small,.stat small{font-size:7px;letter-spacing:.17em;color:#ffffff7b;font-weight:900}.route-card b{font-size:11px;letter-spacing:.1em}.route-card em{font-style:normal;color:#d69b43}.rocket-sound{pointer-events:auto;justify-self:end;width:48px;height:48px;border:1px solid #ffffff35;border-radius:9px;background:#06182ee8;color:#fff;font-size:17px;cursor:pointer;box-shadow:0 12px 30px #00102038}.rocket-instruments{position:absolute;z-index:6;right:24px;top:91px;width:190px;display:grid;gap:8px}.speed,.stat{background:#06182ee8;border:1px solid #ffffff28;border-radius:9px;padding:14px 16px;backdrop-filter:blur(14px);box-shadow:0 15px 35px #00102035}.speed strong{font-size:34px;line-height:1;font-variant-numeric:tabular-nums}.speed>em{font-style:normal;font-size:8px;color:#d69b43;font-weight:900}.speed>i{display:block;height:4px;margin-top:10px;background:#ffffff18;overflow:hidden}.speed>i b{display:block;height:100%;background:#d69b43;transition:width .15s}.stat{display:flex;align-items:center;justify-content:space-between}.stat b{font-size:9px;letter-spacing:.07em}.space-map{position:absolute;z-index:6;right:24px;bottom:24px;width:286px;padding:13px;background:linear-gradient(180deg,#031426f2,#061b31f2);border:1px solid #ffffff2b;border-radius:11px;backdrop-filter:blur(16px);box-shadow:0 22px 55px #00102066,inset 0 1px 0 #ffffff0d;overflow:hidden}.map-title{display:flex;justify-content:space-between;font-size:8px;font-weight:950;letter-spacing:.12em}.map-title span{color:#ffffff8c}.map-title b{color:#d69b43}.map-sub{display:flex;align-items:center;justify-content:space-between;margin-top:7px;color:#ffffff52;font-size:6px;font-weight:900;letter-spacing:.13em}.map-sub i{font-style:normal;color:#78e0aa}.map-sub i:before{content:"";display:inline-block;width:5px;height:5px;margin-right:5px;border-radius:50%;background:#78e0aa;box-shadow:0 0 8px #78e0aa}.map-space{position:relative;height:210px;margin:9px 0 10px;border:1px solid #ffffff16;overflow:hidden;background-color:#04101e;background-image:radial-gradient(#ffffff45 .7px,transparent .7px);background-size:18px 18px}.orbit-line{position:absolute;left:13%;right:13%;top:52%;height:2px;background:linear-gradient(90deg,#55a6d7,#ffffff5e,#d88451);transform:rotate(-10deg);transform-origin:center}.route-fill{position:absolute;left:13%;top:52%;height:2px;background:#d69b43;transform:rotate(-10deg);transform-origin:left center;box-shadow:0 0 8px #d69b43}.planet{position:absolute;z-index:3;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:6px;font-weight:950;letter-spacing:.08em}.planet i{display:block;border-radius:50%;box-shadow:0 0 0 4px #ffffff0d}.planet.earth{left:8%;top:56%}.planet.earth i{width:34px;height:34px;background:radial-gradient(circle at 35% 35%,#72aa70 0 15%,#2d79b9 17% 100%)}.planet.mars{right:7%;top:34%;color:#efb45d}.planet.mars i{width:39px;height:39px;background:radial-gradient(circle at 34% 34%,#d47c4f,#a84d31 70%)}.sun{position:absolute;left:43%;top:9%}.sun i{display:block;width:24px;height:24px;border-radius:50%;background:#ffd36d;box-shadow:0 0 22px #ffc44f}.map-rocket{position:absolute;z-index:6;top:49%;width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#f4f7f9;color:#071a38;font-size:11px;transform:translate(-50%,-50%) rotate(80deg);box-shadow:0 0 0 4px #ffffff16,0 0 18px #d69b43;transition:left .18s linear}.map-data{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.map-data span{min-width:0;padding:7px 6px;background:#ffffff08;border:1px solid #ffffff0d;border-radius:5px}.map-data small{display:block;color:#ffffff4e;font-size:5px;font-weight:950;letter-spacing:.13em}.map-data b{display:block;margin-top:2px;color:#fff;font-size:7px;white-space:nowrap}.map-progress{display:flex;align-items:center;gap:8px;margin-top:8px}.map-progress>i{display:block;flex:1;height:3px;background:#ffffff12;overflow:hidden}.map-progress>i b{display:block;height:100%;background:linear-gradient(90deg,#d69b43,#f4d39b);box-shadow:0 0 7px #d69b43}.map-progress>span{color:#ffffff58;font-size:5px;font-weight:950;letter-spacing:.1em;white-space:nowrap}.control-card{position:absolute;z-index:6;left:24px;bottom:24px;width:min(510px,calc(100vw - 330px));padding:22px;background:#041529ed;border:1px solid #ffffff2a;border-radius:11px;backdrop-filter:blur(15px);box-shadow:0 22px 55px #00102055}.phase{font-size:8px;font-weight:950;letter-spacing:.2em;color:#d69b43}.control-card h1{margin:7px 0 5px;font-size:25px;letter-spacing:-.035em}.control-card p{margin:0 0 15px;color:#ffffffb0;font-size:12px;line-height:1.5}.primary{width:100%;height:50px;border:0;border-radius:7px;background:#f5f6f7;color:#071a38;padding:0 16px;display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:950;letter-spacing:.13em;cursor:pointer;box-shadow:0 12px 26px #0004}.primary:disabled{opacity:.45;cursor:not-allowed}.primary:hover:not(:disabled){transform:translateY(-1px)}.primary>b{font-size:20px;color:#c58b3c}.primary kbd{background:#071a38;color:#fff;border:0}.controls-visible{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.controls-visible>span{min-width:76px;height:42px;padding:6px 8px;border:1px solid #ffffff20;border-radius:6px;background:#ffffff0b;display:flex;align-items:center;gap:7px}.controls-visible kbd{width:27px;height:27px;display:grid;place-items:center;background:#ffffff15;border:1px solid #ffffff35;border-radius:4px;color:#fff;font:950 10px Inter;box-shadow:inset 0 -2px 0 #0004}.controls-visible b{font-size:7px;letter-spacing:.09em}.controls-visible .mouse{margin-left:auto;flex-direction:column;align-items:flex-start;justify-content:center}.controls-visible small{font-size:6px;color:#ffffff70;letter-spacing:.08em}.autopilot-pill{position:absolute;z-index:5;left:50%;top:104px;transform:translateX(-50%);padding:9px 13px;border:1px solid #ffffff2c;border-radius:999px;background:#06182ec9;backdrop-filter:blur(10px);font-size:8px;font-weight:950;letter-spacing:.14em}.autopilot-pill i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#7dd8a4;margin-right:7px;box-shadow:0 0 0 4px #7dd8a422}.space-tag{padding:8px 11px;border:1px solid #ffffff2d;border-radius:999px;background:#041529d9;color:#fff;font:900 8px Inter;letter-spacing:.15em;white-space:nowrap}.rocket-gate{display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#17385d,#06182e 62%)}.gate-card{width:min(560px,calc(100vw - 40px));padding:36px;border:1px solid #ffffff22;border-radius:12px;background:#071a38e8;box-shadow:0 30px 80px #0007}.gate-card>span{font-size:8px;font-weight:950;letter-spacing:.2em;color:#d69b43}.gate-card h1{font-size:30px;line-height:1.08;margin:10px 0}.gate-card p{font-size:12px;color:#ffffff9b;margin:0 0 22px}.gate-card button{width:100%;height:50px;border:0;border-radius:7px;background:#fff;color:#071a38;padding:0 17px;display:flex;align-items:center;justify-content:space-between;font-weight:950;letter-spacing:.12em;cursor:pointer}.gate-card button b{color:#c58b3c;font-size:20px}.ride-notice-backdrop{position:absolute;inset:0;z-index:20;display:grid;place-items:center;padding:24px;background:rgba(2,12,25,.34);backdrop-filter:blur(5px)}.ride-notice{width:min(460px,calc(100vw - 40px));display:grid;grid-template-columns:auto 1fr;gap:18px;padding:24px;border:1px solid rgba(255,255,255,.24);border-radius:12px;background:linear-gradient(145deg,rgba(5,25,48,.98),rgba(8,38,70,.96));box-shadow:0 30px 90px rgba(0,10,24,.58),inset 0 1px 0 rgba(255,255,255,.08)}.ride-notice-icon{width:48px;height:48px;display:grid;place-items:center;border:1px solid rgba(214,155,67,.4);border-radius:10px;background:rgba(214,155,67,.1);color:#d69b43;font-size:20px;box-shadow:0 0 0 6px rgba(214,155,67,.04)}.ride-notice-copy small{display:block;margin:2px 0 7px;color:#d69b43;font-size:7px;font-weight:950;letter-spacing:.2em}.ride-notice-copy h2{margin:0;color:#fff;font-size:25px;line-height:1.05;letter-spacing:-.035em}.ride-notice-copy p{margin:7px 0 0;color:rgba(255,255,255,.65);font-size:12px}.ride-notice button{grid-column:1/-1;height:48px;border:0;border-radius:7px;background:#f5f6f7;color:#071a38;padding:0 16px;display:flex;align-items:center;justify-content:space-between;font:950 10px Inter;letter-spacing:.14em;cursor:pointer}.ride-notice button b{color:#c58b3c;font-size:19px}@media(max-width:850px){.fly-rocket-page,.rocket-gate{top:48px}.rocket-hud{padding:12px}.rocket-brand{display:none}.route-card{grid-column:1/3;justify-self:start}.route-card span{min-width:95px}.rocket-instruments{right:12px;top:78px;transform:scale(.84);transform-origin:top right}.space-map{right:12px;bottom:12px;width:230px;transform:scale(.88);transform-origin:bottom right}.map-space{height:180px}.control-card{left:12px;bottom:12px;width:calc(100vw - 226px);padding:17px}.controls-visible .mouse{display:none}}@media(max-width:620px){.route-card{transform:scale(.86);transform-origin:top left}.rocket-instruments{transform:scale(.7)}.space-map{display:none}.control-card{width:calc(100vw - 24px)}.controls-visible>span{min-width:68px}.autopilot-pill{top:90px}}
`;
