import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox, useTexture, OrbitControls } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
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



const TAKEOFF_SPEED = 115;
const CRUISE_SPEED = 235;
const ROUTE_END_Z = -640;
const DESTINATION_NAME = 'LOS SANTOS';
const START_NAME = 'VICE CITY';

type FlightPhase =
  | 'parked'
  | 'rolling'
  | 'ready'
  | 'takeoff'
  | 'climb'
  | 'cruise'
  | 'approach'
  | 'landing'
  | 'landed'
  | 'off';

type Telemetry = {
  speed: number;
  altitude: number;
  heading: number;
  distance: number;
  routeError: number;
  progress: number;
  canLand: boolean;
};

type Controls = {
  left: boolean;
  right: boolean;
  throttle: boolean;
  brake: boolean;
  climb: boolean;
  descend: boolean;
};

function Building({ x, z, h, w, warm = false }: { x:number; z:number; h:number; w:number; warm?:boolean }) {
  return <group position={[x,h/2,z]}>
    <RoundedBox args={[w,h,w*.82]} radius={.06} smoothness={2} castShadow receiveShadow>
      <meshStandardMaterial color={warm ? '#b9a99a' : '#8998a5'} roughness={.72}/>
    </RoundedBox>
    {Array.from({length:Math.max(2,Math.floor(h/.7))},(_,i)=><mesh key={i} position={[0,h/2-i*.68-h/2,w*.415+.006]}>
      <planeGeometry args={[w*.58,.16]}/><meshBasicMaterial color={warm?'#f3d59b':'#b9d7e8'} toneMapped={false}/>
    </mesh>)}
  </group>;
}

function Runway({ z, length=210 }:{z:number;length?:number}) {
  return <group position={[0,0,z]}>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow>
      <planeGeometry args={[42,length+30]}/><meshStandardMaterial color="#78945f" roughness={1}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]} receiveShadow>
      <planeGeometry args={[5.2,length]}/><meshStandardMaterial color="#4d4d4b" roughness={.98}/>
    </mesh>
    {[-2.43,2.43].map(x=><mesh key={x} rotation={[-Math.PI/2,0,0]} position={[x,.025,0]}>
      <planeGeometry args={[.08,length]}/><meshBasicMaterial color="#e6c95a"/>
    </mesh>)}
    {Array.from({length:Math.floor(length/7)},(_,i)=>-length/2+4+i*7).map(v=><mesh key={v} rotation={[-Math.PI/2,0,0]} position={[0,.03,v]}>
      <planeGeometry args={[.16,2.2]}/><meshBasicMaterial color="#f6f3e9"/>
    </mesh>)}
    {[-1,1].flatMap(side=>Array.from({length:12},(_,i)=><mesh key={`${side}-${i}`} position={[side*2.7,.06,-length/2+8+i*(length-16)/11]}>
      <sphereGeometry args={[.035,8,6]}/><meshBasicMaterial color="#e8f5ff" toneMapped={false}/>
    </mesh>))}
  </group>;
}

function WorldEnvironment() {
  const departureTrees=useMemo(()=>Array.from({length:28},(_,i)=>45-i*6.5),[]);
  const destinationTrees=useMemo(()=>Array.from({length:30},(_,i)=>-545-i*6.2),[]);
  const skyline=useMemo(()=>Array.from({length:34},(_,i)=>({
    x:(i%2?1:-1)*(7+(i%5)*2.1), z:-570-(i%9)*8.5, h:3.5+(i%7)*1.05, w:1.3+(i%3)*.45
  })),[]);
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,-300]} receiveShadow>
      <planeGeometry args={[240,1000]}/><meshStandardMaterial color="#6f8e5d" roughness={1}/>
    </mesh>
    <Runway z={-35} length={230}/>
    <Runway z={ROUTE_END_Z} length={250}/>
    {departureTrees.map((z,i)=><group key={`a${z}`}><Tree x={-6.2} z={z} s={i%3?1:.8}/><Tree x={6.2} z={z-2} s={i%2?.9:1.1}/></group>)}
    {destinationTrees.map((z,i)=><group key={`b${z}`}><Tree x={-6.5} z={z} s={i%2?1:.85}/><Tree x={6.5} z={z-2} s={i%3?.9:1.12}/></group>)}
    {skyline.map((b,i)=><Building key={i} {...b} warm={i%4===0}/>)}
    <group position={[0,.02,-315]}>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[220,300]}/><meshStandardMaterial color="#557d91" roughness={.55} metalness={.05}/></mesh>
      {Array.from({length:18},(_,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[(i%2?1:-1)*(15+(i%6)*12),.015,-125+(i%9)*30]}>
        <circleGeometry args={[2+(i%3),18]}/><meshBasicMaterial color="#8eb5c5" transparent opacity={.35}/>
      </mesh>)}
    </group>
  </group>;
}

function HighClouds() {
  const clouds=useMemo(()=>Array.from({length:34},(_,i)=>({
    x:(i%2?1:-1)*(8+(i%6)*5.2), y:15+(i%5)*1.8, z:20-i*20, s:1.4+(i%4)*.38
  })),[]);
  return <group>{clouds.map((c,i)=><group key={i} position={[c.x,c.y,c.z]} scale={c.s}>
    {[[-.9,0,0],[0,.22,0],[.9,0,0],[.2,-.08,.55],[-.35,.05,-.45]].map((p,j)=><mesh key={j} position={p as [number,number,number]}>
      <sphereGeometry args={[1.2,12,9]}/><meshStandardMaterial color="#fff" transparent opacity={.76} roughness={1} depthWrite={false}/>
    </mesh>)}
  </group>)}</group>;
}

function DestinationBeacon({distance}:{distance:number}) {
  const scale=Math.max(.72,Math.min(1.45,120/Math.max(distance,80)));
  return <group position={[0,12,ROUTE_END_Z]} scale={scale}>
    <Html center distanceFactor={15} style={{pointerEvents:'none'}}>
      <div className="destination-beacon"><span className="destination-pulse"/><b>{DESTINATION_NAME}</b><small>{Math.max(0,Math.round(distance))} KM</small></div>
    </Html>
  </group>;
}

function FlightWorld({phase,setPhase,onTelemetry,controls}:{
  phase:FlightPhase;
  setPhase:(p:FlightPhase)=>void;
  onTelemetry:(t:Telemetry)=>void;
  controls:import('react').MutableRefObject<Controls>;
}) {
  const {liveries}=usePlaneStore();
  const aircraft=useRef<THREE.Group>(null);
  const orbit=useRef<any>(null);
  const speed=useRef(0);
  const x=useRef(0);
  const z=useRef(52);
  const altitude=useRef(.72);
  const yaw=useRef(0);
  const bank=useRef(0);
  const pitch=useRef(0);
  const lastHud=useRef(0);
  const {camera}=useThree();
  const userOrbiting=useRef(false);

  useFrame((state,dt)=>{
    const d=Math.min(dt,.045);
    const c=controls.current;
    const destinationDistance=Math.hypot(x.current,z.current-ROUTE_END_Z);
    const routeError=Math.abs(x.current);

    if(phase==='rolling'||phase==='ready'){
      const accel=c.brake?-45:c.throttle?34:22;
      speed.current=THREE.MathUtils.clamp(speed.current+accel*d,0,145);
      if(speed.current>=TAKEOFF_SPEED&&phase==='rolling')setPhase('ready');
    } else if(phase==='takeoff'){
      speed.current=Math.min(165,speed.current+d*18);
      altitude.current=Math.min(4.5,altitude.current+d*.95);
      pitch.current=THREE.MathUtils.lerp(pitch.current,.13,d*2);
      if(altitude.current>=4.45)setPhase('climb');
    } else if(phase==='climb'){
      speed.current=Math.min(CRUISE_SPEED,speed.current+d*19);
      altitude.current=Math.min(18.5,altitude.current+d*1.55);
      pitch.current=THREE.MathUtils.lerp(pitch.current,.075,d*1.8);
      if(altitude.current>=18.4)setPhase('cruise');
    } else if(phase==='cruise'){
      speed.current=THREE.MathUtils.clamp(speed.current+(c.throttle?18:c.brake?-28:0)*d,145,CRUISE_SPEED);
      altitude.current=THREE.MathUtils.clamp(altitude.current+(c.climb?1.8:c.descend?-1.8:0)*d,13,23);
      pitch.current=THREE.MathUtils.lerp(pitch.current,c.climb?.045:c.descend?-.045:0,d*2.4);
      if(destinationDistance<175)setPhase('approach');
    } else if(phase==='approach'){
      speed.current=THREE.MathUtils.lerp(speed.current,c.brake?125:155,d*.9);
      const targetAlt=THREE.MathUtils.mapLinear(THREE.MathUtils.clamp(destinationDistance,25,175),25,175,2.2,15);
      if(c.descend||destinationDistance<105) altitude.current=THREE.MathUtils.lerp(altitude.current,targetAlt,d*.8);
      if(c.climb) altitude.current=Math.min(17,altitude.current+d*1.2);
      pitch.current=THREE.MathUtils.lerp(pitch.current,c.descend?-.06:0,d*2);
      if(destinationDistance<46&&routeError<8&&altitude.current<6.2)setPhase('landing');
    } else if(phase==='landing'){
      speed.current=Math.max(58,speed.current-d*22);
      altitude.current=Math.max(.72,altitude.current-d*.75);
      yaw.current=THREE.MathUtils.lerp(yaw.current,0,d*1.7);
      x.current=THREE.MathUtils.lerp(x.current,0,d*1.25);
      pitch.current=THREE.MathUtils.lerp(pitch.current,.018,d*2);
      if(altitude.current<=.725){altitude.current=.72;setPhase('landed');}
    } else if(phase==='landed'){
      speed.current=Math.max(0,speed.current-(c.brake?55:30)*d);
      yaw.current=THREE.MathUtils.lerp(yaw.current,0,d*2);
      x.current=THREE.MathUtils.lerp(x.current,0,d*2);
    } else if(phase==='off') speed.current=0;

    const steerAllowed=!['parked','off'].includes(phase);
    if(steerAllowed){
      const steer=(c.left?1:0)-(c.right?1:0);
      const steerPower=(phase==='rolling'||phase==='ready'||phase==='landed') ? .38 : .72;
      yaw.current+=steer*steerPower*d;
      yaw.current=THREE.MathUtils.clamp(yaw.current,-.62,.62);
      if(!steer)yaw.current=THREE.MathUtils.lerp(yaw.current,0,d*((phase==='cruise'||phase==='approach') ? .38 : 1.25));
      bank.current=THREE.MathUtils.lerp(bank.current,-steer*.28,d*3.2);
    }

    if(!['parked','off'].includes(phase)&&speed.current>0){
      const worldSpeed=(speed.current/CRUISE_SPEED)*23;
      x.current+=Math.sin(yaw.current)*worldSpeed*d;
      z.current-=Math.cos(yaw.current)*worldSpeed*d;
    }

    if(aircraft.current){
      aircraft.current.position.set(x.current,altitude.current,z.current);
      aircraft.current.rotation.set(pitch.current,yaw.current,bank.current);
    }

    const chaseOffset=new THREE.Vector3(7.2,3.6,10.5).applyAxisAngle(new THREE.Vector3(0,1,0),yaw.current);
    const desired=new THREE.Vector3(x.current,altitude.current,z.current).add(chaseOffset);
    if(!userOrbiting.current)camera.position.lerp(desired,1-Math.pow(.002,d));
    const look=new THREE.Vector3(x.current,altitude.current+.5,z.current-5.2);
    if(orbit.current){
      orbit.current.target.lerp(look,1-Math.pow(.001,d));
      orbit.current.update();
    } else camera.lookAt(look);

    if(state.clock.elapsedTime-lastHud.current>.08){
      const progress=THREE.MathUtils.clamp(1-destinationDistance/692,0,1);
      onTelemetry({speed:Math.round(speed.current),altitude:Math.max(0,Math.round((altitude.current-.72)*120)),heading:Math.round(180+THREE.MathUtils.radToDeg(yaw.current)),distance:Math.max(0,Math.round(destinationDistance)),routeError:Math.round(routeError),progress,canLand:destinationDistance<46&&routeError<8&&altitude.current<6.2});
      lastHud.current=state.clock.elapsedTime;
    }
  });

  return <>
    <color attach="background" args={['#a9ccdf']}/><fog attach="fog" args={['#bfd7e3',55,260]}/>
    <hemisphereLight intensity={1.15} groundColor="#71845e"/>
    <directionalLight position={[10,22,8]} intensity={2.25} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <WorldEnvironment/><HighClouds/><DestinationBeacon distance={Math.hypot(x.current,z.current-ROUTE_END_Z)}/>
    <group ref={aircraft} position={[0,.72,52]}><Plane liveries={liveries}/></group>
    <OrbitControls ref={orbit} enablePan={false} enableDamping dampingFactor={.08} minDistance={5} maxDistance={18} minPolarAngle={.35} maxPolarAngle={1.38}
      onStart={()=>{userOrbiting.current=true}} onEnd={()=>{userOrbiting.current=false}}/>
  </>;
}

function SoundButton({muted,onClick}:{muted:boolean;onClick:()=>void}){
  return <button className="fly-icon-btn" onClick={onClick} title={muted?'Unmute':'Mute'} aria-label={muted?'Unmute':'Mute'}>{muted?'🔇':'🔊'}</button>;
}

const initialTelemetry:Telemetry={speed:0,altitude:0,heading:180,distance:692,routeError:0,progress:0,canLand:false};

export default function FlyPage(){
  const [phase,setPhase]=useState<FlightPhase>('parked');
  const [telemetry,setTelemetry]=useState<Telemetry>(initialTelemetry);
  const [muted,setMuted]=useState(true);
  const [location,setLocation]=useState(START_NAME);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const controls=useRef<Controls>({left:false,right:false,throttle:false,brake:false,climb:false,descend:false});

  useEffect(()=>{
    const audio=new Audio('/boot.mp3');audio.loop=true;audio.volume=.35;audio.muted=true;audioRef.current=audio;
    return()=>{audio.pause();audio.src='';audioRef.current=null};
  },[]);
  const toggleSound=()=>{const a=audioRef.current;if(!a)return;a.muted=!a.muted;setMuted(a.muted);if(!a.muted)a.play().catch(()=>{})};

  useEffect(()=>{if(phase==='landed'||phase==='off')setLocation(DESTINATION_NAME)},[phase]);

  useEffect(()=>{
    const set=(e:KeyboardEvent,value:boolean)=>{
      const k=e.key.toLowerCase();
      if(['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s'].includes(k))e.preventDefault();
      if(k==='a'||k==='arrowleft')controls.current.left=value;
      if(k==='d'||k==='arrowright')controls.current.right=value;
      if(k==='w')controls.current.throttle=value;
      if(k==='s'&&phase!=='parked')controls.current.brake=value;
      if(k==='arrowup')controls.current.climb=value;
      if(k==='arrowdown')controls.current.descend=value;
      if(!value)return;
      if(k==='s'&&phase==='parked')setPhase('rolling');
      if(k==='t'&&phase==='ready')setPhase('takeoff');
      if(k==='x'&&phase==='landed'&&telemetry.speed<4)setPhase('off');
      if(k==='m')toggleSound();
    };
    const down=(e:KeyboardEvent)=>set(e,true),up=(e:KeyboardEvent)=>set(e,false);
    window.addEventListener('keydown',down,{passive:false});window.addEventListener('keyup',up,{passive:false});
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)};
  },[phase,telemetry.speed]);

  const mainAction=()=>{
    if(phase==='parked')setPhase('rolling');
    else if(phase==='ready')setPhase('takeoff');
    else if(phase==='landed'&&telemetry.speed<4)setPhase('off');
  };

  const phaseText:Record<FlightPhase,[string,string]>= {
    parked:['READY AT VICE CITY','Start the aircraft and build speed on the runway.'],
    rolling:['TAKEOFF ROLL',telemetry.speed<TAKEOFF_SPEED?`${TAKEOFF_SPEED-telemetry.speed} km/h to rotation speed. W adds throttle; S reduces speed.`:'Rotation speed reached.'],
    ready:['READY FOR TAKEOFF','You have rotation speed. Press T and climb through the skyline.'],
    takeoff:['LIFT OFF','Positive climb. Hold course and clear the buildings.'],
    climb:['CLIMBING','Keep the destination marker ahead. The cloud layer is above the skyline.'],
    cruise:['EN ROUTE TO LOS SANTOS','Fly the route with A/D. W adds speed, S reduces it. Use the mini-map to stay on course.'],
    approach:['LOS SANTOS APPROACH',telemetry.routeError>8?'Line up with the runway: steer toward the gold route centerline.':'Good alignment. Use ↓ to descend and S to reduce speed.'],
    landing:['FINAL APPROACH','Runway captured. Aircraft is settling onto the road.'],
    landed:['TOUCHDOWN',telemetry.speed>3?'Hold S to brake to a complete stop.':'Aircraft stopped. Press X to shut down.'],
    off:['THANK YOU, DAWG','Los Santos reached. Aircraft secured.'],
  };
  const [title,desc]=phaseText[phase];
  const actionLabel=phase==='parked'?'S · START':phase==='ready'?'T · TAKE OFF':phase==='landed'&&telemetry.speed<4?'X · TURN OFF':'';

  return <main className="fly-page"><style>{FLY_CSS}</style>
    <Canvas shadows dpr={[1,1.35]} camera={{position:[7.2,4.3,63],fov:43,near:.1,far:1100}} gl={{antialias:true,powerPreference:'high-performance',stencil:false}}>
      <FlightWorld phase={phase} setPhase={setPhase} onTelemetry={setTelemetry} controls={controls}/>
    </Canvas>
    <div className="fly-vignette"/>

    <header className="fly-hud-top">
      <div className="fly-route-title"><span className="fly-live-dot"/>MARSHOUT <b>FLIGHT</b></div>
      <div className="fly-route-locations"><span><small>CURRENT LOCATION</small><b>{location}</b></span><i>→</i><span><small>DESTINATION</small><b>{DESTINATION_NAME}</b></span></div>
      <SoundButton muted={muted} onClick={toggleSound}/>
    </header>

    <aside className="fly-instruments">
      <div className="fly-speed"><span>AIRSPEED</span><strong>{String(telemetry.speed).padStart(3,'0')}</strong><em>KM/H</em><div><i style={{width:`${Math.min(100,telemetry.speed/CRUISE_SPEED*100)}%`}}/></div></div>
      <div className="fly-stat"><span>ALTITUDE</span><b>{telemetry.altitude.toLocaleString()} FT</b></div>
      <div className="fly-stat"><span>HEADING</span><b>{String(telemetry.heading).padStart(3,'0')}°</b></div>
    </aside>

    <aside className="fly-map">
      <div className="fly-map-head"><span>ROUTE</span><b>{telemetry.distance} KM</b></div>
      <div className="fly-map-track"><i className="map-route"/><span className="map-start">VC</span><span className="map-plane" style={{top:`${8+telemetry.progress*76}%`,left:`${50+Math.max(-28,Math.min(28,telemetry.routeError*(0)))}%`}}>▲</span><span className="map-end">LS</span></div>
      <div className="fly-map-foot"><span className={telemetry.routeError<8?'good':''}>{telemetry.routeError<8?'ON ROUTE':'CORRECT COURSE'}</span><b>{Math.round(telemetry.progress*100)}%</b></div>
    </aside>

    <section className="fly-command">
      <div className="fly-phase">{title}</div><h1>{phase==='off'?'THANK YOU, DAWG':'FLIGHT CONTROL'}</h1><p>{desc}</p>
      {actionLabel&&<button onClick={mainAction} className="active"><span>{actionLabel}</span><b>→</b></button>}
      {phase==='approach'&&!telemetry.canLand&&<div className="landing-gate"><b>LANDING GATE</b><span>{telemetry.routeError<8?'✓ Aligned':'○ Align runway'} · {telemetry.altitude<660?'✓ Low enough':'○ Descend'} · {telemetry.distance<46?'✓ In range':'○ Continue approach'}</span></div>}
      <div className="fly-keys"><span><kbd>W</kbd> Throttle</span><span><kbd>S</kbd> Brake</span><span><kbd>A</kbd><kbd>D</kbd> Steer</span><span><kbd>↑</kbd><kbd>↓</kbd> Altitude</span><span><kbd>T</kbd> Take off</span><span><kbd>M</kbd> Sound</span></div>
    </section>

    <div className="fly-guidance"><span className={telemetry.routeError<8?'locked':''}>◆</span><b>{DESTINATION_NAME}</b><small>{telemetry.distance} KM · KEEP MARKER CENTERED</small></div>
    <div className="fly-reticle"><span/><span/></div>
  </main>;
}

const FLY_CSS=`
*{box-sizing:border-box}.fly-page{position:fixed;left:0;right:0;top:48px;bottom:0;overflow:hidden;background:#a9ccdf;font-family:Inter,ui-sans-serif,system-ui;color:#fff;z-index:1}.fly-page canvas{position:absolute!important;inset:0}.fly-vignette{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(2,12,25,.18),transparent 22%,transparent 64%,rgba(2,10,22,.52)),radial-gradient(circle at center,transparent 54%,rgba(2,10,22,.24));z-index:2}.fly-hud-top{position:absolute;z-index:6;top:0;left:0;right:0;padding:16px 24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:start;pointer-events:none}.fly-route-title{font-size:10px;font-weight:950;letter-spacing:.18em;text-shadow:0 2px 12px #0008;padding-top:9px}.fly-route-title b{color:#dda04c}.fly-live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#dda04c;margin-right:10px;box-shadow:0 0 0 5px #dda04c22}.fly-route-locations{display:flex;align-items:center;gap:16px;padding:10px 16px;border:1px solid #ffffff25;background:#071a38b8;border-radius:8px;backdrop-filter:blur(12px);box-shadow:0 10px 30px #0010202d}.fly-route-locations span{display:flex;flex-direction:column;gap:2px;min-width:120px}.fly-route-locations span:last-child{text-align:right}.fly-route-locations small{font-size:7px;letter-spacing:.15em;color:#ffffff6f;font-weight:900}.fly-route-locations b{font-size:10px;letter-spacing:.1em}.fly-route-locations i{font-style:normal;color:#dda04c}.fly-icon-btn{justify-self:end;pointer-events:auto;width:42px;height:42px;border:1px solid #ffffff30;background:#071a38c4;color:#fff;border-radius:7px;backdrop-filter:blur(12px);cursor:pointer}.fly-instruments{position:absolute;z-index:5;right:24px;top:84px;width:150px;display:grid;gap:7px}.fly-speed,.fly-stat{padding:13px 15px;background:#071a38cc;border:1px solid #ffffff20;border-radius:8px;backdrop-filter:blur(12px);box-shadow:0 14px 34px #0010202b}.fly-speed>span,.fly-stat span{display:block;font-size:7px;font-weight:900;letter-spacing:.18em;color:#ffffff72}.fly-speed strong{display:inline-block;font-size:34px;line-height:1.08;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.fly-speed em{font-style:normal;font-size:7px;font-weight:900;margin-left:4px;color:#dda04c}.fly-speed div{height:3px;background:#ffffff1c;margin-top:7px;overflow:hidden}.fly-speed i{display:block;height:100%;background:#dda04c;transition:width .12s}.fly-stat{display:flex;align-items:center;justify-content:space-between}.fly-stat b{font-size:10px;letter-spacing:.08em}.fly-map{position:absolute;z-index:5;right:24px;bottom:24px;width:170px;height:215px;padding:13px;background:#06182edc;border:1px solid #ffffff22;border-radius:9px;backdrop-filter:blur(14px);box-shadow:0 18px 44px #00102048}.fly-map-head,.fly-map-foot{display:flex;justify-content:space-between;align-items:center;font-size:8px;font-weight:900;letter-spacing:.12em}.fly-map-head span{color:#ffffff70}.fly-map-head b{color:#dda04c}.fly-map-track{position:relative;height:155px;margin:8px 0;background:linear-gradient(90deg,#ffffff05,#ffffff0b,#ffffff05);overflow:hidden;border:1px solid #ffffff10}.map-route{position:absolute;left:50%;top:9%;bottom:9%;width:1px;background:linear-gradient(#dda04c,#fff8,#dda04c);transform:translateX(-50%)}.map-start,.map-end{position:absolute;left:50%;transform:translateX(-50%);font-size:7px;font-weight:950;background:#071a38;padding:3px 5px;border:1px solid #ffffff28}.map-start{top:4px}.map-end{bottom:4px;color:#dda04c}.map-plane{position:absolute;transform:translate(-50%,-50%);font-size:13px;color:#fff;text-shadow:0 0 10px #dda04c;transition:top .15s}.fly-map-foot span{color:#e39b82}.fly-map-foot span.good{color:#8ed2a9}.fly-command{position:absolute;z-index:5;left:24px;bottom:24px;width:min(450px,calc(100vw - 48px));padding:19px;background:#06182edc;border:1px solid #ffffff20;border-radius:10px;backdrop-filter:blur(14px);box-shadow:0 20px 55px #00102055}.fly-phase{font-size:8px;font-weight:950;letter-spacing:.19em;color:#dda04c}.fly-command h1{margin:6px 0 5px;font-size:22px;letter-spacing:-.03em}.fly-command p{margin:0 0 13px;color:#ffffffa8;font-size:11px;line-height:1.5}.fly-command button{width:100%;height:44px;padding:0 15px;display:flex;align-items:center;justify-content:space-between;border:0;border-radius:6px;background:#f5f6f7;color:#071a38;font-size:9px;font-weight:950;letter-spacing:.16em;cursor:pointer;box-shadow:0 10px 24px #0004}.fly-command button b{color:#c58b3c;font-size:17px}.landing-gate{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #ffffff18;background:#ffffff09;border-radius:5px;margin-bottom:11px;font-size:8px;letter-spacing:.08em}.landing-gate b{color:#dda04c}.landing-gate span{color:#ffffff9b;text-align:right}.fly-keys{display:flex;flex-wrap:wrap;gap:9px;margin-top:11px;color:#ffffff72;font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}.fly-keys kbd{display:inline-flex;min-width:18px;height:18px;padding:0 4px;align-items:center;justify-content:center;border:1px solid #ffffff32;border-radius:3px;background:#ffffff10;color:#fff;font:800 7px Inter;margin-right:2px}.fly-guidance{position:absolute;z-index:4;left:50%;top:22%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;text-shadow:0 2px 12px #001020c0;pointer-events:none}.fly-guidance span{font-size:18px;color:#e39b82}.fly-guidance span.locked{color:#dda04c}.fly-guidance b{font-size:9px;letter-spacing:.18em;margin-top:3px}.fly-guidance small{font-size:7px;font-weight:800;letter-spacing:.1em;color:#ffffff9a;margin-top:3px}.fly-reticle{position:absolute;z-index:4;left:50%;top:50%;width:28px;height:28px;transform:translate(-50%,-50%);opacity:.3;pointer-events:none}.fly-reticle span:first-child{position:absolute;left:13px;top:0;width:1px;height:28px;background:#fff}.fly-reticle span:last-child{position:absolute;left:0;top:13px;width:28px;height:1px;background:#fff}.destination-beacon{display:flex;flex-direction:column;align-items:center;min-width:120px;padding:8px 12px;background:#071a38d5;border:1px solid #ffffff35;border-radius:5px;color:#fff;font-family:Inter;box-shadow:0 8px 24px #00102044}.destination-beacon b{font-size:9px;letter-spacing:.15em}.destination-beacon small{font-size:7px;color:#dda04c;margin-top:2px}.destination-pulse{width:8px;height:8px;border-radius:50%;background:#dda04c;box-shadow:0 0 0 6px #dda04c28;margin-bottom:6px}@media(max-width:800px){.fly-page{top:48px}.fly-hud-top{padding:12px}.fly-route-title{display:none}.fly-route-locations{grid-column:1/3;justify-self:start}.fly-route-locations span{min-width:92px}.fly-instruments{right:12px;top:74px}.fly-map{right:12px;bottom:12px;width:145px;height:190px}.fly-map-track{height:132px}.fly-command{left:12px;bottom:12px;width:min(390px,calc(100vw - 181px))}.fly-keys{display:none}}@media(max-width:600px){.fly-route-locations{transform:scale(.88);transform-origin:top left}.fly-instruments{transform:scale(.82);transform-origin:top right}.fly-map{display:none}.fly-command{width:calc(100vw - 24px)}.fly-guidance{top:25%}}
`;
