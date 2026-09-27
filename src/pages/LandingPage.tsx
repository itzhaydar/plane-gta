import { Suspense, useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, RoundedBox, Sky } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { usePlaneStore } from '../store';

type Stop = { title: string; subtitle: string; route: string; z: number; accent: string; facade: string };
const STOPS: Stop[] = [
  { title: 'Get a travel flyer', subtitle: 'Make your invitation', route: '/homie', z: 0, accent: '#ffc665', facade: '#e7a38c' },
  { title: 'Take a trip to Port Gellhorn', subtitle: 'Leave Vice City', route: '/hangar', z: -15, accent: '#74ecdf', facade: '#a6c8c6' },
  { title: 'Attend a Party on Mars', subtitle: 'Leave Earth', route: '/rock-hangar', z: -30, accent: '#f494c4', facade: '#a693bd' },
];
const DOOR_X = -4.55;
const clamp = THREE.MathUtils.clamp;

function Window({ x, y, z, lit = true }: { x: number; y: number; z: number; lit?: boolean }) {
  return <group position={[x, y, z]}>
    <mesh><boxGeometry args={[1.05, 1.35, .08]} /><meshStandardMaterial color="#192341" metalness={.45} roughness={.25} /></mesh>
    <mesh position={[0, 0, .052]}><planeGeometry args={[.87, 1.17]} /><meshStandardMaterial color={lit ? '#ffe0ab' : '#44708b'} emissive={lit ? '#ef9d65' : '#183556'} emissiveIntensity={lit ? .47 : .15} /></mesh>
    <mesh position={[0, 0, .1]}><boxGeometry args={[.055, 1.3, .055]} /><meshStandardMaterial color="#ffe1c0" /></mesh>
    <mesh position={[0, -.69, .12]}><boxGeometry args={[1.13, .1, .18]} /><meshStandardMaterial color="#f7dfc4" /></mesh>
  </group>;
}

function Building({ stop, index, nearby }: { stop: Stop; index: number; nearby: boolean }) {
  const height = [7.5, 9.6, 8.3][index];
  return <group position={[DOOR_X, 0, stop.z]}>
    <RoundedBox args={[6.6, height, 7.8]} radius={.16} smoothness={3} position={[-2.1, height / 2, 0]} castShadow receiveShadow><meshStandardMaterial color={stop.facade} roughness={.88} /></RoundedBox>
    <mesh position={[1.2, 3.5, 0]}><boxGeometry args={[.13, 7, 8.05]} /><meshStandardMaterial color="#fff1d6" /></mesh>
    <mesh position={[-5.43, 3.5, 0]}><boxGeometry args={[.14, 7, 8.05]} /><meshStandardMaterial color="#fff1d6" /></mesh>
    {[1.4, 2.55, 5.8, height - .38].map((y) => <mesh key={y} position={[-2.1, y, 0]}><boxGeometry args={[6.9, .14, 8.12]} /><meshStandardMaterial color="#f5d6b8" /></mesh>)}
    {[2.4, 4.65, 6.7].filter(y => y < height - .6).flatMap((y, row) => [-2.6, 0, 2.6].map((z, col) => <Window key={`${row}-${col}`} x={1.28} y={y} z={z} lit={(row + col + index) % 3 !== 0} />))}
    <mesh position={[1.25, 1.21, 0]}><boxGeometry args={[.18, 2.42, 1.7]} /><meshStandardMaterial color="#17213b" metalness={.5} /></mesh>
    <mesh position={[1.36, 1.25, 0]}><boxGeometry args={[.04, 1.96, 1.36]} /><meshStandardMaterial color="#152d46" metalness={.6} roughness={.15} /></mesh>
    <mesh position={[1.4, 1.25, -.46]}><sphereGeometry args={[.055, 10, 10]} /><meshStandardMaterial color="#ffd58b" metalness={.8} /></mesh>
    <mesh position={[1.46, 2.63, 0]}><boxGeometry args={[.85, .13, 2.5]} /><meshStandardMaterial color={stop.accent} emissive={stop.accent} emissiveIntensity={.65} /></mesh>
    <mesh position={[1.22, 3.5, 0]}><boxGeometry args={[1.1, .15, 3.2]} /><meshStandardMaterial color="#13213c" /></mesh>
    <mesh position={[1.25, 3.38, 0]}><boxGeometry args={[1.2, .08, 3.2]} /><meshStandardMaterial color={stop.accent} emissive={stop.accent} emissiveIntensity={.8} /></mesh>
    {index === 1 && <mesh position={[-2, height + .85, 0]}><cylinderGeometry args={[.78, .78, 1.7, 8]} /><meshStandardMaterial color="#d9c2a4" /></mesh>}
    {index === 2 && <mesh position={[-2, height + .8, 0]}><sphereGeometry args={[1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#eacac9" metalness={.2} /></mesh>}
    <Html position={[1.42, 4.15, 0]} center distanceFactor={10} occlude={false} style={{ pointerEvents: 'none' }}>
      <div className={`tour-sign ${nearby ? 'is-near' : ''}`} style={{ '--sign': stop.accent } as CSSProperties}>
        <small>0{index + 1} / MARSHOUT</small><strong>{stop.title}</strong><span>{stop.subtitle} ↗</span>
      </div>
    </Html>
    <pointLight position={[2, 2.5, 0]} color={stop.accent} intensity={nearby ? 5 : 2} distance={7} />
  </group>;
}

function Palm({ z, x }: { z: number; x: number }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, 2.2, 0]} rotation={[0, 0, -.07]} castShadow><cylinderGeometry args={[.11, .21, 4.4, 7]} /><meshStandardMaterial color="#82634f" /></mesh>
    {Array.from({ length: 7 }, (_, i) => { const a = i * Math.PI * 2 / 7; return <mesh key={i} position={[Math.cos(a) * 1.05, 4.3, Math.sin(a) * 1.05]} rotation={[0, -a, -.38]} castShadow><boxGeometry args={[2.2, .075, .48]} /><meshStandardMaterial color="#224a43" side={THREE.DoubleSide} /></mesh>; })}
  </group>;
}

function Avatar({ running }: { running: boolean }) {
  const legs = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (legs.current) legs.current.rotation.x = running ? Math.sin(clock.elapsedTime * 10) * .32 : 0; });
  return <group position={[0, .03, 0]}>
    <mesh position={[0, 1.63, 0]} castShadow><sphereGeometry args={[.19, 16, 12]} /><meshStandardMaterial color="#6a3d2f" /></mesh>
    <mesh position={[0, 1.78, -.035]}><sphereGeometry args={[.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#172038" /></mesh>
    <mesh position={[0, 1.12, 0]} castShadow><capsuleGeometry args={[.27, .62, 4, 8]} /><meshStandardMaterial color="#f1d9c7" /></mesh>
    <mesh position={[0, .98, -.19]} castShadow><boxGeometry args={[.5, .48, .12]} /><meshStandardMaterial color="#152642" /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * .37, 1.11, 0]} rotation={[0, 0, side * .18]} castShadow><capsuleGeometry args={[.085, .57, 4, 8]} /><meshStandardMaterial color="#6a3d2f" /></mesh>)}
    <group ref={legs} position={[0, .62, 0]}>{[-1, 1].map(side => <group key={side} position={[side * .13, 0, 0]}><mesh position={[0, -.25, 0]} castShadow><capsuleGeometry args={[.12, .4, 4, 8]} /><meshStandardMaterial color="#1c2645" /></mesh><mesh position={[0, -.52, .08]}><boxGeometry args={[.23, .11, .38]} /><meshStandardMaterial color="#15131e" /></mesh></group>)}</group>
  </group>;
}

function TourWorld({ onNearby, onEnter, keys }: { onNearby: (index: number | null) => void; onEnter: (index: number) => void; keys: MutableRefObject<Set<string>> }) {
  const player = useRef<THREE.Group>(null);
  const location = useRef(new THREE.Vector3(-1.6, 0, 5));
  const near = useRef<number | null>(null);
  const enter = useRef(onEnter);
  enter.current = onEnter;
  const [active, setActive] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  useEffect(() => { const handle = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 'e' || e.key === 'Enter') { if (near.current !== null) enter.current(near.current); } }; window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle); }, []);
  useFrame(({ camera }, delta) => {
    const d = Math.min(delta, .05), k = keys.current;
    const dx = Number(k.has('d') || k.has('arrowright')) - Number(k.has('a') || k.has('arrowleft'));
    const dz = Number(k.has('s') || k.has('arrowdown')) - Number(k.has('w') || k.has('arrowup'));
    const moving = !!(dx || dz); setRunning(prev => prev === moving ? prev : moving);
    if (moving) {
      const speed = (k.has('shift') ? 5.4 : 3.1) * d / Math.hypot(dx, dz);
      location.current.x = clamp(location.current.x + dx * speed, -1.85, 3.65);
      location.current.z = clamp(location.current.z + dz * speed, -38, 7);
      if (player.current) player.current.rotation.y = THREE.MathUtils.damp(player.current.rotation.y, Math.atan2(-dx, -dz), 9, d);
    }
    if (player.current) player.current.position.copy(location.current);
    const closest = STOPS.findIndex(s => Math.abs(location.current.z - s.z) < 2.45 && location.current.x < -.7);
    const next = closest < 0 ? null : closest;
    if (next !== near.current) { near.current = next; setActive(next); onNearby(next); }
    const target = new THREE.Vector3(location.current.x + 5.3, 3.75, location.current.z + 7.8);
    camera.position.lerp(target, 1 - Math.exp(-3.8 * d));
    camera.lookAt(location.current.x - .8, 1.65, location.current.z - 3);
  });
  return <>
    <color attach="background" args={['#a96183']} />
    <fog attach="fog" args={['#bd7894', 23, 80]} />
    <ambientLight intensity={1.2} color="#f8bbba" />
    <hemisphereLight args={['#f6b8ae', '#212948', 2.2]} />
    <directionalLight position={[-12, 16, -24]} intensity={2} color="#ffd8a9" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} />
    <Sky distance={450000} sunPosition={[-10, .8, -30]} inclination={.48} azimuth={.2} />
    <mesh position={[-1, -.14, -16]} receiveShadow><boxGeometry args={[13, .25, 65]} /><meshStandardMaterial color="#655169" roughness={.9} /></mesh>
    <mesh position={[-1, -.015, -16]} receiveShadow><boxGeometry args={[8.8, .08, 65]} /><meshStandardMaterial color="#c9a9a5" roughness={.9} /></mesh>
    <mesh position={[6.5, -.09, -16]} receiveShadow><boxGeometry args={[6.1, .2, 65]} /><meshStandardMaterial color="#292d42" roughness={.77} /></mesh>
    <mesh position={[3.85, .025, -16]}><boxGeometry args={[.12, .06, 65]} /><meshStandardMaterial color="#e6c2a7" /></mesh>
    {Array.from({ length: 13 }, (_, i) => <mesh key={i} position={[7.2, .02, 6 - i * 4]}><boxGeometry args={[.09, .02, 1.8]} /><meshStandardMaterial color="#f1c9ad" /></mesh>)}
    {STOPS.map((s, i) => <Building key={s.route} stop={s} index={i} nearby={active === i} />)}
    {[-7.5, -22.5, -37].map((z, i) => <Palm key={i} x={2.8} z={z} />)}
    {[-8, -23, -38].map((z, i) => <group key={i} position={[10, 0, z]}><mesh position={[0, 4, 0]}><boxGeometry args={[3.5, 8, 5]} /><meshStandardMaterial color={i % 2 ? '#6c7794' : '#74577a'} /></mesh>{[2, 4, 6].map(y => <mesh key={y} position={[-1.77, y, 0]}><boxGeometry args={[.05, .8, 3.4]} /><meshStandardMaterial color="#edbaaa" emissive="#ba788e" emissiveIntensity={.3} /></mesh>)}</group>)}
    <group ref={player}><Avatar running={running} /></group>
  </>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const setRole = usePlaneStore(s => s.setRole);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [nearby, setNearby] = useState<number | null>(null);
  const keys = useRef(new Set<string>());
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); if (countdown === 0) keys.current.add(e.key.toLowerCase()); };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clear = () => keys.current.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); };
  }, [countdown]);
  const enterStop = (i: number) => { setRole(i === 0 ? 'homie' : 'pilot'); navigate(STOPS[i].route); };
  return <div className="marsh-landing">
    <style>{CSS}</style>
    {!playing ? <main className="marsh-intro">
      <div className="intro-grain" />
      <header className="marsh-header"><span className="brand-mark">M<span>.</span></span><span>MARSHOUT <i>/</i> WORLD 01</span><span className="status">● ONLINE</span></header>
      <div className="intro-content"><span className="eyebrow">WELCOME TO VICE CITY · MARSHOUT EXPERIENCES</span><h1>YOUR NEXT<br /><em>STORY STARTS</em><br />HERE<span className="period">.</span></h1><div className="tour-invitation"><strong>Take a tour.</strong><span>See which door gets you a travel flyer and which one gets you to a new destination.</span></div><button className="tour-button" onClick={() => { setPlaying(true); setCountdown(3); keys.current.clear(); }}><span className="play-glyph">▶</span><span>TAKE A TOUR</span><span className="button-arrow">↗</span></button><div className="intro-directions"><span>01 / GET A FLYER</span><span>02 / PORT GELLHORN</span><span>03 / MARS</span></div></div>
      <div className="intro-city" aria-hidden="true"><div className="sun" /><div className="skyline"><i /><i /><i /><i /><i /><i /><i /></div><div className="palm-silhouette">✳</div><div className="city-caption">VICE CITY <span>AFTER HOURS</span></div></div>
      <footer className="intro-footer"><span>DESKTOP EXPERIENCE · KEYBOARD CONTROLS</span><span>DEVELOPED BY <a href="https://x.com/itzhaydar" target="_blank" rel="noopener noreferrer">@ITZHAYDAR</a></span></footer>
    </main> : <main className="tour-screen">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [4, 3.8, 12], fov: 62 }} gl={{ antialias: true, powerPreference: 'high-performance' }}><Suspense fallback={null}><TourWorld keys={keys} onNearby={setNearby} onEnter={enterStop} /></Suspense></Canvas>
      <div className="tour-top"><div><b>MARSHOUT</b><span> / VICE CITY TOUR</span></div><button onClick={() => { setPlaying(false); setNearby(null); setCountdown(0); keys.current.clear(); }} aria-label="Exit tour">EXIT TOUR ×</button></div>
      <div className="tour-heading"><small>TAKE A TOUR</small><strong>Pick your<br /><em>next move.</em></strong></div>
      <div className="tour-controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> MOVE</span><span><kbd>SHIFT</kbd> RUN</span><span><kbd>E</kbd> ENTER</span></div>
      <div className="tour-progress">{STOPS.map((s, i) => <div key={s.route} className={nearby === i ? 'current' : ''}><b>0{i + 1}</b><span>{s.title}</span></div>)}</div>
      {nearby !== null && <button className="door-prompt" onClick={() => enterStop(nearby)}><span>YOU'VE ARRIVED</span><strong>{STOPS[nearby].title}</strong><small>PRESS <kbd>E</kbd> OR CLICK TO ENTER ↗</small></button>}
      <div className="mobile-tour-controls"><button onPointerDown={() => keys.current.add('a')} onPointerUp={() => keys.current.delete('a')} onPointerLeave={() => keys.current.delete('a')}>←</button><button onPointerDown={() => keys.current.add('w')} onPointerUp={() => keys.current.delete('w')} onPointerLeave={() => keys.current.delete('w')}>↑</button><button onPointerDown={() => keys.current.add('s')} onPointerUp={() => keys.current.delete('s')} onPointerLeave={() => keys.current.delete('s')}>↓</button><button onPointerDown={() => keys.current.add('d')} onPointerUp={() => keys.current.delete('d')} onPointerLeave={() => keys.current.delete('d')}>→</button></div>
      {countdown > 0 && <div className="tour-countdown" role="status" aria-live="polite"><span>MARSHOUT / VICE CITY</span><strong key={countdown}>{countdown}</strong><p>YOUR TOUR BEGINS IN</p><div className="countdown-track"><i key={countdown} /></div></div>}
    </main>}
  </div>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box}html,body,#root{margin:0;min-height:100%;background:#071a38}button{font:inherit}.marsh-landing{font-family:'DM Sans',sans-serif;color:#fff;min-height:100vh}.marsh-intro{height:100svh;min-height:640px;overflow:hidden;position:relative;background:radial-gradient(circle at 75% 42%,#314271 0%,#182d55 34%,#091b39 73%);display:flex;flex-direction:column}.intro-grain{position:absolute;inset:0;opacity:.22;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.26'/%3E%3C/svg%3E")}.marsh-header,.intro-footer{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;padding:27px 5vw;letter-spacing:.17em;font-size:11px;font-weight:700}.marsh-header{border-bottom:1px solid #ffffff26;gap:22px}.marsh-header>span:nth-child(2){margin-right:auto}.marsh-header i{color:#f3a76e;font-style:normal;padding:0 10px}.brand-mark{width:36px;height:36px;border:2px solid #fff;display:grid;place-items:center;font-family:'Barlow Condensed',sans-serif;font-size:25px;font-weight:900;letter-spacing:-.07em}.brand-mark span,.period{color:#f3a76e}.status{color:#a7e5d9}.intro-content{position:relative;z-index:2;margin:auto 0;padding:3vh 5vw 2vh;max-width:900px}.eyebrow,.tour-heading small{color:#f5ad78;letter-spacing:.22em;font-weight:800;font-size:11px}.intro-content h1{font-family:'Barlow Condensed',Impact,sans-serif;font-size:clamp(80px,10vw,166px);font-weight:900;letter-spacing:-.045em;line-height:.8;margin:30px 0 28px;text-shadow:0 12px 32px #071a3870}.intro-content h1 em,.tour-heading em{font-style:normal;color:#f3a76e}.intro-content p{max-width:420px;font-size:15px;line-height:1.7;color:#d3d9e2;margin:0 0 30px}.tour-button{cursor:pointer;border:0;background:#f3ad78;color:#081b35;display:flex;align-items:center;gap:18px;min-width:265px;padding:18px 21px;font-size:13px;font-weight:900;letter-spacing:.13em;box-shadow:8px 8px 0 #071225}.tour-button:hover{background:#ffd0a0;transform:translateY(-2px)}.play-glyph{font-size:18px}.button-arrow{margin-left:auto;font-size:19px}.intro-directions{display:flex;gap:26px;margin-top:40px;color:#b9becd;font-size:10px;font-weight:800;letter-spacing:.12em}.intro-city{position:absolute;right:0;bottom:0;width:58%;height:83%;overflow:hidden;opacity:.93;background:linear-gradient(160deg,transparent 26%,#ef8d83a6 78%,#182a4b 100%);clip-path:polygon(16% 0,100% 0,100% 100%,0 100%)}.sun{position:absolute;right:15%;top:19%;height:37vmin;width:37vmin;border-radius:50%;background:linear-gradient(#ffd3aa,#f48680);box-shadow:0 0 100px #f4968177}.skyline{position:absolute;bottom:0;left:6%;right:0;height:63%;display:flex;align-items:end;justify-content:space-between;filter:drop-shadow(-9px -7px 1px #ffb38e)}.skyline i{display:block;background:linear-gradient(90deg,#101c3d,#24305b);width:13%;height:68%;position:relative}.skyline i:after{content:'';position:absolute;inset:12% 15%;background:repeating-linear-gradient(0deg,transparent 0 18px,#eaa89b 19px 22px,transparent 23px 34px);opacity:.5}.skyline i:nth-child(2){height:92%}.skyline i:nth-child(3){height:58%}.skyline i:nth-child(4){height:76%}.skyline i:nth-child(5){height:46%}.skyline i:nth-child(6){height:84%}.skyline i:nth-child(7){height:62%}.palm-silhouette{position:absolute;right:29%;top:9%;font-size:180px;color:#0b2342;transform:rotate(-15deg)}.city-caption{position:absolute;right:6%;bottom:6%;font-family:'Barlow Condensed';font-size:36px;font-weight:900;letter-spacing:.08em}.city-caption span{display:block;font-family:'DM Sans';font-size:10px;letter-spacing:.3em;color:#ffc49b}.intro-footer{font-size:10px;color:#b2bbcd;border-top:1px solid #ffffff24}.intro-footer a{color:#fff;text-decoration:none}.tour-screen{width:100%;height:100svh;position:relative;background:#172341;overflow:hidden}.tour-screen canvas{display:block}.tour-top{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:22px 34px;background:linear-gradient(#09172bbf,transparent);font-size:12px;letter-spacing:.17em}.tour-top b{font-weight:900}.tour-top span{color:#e8bcaa}.tour-top button{border:1px solid #ffffff69;background:#0a1c3daa;color:#fff;padding:10px 14px;cursor:pointer;font-size:11px;letter-spacing:.12em}.tour-heading{position:absolute;left:34px;top:90px;pointer-events:none}.tour-heading strong{display:block;font:900 clamp(44px,5.2vw,86px)/.83 'Barlow Condensed',Impact,sans-serif;letter-spacing:-.035em;margin-top:10px;text-shadow:0 4px 24px #17234199}.tour-controls{position:absolute;left:34px;bottom:32px;display:flex;gap:18px;align-items:center;background:#101b32d9;padding:14px 18px;border:1px solid #ffffff2e;font-size:10px;letter-spacing:.11em;font-weight:800}.tour-controls span{display:flex;gap:5px;align-items:center}.tour-controls kbd,.door-prompt kbd{border:1px solid #ffffff75;background:#ffffff16;padding:5px 7px;font:inherit}.tour-progress{position:absolute;right:34px;bottom:32px;display:grid;gap:7px;width:245px}.tour-progress div{padding:9px 12px;background:#101b32bd;border-left:2px solid #ffffff50;display:flex;gap:13px;align-items:center;font-size:11px;font-weight:700}.tour-progress div.current{border-color:#f3ad78;background:#20324dd9}.tour-progress b{color:#f3ad78}.door-prompt{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);width:min(340px,90vw);background:#0c1d39f2;color:#fff;border:1px solid #f3ad78;padding:15px 20px;text-align:left;cursor:pointer;box-shadow:0 15px 50px #07122588}.door-prompt span,.door-prompt small{display:block;color:#f3ad78;font-size:10px;font-weight:800;letter-spacing:.15em}.door-prompt strong{display:block;font:800 28px/1 'Barlow Condensed';text-transform:uppercase;margin:6px 0 10px}.door-prompt small{color:#fff}.tour-sign{background:#0b1c36ed;padding:11px 14px;border-left:4px solid var(--sign);color:#fff;width:205px;box-shadow:0 7px 18px #0005;transform:scale(.84);opacity:.85;transition:transform .2s,opacity .2s}.tour-sign.is-near{transform:scale(1);opacity:1}.tour-sign small,.tour-sign span{display:block;font:700 9px 'DM Sans',sans-serif;letter-spacing:.1em;color:var(--sign)}.tour-sign strong{display:block;font:800 24px/.92 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:6px 0}.mobile-tour-controls{display:none}@media(max-width:700px){.marsh-intro{min-height:620px}.marsh-header,.intro-footer{padding:20px 6vw}.marsh-header>span:nth-child(2){font-size:10px}.intro-content{padding:20px 6vw;margin:auto 0}.intro-content h1{font-size:clamp(68px,15vw,105px)}.intro-city{width:100%;height:53%;opacity:.5;clip-path:none}.intro-content p{max-width:320px}.intro-directions{flex-direction:column;gap:8px;margin-top:24px}.intro-footer{font-size:8px;gap:15px}.tour-heading{left:20px;top:74px}.tour-heading strong{font-size:54px}.tour-top{padding:15px 20px}.tour-controls{display:none}.tour-progress{right:12px;bottom:115px;width:190px}.tour-progress div{font-size:9px;padding:7px}.mobile-tour-controls{display:flex;position:absolute;left:12px;bottom:16px;gap:5px}.mobile-tour-controls button{width:42px;height:42px;background:#0b1c36d9;border:1px solid #fff7;color:#fff;font-size:22px;touch-action:none}.door-prompt{bottom:175px}}
.tour-invitation{max-width:530px;margin:-5px 0 28px;padding:14px 0 14px 20px;border-left:3px solid #f3ad78;background:linear-gradient(90deg,#091b39a6,transparent)}.tour-invitation strong{display:block;font:900 clamp(25px,3vw,36px)/1 'Barlow Condensed',Impact,sans-serif;text-transform:uppercase;letter-spacing:.025em;color:#ffc692;margin-bottom:8px}.tour-invitation span{display:block;font-size:15px;font-weight:600;line-height:1.5;color:#fff;max-width:430px;text-shadow:0 2px 8px #071225}.tour-countdown{position:absolute;inset:0;z-index:30;background:radial-gradient(circle at 50% 42%,#293e65,#071a38 72%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:all}.tour-countdown>span{font-size:11px;font-weight:800;letter-spacing:.3em;color:#ffc692}.tour-countdown strong{font:900 clamp(180px,30vw,360px)/.9 'Barlow Condensed',Impact,sans-serif;color:#fff;text-shadow:12px 12px 0 #f3ad78;animation:count-pop .35s ease-out}.tour-countdown p{font-size:12px;font-weight:900;letter-spacing:.28em;margin:22px 0 28px}.countdown-track{width:min(260px,60vw);height:3px;background:#ffffff38}.countdown-track i{display:block;width:100%;height:100%;background:#f3ad78;transform-origin:left;animation:count-bar 1s linear forwards}@keyframes count-pop{from{transform:scale(1.2);opacity:.4}to{transform:scale(1);opacity:1}}@keyframes count-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}@media(max-width:700px){.tour-invitation{max-width:360px;margin-top:-8px;margin-bottom:23px}.tour-invitation span{font-size:13px}}
`;
