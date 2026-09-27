import { Suspense, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { usePlaneStore } from '../store';

type Destination = { title: string; short: string; path: string; x: number; color: string };
const DESTINATIONS: Destination[] = [
  { title: 'Get a travel flyer', short: 'THE FLYER STUDIO', path: '/homie', x: 0, color: '#f8ae75' },
  { title: 'Take a trip to Port Gellhorn', short: 'PORT GELLHORN', path: '/hangar', x: 18, color: '#63e4e2' },
  { title: 'Attend a Party on Mars', short: 'MARS AFTER DARK', path: '/rock-hangar', x: 36, color: '#ff779d' },
];
const START = new THREE.Vector3(-4, 0, 0);

function Building({ destination, index, near }: { destination: Destination; index: number; near: boolean }) {
  const { x, color } = destination;
  const height = [8, 11, 10][index];
  return (
    <group position={[x, 0, -7]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, height, 5.8]} />
        <meshStandardMaterial color={['#29334f', '#284352', '#433046'][index]} roughness={0.72} />
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
              <meshStandardMaterial color="#f9cda7" emissive="#e88f7f" emissiveIntensity={0.58} />
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
          {near && <span>PRESS ENTER TO GO INSIDE</span>}
        </div>
      </Html>
      <pointLight position={[0, 3, 3.8]} intensity={near ? 12 : 6} distance={8} color={color} />
      {index === 2 && <mesh position={[0, height + 0.75, 0]}><sphereGeometry args={[0.55, 20, 12]} /><meshStandardMaterial color="#ff8b9d" emissive="#f34977" emissiveIntensity={1.2} /></mesh>}
    </group>
  );
}

function Palm({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, 2.1, 0]} rotation={[0, 0, -0.09]} castShadow><cylinderGeometry args={[0.13, 0.22, 4.2, 8]} /><meshStandardMaterial color="#5f3e47" /></mesh>
    {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[0, 4.2, 0]} rotation={[0.15, (i * Math.PI * 2) / 7, 0.64]}><coneGeometry args={[0.38, 3.5, 5]} /><meshStandardMaterial color="#23605c" side={THREE.DoubleSide} /></mesh>)}
  </group>;
}

function City({ position, near }: { position: MutableRefObject<THREE.Vector3>; near: number | null }) {
  return <>
    <color attach="background" args={['#231c3b']} />
    <fog attach="fog" args={['#49304d', 28, 88]} />
    <ambientLight intensity={1.25} color="#b9b1d9" />
    <hemisphereLight intensity={1.1} color="#ffa17d" groundColor="#182439" />
    <directionalLight position={[-12, 18, 10]} intensity={2.2} color="#ffbf97" castShadow shadow-mapSize={[1024, 1024]} />
    <Stars radius={90} depth={30} count={450} factor={2} fade />
    <mesh position={[18, -0.19, 0]} receiveShadow><boxGeometry args={[110, 0.3, 50]} /><meshStandardMaterial color="#192039" /></mesh>
    <mesh position={[18, 0, 0]} receiveShadow><boxGeometry args={[110, 0.1, 6.8]} /><meshStandardMaterial color="#22283d" roughness={0.94} /></mesh>
    <mesh position={[18, 0.12, -4.05]} receiveShadow><boxGeometry args={[110, 0.28, 2.35]} /><meshStandardMaterial color="#8a7889" /></mesh>
    <mesh position={[18, 0.13, 4.05]} receiveShadow><boxGeometry args={[110, 0.28, 2.35]} /><meshStandardMaterial color="#817083" /></mesh>
    {Array.from({ length: 18 }, (_, i) => <mesh key={i} position={[-7 + i * 3.2, 0.07, 0]}><boxGeometry args={[1.3, 0.015, 0.08]} /><meshBasicMaterial color="#dec4a7" /></mesh>)}
    {DESTINATIONS.map((destination, index) => <Building key={destination.path} destination={destination} index={index} near={near === index} />)}
    {[-8, 9, 27, 46].map((x) => <Palm key={x} x={x} z={-4.6} />)}
    {[9, 27].map((x) => <group key={x} position={[x, 0, 4.2]}><mesh position={[0, 2.8, 0]}><cylinderGeometry args={[0.07, 0.1, 5.6]} /><meshStandardMaterial color="#17202d" /></mesh><mesh position={[0.5, 5.5, 0]}><boxGeometry args={[1.1, 0.14, 0.18]} /><meshStandardMaterial color="#17202d" /></mesh><pointLight position={[1, 5.2, 0]} intensity={5} distance={9} color="#ffbb88" /></group>)}
    <Player position={position} />
  </>;
}

function Player({ position }: { position: MutableRefObject<THREE.Vector3> }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.copy(position.current);
    group.current.children[0].rotation.z = Math.sin(clock.elapsedTime * 8) * 0.035;
  });
  return <group ref={group} position={START.toArray()}>
    <group>
      <mesh position={[0, 1.12, 0]} castShadow><capsuleGeometry args={[0.34, 0.73, 5, 10]} /><meshStandardMaterial color="#eac4a8" /></mesh>
      <mesh position={[0, 1.34, 0.03]} castShadow><boxGeometry args={[0.83, 0.95, 0.4]} /><meshStandardMaterial color="#111c34" /></mesh>
      <mesh position={[0, 1.98, 0]} castShadow><sphereGeometry args={[0.28, 12, 12]} /><meshStandardMaterial color="#9b685a" /></mesh>
      <mesh position={[0, 2.17, -0.04]} castShadow><sphereGeometry args={[0.29, 12, 12]} /><meshStandardMaterial color="#181c2b" /></mesh>
      {[-0.25, 0.25].map((x) => <mesh key={x} position={[x, 0.4, 0]} castShadow><capsuleGeometry args={[0.12, 0.5, 4, 8]} /><meshStandardMaterial color="#202841" /></mesh>)}
    </group>
  </group>;
}

function Movement({ position, keys, onMove }: { position: MutableRefObject<THREE.Vector3>; keys: MutableRefObject<Set<string>>; onMove: (x: number, z: number) => void }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const held = keys.current;
    const dx = Number(held.has('d') || held.has('arrowright')) - Number(held.has('a') || held.has('arrowleft'));
    const dz = Number(held.has('s') || held.has('arrowdown')) - Number(held.has('w') || held.has('arrowup'));
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
      if (key === 'enter' || key === 'e') {
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
    {phase === 'intro' && <main className="tour-intro"><div className="tour-intro-copy"><div className="tour-eyebrow">THE CITY IS YOUR DEPARTURE GATE <span>✦</span></div><h1>Take a <em>tour.</em></h1><p className="tour-lead">See which door gets you a travel flyer and which one gets you to a new destination.</p><div className="tour-rule" /><p className="tour-options">GET A FLYER <b>·</b> LEAVE EARTH <b>·</b> TRAVEL TO PORT GELLHORN</p><button className="tour-start" onClick={() => { setCount(3); setPhase('countdown'); }}>TAKE A TOUR <span>↗</span></button><p className="tour-hint">Three doors. Your next story starts with one.</p></div><div className="tour-hero" aria-hidden="true"><div className="tour-sun" /><div className="tour-skyline"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="tour-palm">✳</div><div className="tour-hero-caption">MARSHOUT <span>AFTER DARK</span></div></div></main>}
    {phase !== 'intro' && <><div className="tour-topline"><span>VICE CITY <b>/</b> THE THREE DOORS</span><span>WALK THE STRIP · PICK YOUR DESTINATION</span></div>{phase === 'tour' && <><div className="tour-mission"><small>YOUR TOUR STARTS HERE</small><strong>Find your next door.</strong><p>Get a flyer, leave Earth, or travel to Port Gellhorn.</p></div><div className="tour-controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> MOVE</span><span><kbd>SHIFT</kbd> RUN</span><span><kbd>ENTER</kbd> OPEN DOOR</span></div>{active !== null && <button className="tour-enter" onClick={enter}>ENTER <strong>{DESTINATIONS[active].title}</strong><span>↗</span></button>}<div className="tour-touch" aria-label="Movement controls"><button aria-label="Move left" onPointerDown={() => move('a', true)} onPointerUp={() => move('a', false)} onPointerCancel={() => move('a', false)}>←</button><button aria-label="Move forward" onPointerDown={() => move('w', true)} onPointerUp={() => move('w', false)} onPointerCancel={() => move('w', false)}>↑</button><button aria-label="Move backward" onPointerDown={() => move('s', true)} onPointerUp={() => move('s', false)} onPointerCancel={() => move('s', false)}>↓</button><button aria-label="Move right" onPointerDown={() => move('d', true)} onPointerUp={() => move('d', false)} onPointerCancel={() => move('d', false)}>→</button></div></>}{phase === 'countdown' && <div className="tour-countdown"><p>THE CITY IS WAKING UP</p><strong key={count}>{count}</strong><span>YOUR TOUR BEGINS IN</span></div>}</>}
    <footer className="tour-footer"><span>✦ &nbsp; A TRIP WORTH TAKING</span><span>MARSHOUT © 2026</span></footer>
  </div>;
}

const CSS = `
*{box-sizing:border-box}html,body,#root{margin:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,sans-serif}button{font:inherit}.tour-page{position:relative;min-height:100svh;overflow:hidden;background:#101b31;color:#fff}.tour-page:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:2;background:linear-gradient(90deg,rgba(10,18,37,.4),transparent 38%),linear-gradient(0deg,rgba(7,15,31,.5),transparent 30%)}.tour-header,.tour-footer{position:absolute;left:0;right:0;z-index:8;display:flex;justify-content:space-between;align-items:center;padding:0 clamp(22px,5vw,78px)}.tour-header{top:0;height:76px;border-bottom:1px solid rgba(255,255,255,.15)}.tour-footer{bottom:0;height:48px;font-size:10px;letter-spacing:.18em;color:#e6c7b4}.tour-brand{font-weight:950;letter-spacing:.2em;font-size:15px;display:flex;align-items:center;gap:10px}.tour-brand i{width:9px;height:9px;border-radius:50%;background:#dba664;box-shadow:0 0 18px #e9a871}.tour-brand span{font-size:9px;color:#d6abc1;font-weight:650;border-left:1px solid #986879;padding-left:17px;margin-left:8px}.tour-live{font-size:10px;letter-spacing:.2em;color:#f1cb9f}.tour-intro{min-height:100svh;display:grid;grid-template-columns:1fr 1fr;background:radial-gradient(circle at 75% 50%,#794b76 0%,#342747 40%,#101b31 82%)}.tour-intro-copy{position:relative;z-index:4;align-self:center;padding:100px 0 80px clamp(28px,8vw,130px);max-width:720px}.tour-eyebrow{font-size:11px;font-weight:850;letter-spacing:.25em;color:#ffbe9b;display:flex;gap:18px}.tour-eyebrow span{color:#e9a5bd}.tour-intro h1{font-size:clamp(76px,10.5vw,172px);letter-spacing:-.085em;line-height:.88;margin:30px 0;color:#fff;text-shadow:0 12px 40px #1c1525}.tour-intro h1 em{display:block;font-style:italic;font-family:Georgia,serif;font-weight:400;color:#f4ae9e;letter-spacing:-.07em}.tour-lead{font-size:clamp(19px,2vw,29px);font-weight:650;line-height:1.35;max-width:600px;color:#fff;margin:30px 0;text-wrap:balance}.tour-rule{height:1px;width:min(100%,550px);background:linear-gradient(90deg,#e5b692,transparent);margin:26px 0 19px}.tour-options{font-size:10px;letter-spacing:.18em;font-weight:850;color:#f3cbb1;line-height:2}.tour-options b{padding:0 10px;color:#e795ac}.tour-start{margin-top:32px;border:0;background:#e9aa78;color:#17213b;padding:20px 24px 20px 28px;min-width:260px;display:flex;justify-content:space-between;font-weight:950;font-size:12px;letter-spacing:.18em;cursor:pointer;box-shadow:9px 9px 0 #4e3457;transition:transform .2s}.tour-start:hover{transform:translate(4px,-4px)}.tour-start span{font-size:23px;line-height:10px}.tour-hint{font-size:11px;letter-spacing:.1em;color:#caa6b6;margin-top:25px}.tour-hero{position:relative;overflow:hidden;min-height:100svh;background:linear-gradient(#433461 4%,#af6483 50%,#e8a081 71%,#252743 72%)}.tour-sun{position:absolute;width:30vw;height:30vw;min-width:280px;min-height:280px;border-radius:50%;left:16%;top:21%;background:linear-gradient(#ffd5ab,#fd8b8c);box-shadow:0 0 100px #ffb49399}.tour-skyline{position:absolute;bottom:13%;left:-4%;width:110%;height:49%;display:flex;align-items:end;gap:1.5%;filter:drop-shadow(0 0 18px #dc669677)}.tour-skyline i{display:block;background:repeating-linear-gradient(0deg,transparent 0 16px,#ed9b9b55 17px 21px,transparent 22px 29px),#24243e;width:14%;height:65%;box-shadow:inset 5px 0 #764d75}.tour-skyline i:nth-child(2){height:90%}.tour-skyline i:nth-child(3){height:50%}.tour-skyline i:nth-child(4){height:100%}.tour-skyline i:nth-child(5){height:75%}.tour-skyline i:nth-child(6){height:95%}.tour-skyline i:nth-child(7){height:58%}.tour-skyline i:nth-child(8){height:77%}.tour-palm{position:absolute;right:8%;top:8%;font-size:clamp(180px,29vw,420px);color:#172940;transform:rotate(-15deg);text-shadow:12px 16px #1b3044}.tour-hero-caption{position:absolute;bottom:17%;right:10%;font-size:clamp(35px,5vw,80px);font-weight:950;line-height:.86;letter-spacing:-.08em;text-align:right;text-shadow:0 7px 22px #1d1e34}.tour-hero-caption span{display:block;color:#ffc1aa}.tour-canvas{position:absolute;inset:0}.tour-topline{position:absolute;z-index:5;top:94px;left:clamp(22px,5vw,78px);right:clamp(22px,5vw,78px);display:flex;justify-content:space-between;font-size:10px;font-weight:850;letter-spacing:.19em;color:#ffdfc3}.tour-topline b{color:#fa8fa8;padding:0 8px}.tour-mission{position:absolute;z-index:5;top:135px;left:clamp(22px,5vw,78px);padding:20px 24px;background:#101a32df;border-left:3px solid #f5ac8e;box-shadow:0 10px 40px #0a0c1c66;max-width:350px}.tour-mission small{font-size:9px;color:#faad96;font-weight:900;letter-spacing:.21em}.tour-mission strong{display:block;font-size:26px;margin:8px 0 2px;letter-spacing:-.04em}.tour-mission p{color:#f4d4cd;font-size:12px;line-height:1.5;margin:0}.tour-controls{position:absolute;z-index:5;right:clamp(22px,5vw,78px);bottom:68px;display:flex;gap:16px;color:#fff;font-size:10px;font-weight:750;letter-spacing:.1em;background:#111a2dca;padding:15px}.tour-controls span{white-space:nowrap}kbd{font:inherit;border:1px solid #ffffff70;border-radius:3px;padding:4px 6px;margin-right:3px;color:#ffd8b2}.tour-enter{position:absolute;z-index:6;left:50%;transform:translateX(-50%);bottom:100px;padding:13px 18px;background:#f0af80;border:0;color:#101a32;cursor:pointer;font-size:11px;font-weight:950;letter-spacing:.15em;box-shadow:0 0 30px #f3a475aa;white-space:nowrap}.tour-enter strong{margin:0 18px;font-size:13px;letter-spacing:0}.tour-enter span{font-size:20px}.city-sign{font-family:Inter,system-ui,sans-serif;font-size:23px;font-weight:1000;letter-spacing:.12em;text-align:center;white-space:nowrap;text-shadow:0 0 15px currentColor,2px 3px #111}.city-door-label{font-family:Inter,system-ui,sans-serif;min-width:250px;max-width:350px;padding:14px 17px;color:#fff;text-align:center;background:#141c35e8;border:1px solid #f9cfb977;box-shadow:0 8px 30px #1118;transition:transform .2s}.city-door-label.is-near{transform:scale(1.15);border-color:#ffcf9b}.city-door-label small,.city-door-label span{display:block;font-size:9px;color:#ffbe9e;font-weight:900;letter-spacing:.16em}.city-door-label strong{display:block;font-size:17px;line-height:1.25;margin:6px 0}.tour-countdown{position:absolute;z-index:10;inset:0;background:#10182de6;display:flex;align-items:center;justify-content:center;flex-direction:column}.tour-countdown p,.tour-countdown span{font-size:11px;font-weight:900;letter-spacing:.28em;color:#eeb598}.tour-countdown strong{font-size:clamp(150px,28vw,330px);line-height:1;color:#ffd0ad;font-weight:950;text-shadow:0 0 70px #fa799e;animation:count .8s ease-out}.tour-countdown span{color:white}@keyframes count{from{transform:scale(1.6);opacity:0}to{transform:scale(1);opacity:1}}.tour-touch{display:none}@media(max-width:900px){.tour-intro{grid-template-columns:1fr}.tour-intro-copy{padding:130px 28px 70px}.tour-hero{position:absolute;inset:0;opacity:.3}.tour-intro h1{font-size:clamp(74px,17vw,130px)}.tour-controls{display:none}.tour-touch{position:absolute;z-index:8;bottom:85px;right:20px;display:grid;grid-template-columns:repeat(2,55px);gap:6px;touch-action:none}.tour-touch button{height:52px;border:1px solid #ffffff80;background:#14203fce;color:#fff;font-size:24px}.tour-topline span:last-child{display:none}.tour-brand span{display:none}.tour-mission{top:125px;max-width:260px}.tour-enter{bottom:160px;max-width:90vw;white-space:normal}.tour-footer{font-size:8px}}
`;
