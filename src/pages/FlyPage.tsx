import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox, useTexture } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { usePlaneStore, type Face } from '../store';

const TAKEOFF_SPEED = 115;
const CRUISE_SPEED = 245;
const ROAD_LENGTH = 260;

type FlightPhase = 'parked' | 'rolling' | 'ready' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'landing' | 'landed' | 'off';

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



function FlightRoad() {
  const trees = useMemo(() => Array.from({ length: 42 }, (_, i) => -110 + i * 5.5), []);
  const buildings = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    z: -92 + i * 7,
    side: i % 2 ? 1 : -1,
    h: 2.2 + (i % 6) * 0.65,
    w: 1.2 + (i % 3) * 0.35,
  })), []);

  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[52, 300]} />
      <meshStandardMaterial color="#88aa66" roughness={1} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -18]} receiveShadow>
      <planeGeometry args={[4.8, ROAD_LENGTH]} />
      <meshStandardMaterial color="#4f4b47" roughness={0.98} />
    </mesh>
    {[-2.25, 2.25].map(x => <mesh key={x} rotation={[-Math.PI / 2,0,0]} position={[x,0.025,-18]}>
      <planeGeometry args={[0.08, ROAD_LENGTH]} /><meshBasicMaterial color="#f1d25d" />
    </mesh>)}
    {Array.from({length: 58},(_,i)=>-140+i*4.5).map(z => <mesh key={z} rotation={[-Math.PI/2,0,0]} position={[0,0.03,z]}>
      <planeGeometry args={[0.16,1.5]} /><meshBasicMaterial color="#f7f4ea" />
    </mesh>)}
    {trees.map((z,i)=><group key={z}><Tree x={-5.2} z={z} s={i%3===0?1.2:.9}/><Tree x={5.2} z={z+2} s={i%2?1.05:.85}/></group>)}
    {buildings.map((b,i)=><group key={i} position={[b.side*(8+(i%4)*1.8), b.h/2, b.z]}>
      <RoundedBox args={[b.w,b.h,b.w*1.05]} radius={0.06} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={i%3===0?'#9ca8b2':i%3===1?'#c4c9cc':'#7e8992'} roughness={0.72}/>
      </RoundedBox>
      {Array.from({length:Math.max(2,Math.floor(b.h/.55))},(_,j)=><mesh key={j} position={[0,b.h/2-j*.52-b.h/2,b.side>0?-b.w*.53:b.w*.53]}>
        <planeGeometry args={[b.w*.55,.18]}/><meshBasicMaterial color="#b8d8e8" toneMapped={false}/>
      </mesh>)}
    </group>)}
  </group>;
}

function Clouds() {
  const clouds = useMemo(()=>Array.from({length:24},(_,i)=>({x:(i%2?1:-1)*(4+(i%5)*3),y:8+(i%4)*1.2,z:-35-i*10,s:1.2+(i%3)*.45})),[]);
  return <group>{clouds.map((c,i)=><group key={i} position={[c.x,c.y,c.z]} scale={c.s}>
    {[[-.8,0,0],[0,0.18,0],[.8,0,0],[.25,-.05,.35]].map((p,j)=><mesh key={j} position={p as [number,number,number]}>
      <sphereGeometry args={[1,14,10]}/><meshStandardMaterial color="#ffffff" transparent opacity={0.82} roughness={1}/>
    </mesh>)}
  </group>)}</group>;
}

function CityMarker({name, position}:{name:string;position:[number,number,number]}) {
  return <group position={position}><Html center distanceFactor={13} style={{pointerEvents:'none'}}>
    <div className="fly-city-marker"><span></span>{name}</div>
  </Html></group>;
}

function FlightWorld({phase,setPhase,onSpeed}:{phase:FlightPhase;setPhase:(p:FlightPhase)=>void;onSpeed:(v:number)=>void}) {
  const { liveries } = usePlaneStore();
  const plane = useRef<THREE.Group>(null);
  const speed = useRef(0);
  const z = useRef(34);
  const altitude = useRef(.72);
  const pitch = useRef(0);
  const lastHud = useRef(0);
  const { camera } = useThree();

  useFrame((state,dt)=>{
    const d=Math.min(dt,.05);
    if (phase==='rolling' || phase==='ready') {
      speed.current=Math.min(TAKEOFF_SPEED, speed.current+d*24);
      z.current-=d*(2.2+speed.current*.035);
      if(speed.current>=TAKEOFF_SPEED && phase==='rolling') setPhase('ready');
    } else if(phase==='takeoff') {
      speed.current=Math.min(155,speed.current+d*18);
      z.current-=d*(5.8+speed.current*.03);
      altitude.current=Math.min(3.2,altitude.current+d*.72);
      pitch.current=THREE.MathUtils.lerp(pitch.current,.12,d*1.6);
      if(altitude.current>=3.15) setPhase('climb');
    } else if(phase==='climb') {
      speed.current=Math.min(CRUISE_SPEED,speed.current+d*22);
      z.current-=d*(7+speed.current*.035);
      altitude.current=Math.min(10.5,altitude.current+d*1.2);
      pitch.current=THREE.MathUtils.lerp(pitch.current,.08,d*1.5);
      if(altitude.current>=10.4) setPhase('cruise');
    } else if(phase==='cruise') {
      speed.current=THREE.MathUtils.lerp(speed.current,CRUISE_SPEED,d*1.2);
      z.current-=d*11;
      pitch.current=THREE.MathUtils.lerp(pitch.current,0,d*2);
    } else if(phase==='descent') {
      speed.current=THREE.MathUtils.lerp(speed.current,170,d*.8);
      z.current-=d*8.5;
      altitude.current=Math.max(3.4,altitude.current-d*.85);
      pitch.current=THREE.MathUtils.lerp(pitch.current,-.055,d*1.5);
      if(altitude.current<=3.45) setPhase('landing');
    } else if(phase==='landing') {
      speed.current=Math.max(48,speed.current-d*18);
      z.current-=d*(3+speed.current*.025);
      altitude.current=Math.max(.72,altitude.current-d*.55);
      pitch.current=THREE.MathUtils.lerp(pitch.current,.025,d*1.8);
      if(altitude.current<=.725){ altitude.current=.72; setPhase('landed'); }
    } else if(phase==='landed') {
      speed.current=Math.max(0,speed.current-d*30);
      z.current-=d*(speed.current*.018);
    } else if(phase==='off') speed.current=0;

    if(plane.current){
      plane.current.position.set(0,altitude.current,z.current);
      plane.current.rotation.x=pitch.current;
    }
    const camTarget = new THREE.Vector3(5.7, altitude.current+2.15, z.current+7.4);
    camera.position.lerp(camTarget,1-Math.pow(.001,d));
    camera.lookAt(0,altitude.current+.35,z.current-2.8);

    if(state.clock.elapsedTime-lastHud.current>.09){onSpeed(Math.round(speed.current));lastHud.current=state.clock.elapsedTime;}
  });

  return <>
    <color attach="background" args={['#b9d7e8']}/>
    <fog attach="fog" args={['#cfe1ea',28,125]}/>
    <hemisphereLight intensity={1.1} groundColor="#71845e"/>
    <directionalLight position={[8,16,7]} intensity={2.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <FlightRoad/><Clouds/>
    <CityMarker name="VICE CITY" position={[-8,7,-145]}/>
    <CityMarker name="PORT GELLHORN" position={[9,6,-205]}/>
    <CityMarker name="AMBROSIA" position={[-11,5,-265]}/>
    <group ref={plane} position={[0,.72,34]}><Plane liveries={liveries}/></group>
  </>;
}

function SoundButton({muted,onClick}:{muted:boolean;onClick:()=>void}){
  return <button className="fly-icon-btn" onClick={onClick} title={muted?'Unmute':'Mute'}>{muted?'🔇':'🔊'}</button>;
}

export default function FlyPage(){
  const [phase,setPhase]=useState<FlightPhase>('parked');
  const [speed,setSpeed]=useState(0);
  const [muted,setMuted]=useState(true);
  const audioRef=useRef<HTMLAudioElement|null>(null);

  useEffect(()=>{
    const audio=new Audio('/boot.mp3'); audio.loop=true; audio.volume=.35; audio.muted=true; audioRef.current=audio;
    return()=>{audio.pause();audio.src='';audioRef.current=null;};
  },[]);
  const toggleSound=()=>{const a=audioRef.current;if(!a)return;a.muted=!a.muted;setMuted(a.muted);if(!a.muted)a.play().catch(()=>{});};

  const action=()=>{
    if(phase==='parked') setPhase('rolling');
    else if(phase==='ready') setPhase('takeoff');
    else if(phase==='cruise') setPhase('descent');
    else if(phase==='landed') setPhase('off');
  };
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase();
      if(k==='s' && phase==='parked') setPhase('rolling');
      if(k==='t' && phase==='ready') setPhase('takeoff');
      if((k==='d'||e.key==='ArrowDown') && phase==='cruise') setPhase('descent');
      if(k==='x' && phase==='landed') setPhase('off');
      if(k==='m') toggleSound();
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[phase]);

  const copy:Record<FlightPhase,[string,string,string]>={
    parked:['READY ON RUNWAY','Start the engine and begin your takeoff roll.','S · START ENGINE'],
    rolling:['ACCELERATING',`Building airspeed — ${Math.max(0,TAKEOFF_SPEED-speed)} km/h to rotation speed.`,'HOLD COURSE'],
    ready:['ROTATION SPEED','Aircraft is ready for takeoff.','T · TAKE OFF'],
    takeoff:['LIFT OFF','Positive climb. Keep the nose steady.','CLIMBING'],
    climb:['CLIMBING','Clearing the skyline and climbing toward the cloud layer.','GAIN ALTITUDE'],
    cruise:['CRUISE','You are above the city. Choose your descent when ready.','D / ↓ · DESCEND'],
    descent:['DESCENDING','City lights and rooftops are coming into view.','APPROACH'],
    landing:['FINAL APPROACH','Reducing speed and lining up with the runway.','LANDING'],
    landed:['TOUCHDOWN','Brakes applied. Bring the aircraft to a complete stop.','X · TURN OFF'],
    off:['FLIGHT COMPLETE','Aircraft secured. Welcome to the city.','ENGINE OFF'],
  };
  const [title,desc,button]=copy[phase];
  const clickable=['parked','ready','cruise','landed'].includes(phase);

  return <main className="fly-page"><style>{FLY_CSS}</style>
    <Canvas shadows dpr={[1,1.35]} camera={{position:[5.7,2.9,41],fov:42,near:.1,far:500}} gl={{antialias:true,powerPreference:'high-performance'}}>
      <FlightWorld phase={phase} setPhase={setPhase} onSpeed={setSpeed}/>
    </Canvas>
    <div className="fly-vignette"/>
    <header className="fly-hud-top">
      <div className="fly-brand"><span className="fly-live-dot"/>MARSHOUT <b>FLIGHT</b></div>
      <SoundButton muted={muted} onClick={toggleSound}/>
    </header>
    <aside className="fly-speed"><span>AIRSPEED</span><strong>{String(speed).padStart(3,'0')}</strong><em>KM/H</em><div><i style={{width:`${Math.min(100,speed/CRUISE_SPEED*100)}%`}}/></div></aside>
    <section className="fly-command">
      <div className="fly-phase">{title}</div><h1>{phase==='off'?'WELCOME.':'FLIGHT CONTROL'}</h1><p>{desc}</p>
      <button disabled={!clickable} onClick={action} className={clickable?'active':''}><span>{button}</span><b>→</b></button>
      <div className="fly-keys"><span><kbd>S</kbd> Start</span><span><kbd>T</kbd> Take off</span><span><kbd>D</kbd> Descend</span><span><kbd>X</kbd> Shutdown</span><span><kbd>M</kbd> Sound</span></div>
    </section>
    <div className="fly-reticle"><span/><span/></div>
  </main>;
}

const FLY_CSS=`
*{box-sizing:border-box}.fly-page{position:fixed;inset:0;overflow:hidden;background:#b9d7e8;font-family:Inter,ui-sans-serif,system-ui;color:white}.fly-page canvas{position:absolute!important;inset:0}.fly-vignette{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(2,12,25,.22),transparent 24%,transparent 65%,rgba(2,10,22,.55)),radial-gradient(circle at center,transparent 52%,rgba(2,10,22,.26));z-index:2}.fly-hud-top{position:absolute;z-index:5;top:0;left:0;right:0;padding:24px 28px;display:flex;justify-content:space-between;align-items:center}.fly-brand{font-size:11px;font-weight:900;letter-spacing:.18em;text-shadow:0 2px 12px #0008}.fly-brand b{color:#e0ad65}.fly-live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#e0ad65;margin-right:10px;box-shadow:0 0 0 5px #e0ad6522}.fly-icon-btn{width:43px;height:43px;border:1px solid #ffffff38;background:#071a38b8;color:white;border-radius:7px;backdrop-filter:blur(12px);cursor:pointer}.fly-speed{position:absolute;z-index:5;right:28px;top:94px;width:150px;padding:15px 16px;background:#071a38c9;border:1px solid #ffffff24;border-radius:8px;backdrop-filter:blur(12px);box-shadow:0 14px 34px #00102030}.fly-speed span{display:block;font-size:8px;font-weight:900;letter-spacing:.18em;color:#ffffff80}.fly-speed strong{display:inline-block;font-size:38px;line-height:1.1;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.fly-speed em{font-style:normal;font-size:8px;font-weight:900;margin-left:5px;color:#e0ad65}.fly-speed div{height:3px;background:#ffffff20;margin-top:8px;overflow:hidden}.fly-speed i{display:block;height:100%;background:#e0ad65;transition:width .15s}.fly-command{position:absolute;z-index:5;left:28px;bottom:28px;width:min(430px,calc(100vw - 56px));padding:20px;background:#06182edb;border:1px solid #ffffff20;border-radius:10px;backdrop-filter:blur(14px);box-shadow:0 20px 55px #00102055}.fly-phase{font-size:9px;font-weight:950;letter-spacing:.19em;color:#e0ad65}.fly-command h1{margin:7px 0 5px;font-size:24px;letter-spacing:-.03em}.fly-command p{margin:0 0 16px;color:#ffffffa8;font-size:12px;line-height:1.55}.fly-command button{width:100%;height:47px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;border:1px solid #ffffff18;border-radius:6px;background:#ffffff12;color:#ffffff55;font-size:10px;font-weight:950;letter-spacing:.16em}.fly-command button.active{background:#f4f6f8;color:#071a38;cursor:pointer;box-shadow:0 10px 24px #0004}.fly-command button.active b{color:#c58b3c;font-size:18px}.fly-keys{display:flex;flex-wrap:wrap;gap:11px;margin-top:13px;color:#ffffff75;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.fly-keys kbd{display:inline-flex;min-width:19px;height:19px;align-items:center;justify-content:center;border:1px solid #ffffff32;border-radius:3px;background:#ffffff10;color:#fff;font:800 8px Inter}.fly-reticle{position:absolute;z-index:4;left:50%;top:50%;width:28px;height:28px;transform:translate(-50%,-50%);opacity:.32;pointer-events:none}.fly-reticle span:first-child{position:absolute;left:13px;top:0;width:1px;height:28px;background:white}.fly-reticle span:last-child{position:absolute;left:0;top:13px;width:28px;height:1px;background:white}.fly-city-marker{padding:7px 10px;border-radius:4px;background:#071a38d9;border:1px solid #ffffff35;color:#fff;font:900 9px Inter;letter-spacing:.15em;white-space:nowrap;box-shadow:0 6px 20px #00102044}.fly-city-marker span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#e0ad65;margin-right:7px}@media(max-width:650px){.fly-hud-top{padding:16px}.fly-speed{right:16px;top:72px}.fly-command{left:16px;bottom:16px;width:calc(100vw - 32px)}.fly-keys{display:none}}
`;
