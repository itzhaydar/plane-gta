import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox, useTexture, OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
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



const CRUISE_SPEED = 235;
const ROUTE_END_Z = -720;
const DESTINATION_NAME = 'LOS SANTOS';
const START_NAME = 'VICE CITY';

type FlightPhase = 'outside'|'parked'|'takeoff'|'climb'|'cruise'|'approach'|'landing'|'landed'|'stopped'|'exited';
type Telemetry = { speed:number; altitude:number; distance:number; progress:number };

function Building({x,z,h,w,warm=false}:{x:number;z:number;h:number;w:number;warm?:boolean}){
  const floors=Math.max(3,Math.floor(h/.62));
  return <group position={[x,0,z]}>
    <RoundedBox args={[w,h,w*.82]} radius={.055} smoothness={3} position={[0,h/2,0]} castShadow receiveShadow>
      <meshStandardMaterial color={warm?'#a99b91':'#748795'} roughness={.62} metalness={.08}/>
    </RoundedBox>
    <mesh position={[0,h+.16,0]} castShadow><boxGeometry args={[w*.52,.32,w*.48]}/><meshStandardMaterial color={warm?'#80766f':'#596b78'} roughness={.7}/></mesh>
    <mesh position={[0,h+.42,0]}><cylinderGeometry args={[.025,.025,.55,8]}/><meshStandardMaterial color="#4e5b64" metalness={.45}/></mesh>
    {Array.from({length:floors},(_,i)=>{const y=.42+i*.62;return <group key={i}>
      <mesh position={[0,y,w*.415+.007]}><planeGeometry args={[w*.62,.16]}/><meshBasicMaterial color={i%3===0?'#f1d398':'#bdd9e8'} toneMapped={false}/></mesh>
      <mesh position={[w*.501,y,0]} rotation={[0,Math.PI/2,0]}><planeGeometry args={[w*.48,.14]}/><meshBasicMaterial color={i%4===0?'#efd08f':'#a9cfdf'} toneMapped={false}/></mesh>
    </group>})}
  </group>;
}

function Runway({z,length=250}:{z:number;length?:number}){
  return <group position={[0,0,z]}><mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[44,length+35]}/><meshStandardMaterial color="#78945f" roughness={1}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]} receiveShadow><planeGeometry args={[5.4,length]}/><meshStandardMaterial color="#4c4d4c" roughness={.98}/></mesh>{[-2.5,2.5].map(x=><mesh key={x} rotation={[-Math.PI/2,0,0]} position={[x,.025,0]}><planeGeometry args={[.08,length]}/><meshBasicMaterial color="#e8ca5b"/></mesh>)}{Array.from({length:Math.floor(length/7)},(_,i)=>-length/2+4+i*7).map(v=><mesh key={v} rotation={[-Math.PI/2,0,0]} position={[0,.03,v]}><planeGeometry args={[.17,2.25]}/><meshBasicMaterial color="#f6f3e9"/></mesh>)}</group>;
}

function WorldEnvironment(){
  const trees=useMemo(()=>Array.from({length:58},(_,i)=>55-i*13),[]);
  const skyline=useMemo(()=>[...Array.from({length:34},(_,i)=>({x:(i%2?1:-1)*(7+(i%5)*2.15),z:58-i*5.7,h:4.5+(i%7)*1.05,w:1.35+(i%4)*.38})),...Array.from({length:64},(_,i)=>({x:(i%2?1:-1)*(7+(i%6)*2.2),z:-610-(i%16)*8,h:5+(i%9)*1.18,w:1.4+(i%4)*.42}))],[]);
  return <group><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.04,-330]} receiveShadow><planeGeometry args={[260,1150]}/><meshStandardMaterial color="#6d8b5a" roughness={1}/></mesh><Runway z={-45} length={260}/><Runway z={ROUTE_END_Z} length={280}/>{trees.map((z,i)=><group key={z}><Tree x={-6.6} z={z} s={i%3?.9:1.1}/><Tree x={6.6} z={z-3} s={i%2?1:.85}/></group>)}{skyline.map((b,i)=><Building key={i} {...b} warm={i%5===0}/>)}</group>;
}

function HighClouds(){
  const clouds=useMemo(()=>Array.from({length:36},(_,i)=>({x:(i%2?1:-1)*(10+(i%6)*5.5),y:20+(i%5)*2,z:-120-i*14,s:1.5+(i%4)*.4})),[]);
  return <group>{clouds.map((c,i)=><group key={i} position={[c.x,c.y,c.z]} scale={c.s}>{[[-.9,0,0],[0,.22,0],[.9,0,0],[.2,-.08,.55],[-.35,.05,-.45]].map((q,j)=><mesh key={j} position={q as [number,number,number]}><sphereGeometry args={[1.2,10,8]}/><meshStandardMaterial color="#fff" transparent opacity={.72} roughness={1} depthWrite={false}/></mesh>)}</group>)}</group>;
}

useGLTF.preload('/pilot-out.glb');
useGLTF.preload('/homie1.glb');

function AnimatedPerson({url,height,position,rotation=[0,-Math.PI/2,0]}:{url:string;height:number;position:[number,number,number];rotation?:[number,number,number]}){
  const {scene,animations}=useGLTF(url);
  const person=useMemo(()=>{const c=SkeletonUtils.clone(scene);c.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}});c.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(c),sz=b.getSize(new THREE.Vector3());c.scale.multiplyScalar(height/Math.max(sz.y,1e-6));c.updateMatrixWorld(true);const f=new THREE.Box3().setFromObject(c),center=f.getCenter(new THREE.Vector3());c.position.x-=center.x;c.position.z-=center.z;c.position.y-=f.min.y;return c},[scene,height]);
  const {actions,mixer}=useAnimations(animations,person);
  useEffect(()=>{const names=Object.keys(actions);const action=actions.idle||actions.Idle||actions.walk||actions.Walk||actions[names[0]];if(!action)return;action.reset().setLoop(THREE.LoopRepeat,Infinity).fadeIn(.2).play();return()=>{action.fadeOut(.2)}},[actions]);
  useFrame((_,dt)=>mixer?.update(dt));
  return <group position={position} rotation={rotation}><primitive object={person}/></group>;
}

function StartCrew(){return <><AnimatedPerson url="/pilot-out.glb" height={1.42} position={[1.65,-.72,.35]}/><AnimatedPerson url="/homie1.glb" height={1.42} position={[-1.15,-.72,.65]} rotation={[0,Math.PI/2,0]}/></>}
function ExitHomie(){return <AnimatedPerson url="/homie1.glb" height={1.48} position={[1.45,-.72,.42]}/>;}

function DestinationBeacon({distance}:{distance:number}){return <group position={[0,13,ROUTE_END_Z]}><Html center distanceFactor={16} style={{pointerEvents:'none'}}><div className="destination-beacon"><span/><b>{DESTINATION_NAME}</b><small>{Math.max(0,Math.round(distance))} KM</small></div></Html></group>}

function FlightWorld({phase,setPhase,onTelemetry}:{phase:FlightPhase;setPhase:(p:FlightPhase)=>void;onTelemetry:(t:Telemetry)=>void}){
  const {liveries}=usePlaneStore(); const aircraft=useRef<THREE.Group>(null); const orbit=useRef<any>(null); const {camera}=useThree();
  const speed=useRef(0), z=useRef(65), altitude=useRef(.72), pitch=useRef(0), lastHud=useRef(0);
  useFrame((state,dt)=>{const d=Math.min(dt,.045);const dist=Math.max(0,z.current-ROUTE_END_Z);
    if(phase==='takeoff'){speed.current=Math.min(150,speed.current+30*d);z.current-=Math.max(5,speed.current/10)*d;if(speed.current>108){altitude.current=Math.min(5,altitude.current+1.25*d);pitch.current=THREE.MathUtils.lerp(pitch.current,.13,d*2)}if(altitude.current>=4.9)setPhase('climb')}
    else if(phase==='climb'){speed.current=Math.min(CRUISE_SPEED,speed.current+20*d);z.current-=speed.current/10*d;altitude.current=Math.min(23,altitude.current+1.9*d);pitch.current=THREE.MathUtils.lerp(pitch.current,.07,d*2);if(altitude.current>=22.8)setPhase('cruise')}
    else if(phase==='cruise'){speed.current=THREE.MathUtils.lerp(speed.current,CRUISE_SPEED,d);z.current-=speed.current/10*d;pitch.current=THREE.MathUtils.lerp(pitch.current,0,d*2);if(dist<190)setPhase('approach')}
    else if(phase==='approach'){speed.current=THREE.MathUtils.lerp(speed.current,145,d*.7);z.current-=speed.current/10*d;const target=THREE.MathUtils.mapLinear(THREE.MathUtils.clamp(dist,35,190),35,190,3.2,22);altitude.current=THREE.MathUtils.lerp(altitude.current,target,d*.85);pitch.current=THREE.MathUtils.lerp(pitch.current,-.045,d*2);if(dist<45)setPhase('landing')}
    else if(phase==='landing'){speed.current=THREE.MathUtils.lerp(speed.current,72,d*.8);z.current-=Math.max(7,speed.current/11)*d;altitude.current=Math.max(.72,altitude.current-1.05*d);pitch.current=THREE.MathUtils.lerp(pitch.current,.025,d*2);if(altitude.current<=.725){altitude.current=.72;z.current=ROUTE_END_Z+42;setPhase('landed')}}
    else if(phase==='landed'){
      // Automatic rollout braking: touchdown speed -> 0 km/h.
      // S / STOP can still end the rollout earlier, but it is never required.
      const AUTO_BRAKE_KMH_PER_SEC = 18;
      speed.current = Math.max(0, speed.current - AUTO_BRAKE_KMH_PER_SEC * d);
      z.current -= (speed.current / 13) * d;
      pitch.current = THREE.MathUtils.lerp(pitch.current, 0, d * 3);

      if (speed.current <= 0.5) {
        speed.current = 0;
        setPhase('stopped');
      }
    }
    else if(phase==='stopped'||phase==='exited'){
      speed.current=0;
    }
    if(aircraft.current){aircraft.current.position.set(0,altitude.current,z.current);aircraft.current.rotation.set(pitch.current,0,0)}
    const chase=new THREE.Vector3(7.4,3.8,z.current+11.5);if(!orbit.current?.__dragging)camera.position.lerp(chase,1-Math.pow(.003,d));if(orbit.current){orbit.current.target.lerp(new THREE.Vector3(0,altitude.current+.5,z.current-5),1-Math.pow(.002,d));orbit.current.update()}
    if(state.clock.elapsedTime-lastHud.current>.08){onTelemetry({speed:Math.round(speed.current),altitude:Math.max(0,Math.round((altitude.current-.72)*120)),distance:Math.round(Math.max(0,dist)),progress:THREE.MathUtils.clamp(1-dist/785,0,1)});lastHud.current=state.clock.elapsedTime}
  });
  return <><color attach="background" args={['#a9cede']}/><fog attach="fog" args={['#b8d5e2',55,330]}/><ambientLight intensity={.82}/><directionalLight position={[7,12,5]} intensity={1.8} castShadow/><WorldEnvironment/><HighClouds/><group ref={aircraft} position={[0,.72,65]}><Plane liveries={liveries}/>{phase==='outside'&&<StartCrew/>}{phase==='exited'&&<ExitHomie/>}</group>{!['outside','parked','takeoff'].includes(phase)&&<DestinationBeacon distance={Math.max(0,z.current-ROUTE_END_Z)}/>}<OrbitControls ref={orbit} enablePan={false} enableZoom minDistance={5} maxDistance={18} maxPolarAngle={Math.PI*.48} minPolarAngle={.35} onStart={()=>{if(orbit.current)orbit.current.__dragging=true}} onEnd={()=>{if(orbit.current)orbit.current.__dragging=false}}/></>;
}

function SoundButton({muted,onClick}:{muted:boolean;onClick:()=>void}){return <button className="fly-sound" onClick={onClick} aria-label={muted?'Unmute':'Mute'}>{muted?'🔇':'🔊'}</button>}

export default function FlyPage(){
  const go=useNavigate(); const {liveries}=usePlaneStore();
  const flagsReady=Boolean(liveries['flag-left']&&liveries['flag-right']);
  const [phase,setPhase]=useState<FlightPhase>('outside'); const [muted,setMuted]=useState(true); const [rideNotice,setRideNotice]=useState(true); const audioRef=useRef<HTMLAudioElement|null>(null);
  const [telemetry,setTelemetry]=useState<Telemetry>({speed:0,altitude:0,distance:785,progress:0});
  useEffect(()=>{const a=new Audio('/boot.mp3');a.loop=true;a.volume=.35;a.muted=true;audioRef.current=a;return()=>{a.pause();a.src=''}},[]);
  const toggleSound=()=>{const a=audioRef.current;if(!a)return;a.muted=!a.muted;setMuted(a.muted);if(!a.muted)a.play().catch(()=>{})};
  const getIn=()=>phase==='outside'&&setPhase('parked');
  const takeOff=()=>{if(!flagsReady)return;audioRef.current?.play().catch(()=>{});setPhase('takeoff')};
  const stop=()=>phase==='landed'&&setPhase('stopped');
  const exitPlane=()=>phase==='stopped'&&setPhase('exited');
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.repeat)return;const k=e.key.toLowerCase();if(k==='g'&&phase==='outside')getIn();if(k==='t'&&phase==='parked')takeOff();if(k==='s'&&phase==='landed')stop();if(k==='e'&&phase==='stopped')exitPlane();if(k==='m')toggleSound()};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[phase,flagsReady]);
  if(!flagsReady)return <main className="fly-gate"><style>{FLY_CSS}</style><div className="gate-card"><span>MARSHOUT FLIGHT</span><h1>Paint them flags, dawg, then we out.</h1><p>Your aircraft needs both flags painted before it can leave Vice City.</p><button onClick={()=>go('/hangar')}>GO TO HANGAR <b>→</b></button></div></main>;
  const current=phase==='landed'||phase==='stopped'||phase==='exited'?DESTINATION_NAME:START_NAME;
  const status:Record<FlightPhase,[string,string]>={outside:['CREW READY','Pilot and homie are waiting beside the aircraft. Get in when you are ready.'],parked:['READY AT VICE CITY','Autopilot is ready. Take off and enjoy the flight.'],takeoff:['TAKEOFF ROLL','Autopilot accelerating and rotating from the runway.'],climb:['CLIMBING','Clearing the skyline. Cloud layer ahead.'],cruise:['EN ROUTE','Autopilot locked for Los Santos.'],approach:['APPROACH','Descending automatically toward Los Santos.'],landing:['FINAL APPROACH','Runway captured. Landing automatically.'],landed:['TOUCHDOWN','Automatic braking engaged. The aircraft will stop on its own.'],stopped:['PARKED','Aircraft stopped completely. You can get out now.'],exited:['ARRIVED','Thank you, dawg']};
  const [title,desc]=status[phase];
  // On final approach the nav display snaps to the destination/runway, so the map agrees with the actual landing state.
  const mapProgress=['landing','landed','stopped','exited'].includes(phase)?1:telemetry.progress;
  const mapLeft=22 + mapProgress*67 + Math.sin(mapProgress*Math.PI)*15;
  const mapTop=12 + mapProgress*77;
  return <main className="fly-page"><style>{FLY_CSS}</style><Canvas shadows dpr={[1,1.3]} camera={{position:[7.4,4.5,76],fov:43,near:.1,far:1200}} gl={{antialias:true,powerPreference:'high-performance',stencil:false}}><FlightWorld phase={phase} setPhase={setPhase} onTelemetry={setTelemetry}/></Canvas><div className="fly-vignette"/>
    <header className="fly-hud"><div className="flight-brand"><i/>MARSHOUT <b>FLIGHT</b></div>{['landed','stopped','exited'].includes(phase)?<div className="route-card route-card-arrived"><span><small>CURRENT LOCATION</small><b>{DESTINATION_NAME}</b></span></div>:<div className="route-card"><span><small>CURRENT LOCATION</small><b>{current}</b></span><em>→</em><span><small>DESTINATION</small><b>{DESTINATION_NAME}</b></span></div>}<SoundButton muted={muted} onClick={toggleSound}/></header>
    <aside className="instruments"><div className="speed"><small>AIRSPEED</small><strong>{String(telemetry.speed).padStart(3,'0')}</strong><em> KM/H</em><i><b style={{width:`${Math.min(100,telemetry.speed/CRUISE_SPEED*100)}%`}}/></i></div><div className="stat"><small>ALTITUDE</small><b>{telemetry.altitude.toLocaleString()} FT</b></div><div className="stat"><small>AUTOPILOT</small><b>{phase==='outside'||phase==='parked'?'STANDBY':phase==='exited'?'COMPLETE':'ENGAGED'}</b></div></aside>
    <aside className={`nav-map ${mapProgress > .72 ? 'is-approach' : ''}`}>
      <div className="map-title"><span>NAV / AUTOPILOT</span><b>{telemetry.distance} KM</b></div>
      <div className="map-sub"><span>VCY 024°</span><i>LIVE</i><span>LSX 204°</span></div>
      <div className="map-grid">
        <svg className="map-land" viewBox="0 0 220 230" preserveAspectRatio="none" aria-hidden="true">
          <path className="coast coast-a" d="M-8 30 C28 17 39 41 62 48 C81 54 83 75 69 91 C52 110 30 108 8 125 L-8 130Z"/>
          <path className="coast coast-b" d="M228 104 C195 93 181 112 169 132 C157 151 174 166 157 184 C142 200 155 219 183 236 L228 236Z"/>
          <path className="district" d="M6 58 L54 71 L31 111 M177 135 L213 153 L171 177 L205 201"/>
          <path className="water-line" d="M82 0 C75 50 98 72 90 110 C81 151 102 179 96 230"/>
        </svg>
        <div className="map-route-curve"/>
        <i className="radar r1"/><i className="radar r2"/><i className="radar r3"/>
        <span className="waypoint wp1">VC-01</span><span className="waypoint wp2">MAR-7</span><span className="waypoint wp3">LS-APP</span>
        <span className="city vc"><i/>VICE CITY</span><span className="city ls"><i/>LOS SANTOS</span>
        <span className="approach-cone"/><span className="runway-map">RWY 24</span>
        <span className="plane-dot" style={{top:`${mapTop}%`,left:`${mapLeft}%`,transform:`translate(-50%,-50%) rotate(${18+mapProgress*18}deg)`}}>▲</span>
        <span className="map-track" style={{height:`${Math.max(3,mapProgress*76)}%`}}/>
      </div>
      <div className="map-data"><span><small>ALT</small><b>{telemetry.altitude.toLocaleString()} FT</b></span><span><small>SPD</small><b>{telemetry.speed} KM/H</b></span><span><small>ETA</small><b>{telemetry.distance===0?'ARRIVED':`${Math.max(1,Math.ceil(telemetry.distance/95))} MIN`}</b></span></div>
      <div className="map-progress"><i><b style={{width:`${Math.round(telemetry.progress*100)}%`}}/></i><span>{Math.round(telemetry.progress*100)}% ROUTE</span></div>
    </aside>
    <section className="control-card"><div className="phase">{title}</div><h1>{phase==='exited'?'THANK YOU, DAWG':'FLIGHT CONTROL'}</h1><p>{desc}</p>{phase==='outside'&&<button className="primary" onClick={getIn}><span><kbd>G</kbd> GET IN</span><b>→</b></button>}{phase==='parked'&&<button className="primary" onClick={takeOff}><span><kbd>T</kbd> TAKE OFF</span><b>→</b></button>}{phase==='landed'&&<button className="primary" onClick={stop}><span><kbd>S</kbd> STOP PLANE</span><b>→</b></button>}{phase==='stopped'&&<button className="primary" onClick={exitPlane}><span><kbd>E</kbd> GET OUT</span><b>→</b></button>}{phase==='exited'&&<button className="primary" onClick={()=>go('/')}><span>HOME</span><b>→</b></button>}<div className="controls-visible"><span><kbd>G</kbd><b>GET IN</b></span><span><kbd>T</kbd><b>TAKE OFF</b></span><span><kbd>S</kbd><b>STOP</b></span><span><kbd>E</kbd><b>GET OUT</b></span><span><kbd>M</kbd><b>SOUND</b></span><span className="mouse"><b>DRAG MOUSE</b><small>ROTATE CAMERA</small></span></div></section>
    {!['parked','landed','stopped','exited'].includes(phase)&&<div className="autopilot-pill"><i/> AUTOPILOT · {DESTINATION_NAME}</div>}
    {rideNotice&&<div className="ride-notice-backdrop"><div className="ride-notice"><div className="ride-notice-icon"><span>✦</span></div><div className="ride-notice-copy"><small>MARSHOUT AUTOPILOT</small><h2>Enjoy your ride.</h2><p>The plane is self-driving.</p></div><button type="button" onClick={()=>setRideNotice(false)}>OK <b>→</b></button></div></div>}
  </main>;
}

const FLY_CSS=`
*{box-sizing:border-box}.fly-page,.fly-gate{position:fixed;left:0;right:0;top:48px;bottom:0;overflow:hidden;font-family:Inter,ui-sans-serif,system-ui;color:#fff;background:#a9cede;z-index:1}.fly-page canvas{position:absolute!important;inset:0}.fly-vignette{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(180deg,rgba(1,10,22,.2),transparent 26%,transparent 60%,rgba(1,10,22,.58)),radial-gradient(circle at center,transparent 50%,rgba(1,10,22,.2))}.fly-hud{position:absolute;z-index:7;left:0;right:0;top:0;padding:18px 24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:start;pointer-events:none}.flight-brand{font-size:10px;font-weight:950;letter-spacing:.18em;padding-top:13px;text-shadow:0 2px 12px #0008}.flight-brand i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#d69b43;margin-right:9px;box-shadow:0 0 0 5px #d69b4322}.flight-brand b{color:#d69b43}.route-card{display:flex;align-items:center;gap:18px;background:#06182ee8;border:1px solid #ffffff2b;border-radius:9px;padding:11px 17px;backdrop-filter:blur(14px);box-shadow:0 14px 36px #00102038}.route-card span{min-width:130px;display:flex;flex-direction:column;gap:3px}.route-card span:last-child{text-align:right}.route-card small,.speed small,.stat small{font-size:7px;letter-spacing:.17em;color:#ffffff7b;font-weight:900}.route-card b{font-size:11px;letter-spacing:.1em}.route-card em{font-style:normal;color:#d69b43}.fly-sound{pointer-events:auto;justify-self:end;width:48px;height:48px;border:1px solid #ffffff35;border-radius:9px;background:#06182ee8;color:#fff;font-size:17px;cursor:pointer;box-shadow:0 12px 30px #00102038}.instruments{position:absolute;z-index:6;right:24px;top:91px;width:178px;display:grid;gap:8px}.speed,.stat{background:#06182ee8;border:1px solid #ffffff28;border-radius:9px;padding:14px 16px;backdrop-filter:blur(14px);box-shadow:0 15px 35px #00102035}.speed strong{font-size:39px;line-height:1;font-variant-numeric:tabular-nums}.speed>em{font-style:normal;font-size:8px;color:#d69b43;font-weight:900}.speed>i{display:block;height:4px;margin-top:10px;background:#ffffff18;overflow:hidden}.speed>i b{display:block;height:100%;background:#d69b43;transition:width .15s}.stat{display:flex;align-items:center;justify-content:space-between}.stat b{font-size:10px;letter-spacing:.07em}.nav-map{position:absolute;z-index:6;right:24px;bottom:24px;width:286px;padding:13px;background:linear-gradient(180deg,#031426f2,#061b31f2);border:1px solid #ffffff2b;border-radius:11px;backdrop-filter:blur(16px);box-shadow:0 22px 55px #00102066,inset 0 1px 0 #ffffff0d;overflow:hidden}.nav-map:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 49.7%,#ffffff08 50%,transparent 50.3%),linear-gradient(transparent 49.7%,#ffffff08 50%,transparent 50.3%)}.map-title,.map-bottom{position:relative;z-index:2;display:flex;justify-content:space-between;font-size:8px;font-weight:950;letter-spacing:.12em}.map-title span{color:#ffffff8c}.map-title b{color:#d69b43}.map-sub{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;margin-top:7px;color:#ffffff52;font-size:6px;font-weight:900;letter-spacing:.13em}.map-sub i{font-style:normal;color:#78e0aa}.map-sub i:before{content:"";display:inline-block;width:5px;height:5px;margin-right:5px;border-radius:50%;background:#78e0aa;box-shadow:0 0 8px #78e0aa}.map-grid{position:relative;height:230px;margin:9px 0 10px;border:1px solid #ffffff16;overflow:hidden;background-color:#061a2e;background-image:linear-gradient(#ffffff09 1px,transparent 1px),linear-gradient(90deg,#ffffff09 1px,transparent 1px),linear-gradient(#ffffff04 1px,transparent 1px),linear-gradient(90deg,#ffffff04 1px,transparent 1px);background-size:27px 27px,27px 27px,9px 9px,9px 9px}.map-grid:after{content:"N";position:absolute;right:8px;top:7px;color:#ffffff55;font-size:7px;font-weight:950;z-index:5}.map-land{position:absolute;inset:0;width:100%;height:100%;z-index:0}.coast{fill:#183b3d;stroke:#4d8d79;stroke-width:1.2;opacity:.7}.district{fill:none;stroke:#ffffff13;stroke-width:1}.water-line{fill:none;stroke:#54a8c055;stroke-width:1;stroke-dasharray:3 3}.map-route-curve{position:absolute;z-index:1;left:36%;top:13%;width:31%;height:72%;border-right:2px solid #d69b43;border-radius:0 75% 75% 0;transform:rotate(-5deg);filter:drop-shadow(0 0 5px #d69b4377)}.map-route-curve:after{content:"";position:absolute;inset:-1px;border-right:1px dashed #ffffff99;border-radius:inherit;transform:translateX(5px)}.radar{position:absolute;left:50%;top:50%;border:1px solid #ffffff0d;border-radius:50%;transform:translate(-50%,-50%);z-index:0}.r1{width:78px;height:78px}.r2{width:140px;height:140px}.r3{width:205px;height:205px}.city{position:absolute;z-index:4;display:flex;align-items:center;gap:5px;padding:4px 6px;background:#031426e8;border:1px solid #ffffff31;font-size:6px;font-weight:950;letter-spacing:.09em;box-shadow:0 5px 14px #0005}.city i{width:5px;height:5px;border-radius:50%;background:#fff}.city.vc{left:16%;top:8%;transform:none}.city.ls{right:7%;bottom:7%;left:auto;transform:none;color:#efb45d;border-color:#d69b4360}.city.ls i{background:#d69b43;box-shadow:0 0 8px #d69b43}.waypoint{position:absolute;z-index:3;color:#ffffff55;font-size:5px;font-weight:900;letter-spacing:.08em}.waypoint:before{content:"◇";color:#d69b43;margin-right:3px}.wp1{left:37%;top:30%}.wp2{left:58%;top:49%}.wp3{right:19%;bottom:24%}.approach-cone{position:absolute;z-index:1;right:9%;bottom:9%;width:50px;height:78px;background:linear-gradient(to top,#d69b4325,transparent);clip-path:polygon(43% 100%,57% 100%,100% 0,0 0);transform:rotate(-18deg);transform-origin:bottom}.runway-map{position:absolute;z-index:4;right:5%;bottom:2%;padding:2px 4px;color:#d69b43;border-left:2px solid #d69b43;font-size:5px;font-weight:950;letter-spacing:.08em}.plane-dot{position:absolute;z-index:7;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#f4f7f9;color:#071a38;font-size:11px;box-shadow:0 0 0 4px #ffffff16,0 0 18px #d69b43;transition:top .18s linear,left .18s linear,transform .18s linear}.map-track{position:absolute;z-index:2;left:35%;top:13%;width:1px;background:linear-gradient(#ffffff00,#ffffff8c);transform:rotate(-8deg);transform-origin:top}.map-data{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.map-data span{min-width:0;padding:7px 6px;background:#ffffff08;border:1px solid #ffffff0d;border-radius:5px}.map-data small{display:block;color:#ffffff4e;font-size:5px;font-weight:950;letter-spacing:.13em}.map-data b{display:block;margin-top:2px;color:#fff;font-size:7px;white-space:nowrap}.map-progress{position:relative;z-index:2;display:flex;align-items:center;gap:8px;margin-top:8px}.map-progress>i{display:block;flex:1;height:3px;background:#ffffff12;overflow:hidden}.map-progress>i b{display:block;height:100%;background:linear-gradient(90deg,#d69b43,#f4d39b);box-shadow:0 0 7px #d69b43}.map-progress>span{color:#ffffff58;font-size:5px;font-weight:950;letter-spacing:.1em;white-space:nowrap}.nav-map.is-approach{border-color:#d69b4355}.nav-map.is-approach .approach-cone{animation:approachPulse 1.3s ease-in-out infinite}.nav-map.is-approach .city.ls{box-shadow:0 0 18px #d69b4333}@keyframes approachPulse{50%{opacity:.35}}.control-card{position:absolute;z-index:6;left:24px;bottom:24px;width:min(510px,calc(100vw - 302px));padding:22px;background:#041529ed;border:1px solid #ffffff2a;border-radius:11px;backdrop-filter:blur(15px);box-shadow:0 22px 55px #00102055}.phase{font-size:8px;font-weight:950;letter-spacing:.2em;color:#d69b43}.control-card h1{margin:7px 0 5px;font-size:25px;letter-spacing:-.035em}.control-card p{margin:0 0 15px;color:#ffffffb0;font-size:12px;line-height:1.5}.primary{width:100%;height:50px;border:0;border-radius:7px;background:#f5f6f7;color:#071a38;padding:0 16px;display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:950;letter-spacing:.13em;cursor:pointer;box-shadow:0 12px 26px #0004}.primary:hover{transform:translateY(-1px)}.primary>b{font-size:20px;color:#c58b3c}.primary kbd{background:#071a38;color:#fff;border:0}.controls-visible{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.controls-visible>span{min-width:76px;height:42px;padding:6px 8px;border:1px solid #ffffff20;border-radius:6px;background:#ffffff0b;display:flex;align-items:center;gap:7px}.controls-visible kbd{width:27px;height:27px;display:grid;place-items:center;background:#ffffff15;border:1px solid #ffffff35;border-radius:4px;color:#fff;font:950 10px Inter;box-shadow:inset 0 -2px 0 #0004}.controls-visible b{font-size:7px;letter-spacing:.09em}.controls-visible .mouse{margin-left:auto;flex-direction:column;align-items:flex-start;justify-content:center}.controls-visible small{font-size:6px;color:#ffffff70;letter-spacing:.08em}.autopilot-pill{position:absolute;z-index:5;left:50%;top:104px;transform:translateX(-50%);padding:9px 13px;border:1px solid #ffffff2c;border-radius:999px;background:#06182ec9;backdrop-filter:blur(10px);font-size:8px;font-weight:950;letter-spacing:.14em}.autopilot-pill i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#7dd8a4;margin-right:7px;box-shadow:0 0 0 4px #7dd8a422}.destination-beacon{display:flex;flex-direction:column;align-items:center;min-width:120px;padding:8px 12px;background:#071a38dd;border:1px solid #ffffff35;border-radius:5px;color:#fff;font-family:Inter;box-shadow:0 8px 24px #00102044}.destination-beacon>span{width:8px;height:8px;border-radius:50%;background:#d69b43;box-shadow:0 0 0 6px #d69b4328;margin-bottom:6px}.destination-beacon b{font-size:9px;letter-spacing:.15em}.destination-beacon small{font-size:7px;color:#d69b43;margin-top:2px}.fly-gate{display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#17385d,#06182e 62%)}.gate-card{width:min(560px,calc(100vw - 40px));padding:36px;border:1px solid #ffffff22;border-radius:12px;background:#071a38e8;box-shadow:0 30px 80px #0007}.gate-card>span{font-size:8px;font-weight:950;letter-spacing:.2em;color:#d69b43}.gate-card h1{font-size:30px;line-height:1.08;margin:10px 0}.gate-card p{font-size:12px;color:#ffffff9b;margin:0 0 22px}.gate-card button{width:100%;height:50px;border:0;border-radius:7px;background:#fff;color:#071a38;padding:0 17px;display:flex;align-items:center;justify-content:space-between;font-weight:950;letter-spacing:.12em;cursor:pointer}.gate-card button b{color:#c58b3c;font-size:20px}.route-card-arrived{justify-content:center;min-width:260px}.route-card-arrived span{min-width:0;text-align:center!important}.ride-notice-backdrop{position:absolute;inset:0;z-index:20;display:grid;place-items:center;padding:24px;background:rgba(2,12,25,.34);backdrop-filter:blur(5px)}.ride-notice{width:min(440px,calc(100vw - 40px));display:grid;grid-template-columns:auto 1fr;gap:18px;padding:24px;border:1px solid rgba(255,255,255,.24);border-radius:12px;background:linear-gradient(145deg,rgba(5,25,48,.98),rgba(8,38,70,.96));box-shadow:0 30px 90px rgba(0,10,24,.58),inset 0 1px 0 rgba(255,255,255,.08)}.ride-notice-icon{width:48px;height:48px;display:grid;place-items:center;border:1px solid rgba(214,155,67,.4);border-radius:10px;background:rgba(214,155,67,.1);color:#d69b43;font-size:20px;box-shadow:0 0 0 6px rgba(214,155,67,.04)}.ride-notice-copy small{display:block;margin:2px 0 7px;color:#d69b43;font-size:7px;font-weight:950;letter-spacing:.2em}.ride-notice-copy h2{margin:0;color:#fff;font-size:25px;line-height:1.05;letter-spacing:-.035em}.ride-notice-copy p{margin:7px 0 0;color:rgba(255,255,255,.65);font-size:12px}.ride-notice button{grid-column:1/-1;height:48px;border:0;border-radius:7px;background:#f5f6f7;color:#071a38;padding:0 16px;display:flex;align-items:center;justify-content:space-between;font:950 10px Inter;letter-spacing:.14em;cursor:pointer}.ride-notice button b{color:#c58b3c;font-size:19px}.ride-notice button:hover{transform:translateY(-1px)}@media(max-width:850px){.fly-page,.fly-gate{top:48px}.fly-hud{padding:12px}.flight-brand{display:none}.route-card{grid-column:1/3;justify-self:start}.route-card span{min-width:95px}.instruments{right:12px;top:78px;transform:scale(.88);transform-origin:top right}.nav-map{right:12px;bottom:12px;width:230px;transform:scale(.88);transform-origin:bottom right}.map-grid{height:190px}.control-card{left:12px;bottom:12px;width:calc(100vw - 226px);padding:17px}.controls-visible .mouse{display:none}}@media(max-width:620px){.route-card{transform:scale(.86);transform-origin:top left}.instruments{transform:scale(.72)}.nav-map{display:none}.control-card{width:calc(100vw - 24px)}.controls-visible>span{min-width:68px}.autopilot-pill{top:90px}}
`;
