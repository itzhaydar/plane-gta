import { Suspense, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { usePlaneStore } from '../store';

type Destination = { title: string; short: string; path: string; x: number; color: string };
const DESTINATIONS: Destination[] = [
  { title: 'Get a travel flyer', short: 'FLYER HOUSE', path: '/homie', x: 0, color: '#d3a34f' },
  { title: 'Take a trip to Port Gellhorn', short: 'GELLHORN DEPARTURES', path: '/hangar', x: 18, color: '#f4f0e8' },
  { title: 'Attend a Party on Mars', short: 'MARS / NIGHT FLIGHT', path: '/rock-hangar', x: 36, color: '#d3a34f' },
];
const START = new THREE.Vector3(-4, 0, 0);

function Building({ destination, index, near }: { destination: Destination; index: number; near: boolean }) {
  const { x, color } = destination;
  const height = [8, 11, 10][index];
  return (
    <group position={[x, 0, -7]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, height, 5.8]} />
        <meshStandardMaterial color={['#f1eee7', '#102848', '#e7e3db'][index]} roughness={0.72} />
      </mesh>
      <mesh position={[0, height + 0.2, 0]} castShadow>
        <boxGeometry args={[11.6, 0.4, 6.3]} />
        <meshStandardMaterial color="#111c33" metalness={0.4} />
      </mesh>
      {/* Vertical architectural ribs and warm lit windows. */}
      {[-4.6, -2.7, 2.7, 4.6].map((offset) => (
        <group key={offset}>
          <mesh position={[offset, height / 2, 3.01]}>
            <boxGeometry args={[0.14, height - 0.5, 0.18]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
          {[3.2, 5.2, 7.2].filter((y) => y < height - 0.7).map((y) => (
            <mesh key={y} position={[offset + 0.85, y, 2.99]}>
              <boxGeometry args={[1.1, 1.25, 0.09]} />
              <meshStandardMaterial color="#f5f1e8" emissive="#d3a34f" emissiveIntensity={0.58} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 1.17, 3.07]}>
        <boxGeometry args={[2.1, 2.34, 0.16]} />
        <meshStandardMaterial color="#102334" metalness={0.7} roughness={0.18} />
      </mesh>
      <mesh position={[0, 1.18, 3.18]}>
        <boxGeometry args={[2.35, 2.48, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={near ? 2 : 0.85} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 2.75, 3.42]} castShadow>
        <boxGeometry args={[4.4, 0.24, 1.6]} />
        <meshStandardMaterial color="#101c32" />
      </mesh>
      <mesh position={[0, height - 0.8, 3.14]}>
        <boxGeometry args={[8.8, 1.05, 0.18]} />
        <meshStandardMaterial color="#13213a" />
      </mesh>
      <Html position={[0, height - 0.8, 3.28]} transform center distanceFactor={12} occlude={false}>
        <div className="city-sign" style={{ color }}>{destination.short}</div>
      </Html>
      <Html position={[0, 3.4, 3.15]} center distanceFactor={13} occlude={false}>
        <div className={`city-door-label ${near ? 'is-near' : ''}`}>
          <small>0{index + 1} / DESTINATION</small>
          <strong>{destination.title}</strong>
          {near && <span className="door-enter-key"><b>E</b> STEP INSIDE</span>}
        </div>
      </Html>
      <pointLight position={[0, 3, 3.8]} intensity={near ? 12 : 6} distance={8} color={color} />
      {index === 2 && <mesh position={[0, height + 0.75, 0]}><sphereGeometry args={[0.55, 20, 12]} /><meshStandardMaterial color="#d3a34f" emissive="#d3a34f" emissiveIntensity={1.2} /></mesh>}
    </group>
  );
}

function Palm({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
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
  </group>;
}

function StreetLight({ x, z = 4.2 }: { x: number; z?: number }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, 2.8, 0]}><cylinderGeometry args={[0.055, 0.09, 5.6, 8]} /><meshStandardMaterial color="#0a1930" metalness={0.7} /></mesh>
    <mesh position={[0.45, 5.55, 0]}><boxGeometry args={[0.95, 0.12, 0.16]} /><meshStandardMaterial color="#0a1930" /></mesh>
    <mesh position={[0.88, 5.42, 0]}><boxGeometry args={[0.28, 0.1, 0.25]} /><meshStandardMaterial color="#f4f0e8" emissive="#d3a34f" emissiveIntensity={2.4} /></mesh>
    <pointLight position={[0.88, 5.25, 0]} intensity={4.5} distance={10} color="#f0c778" />
  </group>;
}

type WalkerLook = { skin: string; top: string; bottom: string; hair: string; accent: string };

function Pedestrian({ x, z, speed, direction, look, phase = 0, variant = 'man' }: {
  x: number; z: number; speed: number; direction: 1 | -1; look: WalkerLook; phase?: number; variant?: 'man' | 'woman';
}) {
  const ref = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;

    ref.current.position.x += direction * speed * delta;
    if (direction > 0 && ref.current.position.x > 50) ref.current.position.x = -10;
    if (direction < 0 && ref.current.position.x < -10) ref.current.position.x = 50;

    const t = clock.elapsedTime * 6.4 + phase;
    const swing = Math.sin(t) * 0.48;
    const bob = Math.abs(Math.sin(t)) * 0.018;

    if (torso.current) torso.current.position.y = bob;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.72;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.72;

    ref.current.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  });

  return (
    <group ref={ref} position={[x, 0, z]} scale={0.88}>
      <group ref={torso}>
        {/* Same smooth blocky character language as the player, varied casual clothes */}
        <mesh position={[0, 1.48, 0]} castShadow>
          <boxGeometry args={[variant === 'woman' ? 0.64 : 0.70, 0.86, variant === 'woman' ? 0.36 : 0.38]} />
          <meshStandardMaterial color={look.top} roughness={0.84} />
        </mesh>

        {/* shirt seams / layered casual detail */}
        <mesh position={[0, 1.49, 0.205]}>
          <boxGeometry args={[0.10, 0.78, 0.025]} />
          <meshStandardMaterial color={look.accent} roughness={0.78} />
        </mesh>

        <mesh position={[0, 1.98, 0]} castShadow>
          <boxGeometry args={[0.20, 0.20, 0.20]} />
          <meshStandardMaterial color={look.skin} roughness={0.9} />
        </mesh>

        <mesh position={[0, 2.27, 0]} castShadow>
          <boxGeometry args={[0.48, 0.47, 0.42]} />
          <meshStandardMaterial color={look.skin} roughness={0.9} />
        </mesh>

        {/* Distinct hair silhouettes while keeping the same blocky visual language */}
        {variant === 'woman' ? (
          <>
            <mesh position={[0, 2.51, -0.035]} castShadow>
              <boxGeometry args={[0.51, 0.15, 0.43]} />
              <meshStandardMaterial color={look.hair} roughness={1} />
            </mesh>
            <mesh position={[-0.21, 2.30, -0.08]} castShadow>
              <boxGeometry args={[0.11, 0.48, 0.24]} />
              <meshStandardMaterial color={look.hair} roughness={1} />
            </mesh>
            <mesh position={[0.21, 2.30, -0.08]} castShadow>
              <boxGeometry args={[0.11, 0.48, 0.24]} />
              <meshStandardMaterial color={look.hair} roughness={1} />
            </mesh>
            <mesh position={[0, 2.18, -0.20]} castShadow>
              <boxGeometry args={[0.34, 0.36, 0.12]} />
              <meshStandardMaterial color={look.hair} roughness={1} />
            </mesh>
          </>
        ) : (
          <>
            <mesh position={[0, 2.53, -0.01]} castShadow>
              <boxGeometry args={[0.49, 0.13, 0.42]} />
              <meshStandardMaterial color={look.hair} roughness={1} />
            </mesh>
            {[-0.15,-0.05,0.05,0.15].map((hx, i) => (
              <mesh key={hx} position={[hx, 2.595 + (i % 2) * .012, 0.015]}>
                <boxGeometry args={[0.085, 0.065, 0.085]} />
                <meshStandardMaterial color={look.hair} roughness={1} />
              </mesh>
            ))}
          </>
        )}

        {/* simple human face, no glasses */}
        {[-0.10,0.10].map((ex) => (
          <mesh key={ex} position={[ex,2.31,0.219]}>
            <boxGeometry args={[0.04,.024,.016]} />
            <meshStandardMaterial color="#171719" />
          </mesh>
        ))}
        <mesh position={[0,2.245,0.23]}>
          <boxGeometry args={[0.065,.09,.05]} />
          <meshStandardMaterial color={look.skin} />
        </mesh>
        <mesh position={[0,2.16,0.219]}>
          <boxGeometry args={[0.17,.03,.016]} />
          <meshStandardMaterial color="#633f32" />
        </mesh>
      </group>

      <group ref={leftArm} position={[-0.43,1.70,0]}>
        <mesh position={[0,-0.31,0]} castShadow>
          <capsuleGeometry args={[0.095,0.53,6,10]} />
          <meshStandardMaterial color={look.skin} roughness={0.9} />
        </mesh>
        <mesh position={[0,-0.65,0.02]}>
          <boxGeometry args={[0.17,.19,.17]} />
          <meshStandardMaterial color={look.skin} />
        </mesh>
      </group>

      <group ref={rightArm} position={[0.43,1.70,0]}>
        <mesh position={[0,-0.31,0]} castShadow>
          <capsuleGeometry args={[0.095,0.53,6,10]} />
          <meshStandardMaterial color={look.skin} roughness={0.9} />
        </mesh>
        <mesh position={[0,-0.65,0.02]}>
          <boxGeometry args={[0.17,.19,.17]} />
          <meshStandardMaterial color={look.skin} />
        </mesh>
      </group>

      <group ref={leftLeg} position={[variant === 'woman' ? -0.14 : -0.16,1.05,0]}>
        <mesh position={[0,-0.46,0]} castShadow>
          <capsuleGeometry args={[0.12,0.69,6,10]} />
          <meshStandardMaterial color={look.bottom} roughness={0.9} />
        </mesh>
        <mesh position={[0,-0.90,0.10]}>
          <boxGeometry args={[0.26,.16,.45]} />
          <meshStandardMaterial color="#17181c" roughness={0.88} />
        </mesh>
      </group>

      <group ref={rightLeg} position={[variant === 'woman' ? 0.14 : 0.16,1.05,0]}>
        <mesh position={[0,-0.46,0]} castShadow>
          <capsuleGeometry args={[0.12,0.69,6,10]} />
          <meshStandardMaterial color={look.bottom} roughness={0.9} />
        </mesh>
        <mesh position={[0,-0.90,0.10]}>
          <boxGeometry args={[0.26,.16,.45]} />
          <meshStandardMaterial color="#17181c" roughness={0.88} />
        </mesh>
      </group>
    </group>
  );
}

function Car({ x, z, speed, direction, kind = 0 }: { x: number; z: number; speed: number; direction: 1 | -1; kind?: number }) {
  const ref = useRef<THREE.Group>(null);
  const body = ['#f2efe7', '#0b2344', '#c99a43', '#d9dce1'][kind % 4];
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x += direction * speed * delta;
    if (direction > 0 && ref.current.position.x > 56) ref.current.position.x = -16;
    if (direction < 0 && ref.current.position.x < -16) ref.current.position.x = 56;
  });
  return <group ref={ref} position={[x, 0.43, z]} rotation={[0, direction > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
    <mesh castShadow position={[0, 0.18, 0]}><boxGeometry args={[1.75, 0.46, 3.7]} /><meshStandardMaterial color={body} metalness={0.35} roughness={0.3} /></mesh>
    <mesh castShadow position={[0, 0.66, -0.2]}><boxGeometry args={[1.48, 0.62, 1.95]} /><meshStandardMaterial color={body} metalness={0.3} roughness={0.28} /></mesh>
    <mesh position={[0, 0.69, 0.82]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[1.25, 0.65]} /><meshStandardMaterial color="#071427" metalness={0.65} roughness={0.12} /></mesh>
    <mesh position={[0, 0.69, -1.2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[1.25, 0.55]} /><meshStandardMaterial color="#071427" metalness={0.65} roughness={0.12} /></mesh>
    {[-0.83, 0.83].flatMap((wx) => [-1.15, 1.15].map((wz) => <mesh key={`${wx}-${wz}`} position={[wx, -0.12, wz]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.29, 0.29, 0.18, 14]} /><meshStandardMaterial color="#080b11" roughness={0.85} /></mesh>))}
    <mesh position={[-0.58, 0.18, 1.87]}><boxGeometry args={[0.35, 0.18, 0.05]} /><meshStandardMaterial color="#fff4d6" emissive="#f4d28a" emissiveIntensity={2} /></mesh>
    <mesh position={[0.58, 0.18, 1.87]}><boxGeometry args={[0.35, 0.18, 0.05]} /><meshStandardMaterial color="#fff4d6" emissive="#f4d28a" emissiveIntensity={2} /></mesh>
  </group>;
}

function MalePlayer({ position }: { position: MutableRefObject<THREE.Vector3> }) {
  const group = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const last = useRef(START.clone());

  useFrame(({ clock }) => {
    if (!group.current) return;

    const moved = last.current.distanceToSquared(position.current) > 0.000008;
    const dx = position.current.x - last.current.x;
    const dz = position.current.z - last.current.z;

    group.current.position.copy(position.current);
    if (moved) group.current.rotation.y = Math.atan2(dx, dz);

    const t = clock.elapsedTime * 8.2;
    const swing = moved ? Math.sin(t) * 0.52 : 0;
    const bob = moved ? Math.abs(Math.sin(t)) * 0.025 : Math.sin(clock.elapsedTime * 1.8) * 0.006;

    if (torso.current) torso.current.position.y = bob;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.72;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.72;

    last.current.copy(position.current);
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
    <group ref={group} position={START.toArray()} scale={1.04}>
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


function FemalePlayer({ position }: { position: MutableRefObject<THREE.Vector3> }) {
  const group = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const last = useRef(START.clone());

  useFrame(({ clock }) => {
    if (!group.current) return;

    const moved = last.current.distanceToSquared(position.current) > 0.000008;
    const dx = position.current.x - last.current.x;
    const dz = position.current.z - last.current.z;

    group.current.position.copy(position.current);
    if (moved) group.current.rotation.y = Math.atan2(dx, dz);

    const t = clock.elapsedTime * 8.2;
    const swing = moved ? Math.sin(t) * 0.46 : 0;
    const bob = moved
      ? Math.abs(Math.sin(t)) * 0.023
      : Math.sin(clock.elapsedTime * 1.8) * 0.006;

    if (torso.current) torso.current.position.y = bob;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.74;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.74;

    last.current.copy(position.current);
  });

  const skin = '#a96f52';
  const hair = '#241914';
  const navy = '#0b274b';
  const cream = '#f5f2eb';
  const gold = '#d3a34f';
  const denim = '#17223a';
  const shoes = '#10151d';

  return (
    <group ref={group} position={START.toArray()} scale={1.01}>
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

function City({ position, near, gender }: { position: MutableRefObject<THREE.Vector3>; near: number | null; gender: 'man' | 'woman' }) {
  const walkers: Array<{x:number;z:number;speed:number;direction:1|-1;look:WalkerLook;phase:number;variant:'man'|'woman'}> = [
    // North sidewalk — mixed crowd, equal speed preserves spacing.
    { x: -7, z: -4.0, speed: 0.50, direction: 1, phase: 0.0, variant:'man', look: { skin:'#70472f', top:'#d9c7a5', bottom:'#3b4558', hair:'#111317', accent:'#9b5a42' } },
    { x:  5, z: -4.0, speed: 0.50, direction: 1, phase: 1.2, variant:'woman', look: { skin:'#a96f52', top:'#a94f58', bottom:'#34394b', hair:'#251914', accent:'#e2bf77' } },
    { x: 17, z: -4.0, speed: 0.50, direction: 1, phase: 2.4, variant:'man', look: { skin:'#5f3d2c', top:'#627550', bottom:'#293a50', hair:'#0e1014', accent:'#d7b26a' } },
    { x: 29, z: -4.0, speed: 0.50, direction: 1, phase: 3.6, variant:'woman', look: { skin:'#c88767', top:'#4d7180', bottom:'#6c5146', hair:'#2c1b17', accent:'#e7d2a6' } },
    { x: 41, z: -4.0, speed: 0.50, direction: 1, phase: 4.8, variant:'man', look: { skin:'#c99572', top:'#6c5d8f', bottom:'#33384a', hair:'#261b18', accent:'#d9c58d' } },

    // South sidewalk — mixed crowd, opposite direction and stable gaps.
    { x: 49, z: 4.2, speed: 0.46, direction: -1, phase: 0.6, variant:'woman', look: { skin:'#d5a17e', top:'#b27649', bottom:'#ded6c8', hair:'#3a241b', accent:'#e0b967' } },
    { x: 37, z: 4.2, speed: 0.46, direction: -1, phase: 1.8, variant:'man', look: { skin:'#9b684c', top:'#315f67', bottom:'#6b594b', hair:'#1d1715', accent:'#d6b779' } },
    { x: 25, z: 4.2, speed: 0.46, direction: -1, phase: 3.0, variant:'woman', look: { skin:'#653f31', top:'#8b668e', bottom:'#27303d', hair:'#111215', accent:'#d9b676' } },
    { x: 13, z: 4.2, speed: 0.46, direction: -1, phase: 4.2, variant:'man', look: { skin:'#b97758', top:'#c06f3f', bottom:'#30343c', hair:'#2b1d18', accent:'#f0d7aa' } },
  ];

  return <>
    <color attach="background" args={['#07162b']} />
    <fog attach="fog" args={['#0a1c35', 34, 95]} />
    <ambientLight intensity={0.85} color="#dce4ef" />
    <hemisphereLight intensity={1.05} color="#f6f1e7" groundColor="#071427" />
    <directionalLight position={[-12, 18, 10]} intensity={2.3} color="#f0c778" castShadow shadow-mapSize={[1024, 1024]} />
    <Stars radius={90} depth={30} count={260} factor={1.6} fade />

    {/* boulevard, sidewalks and lane detail */}
    <mesh position={[20, -0.2, 0]} receiveShadow><boxGeometry args={[125, 0.3, 52]} /><meshStandardMaterial color="#071427" /></mesh>
    <mesh position={[20, 0, 0]} receiveShadow><boxGeometry args={[125, 0.1, 7.2]} /><meshStandardMaterial color="#111b2b" roughness={0.96} /></mesh>
    <mesh position={[20, 0.12, -4.45]} receiveShadow><boxGeometry args={[125, 0.3, 2.5]} /><meshStandardMaterial color="#d9d5cc" roughness={0.9} /></mesh>
    <mesh position={[20, 0.12, 4.45]} receiveShadow><boxGeometry args={[125, 0.3, 2.5]} /><meshStandardMaterial color="#d9d5cc" roughness={0.9} /></mesh>
    {Array.from({ length: 23 }, (_, i) => <mesh key={i} position={[-10 + i * 3.2, 0.07, 0]}><boxGeometry args={[1.45, 0.018, 0.08]} /><meshBasicMaterial color="#d3a34f" /></mesh>)}

    {DESTINATIONS.map((destination, index) => <Building key={destination.path} destination={destination} index={index} near={near === index} />)}
    {[-8, 8, 26, 46].map((x) => <Palm key={x} x={x} z={-5.15} />)}
    {[-1, 10, 21, 32, 43].map((x) => <StreetLight key={x} x={x} />)}

    {/* moving city life */}
    {/* Light traffic: three cars per lane, equal lane speeds preserve spacing. */}
    <Car x={-12} z={1.75} speed={3.05} direction={1} kind={0} />
    <Car x={10}  z={1.75} speed={3.05} direction={1} kind={2} />
    <Car x={34}  z={1.75} speed={3.05} direction={1} kind={4} />

    <Car x={54} z={-1.75} speed={3.25} direction={-1} kind={1} />
    <Car x={31} z={-1.75} speed={3.25} direction={-1} kind={3} />
    <Car x={8}  z={-1.75} speed={3.25} direction={-1} kind={5} />
    {walkers.map((w, i) => <Pedestrian key={i} {...w} />)}

    {gender === 'woman' ? <FemalePlayer position={position} /> : <MalePlayer position={position} />}
  </>;
}

function Movement({ position, keys, onMove }: { position: MutableRefObject<THREE.Vector3>; keys: MutableRefObject<Set<string>>; onMove: (x: number, z: number) => void }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const held = keys.current;
    const dx = Number(held.has('arrowright')) - Number(held.has('arrowleft'));
    const dz = Number(held.has('arrowdown')) - Number(held.has('arrowup'));
    if (dx || dz) {
      const step = Math.min(delta, 0.05) * 5 / Math.hypot(dx, dz);
      position.current.x = THREE.MathUtils.clamp(position.current.x + dx * step, -7, 44);
      position.current.z = THREE.MathUtils.clamp(position.current.z + dz * step, -2.7, 2.8);
      onMove(position.current.x, position.current.z);
    }
    target.current.set(position.current.x - 5.7, 5.1, position.current.z + 10.5);
    camera.position.lerp(target.current, Math.min(delta * 3, 1));
    camera.lookAt(position.current.x + 2.8, 1.8, -3.6);
  });
  return null;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const setRole = usePlaneStore((state) => state.setRole);
  const gender = usePlaneStore((state) => state.gender);
  const setGender = usePlaneStore((state) => state.setGender);
  const [phase, setPhase] = useState<'intro' | 'gender' | 'countdown' | 'tour'>('intro');
  const [count, setCount] = useState(3);
  const [location, setLocation] = useState({ x: -4, z: 0 });
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const position = useRef(START.clone());
  const keys = useRef(new Set<string>());
  const near = DESTINATIONS.findIndex(({ x }) => Math.abs(location.x - x) < 2.1 && location.z < -1.1);
  const active = near < 0 ? null : near;
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;

  useEffect(() => {
    if (phase !== 'countdown') return;
    const id = window.setTimeout(() => count === 1 ? setPhase('tour') : setCount(count - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== 'tour') return;

    if (!audioRef.current) {
      const audio = new Audio('/boot.mp3');
      audio.loop = true;
      audio.volume = 0.42;
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    audio.muted = !soundOn;

    if (soundOn) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [phase, soundOn]);

  useEffect(() => {
    if (phase !== 'tour') return;
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'm' && !event.repeat) {
        setSoundOn((value) => !value);
        return;
      }
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) event.preventDefault();
      if (key === 'e') {
        if (activeRef.current !== null) {
          const door = DESTINATIONS[activeRef.current];
          setRole(door.path === '/homie' ? 'homie' : 'pilot');
          navigate(door.path);
        }
      } else keys.current.add(key);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); keys.current.clear(); };
  }, [phase, navigate, setRole]);

  const enter = () => {
    if (active === null) return;
    const door = DESTINATIONS[active];
    setRole(door.path === '/homie' ? 'homie' : 'pilot');
    navigate(door.path);
  };
  const move = (key: string, pressed: boolean) => pressed ? keys.current.add(key) : keys.current.delete(key);

  return <div className="tour-page">
    <style>{CSS}</style>
    {(phase === 'countdown' || phase === 'tour') && <div className="tour-canvas"><Canvas shadows dpr={[1, 1.5]} camera={{ position: [-9, 5, 11], fov: 55 }} gl={{ antialias: false, powerPreference: 'high-performance' }}><Suspense fallback={null}><City position={position} near={active} gender={gender === 'woman' ? 'woman' : 'man'} /><Movement position={position} keys={keys} onMove={(x, z) => setLocation((old) => Math.abs(old.x - x) > 0.05 || Math.abs(old.z - z) > 0.05 ? { x, z } : old)} /></Suspense></Canvas></div>}
    <header className="tour-header"><div className="tour-brand"><i /> MARSHOUT <span>VICE CITY / WORLD 01</span></div><span className="tour-live">● &nbsp; ONLINE</span></header>
    {phase === 'intro' && <main className="tour-intro"><div className="tour-intro-copy"><div className="tour-eyebrow">MARSHOUT / VICE CITY <span>✦</span></div><h1>Take a <em>tour.</em></h1><p className="tour-lead">See which door gets you a travel flyer and which one gets you to a new destination.</p><button className="tour-start" aria-label="Take a tour" onClick={() => setPhase('gender')}><span className="tour-play">▶</span><span>TAKE A TOUR</span></button><p className="tour-hint">Walk the boulevard. Three doors are waiting.</p></div><div className="tour-hero" aria-hidden="true"><div className="tour-sun" /><div className="tour-skyline"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="tour-palm">✳</div><div className="tour-hero-caption">VICE CITY <span>BOARDING LATE</span></div></div></main>}

    {phase === 'gender' && (
      <main className="tour-gender">
        <div className="tour-gender-card">
          <div className="tour-eyebrow">MARSHOUT / PLAYER SETUP <span>✦</span></div>
          <h2>Choose your <em>character.</em></h2>
          <p>This character stays with you through the trip.</p>

          <div className="tour-gender-options">
            <button
              type="button"
              className="tour-gender-option"
              onClick={() => {
                setGender('man');
                position.current.copy(START);
                setLocation({ x: -4, z: 0 });
                setCount(3);
                setPhase('countdown');
              }}
            >
              <span className="gender-figure gender-man" aria-hidden="true">
                <i className="gender-head" />
                <i className="gender-body" />
                <i className="gender-legs" />
              </span>
              <span className="gender-copy">
                <small>01 / CHARACTER</small>
                <strong>MALE</strong>
                <b>SELECT →</b>
              </span>
            </button>

            <button
              type="button"
              className="tour-gender-option"
              onClick={() => {
                setGender('woman');
                position.current.copy(START);
                setLocation({ x: -4, z: 0 });
                setCount(3);
                setPhase('countdown');
              }}
            >
              <span className="gender-figure gender-woman" aria-hidden="true">
                <i className="gender-hair-back" />
                <i className="gender-head" />
                <i className="gender-hair-side left" />
                <i className="gender-hair-side right" />
                <i className="gender-body" />
                <i className="gender-legs" />
              </span>
              <span className="gender-copy">
                <small>02 / CHARACTER</small>
                <strong>FEMALE</strong>
                <b>SELECT →</b>
              </span>
            </button>
          </div>
        </div>
      </main>
    )}

    {(phase === 'countdown' || phase === 'tour') && <><div className="tour-topline"><span>VICE CITY <b>/</b> MARSHOUT BOULEVARD</span><span>FOLLOW THE GOLD · CHOOSE A DOOR</span></div>{phase === 'tour' && <><div className="tour-mission"><small>YOU'RE ON THE BOULEVARD</small><strong>Where are you headed?</strong><p>Walk up to a marked entrance. The city will tell you when you're close.</p></div><div className="tour-controls">
      <span className="control-block"><b className="control-label">MOVE</b><span className="arrow-pad"><kbd className="key up">↑</kbd><kbd className="key left">←</kbd><kbd className="key down">↓</kbd><kbd className="key right">→</kbd></span></span>
      <span className="control-block"><kbd className="key">E</kbd><b className="control-label">ENTER</b></span>
    
      <span className="control-block sound-control">
        <kbd className="key">M</kbd>
        <button type="button" className="speaker-control" aria-label={soundOn ? 'Mute sound' : 'Play sound'} onClick={() => setSoundOn((value) => !value)}>
          <span className="speaker-icon" aria-hidden="true">{soundOn ? '🔊' : '🔇'}</span>
          <b className="control-label">{soundOn ? 'SOUND ON' : 'SOUND OFF'}</b>
        </button>
      </span></div>{active !== null && <button className="tour-enter" onClick={enter}>ENTER <strong>{DESTINATIONS[active].title}</strong><span>↗</span></button>}<div className="tour-touch" aria-label="Movement controls"><button aria-label="Move left" onPointerDown={() => move('arrowleft', true)} onPointerUp={() => move('arrowleft', false)} onPointerCancel={() => move('arrowleft', false)}>←</button><button aria-label="Move forward" onPointerDown={() => move('arrowup', true)} onPointerUp={() => move('arrowup', false)} onPointerCancel={() => move('arrowup', false)}>↑</button><button aria-label="Move backward" onPointerDown={() => move('arrowdown', true)} onPointerUp={() => move('arrowdown', false)} onPointerCancel={() => move('arrowdown', false)}>↓</button><button aria-label="Move right" onPointerDown={() => move('arrowright', true)} onPointerUp={() => move('arrowright', false)} onPointerCancel={() => move('arrowright', false)}>→</button></div></>}{phase === 'countdown' && <div className="tour-countdown"><p>VICE CITY / LOADING THE BLOCK</p><strong key={count}>{count}</strong><span>STREETS OPEN IN</span></div>}</>}
    <footer className="tour-footer"><span>✦ &nbsp; A TRIP WORTH TAKING</span><span>MARSHOUT © 2026</span></footer>
  </div>;
}

const CSS = `
*{box-sizing:border-box}html,body,#root{margin:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,sans-serif}button{font:inherit}
:root{--navy:#071a38;--navy2:#0b274b;--white:#f5f2eb;--gold:#d3a34f;--ink:#06162d}
.tour-page{position:relative;min-height:100svh;overflow:hidden;background:var(--navy);color:var(--white)}
.tour-page:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:2;background:linear-gradient(90deg,rgba(4,15,31,.42),transparent 35%),linear-gradient(0deg,rgba(4,14,29,.48),transparent 32%)}
.tour-header,.tour-footer{position:absolute;left:0;right:0;z-index:8;display:flex;justify-content:space-between;align-items:center;padding:0 clamp(22px,5vw,78px)}
.tour-header{top:0;height:72px;border-bottom:1px solid rgba(255,255,255,.13);background:linear-gradient(180deg,rgba(5,19,40,.68),transparent)}
.tour-footer{bottom:0;height:46px;font-size:9px;letter-spacing:.19em;color:rgba(245,242,235,.58)}
.tour-brand{font-weight:950;letter-spacing:.2em;font-size:14px;display:flex;align-items:center;gap:10px}.tour-brand i{width:8px;height:8px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 4px rgba(211,163,79,.13),0 0 20px rgba(211,163,79,.45)}.tour-brand span{font-size:8px;color:rgba(245,242,235,.45);font-weight:750;border-left:1px solid rgba(255,255,255,.16);padding-left:16px;margin-left:7px}.tour-live{font-size:9px;letter-spacing:.2em;color:var(--gold)}
.tour-intro{min-height:100svh;display:grid;grid-template-columns:.92fr 1.08fr;background:linear-gradient(118deg,#fbfaf7 0 47%,#071a38 47% 100%);color:var(--navy)}
.tour-intro-copy{position:relative;z-index:4;align-self:center;padding:105px 6vw 80px clamp(28px,8vw,130px);max-width:760px}
.tour-eyebrow{font-size:9px;font-weight:950;letter-spacing:.26em;color:rgba(7,26,56,.48);display:flex;gap:16px;align-items:center}.tour-eyebrow span{color:var(--gold)}
.tour-intro h1{font-size:clamp(76px,9vw,154px);letter-spacing:-.085em;line-height:.82;margin:26px 0 28px;color:var(--navy);text-transform:uppercase}.tour-intro h1 em{display:block;font-style:italic;font-family:Georgia,serif;font-weight:400;color:var(--gold);letter-spacing:-.07em;text-transform:none}
.tour-lead{font-size:clamp(18px,1.7vw,25px);font-weight:720;line-height:1.38;max-width:560px;color:#17385e;margin:0;text-wrap:balance}
.tour-start{margin-top:36px;border:0;background:var(--navy);color:white;padding:0 27px 0 8px;height:62px;display:inline-flex;align-items:center;gap:18px;font-weight:950;font-size:11px;letter-spacing:.2em;cursor:pointer;box-shadow:0 16px 35px rgba(7,26,56,.16);transition:transform .2s,box-shadow .2s}.tour-start:hover{transform:translateY(-3px);box-shadow:0 22px 44px rgba(7,26,56,.22)}.tour-play{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--gold);color:var(--navy);font-size:13px;padding-left:2px}.tour-hint{font-size:9px;letter-spacing:.14em;color:rgba(7,26,56,.38);margin-top:22px;font-weight:800;text-transform:uppercase}
.tour-hero{position:relative;overflow:hidden;min-height:100svh;background:linear-gradient(#0b274b 0%,#12365f 45%,#d3a34f 72%,#071a38 72%)}.tour-sun{position:absolute;width:25vw;height:25vw;min-width:260px;min-height:260px;border-radius:50%;left:17%;top:20%;background:#f7f3e9;box-shadow:0 0 100px rgba(245,239,222,.3)}.tour-skyline{position:absolute;bottom:12%;left:-4%;width:110%;height:51%;display:flex;align-items:end;gap:1.3%;filter:drop-shadow(0 0 18px rgba(4,15,31,.4))}.tour-skyline i{display:block;background:repeating-linear-gradient(0deg,transparent 0 16px,rgba(211,163,79,.32) 17px 21px,transparent 22px 29px),#081a35;width:14%;height:65%;box-shadow:inset 4px 0 #15365d}.tour-skyline i:nth-child(2){height:90%}.tour-skyline i:nth-child(3){height:50%}.tour-skyline i:nth-child(4){height:100%}.tour-skyline i:nth-child(5){height:75%}.tour-skyline i:nth-child(6){height:95%}.tour-skyline i:nth-child(7){height:58%}.tour-skyline i:nth-child(8){height:77%}.tour-palm{position:absolute;right:6%;top:7%;font-size:clamp(180px,29vw,420px);color:#06162d;transform:rotate(-15deg);opacity:.88}.tour-hero-caption{position:absolute;bottom:16%;right:9%;font-size:clamp(32px,4.8vw,76px);font-weight:950;line-height:.86;letter-spacing:-.075em;text-align:right;color:white;text-shadow:0 8px 28px #031024}.tour-hero-caption span{display:block;color:#e1b966;font-size:.54em;letter-spacing:.02em;margin-top:10px}

.tour-gender{position:relative;z-index:4;min-height:100svh;display:grid;place-items:center;padding:110px 24px 70px;background:radial-gradient(circle at 50% 18%,#173d69 0,#0b274b 34%,#071a38 72%);color:var(--white)}
.tour-gender:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(to bottom,#000,transparent 92%)}
.tour-gender-card{position:relative;width:min(980px,100%);text-align:center}.tour-gender .tour-eyebrow{justify-content:center;color:rgba(245,242,235,.55)}
.tour-gender h2{margin:18px 0 8px;font-size:clamp(45px,6vw,82px);line-height:.92;letter-spacing:-.065em;text-transform:uppercase}.tour-gender h2 em{font-family:Georgia,serif;font-weight:400;text-transform:none;color:var(--gold)}
.tour-gender-card>p{margin:0 auto 32px;color:rgba(245,242,235,.58);font-size:13px;font-weight:700}
.tour-gender-options{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:760px;margin:0 auto}
.tour-gender-option{position:relative;min-height:340px;overflow:hidden;border:1px solid rgba(255,255,255,.13);background:linear-gradient(155deg,rgba(255,255,255,.08),rgba(255,255,255,.025));color:white;cursor:pointer;text-align:left;padding:0;transition:transform .2s,border-color .2s,background .2s;box-shadow:0 24px 70px rgba(0,0,0,.18)}
.tour-gender-option:hover{transform:translateY(-5px);border-color:rgba(211,163,79,.75);background:linear-gradient(155deg,rgba(255,255,255,.11),rgba(211,163,79,.055))}
.gender-copy{position:absolute;left:22px;right:22px;bottom:20px;z-index:3;display:grid;grid-template-columns:1fr auto;align-items:end}.gender-copy small{grid-column:1/-1;color:var(--gold);font-size:8px;font-weight:950;letter-spacing:.19em;margin-bottom:5px}.gender-copy strong{font-size:29px;letter-spacing:-.04em}.gender-copy b{font-size:8px;letter-spacing:.16em;color:rgba(255,255,255,.62);padding-bottom:5px}
.gender-figure{position:absolute;left:50%;top:25px;width:160px;height:235px;transform:translateX(-50%);filter:drop-shadow(0 22px 20px rgba(0,0,0,.22))}
.gender-figure i{position:absolute;display:block}.gender-head{left:54px;top:10px;width:52px;height:55px;border-radius:8px;background:#b47a52}.gender-body{left:37px;top:68px;width:86px;height:92px;border-radius:9px 9px 4px 4px;background:linear-gradient(90deg,#0b274b 0 28%,#f5f2eb 28% 72%,#0b274b 72%)}.gender-legs{left:43px;top:158px;width:74px;height:77px;background:linear-gradient(90deg,#071a38 0 44%,transparent 44% 56%,#071a38 56%);border-radius:0 0 7px 7px}
.gender-man .gender-head:before{content:"";position:absolute;left:0;right:0;top:-7px;height:14px;border-radius:6px 6px 2px 2px;background:#241b16}
.gender-woman .gender-head{background:#a96f52}.gender-woman .gender-body{left:42px;width:76px;background:linear-gradient(90deg,#0b274b 0 25%,#f5f2eb 25% 75%,#0b274b 75%)}.gender-woman .gender-legs{left:46px;width:68px;background:linear-gradient(90deg,#17223a 0 44%,transparent 44% 56%,#17223a 56%)}
.gender-hair-back{left:48px;top:5px;width:64px;height:79px;border-radius:10px;background:#241914}.gender-hair-side{top:28px;width:11px;height:63px;background:#241914;border-radius:4px}.gender-hair-side.left{left:47px}.gender-hair-side.right{right:47px}

.tour-canvas{position:absolute;inset:0}.tour-topline{position:absolute;z-index:5;top:92px;left:clamp(22px,5vw,78px);right:clamp(22px,5vw,78px);display:flex;justify-content:space-between;font-size:9px;font-weight:900;letter-spacing:.2em;color:#f5f2eb}.tour-topline b{color:var(--gold);padding:0 8px}
.tour-mission{position:absolute;z-index:5;top:132px;left:clamp(22px,5vw,78px);padding:18px 21px;background:rgba(7,26,56,.91);border-left:3px solid var(--gold);box-shadow:0 16px 45px rgba(0,0,0,.24);max-width:360px;backdrop-filter:blur(12px)}.tour-mission small{font-size:8px;color:var(--gold);font-weight:950;letter-spacing:.22em}.tour-mission strong{display:block;font-size:27px;margin:7px 0 3px;letter-spacing:-.04em}.tour-mission p{color:rgba(245,242,235,.65);font-size:11px;line-height:1.55;margin:0}
.tour-controls{position:absolute;z-index:5;right:clamp(22px,5vw,78px);bottom:68px;display:flex;gap:15px;color:white;font-size:9px;font-weight:800;letter-spacing:.1em;background:rgba(7,26,56,.9);padding:14px 16px;border:1px solid rgba(211,163,79,.25);backdrop-filter:blur(10px)}.tour-controls span{white-space:nowrap}kbd{font:inherit;border:1px solid rgba(255,255,255,.34);border-radius:2px;padding:4px 6px;margin-right:3px;color:var(--gold)}
.tour-enter{position:absolute;z-index:6;left:50%;transform:translateX(-50%);bottom:100px;padding:14px 18px;background:var(--gold);border:0;color:var(--navy);cursor:pointer;font-size:10px;font-weight:950;letter-spacing:.16em;box-shadow:0 0 34px rgba(211,163,79,.36);white-space:nowrap}.tour-enter strong{margin:0 18px;font-size:12px;letter-spacing:0}.tour-enter span{font-size:18px}
.city-sign{font-family:Inter,system-ui,sans-serif;font-size:21px;font-weight:1000;letter-spacing:.11em;text-align:center;white-space:nowrap;text-shadow:0 2px 14px #06162d}.city-door-label{font-family:Inter,system-ui,sans-serif;min-width:245px;max-width:350px;padding:13px 16px;color:white;text-align:center;background:rgba(7,26,56,.93);border:1px solid rgba(211,163,79,.42);box-shadow:0 12px 32px rgba(0,0,0,.28);transition:transform .2s,border-color .2s;backdrop-filter:blur(8px)}.city-door-label.is-near{transform:scale(1.13);border-color:var(--gold)}.city-door-label small,.city-door-label span{display:block;font-size:8px;color:var(--gold);font-weight:950;letter-spacing:.17em}.city-door-label strong{display:block;font-size:16px;line-height:1.25;margin:6px 0}
.tour-countdown{position:absolute;z-index:10;inset:0;background:rgba(7,26,56,.96);display:flex;align-items:center;justify-content:center;flex-direction:column}.tour-countdown:before{content:"";position:absolute;width:min(62vw,760px);height:min(62vw,760px);border:1px solid rgba(211,163,79,.18);border-radius:50%}.tour-countdown p,.tour-countdown span{position:relative;font-size:10px;font-weight:950;letter-spacing:.29em;color:var(--gold)}.tour-countdown strong{position:relative;font-size:clamp(150px,28vw,330px);line-height:.9;color:#f7f4ed;font-weight:950;text-shadow:0 0 70px rgba(211,163,79,.3);animation:count .8s cubic-bezier(.2,.8,.2,1)}.tour-countdown span{color:white}@keyframes count{from{transform:scale(1.45);opacity:0}to{transform:scale(1);opacity:1}}
.tour-header-actions{display:flex;align-items:center;gap:16px}.sound-toggle{height:34px;padding:0 11px;border:1px solid rgba(211,163,79,.35);background:rgba(7,26,56,.65);color:#f5f2eb;display:flex;align-items:center;gap:8px;cursor:pointer;backdrop-filter:blur(8px)}.sound-toggle span{width:17px;height:17px;border-radius:50%;display:grid;place-items:center;background:#d3a34f;color:#071a38;font-size:10px;font-weight:1000}.sound-toggle i{font-style:normal;font-size:7px;font-weight:950;letter-spacing:.14em}.sound-toggle:not(.is-on){opacity:.58}.control-block{display:flex;align-items:center;gap:7px}.speaker-control{border:0;background:transparent;color:#f5f2eb;display:flex;align-items:center;gap:6px;padding:0;cursor:pointer}.speaker-icon{font-size:16px;line-height:1;filter:saturate(.7)}.sound-control{gap:6px}.control-label{font-size:8px;letter-spacing:.13em;color:#f5f2eb}.key{min-width:29px;height:28px;padding:0 7px!important;display:inline-grid;place-items:center;border:1px solid rgba(255,255,255,.55)!important;border-bottom:3px solid rgba(211,163,79,.75)!important;border-radius:4px!important;background:linear-gradient(#f7f5ef,#dcd8cf)!important;color:#071a38!important;box-shadow:0 3px 8px rgba(0,0,0,.24);font-size:10px!important;font-weight:950!important;margin:0!important}.key.wide{min-width:54px}.arrow-pad{width:89px;height:58px;display:grid;grid-template-columns:repeat(3,29px);grid-template-rows:repeat(2,28px);gap:2px}.arrow-pad .up{grid-column:2;grid-row:1}.arrow-pad .left{grid-column:1;grid-row:2}.arrow-pad .down{grid-column:2;grid-row:2}.arrow-pad .right{grid-column:3;grid-row:2}.key-group{display:flex!important;align-items:center;gap:3px}.key-group b{margin-left:6px;font-size:9px;letter-spacing:.12em}.door-enter-key{margin-top:8px!important}.door-enter-key b{display:inline-grid;place-items:center;margin-right:7px;padding:4px 7px;border:1px solid rgba(255,255,255,.55);border-bottom-width:2px;border-radius:3px;background:#f5f2eb;color:#071a38;font-size:8px;letter-spacing:.08em}.tour-touch{display:none}
@media(max-width:900px){.tour-gender{padding-top:95px}.tour-gender-options{grid-template-columns:1fr 1fr;gap:9px}.tour-gender-option{min-height:300px}.gender-figure{transform:translateX(-50%) scale(.88);transform-origin:top center}.gender-copy{left:14px;right:14px}.gender-copy strong{font-size:22px}.gender-copy b{display:none}.tour-intro{grid-template-columns:1fr;background:#fbfaf7}.tour-intro-copy{padding:130px 28px 70px}.tour-hero{position:absolute;inset:0;opacity:.1}.tour-intro h1{font-size:clamp(74px,17vw,130px)}.tour-controls{display:none}.tour-touch{position:absolute;z-index:8;bottom:85px;right:20px;display:grid;grid-template-columns:repeat(2,55px);gap:6px;touch-action:none}.tour-touch button{height:52px;border:1px solid rgba(211,163,79,.55);background:rgba(7,26,56,.92);color:white;font-size:24px}.tour-topline span:last-child{display:none}.tour-brand span{display:none}.tour-mission{top:122px;max-width:275px}.tour-enter{bottom:160px;max-width:90vw;white-space:normal}.tour-footer{font-size:8px}}
`;
