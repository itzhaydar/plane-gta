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
  useCallback,
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

type PlayerGender = 'man' | 'woman';

const PLAYER_START = new THREE.Vector3(0, 0, 3.65);
const FLAG_APPROACH = {
  'flag-left': new THREE.Vector3(-0.82, 0, 1.58),
  'flag-right': new THREE.Vector3(0.82, 0, 1.58),
} as const;

function MainCharacter({
  gender,
  position,
}: {
  gender: PlayerGender;
  position: React.MutableRefObject<THREE.Vector3>;
}) {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const last = useRef(position.current.clone());

  useFrame(({ clock }) => {
    if (!group.current) return;
    const moved = last.current.distanceToSquared(position.current) > 0.00001;
    const dx = position.current.x - last.current.x;
    const dz = position.current.z - last.current.z;
    group.current.position.copy(position.current);
    if (moved) group.current.rotation.y = Math.atan2(dx, dz);

    const swing = moved ? Math.sin(clock.elapsedTime * 9) * 0.48 : 0;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.72;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.72;
    last.current.copy(position.current);
  });

  const female = gender === 'woman';
  const skin = female ? '#a96f52' : '#9b684c';
  const shirt = female ? '#f2eee5' : '#102f59';
  const trousers = female ? '#17223a' : '#24272b';
  const hair = '#211714';

  return (
    <group ref={group} position={position.current.toArray()} scale={0.58}>
      <mesh position={[0, 1.48, 0]} castShadow>
        <boxGeometry args={[female ? 0.58 : 0.72, 0.88, 0.38]} />
        <meshStandardMaterial color={shirt} roughness={0.86} />
      </mesh>
      {female && (
        <>
          <mesh position={[-0.22, 1.55, 0.205]}><boxGeometry args={[0.16, 0.68, 0.04]} /><meshStandardMaterial color="#0b274b" /></mesh>
          <mesh position={[0.22, 1.55, 0.205]}><boxGeometry args={[0.16, 0.68, 0.04]} /><meshStandardMaterial color="#0b274b" /></mesh>
        </>
      )}
      <mesh position={[0, 2.02, 0]} castShadow><boxGeometry args={[0.18, 0.18, 0.18]} /><meshStandardMaterial color={skin} /></mesh>
      <mesh position={[0, 2.30, 0]} castShadow><boxGeometry args={[0.46, 0.48, 0.41]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
      <mesh position={[0, 2.56, -0.02]} castShadow><boxGeometry args={[0.49, female ? 0.16 : 0.12, 0.42]} /><meshStandardMaterial color={hair} /></mesh>
      {female && <>
        <mesh position={[-0.205, 2.28, -0.07]} castShadow><boxGeometry args={[0.11, 0.55, 0.22]} /><meshStandardMaterial color={hair} /></mesh>
        <mesh position={[0.205, 2.28, -0.07]} castShadow><boxGeometry args={[0.11, 0.55, 0.22]} /><meshStandardMaterial color={hair} /></mesh>
        <mesh position={[0, 2.18, -0.205]} castShadow><boxGeometry args={[0.35, 0.48, 0.11]} /><meshStandardMaterial color={hair} /></mesh>
      </>}
      {[-0.1, 0.1].map((x) => <mesh key={x} position={[x, 2.33, 0.216]}><boxGeometry args={[0.04, 0.025, 0.016]} /><meshBasicMaterial color="#111" /></mesh>)}

      <group ref={leftArm} position={[-(female ? .36 : .43), 1.72, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow><capsuleGeometry args={[0.09, 0.52, 5, 8]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      <group ref={rightArm} position={[(female ? .36 : .43), 1.72, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow><capsuleGeometry args={[0.09, 0.52, 5, 8]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      <group ref={leftLeg} position={[-0.15, 1.05, 0]}>
        <mesh position={[0, -0.47, 0]} castShadow><capsuleGeometry args={[0.12, 0.72, 5, 8]} /><meshStandardMaterial color={trousers} /></mesh>
      </group>
      <group ref={rightLeg} position={[0.15, 1.05, 0]}>
        <mesh position={[0, -0.47, 0]} castShadow><capsuleGeometry args={[0.12, 0.72, 5, 8]} /><meshStandardMaterial color={trousers} /></mesh>
      </group>
    </group>
  );
}

function PlayerController({
  position,
  enabled,
  onNearFace,
  onInteract,
}: {
  position: React.MutableRefObject<THREE.Vector3>;
  enabled: boolean;
  onNearFace: (face: Face | null) => void;
  onInteract: (face: Face) => void;
}) {
  const keys = useRef(new Set<string>());
  const invalidate = useThree((state) => state.invalidate);
  const nearRef = useRef<Face | null>(null);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e'].includes(key)) {
        event.preventDefault();
      }
      keys.current.add(key);
      if (key === 'e' && enabled && nearRef.current) onInteract(nearRef.current);
      invalidate();
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [enabled, invalidate, onInteract]);

  useFrame((_, delta) => {
    if (!enabled) return;
    let dx = 0, dz = 0;
    if (keys.current.has('a') || keys.current.has('arrowleft')) dx -= 1;
    if (keys.current.has('d') || keys.current.has('arrowright')) dx += 1;
    if (keys.current.has('w') || keys.current.has('arrowup')) dz -= 1;
    if (keys.current.has('s') || keys.current.has('arrowdown')) dz += 1;

    if (dx || dz) {
      const mag = Math.hypot(dx, dz);
      const speed = Math.min(delta, .05) * 2.25;
      position.current.x = THREE.MathUtils.clamp(position.current.x + dx / mag * speed, -4.7, 4.7);
      position.current.z = THREE.MathUtils.clamp(position.current.z + dz / mag * speed, -4.7, 4.6);
      invalidate();
    }

    let closest: Face | null = null;
    let distance = Infinity;
    (FACES as Face[]).forEach((face) => {
      const d = position.current.distanceTo(FLAG_APPROACH[face as 'flag-left' | 'flag-right']);
      if (d < distance) { distance = d; closest = face; }
    });
    const next = distance < 1.05 ? closest : null;
    if (nearRef.current !== next) {
      nearRef.current = next;
      onNearFace(next);
    }
  });
  return null;
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
  const playerPosition = useRef(PLAYER_START.clone());
  const [muted, setMuted] = useState(true);
  const [introOpen, setIntroOpen] = useState(true);
  const [openingCount, setOpeningCount] = useState<number | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [nearFace, setNearFace] = useState<Face | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [scores, setScores] = useState<Record<'flag-left' | 'flag-right', number>>({
    'flag-left': 0,
    'flag-right': 0,
  });

  const {
    activeFace,
    setActiveFace,
    liveries,
    gender,
  } = usePlaneStore();

  const playerGender: PlayerGender = gender === 'woman' ? 'woman' : 'man';

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
    if (openingCount === null) return;
    if (openingCount <= 0) {
      setOpeningCount(null);
      setGameReady(true);
      return;
    }
    const timer = window.setTimeout(() => setOpeningCount((n) => (n ?? 1) - 1), 650);
    return () => window.clearTimeout(timer);
  }, [openingCount]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getPaintCoverage(liveries['flag-left'], '/templates/flag-left.svg'),
      getPaintCoverage(liveries['flag-right'], '/templates/flag-right.svg'),
    ]).then(([left, right]) => {
      if (!cancelled) setScores({ 'flag-left': left, 'flag-right': right });
    });
    return () => { cancelled = true; };
  }, [liveries['flag-left'], liveries['flag-right']]);

  const openFlagEditor = useCallback((face: Face) => {
    if (face !== 'flag-left' && face !== 'flag-right') return;
    setActiveFace(face);
    setEditorOpen(true);
  }, [setActiveFace]);

  const bothReady =
    scores['flag-left'] >= TAKEOFF_SCORE &&
    scores['flag-right'] >= TAKEOFF_SCORE;
  const overallScore = Math.round((scores['flag-left'] + scores['flag-right']) / 2);

  const startHangar = () => {
    setIntroOpen(false);
    setOpeningCount(3);
    playerPosition.current.copy(PLAYER_START);
  };

  return (
    <main className="launch-bay">
      <style>{LAUNCH_BAY_CSS}</style>

      {introOpen && (
        <div className="mission-intro">
          <div className="mission-card">
            <span className="mission-kicker">MARSHOUT / FREE FLIGHT</span>
            <h1>I got the flight.<br /><em>You make it ours.</em></h1>
            <p>
              I’m giving you a free flight, homie. Paint both flags at least 80%,
              then we out.
            </p>
            <div className="mission-tip">
              <span className="pen-icon">✏️</span>
              <div>
                <b>KEEP THE FLAG SHAPE.</b>
                <small>Don’t crop the flag — paint it using the <strong>Draw</strong> tool.</small>
              </div>
            </div>
            <button type="button" className="mission-ok" onClick={startHangar}>
              <span>BET. OPEN THE HANGAR</span><b>→</b>
            </button>
          </div>
        </div>
      )}

      {openingCount !== null && (
        <div className="opening-overlay">
          <span>VICE CITY AIRFIELD / BAY 01</span>
          <strong>{openingCount > 0 ? openingCount : 'GO'}</strong>
          <h2>ROLLING THE BIRD OUT...</h2>
          <div className="opening-track"><i /></div>
        </div>
      )}

      <header className="hangar-topbar">
        <button type="button" className="top-door" onClick={() => go('/')}>
          <span className="top-door-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M3 11.2 12 4l9 7.2" />
              <path d="M5.5 10.2V21h13V10.2" />
              <path d="M9.5 21v-6.7h5V21" />
              <path d="M14.5 14.3h2.2" />
            </svg>
          </span>
          <span><small>BACK TO THE BOULEVARD</small><strong>OPEN ANOTHER DOOR</strong></span>
          <b>↗</b>
        </button>

        <div className="hangar-title">
          <small>MARSHOUT / PLANE HANGAR</small>
          <strong>FLAG RUN</strong>
        </div>

        <SoundToggle muted={muted} onToggle={toggleSound} />
      </header>

      <section className="game-shell">
        <div className="game-viewport">
          <Canvas
            shadows
            dpr={[1, 1.25]}
            frameloop="always"
            gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
            camera={{ position: [5.2, 3.4, 6.5], fov: 42, near: 0.1, far: 50 }}
          >
            <color attach="background" args={['#202b38']} />
            <fog attach="fog" args={['#202b38', 12, 27]} />
            <hemisphereLight args={['#f5d7aa', '#27313a', 1.1]} />
            <directionalLight position={[5, 8, 5]} intensity={2.3} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
            <pointLight position={[-4, 2.4, 1]} color="#e59b5b" intensity={13} distance={8} />
            <pointLight position={[4, 2.6, -1]} color="#6e9fc6" intensity={9} distance={8} />

            <Road />
            <Plane liveries={liveries} />
            <MainCharacter gender={playerGender} position={playerPosition} />
            <PlayerController
              position={playerPosition}
              enabled={gameReady && !editorOpen && !introOpen}
              onNearFace={setNearFace}
              onInteract={openFlagEditor}
            />

            <Suspense fallback={<Html center style={{ color:'#f4d8a7',fontSize:'9px',fontWeight:900,letterSpacing:'.16em' }}>PILOT CLOCKING IN…</Html>}>
              <HangarMan position={[1.75, 0, -0.35]} />
            </Suspense>

            <OrbitControls
              makeDefault
              enablePan={false}
              enableDamping
              dampingFactor={0.12}
              minDistance={4.5}
              maxDistance={9}
              maxPolarAngle={1.25}
              minPolarAngle={0.45}
              target={[0, 0.75, 0.6]}
            />
          </Canvas>

          <div className="game-hud">
            <div className="hud-controls">
              <small>MOVE</small><b>WASD / ARROWS</b>
              <i />
              <small>INTERACT</small><b>E</b>
            </div>

            {nearFace && (
              <button className="interaction-prompt" type="button" onClick={() => openFlagEditor(nearFace)}>
                <kbd>E</kbd>
                <span>
                  <small>YOU’RE AT {nearFace === 'flag-left' ? 'LEFT FLAG' : 'RIGHT FLAG'}</small>
                  <strong>PAINT THIS FLAG</strong>
                </span>
                <b>✏️</b>
              </button>
            )}

            {!nearFace && gameReady && (
              <div className="walk-prompt">Walk around the plane. Get close to a flag.</div>
            )}
          </div>
        </div>

        <aside className="mission-panel">
          <div className="mission-panel-head">
            <span>FLIGHT PREP / 01</span>
            <strong>PAINT BOTH FLAGS</strong>
            <p>Get each flag to 80%. Both sides count.</p>
          </div>

          <div className="score-card">
            {(['flag-left','flag-right'] as const).map((face) => (
              <div className="flag-score" key={face}>
                <div>
                  <span>{face === 'flag-left' ? 'LEFT FLAG' : 'RIGHT FLAG'}</span>
                  <b className={scores[face] >= 80 ? 'ready' : ''}>{scores[face]}%</b>
                </div>
                <div className="score-track"><i style={{ width: `${scores[face]}%` }} /></div>
                <small>{scores[face] >= 80 ? 'READY ✓' : `${80 - scores[face]}% TO GO`}</small>
              </div>
            ))}
          </div>

          <div className="overall">
            <span>COMBINED PAINT</span><b>{overallScore}%</b>
          </div>

          <div className="draw-notice">
            <span>✏️</span>
            <p><b>DON’T CROP THE FLAG.</b><br />Use <strong>Draw</strong> and paint over the flag itself.</p>
          </div>

          <div className="pilot-status">
            <i /><span><small>PILOT-OUT</small><b>WAITING ON YOU</b></span>
          </div>

          <button
            type="button"
            disabled={!bothReady}
            className={`launch-bay-takeoff-button ${bothReady ? 'is-ready' : ''}`}
            onClick={() => bothReady && go('/fly')}
          >
            <span>{bothReady ? 'TAKE OFF' : 'PAINT BOTH TO 80%'}</span>
            <span className="launch-bay-arrow">→</span>
          </button>
        </aside>
      </section>

      {editorOpen && (
        <div className="editor-overlay">
          <div className="editor-window">
            <div className="editor-window-head">
              <div>
                <small>NOW PAINTING</small>
                <strong>{activeFace === 'flag-left' ? 'LEFT FLAG' : 'RIGHT FLAG'}</strong>
              </div>
              <div className="editor-rule"><span>✏️</span><b>DON’T CROP IT.</b> USE DRAW.</div>
              <button type="button" onClick={() => setEditorOpen(false)}>DONE / CLOSE ×</button>
            </div>
            <div className="editor-body"><LiveryEditor /></div>
          </div>
        </div>
      )}
    </main>
  );
}

const LAUNCH_BAY_CSS = `
*{box-sizing:border-box}
.launch-bay{min-height:100svh;background:#111923;color:#f5f0e7;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}
.launch-bay button{font:inherit}
.hangar-topbar{height:84px;padding:12px clamp(16px,3vw,44px);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;background:#f6f2e9;color:#071a38;border-bottom:1px solid rgba(7,26,56,.12);position:relative;z-index:20}
.top-door{justify-self:start;min-height:58px;padding:7px 12px 7px 8px;border:1px solid rgba(192,139,67,.55);border-radius:9px;background:#071a38;color:white;display:grid;grid-template-columns:43px auto 18px;align-items:center;gap:11px;text-align:left;cursor:pointer;box-shadow:0 12px 28px rgba(7,26,56,.16);transition:.15s}
.top-door:hover{transform:translateY(-2px);border-color:#d3a252}.top-door-icon{width:43px;height:43px;border-radius:7px;background:#d3a252;color:#071a38;display:grid;place-items:center}.top-door-icon svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.top-door small,.top-door strong{display:block}.top-door small{font-size:6px;color:rgba(255,255,255,.5);letter-spacing:.13em}.top-door strong{margin-top:3px;font-size:9px;letter-spacing:.1em}.top-door>b{color:#d3a252;font-size:17px}
.hangar-title{text-align:center}.hangar-title small,.hangar-title strong{display:block}.hangar-title small{font-size:7px;letter-spacing:.18em;color:#c08b43;font-weight:950}.hangar-title strong{font-size:19px;letter-spacing:-.03em;margin-top:3px}
.launch-bay-sound-toggle{justify-self:end;width:46px;height:46px;border:1px solid rgba(7,26,56,.12);border-radius:8px;background:white;color:#071a38;display:grid;place-items:center;cursor:pointer}
.game-shell{height:calc(100svh - 84px);display:grid;grid-template-columns:minmax(0,1fr) 310px;background:#121b25}
.game-viewport{position:relative;min-width:0;overflow:hidden}.game-viewport canvas{display:block}
.game-hud{position:absolute;inset:0;pointer-events:none}.hud-controls{position:absolute;left:18px;top:18px;display:flex;align-items:center;gap:8px;padding:9px 11px;border:1px solid rgba(255,255,255,.12);border-radius:6px;background:rgba(7,17,29,.76);backdrop-filter:blur(10px);box-shadow:0 10px 25px rgba(0,0,0,.18)}.hud-controls small{font-size:6px;color:#d3a252;font-weight:950;letter-spacing:.13em}.hud-controls b{font-size:8px;letter-spacing:.08em}.hud-controls i{width:1px;height:16px;background:rgba(255,255,255,.14);margin:0 3px}
.interaction-prompt{pointer-events:auto;position:absolute;left:50%;bottom:32px;transform:translateX(-50%);min-width:310px;padding:10px 13px;border:1px solid rgba(211,162,82,.7);border-radius:7px;background:rgba(7,20,37,.94);color:white;display:grid;grid-template-columns:40px 1fr 28px;align-items:center;gap:12px;text-align:left;cursor:pointer;box-shadow:0 20px 55px rgba(0,0,0,.3)}.interaction-prompt kbd{width:38px;height:38px;border-radius:5px;background:#d3a252;color:#071a38;display:grid;place-items:center;font-weight:950}.interaction-prompt small,.interaction-prompt strong{display:block}.interaction-prompt small{font-size:6px;color:rgba(255,255,255,.5);letter-spacing:.12em}.interaction-prompt strong{font-size:10px;letter-spacing:.1em;margin-top:3px}.interaction-prompt>b{font-size:20px}.walk-prompt{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);padding:8px 12px;background:rgba(7,20,37,.72);border-radius:4px;font-size:8px;font-weight:850;letter-spacing:.08em}
.mission-panel{padding:24px 20px;background:linear-gradient(180deg,#f4f0e8,#e8e2d7);color:#071a38;border-left:1px solid rgba(0,0,0,.15);display:flex;flex-direction:column;gap:18px;overflow:auto}.mission-panel-head>span{font-size:7px;color:#b37a35;font-weight:950;letter-spacing:.16em}.mission-panel-head>strong{display:block;font-size:20px;letter-spacing:-.035em;margin-top:5px}.mission-panel-head p{font-size:10px;color:rgba(7,26,56,.56);line-height:1.5;margin:5px 0 0}
.score-card{display:grid;gap:14px}.flag-score{padding:13px;border:1px solid rgba(7,26,56,.1);border-radius:7px;background:rgba(255,255,255,.55)}.flag-score>div:first-child{display:flex;justify-content:space-between;align-items:center}.flag-score span{font-size:8px;font-weight:950;letter-spacing:.1em}.flag-score b{font-size:17px;color:#9a5d3b}.flag-score b.ready{color:#33704e}.score-track{height:5px;margin:9px 0 6px;background:rgba(7,26,56,.09);border-radius:9px;overflow:hidden}.score-track i{display:block;height:100%;background:#c58b3c;border-radius:9px;transition:width .3s}.flag-score small{font-size:6px;color:rgba(7,26,56,.45);font-weight:950;letter-spacing:.1em}.overall{display:flex;justify-content:space-between;align-items:end;padding:0 2px}.overall span{font-size:7px;font-weight:950;letter-spacing:.14em;color:rgba(7,26,56,.48)}.overall b{font-size:24px}
.draw-notice{display:flex;gap:10px;padding:12px;border:1px solid rgba(197,139,60,.35);background:#fff7e9;border-radius:7px}.draw-notice>span{font-size:19px}.draw-notice p{margin:0;font-size:9px;line-height:1.5}.draw-notice p>b{letter-spacing:.07em}.pilot-status{display:flex;align-items:center;gap:9px;margin-top:auto;padding-top:8px}.pilot-status>i{width:8px;height:8px;border-radius:50%;background:#3f815e;box-shadow:0 0 0 4px rgba(63,129,94,.1)}.pilot-status small,.pilot-status b{display:block}.pilot-status small{font-size:6px;color:rgba(7,26,56,.45);letter-spacing:.13em}.pilot-status b{font-size:8px;letter-spacing:.09em;margin-top:2px}
.launch-bay-takeoff-button{height:52px;padding:0 16px;border:0;border-radius:7px;background:#cbc8c1;color:rgba(7,26,56,.35);display:flex;align-items:center;justify-content:space-between;font-size:9px;font-weight:950;letter-spacing:.12em;cursor:not-allowed}.launch-bay-takeoff-button.is-ready{background:#071a38;color:white;cursor:pointer;box-shadow:0 12px 25px rgba(7,26,56,.18)}.launch-bay-arrow{color:#d3a252;font-size:17px}
.mission-intro,.opening-overlay,.editor-overlay{position:fixed;inset:0;z-index:100;background:rgba(5,12,22,.82);backdrop-filter:blur(12px);display:grid;place-items:center;padding:20px}.mission-card{width:min(540px,100%);padding:34px;background:#f3eee4;color:#071a38;border:1px solid rgba(211,162,82,.45);border-radius:10px;box-shadow:0 35px 90px rgba(0,0,0,.35)}.mission-kicker{font-size:7px;color:#b77e38;font-weight:950;letter-spacing:.18em}.mission-card h1{font-size:clamp(38px,5vw,62px);line-height:.88;letter-spacing:-.06em;margin:14px 0 16px;text-transform:uppercase}.mission-card h1 em{font-family:Georgia,serif;font-weight:400;text-transform:none;color:#bd8240}.mission-card>p{font-size:13px;line-height:1.55;color:rgba(7,26,56,.66)}.mission-tip{margin:22px 0;display:flex;gap:12px;padding:13px;background:#fff8e9;border:1px solid rgba(197,139,60,.3);border-radius:7px}.pen-icon{font-size:22px}.mission-tip b,.mission-tip small{display:block}.mission-tip b{font-size:9px;letter-spacing:.1em}.mission-tip small{margin-top:3px;font-size:9px;color:rgba(7,26,56,.6)}.mission-ok{width:100%;height:54px;padding:0 16px;border:0;border-radius:7px;background:#071a38;color:white;display:flex;justify-content:space-between;align-items:center;font-size:9px;font-weight:950;letter-spacing:.12em;cursor:pointer}.mission-ok b{color:#d3a252;font-size:18px}
.opening-overlay{z-index:110;background:#071523;color:white;text-align:center}.opening-overlay>span{font-size:7px;color:#d3a252;font-weight:950;letter-spacing:.2em}.opening-overlay>strong{display:block;font-size:clamp(100px,18vw,220px);line-height:.8;letter-spacing:-.08em;margin:20px 0;color:#f3eee4}.opening-overlay h2{font-size:10px;letter-spacing:.22em}.opening-track{width:min(330px,70vw);height:3px;background:rgba(255,255,255,.12);margin:18px auto 0;overflow:hidden}.opening-track i{display:block;width:100%;height:100%;background:#d3a252;animation:openTrack 1.95s linear}@keyframes openTrack{from{transform:translateX(-100%)}to{transform:translateX(0)}}
.editor-overlay{z-index:120;padding:28px}.editor-window{width:min(1180px,96vw);height:min(800px,92vh);display:flex;flex-direction:column;background:#eef1f3;border-radius:10px;overflow:hidden;box-shadow:0 35px 100px rgba(0,0,0,.5)}.editor-window-head{min-height:70px;padding:10px 14px;background:#071a38;color:white;display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:18px}.editor-window-head small,.editor-window-head strong{display:block}.editor-window-head small{font-size:6px;color:#d3a252;letter-spacing:.14em}.editor-window-head strong{font-size:13px;margin-top:3px}.editor-rule{font-size:8px;letter-spacing:.08em;color:rgba(255,255,255,.7)}.editor-rule span{font-size:17px;margin-right:7px}.editor-rule b{color:#d3a252}.editor-window-head button{height:38px;padding:0 12px;border:1px solid rgba(255,255,255,.18);border-radius:5px;background:white;color:#071a38;font-size:8px;font-weight:950;letter-spacing:.08em;cursor:pointer}.editor-body{flex:1;min-height:0}.editor-body>*{width:100%;height:100%;min-height:0}
@media(max-width:900px){.hangar-topbar{height:auto;grid-template-columns:1fr auto;padding:10px 12px}.hangar-title{display:none}.top-door{min-height:52px}.game-shell{height:calc(100svh - 73px);grid-template-columns:1fr}.mission-panel{position:absolute;right:10px;top:86px;z-index:30;width:230px;max-height:calc(100svh - 105px);padding:14px;gap:11px;border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.25)}.mission-panel-head>strong{font-size:15px}.draw-notice,.pilot-status{display:none}.interaction-prompt{min-width:min(310px,88vw);bottom:20px}.editor-window-head{grid-template-columns:1fr auto}.editor-rule{grid-column:1/-1;grid-row:2}.editor-window{height:94vh}.editor-overlay{padding:10px}}
@media(max-width:560px){.top-door{grid-template-columns:38px auto 14px}.top-door-icon{width:38px;height:38px}.top-door small{display:none}.top-door strong{font-size:8px}.mission-panel{width:190px}.flag-score{padding:9px}.hud-controls{top:10px;left:10px}.walk-prompt{display:none}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}.opening-track i{animation:none}}
`;
