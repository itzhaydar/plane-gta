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
          {near && <span className="door-enter-key"><b>ENTER</b> STEP INSIDE</span>}
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

function Pedestrian({ x, z, speed, direction, look, phase = 0 }: {
  x: number; z: number; speed: number; direction: 1 | -1; look: WalkerLook; phase?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    ref.current.position.x += direction * speed * delta;
    if (direction > 0 && ref.current.position.x > 50) ref.current.position.x = -10;
    if (direction < 0 && ref.current.position.x < -10) ref.current.position.x = 50;
    const t = clock.elapsedTime * 6.5 + phase;
    const swing = Math.sin(t) * 0.5;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.7;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.7;
    ref.current.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  });

  return <group ref={ref} position={[x, 0, z]} scale={0.88}>
    <mesh position={[0, 1.42, 0]} castShadow><capsuleGeometry args={[0.27, 0.66, 7, 12]} /><meshStandardMaterial color={look.top} roughness={0.72} /></mesh>
    <mesh position={[0, 2.02, 0]} castShadow><sphereGeometry args={[0.25, 18, 16]} /><meshStandardMaterial color={look.skin} roughness={0.85} /></mesh>
    <mesh position={[0, 2.22, -0.02]} scale={[1, 0.55, 1]} castShadow><sphereGeometry args={[0.255, 16, 12]} /><meshStandardMaterial color={look.hair} roughness={0.95} /></mesh>
    <mesh position={[0.27, 1.55, 0.02]}><boxGeometry args={[0.05, 0.38, 0.05]} /><meshStandardMaterial color={look.accent} metalness={0.6} /></mesh>
    <group ref={leftArm} position={[-0.34, 1.62, 0]}><mesh position={[0, -0.35, 0]} castShadow><capsuleGeometry args={[0.085, 0.52, 5, 8]} /><meshStandardMaterial color={look.skin} /></mesh></group>
    <group ref={rightArm} position={[0.34, 1.62, 0]}><mesh position={[0, -0.35, 0]} castShadow><capsuleGeometry args={[0.085, 0.52, 5, 8]} /><meshStandardMaterial color={look.skin} /></mesh></group>
    <group ref={leftLeg} position={[-0.15, 1.05, 0]}><mesh position={[0, -0.48, 0]} castShadow><capsuleGeometry args={[0.11, 0.72, 5, 8]} /><meshStandardMaterial color={look.bottom} /></mesh><mesh position={[0, -0.91, 0.08]}><boxGeometry args={[0.23, 0.13, 0.42]} /><meshStandardMaterial color="#f4f0e8" /></mesh></group>
    <group ref={rightLeg} position={[0.15, 1.05, 0]}><mesh position={[0, -0.48, 0]} castShadow><capsuleGeometry args={[0.11, 0.72, 5, 8]} /><meshStandardMaterial color={look.bottom} /></mesh><mesh position={[0, -0.91, 0.08]}><boxGeometry args={[0.23, 0.13, 0.42]} /><meshStandardMaterial color="#f4f0e8" /></mesh></group>
  </group>;
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

function Player({ position }: { position: MutableRefObject<THREE.Vector3> }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
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

    const t = clock.elapsedTime * 8.5;
    const swing = moved ? Math.sin(t) * 0.58 : 0;
    const idle = moved ? Math.abs(Math.sin(t)) * 0.028 : Math.sin(clock.elapsedTime * 1.7) * 0.008;

    if (body.current) body.current.position.y = idle;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.76;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.76;

    last.current.copy(position.current);
  });

  const skin = '#8c583d';
  const hair = '#15171b';
  const shirt = '#eeeae1';
  const pants = '#10233f';
  const gold = '#d3a34f';

  return (
    <group ref={group} position={START.toArray()} scale={1.04}>
      <group ref={body}>
        {/* Casual fitted T-shirt torso */}
        <mesh position={[0, 1.52, 0]} scale={[1.08, 1, 0.72]} castShadow>
          <capsuleGeometry args={[0.31, 0.68, 10, 18]} />
          <meshStandardMaterial color={shirt} roughness={0.78} />
        </mesh>

        {/* subtle collar */}
        <mesh position={[0, 1.88, 0.245]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.115, 0.018, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#d9d5cd" roughness={0.8} />
        </mesh>

        {/* neck */}
        <mesh position={[0, 1.98, 0]}>
          <cylinderGeometry args={[0.115, 0.135, 0.22, 16]} />
          <meshStandardMaterial color={skin} roughness={0.88} />
        </mesh>

        {/* human head, slightly elongated */}
        <mesh position={[0, 2.25, 0]} scale={[0.92, 1.08, 0.9]} castShadow>
          <sphereGeometry args={[0.285, 28, 22]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>

        {/* ears */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.267, 2.25, 0]}>
            <sphereGeometry args={[0.052, 12, 10]} />
            <meshStandardMaterial color={skin} roughness={0.9} />
          </mesh>
        ))}

        {/* textured-looking short curls / fade silhouette */}
        <mesh position={[0, 2.455, -0.018]} scale={[0.95, 0.47, 0.92]} castShadow>
          <sphereGeometry args={[0.29, 20, 16]} />
          <meshStandardMaterial color={hair} roughness={1} />
        </mesh>
        {[-0.16,-0.08,0,0.08,0.16].map((x, i) => (
          <mesh key={x} position={[x, 2.55 + (i % 2) * 0.018, 0.015]}>
            <sphereGeometry args={[0.065, 9, 8]} />
            <meshStandardMaterial color={hair} roughness={1} />
          </mesh>
        ))}

        {/* brows */}
        {[-0.09,0.09].map((x) => (
          <mesh key={x} position={[x, 2.315, 0.252]} scale={[1.5,.35,.35]}>
            <sphereGeometry args={[0.036, 8, 6]} />
            <meshStandardMaterial color={hair} />
          </mesh>
        ))}

        {/* simple eyes - no glasses */}
        {[-0.09,0.09].map((x) => (
          <mesh key={x} position={[x, 2.292, 0.269]}>
            <sphereGeometry args={[0.022, 10, 8]} />
            <meshStandardMaterial color="#17191c" roughness={0.5} />
          </mesh>
        ))}

        {/* nose */}
        <mesh position={[0, 2.235, 0.286]} scale={[0.6,1.2,0.72]}>
          <sphereGeometry args={[0.055, 12, 10]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>

        {/* neat beard */}
        <mesh position={[0, 2.135, 0.17]} scale={[0.88,.54,.65]}>
          <sphereGeometry args={[0.245, 18, 12]} />
          <meshStandardMaterial color={hair} roughness={1} />
        </mesh>
        <mesh position={[0, 2.18, 0.292]} scale={[1.4,.28,.28]}>
          <sphereGeometry args={[0.075, 12, 8]} />
          <meshStandardMaterial color="#6e3f31" roughness={0.9} />
        </mesh>

        {/* restrained gold chain */}
        <mesh position={[0, 1.88, 0.286]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.014, 8, 28, Math.PI]} />
          <meshStandardMaterial color={gold} metalness={0.95} roughness={0.18} />
        </mesh>
      </group>

      {/* arms */}
      <group ref={leftArm} position={[-0.37, 1.72, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow><capsuleGeometry args={[0.10, 0.54, 7, 12]} /><meshStandardMaterial color={skin} roughness={0.88} /></mesh>
        <mesh position={[0, 0.01, 0]} scale={[1.2,.75,1.2]}><capsuleGeometry args={[0.112, 0.23, 6, 10]} /><meshStandardMaterial color={shirt} roughness={0.78} /></mesh>
        <mesh position={[0, -0.68, 0.02]}><sphereGeometry args={[0.115, 14, 12]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      <group ref={rightArm} position={[0.37, 1.72, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow><capsuleGeometry args={[0.10, 0.54, 7, 12]} /><meshStandardMaterial color={skin} roughness={0.88} /></mesh>
        <mesh position={[0, 0.01, 0]} scale={[1.2,.75,1.2]}><capsuleGeometry args={[0.112, 0.23, 6, 10]} /><meshStandardMaterial color={shirt} roughness={0.78} /></mesh>
        <mesh position={[0, -0.68, 0.02]}><sphereGeometry args={[0.115, 14, 12]} /><meshStandardMaterial color={skin} /></mesh>
      </group>

      {/* relaxed cargo-style pants + sneakers */}
      <group ref={leftLeg} position={[-0.16, 1.08, 0]}>
        <mesh position={[0, -0.46, 0]} scale={[1.08,1,1]} castShadow><capsuleGeometry args={[0.125, 0.70, 7, 12]} /><meshStandardMaterial color={pants} roughness={0.84} /></mesh>
        <mesh position={[-0.105,-0.42,0.04]}><boxGeometry args={[0.08,.25,.22]} /><meshStandardMaterial color="#162d4e" /></mesh>
        <mesh position={[0, -0.91, 0.11]}><boxGeometry args={[0.28, 0.16, 0.5]} /><meshStandardMaterial color="#f3f0e8" roughness={0.66} /></mesh>
        <mesh position={[0,-0.96,0.15]}><boxGeometry args={[0.29,.045,.52]} /><meshStandardMaterial color="#d8d5ce" /></mesh>
      </group>
      <group ref={rightLeg} position={[0.16, 1.08, 0]}>
        <mesh position={[0, -0.46, 0]} scale={[1.08,1,1]} castShadow><capsuleGeometry args={[0.125, 0.70, 7, 12]} /><meshStandardMaterial color={pants} roughness={0.84} /></mesh>
        <mesh position={[0.105,-0.42,0.04]}><boxGeometry args={[0.08,.25,.22]} /><meshStandardMaterial color="#162d4e" /></mesh>
        <mesh position={[0, -0.91, 0.11]}><boxGeometry args={[0.28, 0.16, 0.5]} /><meshStandardMaterial color="#f3f0e8" roughness={0.66} /></mesh>
        <mesh position={[0,-0.96,0.15]}><boxGeometry args={[0.29,.045,.52]} /><meshStandardMaterial color="#d8d5ce" /></mesh>
      </group>
    </group>
  );
}

function City({ position, near }: { position: MutableRefObject<THREE.Vector3>; near: number | null }) {
  const walkers: Array<{x:number;z:number;speed:number;direction:1|-1;look:WalkerLook;phase:number}> = [
    { x: 5, z: -4.0, speed: 0.7, direction: 1, phase: 0, look: { skin:'#70472f', top:'#e7dfd3', bottom:'#3c4658', hair:'#111317', accent:'#8d6c39' } },
    { x: 14, z: 4.2, speed: 0.55, direction: -1, phase: 2, look: { skin:'#d5a17e', top:'#8b5f49', bottom:'#d8d1c6', hair:'#38251d', accent:'#192d47' } },
    { x: 25, z: -4.0, speed: 0.8, direction: 1, phase: 4, look: { skin:'#8b5a42', top:'#466071', bottom:'#242833', hair:'#171311', accent:'#b49a73' } },
    { x: 40, z: 4.25, speed: 0.62, direction: -1, phase: 1, look: { skin:'#c88767', top:'#d5c8b8', bottom:'#6e5848', hair:'#201914', accent:'#23384f' } },
    { x: 33, z: -4.0, speed: 0.48, direction: -1, phase: 3, look: { skin:'#5f3d2c', top:'#6e735e', bottom:'#26384d', hair:'#0e1014', accent:'#ddd4c5' } },
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
    <Car x={-8} z={1.75} speed={3.5} direction={1} kind={0} />
    <Car x={18} z={-1.75} speed={4.2} direction={-1} kind={1} />
    <Car x={37} z={1.75} speed={2.9} direction={1} kind={2} />
    <Car x={50} z={-1.75} speed={3.7} direction={-1} kind={3} />
    {walkers.map((w, i) => <Pedestrian key={i} {...w} />)}

    <Player position={position} />
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
      const step = Math.min(delta, 0.05) * (held.has('shift') ? 8 : 5) / Math.hypot(dx, dz);
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
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'tour'>('intro');
  const [count, setCount] = useState(3);
  const [location, setLocation] = useState({ x: -4, z: 0 });
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
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) event.preventDefault();
      if (key === 'enter') {
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
    {phase !== 'intro' && <div className="tour-canvas"><Canvas shadows dpr={[1, 1.5]} camera={{ position: [-9, 5, 11], fov: 55 }} gl={{ antialias: false, powerPreference: 'high-performance' }}><Suspense fallback={null}><City position={position} near={active} /><Movement position={position} keys={keys} onMove={(x, z) => setLocation((old) => Math.abs(old.x - x) > 0.05 || Math.abs(old.z - z) > 0.05 ? { x, z } : old)} /></Suspense></Canvas></div>}
    <header className="tour-header"><div className="tour-brand"><i /> MARSHOUT <span>VICE CITY / WORLD 01</span></div><span className="tour-live">● &nbsp; ONLINE</span></header>
    {phase === 'intro' && <main className="tour-intro"><div className="tour-intro-copy"><div className="tour-eyebrow">MARSHOUT / VICE CITY <span>✦</span></div><h1>Take a <em>tour.</em></h1><p className="tour-lead">See which door gets you a travel flyer and which one gets you to a new destination.</p><button className="tour-start" aria-label="Take a tour" onClick={() => { setCount(3); setPhase('countdown'); }}><span className="tour-play">▶</span><span>TAKE A TOUR</span></button><p className="tour-hint">Walk the boulevard. Three doors are waiting.</p></div><div className="tour-hero" aria-hidden="true"><div className="tour-sun" /><div className="tour-skyline"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="tour-palm">✳</div><div className="tour-hero-caption">VICE CITY <span>BOARDING LATE</span></div></div></main>}
    {phase !== 'intro' && <><div className="tour-topline"><span>VICE CITY <b>/</b> MARSHOUT BOULEVARD</span><span>FOLLOW THE GOLD · CHOOSE A DOOR</span></div>{phase === 'tour' && <><div className="tour-mission"><small>YOU'RE ON THE BOULEVARD</small><strong>Where are you headed?</strong><p>Walk up to a marked entrance. The city will tell you when you're close.</p></div><div className="tour-controls"><span className="key-group"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd><b>MOVE</b></span><span><kbd>SHIFT</kbd> RUN</span><span><kbd>ENTER</kbd> ENTER</span></div>{active !== null && <button className="tour-enter" onClick={enter}>ENTER <strong>{DESTINATIONS[active].title}</strong><span>↗</span></button>}<div className="tour-touch" aria-label="Movement controls"><button aria-label="Move left" onPointerDown={() => move('arrowleft', true)} onPointerUp={() => move('arrowleft', false)} onPointerCancel={() => move('arrowleft', false)}>←</button><button aria-label="Move forward" onPointerDown={() => move('arrowup', true)} onPointerUp={() => move('arrowup', false)} onPointerCancel={() => move('arrowup', false)}>↑</button><button aria-label="Move backward" onPointerDown={() => move('arrowdown', true)} onPointerUp={() => move('arrowdown', false)} onPointerCancel={() => move('arrowdown', false)}>↓</button><button aria-label="Move right" onPointerDown={() => move('arrowright', true)} onPointerUp={() => move('arrowright', false)} onPointerCancel={() => move('arrowright', false)}>→</button></div></>}{phase === 'countdown' && <div className="tour-countdown"><p>VICE CITY / LOADING THE BLOCK</p><strong key={count}>{count}</strong><span>STREETS OPEN IN</span></div>}</>}
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
.tour-canvas{position:absolute;inset:0}.tour-topline{position:absolute;z-index:5;top:92px;left:clamp(22px,5vw,78px);right:clamp(22px,5vw,78px);display:flex;justify-content:space-between;font-size:9px;font-weight:900;letter-spacing:.2em;color:#f5f2eb}.tour-topline b{color:var(--gold);padding:0 8px}
.tour-mission{position:absolute;z-index:5;top:132px;left:clamp(22px,5vw,78px);padding:18px 21px;background:rgba(7,26,56,.91);border-left:3px solid var(--gold);box-shadow:0 16px 45px rgba(0,0,0,.24);max-width:360px;backdrop-filter:blur(12px)}.tour-mission small{font-size:8px;color:var(--gold);font-weight:950;letter-spacing:.22em}.tour-mission strong{display:block;font-size:27px;margin:7px 0 3px;letter-spacing:-.04em}.tour-mission p{color:rgba(245,242,235,.65);font-size:11px;line-height:1.55;margin:0}
.tour-controls{position:absolute;z-index:5;right:clamp(22px,5vw,78px);bottom:68px;display:flex;gap:15px;color:white;font-size:9px;font-weight:800;letter-spacing:.1em;background:rgba(7,26,56,.9);padding:14px 16px;border:1px solid rgba(211,163,79,.25);backdrop-filter:blur(10px)}.tour-controls span{white-space:nowrap}kbd{font:inherit;border:1px solid rgba(255,255,255,.34);border-radius:2px;padding:4px 6px;margin-right:3px;color:var(--gold)}
.tour-enter{position:absolute;z-index:6;left:50%;transform:translateX(-50%);bottom:100px;padding:14px 18px;background:var(--gold);border:0;color:var(--navy);cursor:pointer;font-size:10px;font-weight:950;letter-spacing:.16em;box-shadow:0 0 34px rgba(211,163,79,.36);white-space:nowrap}.tour-enter strong{margin:0 18px;font-size:12px;letter-spacing:0}.tour-enter span{font-size:18px}
.city-sign{font-family:Inter,system-ui,sans-serif;font-size:21px;font-weight:1000;letter-spacing:.11em;text-align:center;white-space:nowrap;text-shadow:0 2px 14px #06162d}.city-door-label{font-family:Inter,system-ui,sans-serif;min-width:245px;max-width:350px;padding:13px 16px;color:white;text-align:center;background:rgba(7,26,56,.93);border:1px solid rgba(211,163,79,.42);box-shadow:0 12px 32px rgba(0,0,0,.28);transition:transform .2s,border-color .2s;backdrop-filter:blur(8px)}.city-door-label.is-near{transform:scale(1.13);border-color:var(--gold)}.city-door-label small,.city-door-label span{display:block;font-size:8px;color:var(--gold);font-weight:950;letter-spacing:.17em}.city-door-label strong{display:block;font-size:16px;line-height:1.25;margin:6px 0}
.tour-countdown{position:absolute;z-index:10;inset:0;background:rgba(7,26,56,.96);display:flex;align-items:center;justify-content:center;flex-direction:column}.tour-countdown:before{content:"";position:absolute;width:min(62vw,760px);height:min(62vw,760px);border:1px solid rgba(211,163,79,.18);border-radius:50%}.tour-countdown p,.tour-countdown span{position:relative;font-size:10px;font-weight:950;letter-spacing:.29em;color:var(--gold)}.tour-countdown strong{position:relative;font-size:clamp(150px,28vw,330px);line-height:.9;color:#f7f4ed;font-weight:950;text-shadow:0 0 70px rgba(211,163,79,.3);animation:count .8s cubic-bezier(.2,.8,.2,1)}.tour-countdown span{color:white}@keyframes count{from{transform:scale(1.45);opacity:0}to{transform:scale(1);opacity:1}}
.key-group{display:flex!important;align-items:center;gap:3px}.key-group b{margin-left:6px;font-size:9px;letter-spacing:.12em}.door-enter-key{margin-top:8px!important}.door-enter-key b{display:inline-grid;place-items:center;margin-right:7px;padding:4px 7px;border:1px solid rgba(255,255,255,.55);border-bottom-width:2px;border-radius:3px;background:#f5f2eb;color:#071a38;font-size:8px;letter-spacing:.08em}.tour-touch{display:none}
@media(max-width:900px){.tour-intro{grid-template-columns:1fr;background:#fbfaf7}.tour-intro-copy{padding:130px 28px 70px}.tour-hero{position:absolute;inset:0;opacity:.1}.tour-intro h1{font-size:clamp(74px,17vw,130px)}.tour-controls{display:none}.tour-touch{position:absolute;z-index:8;bottom:85px;right:20px;display:grid;grid-template-columns:repeat(2,55px);gap:6px;touch-action:none}.tour-touch button{height:52px;border:1px solid rgba(211,163,79,.55);background:rgba(7,26,56,.92);color:white;font-size:24px}.tour-topline span:last-child{display:none}.tour-brand span{display:none}.tour-mission{top:122px;max-width:275px}.tour-enter{bottom:160px;max-width:90vw;white-space:normal}.tour-footer{font-size:8px}}
`;
