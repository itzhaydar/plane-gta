import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { usePlaneStore } from '../store';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const HOMIES = ['Toni — docks', 'Mercedes — rooftop', 'Lance — strip'];

function Plane({ url }: { url: string }) {
  const map = useTexture(url);
  const prop = useRef<any>(null);
  const body = { map, color: '#3a5a8c', metalness: 0.15, roughness: 0.45 };
  const paint = { color: '#efebe3', metalness: 0.05, roughness: 0.6 };

  useFrame((_, dt) => {
    if (prop.current) prop.current.rotation.x += dt * 30;
  });

  return (
    <group rotation={[0.15, 0.55, 0]} scale={1.15}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.22, 1.55, 8, 20]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <mesh position={[1.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.2, 0.28, 16]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <mesh position={[1.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.25} />
      </mesh>
      <group ref={prop} position={[1.22, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.025, 0.1, 0.95]} />
          <meshStandardMaterial color="#9aa3ad" />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <boxGeometry args={[0.025, 0.1, 0.95]} />
          <meshStandardMaterial color="#9aa3ad" />
        </mesh>
        <mesh rotation={[(Math.PI * 2) / 3, 0, 0]}>
          <boxGeometry args={[0.025, 0.1, 0.95]} />
          <meshStandardMaterial color="#9aa3ad" />
        </mesh>
      </group>
      <mesh position={[0.22, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <sphereGeometry args={[0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#8fd4ea" transparent opacity={0.45} roughness={0.1} />
      </mesh>
      <mesh position={[-0.05, -0.04, 0]}>
        <boxGeometry args={[0.42, 0.045, 2.35]} />
        <meshStandardMaterial {...paint} />
      </mesh>
      <mesh position={[-0.95, 0.28, 0]}>
        <boxGeometry args={[0.28, 0.42, 0.045]} />
        <meshStandardMaterial {...paint} />
      </mesh>
      <mesh position={[-0.98, 0.08, 0]}>
        <boxGeometry args={[0.22, 0.035, 0.85]} />
        <meshStandardMaterial {...paint} />
      </mesh>
    </group>
  );
}export default function FlyPage() {
  const go = useNavigate();
  const { liveries, setLastRun } = usePlaneStore();
  const skin = liveries.top ?? liveries.left ?? '/templates/plane-top.svg';

  return (
    <main style={{ display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: 'calc(100vh - 52px)' }}>
      <div style={{ background: '#0e0718' }}>
        <Canvas camera={{ position: [3.4, 1.8, 3.4], fov: 45 }}>
          <ambientLight intensity={0.65} />
          <directionalLight position={[5, 7, 2]} intensity={1.5} />
          <Plane url={skin} />
          <OrbitControls />
        </Canvas>
      </div>
      <aside style={{ padding: 20, background: '#160a22', borderLeft: '1px solid #2a1638' }}>
        <p style={{ color: '#00e5ff', letterSpacing: '0.25em', fontSize: 12 }}>PICKUPS</p>
        <ol style={{ fontFamily: 'Arial, sans-serif', color: '#c9b8ff', lineHeight: 1.9 }}>
          {HOMIES.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
        <button
          onClick={() => {
            setLastRun({ picked: HOMIES.length, score: 87 });
            go('/result');
          }}
          style={{
            marginTop: 18,
            width: '100%',
            padding: '14px 16px',
            border: '0',
            background: '#ff2bd6',
            color: '#12081c',
            letterSpacing: '0.18em',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          DROP IN
        </button>
      </aside>
    </main>
  );
}