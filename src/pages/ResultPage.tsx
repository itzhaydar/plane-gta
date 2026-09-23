import { useNavigate } from 'react-router-dom';
import { usePlaneStore } from '../store';

export default function ResultPage() {
  const go = useNavigate();
  const lastRun = usePlaneStore((s) => s.lastRun);

  return (
    <main style={{ padding: '12vh 8vw' }}>
      <p style={{ color: '#00e5ff', letterSpacing: '0.35em', fontSize: 12 }}>EXTRACTED</p>
      <h1 style={{ fontSize: 64, margin: '8px 0 16px', color: '#ffe600', textShadow: '3px 3px 0 #ff2bd6' }}>
        RESULT
      </h1>
      <p style={{ fontFamily: 'Arial, sans-serif', color: '#c9b8ff', fontSize: 20 }}>
        {lastRun
          ? `${lastRun.picked} homies pulled. Style score ${lastRun.score}.`
          : 'No run yet. Paint it, take off, drop in.'}
      </p>
      <button
        onClick={() => go('/hangar')}
        style={{
          marginTop: 28,
          padding: '14px 24px',
          border: '0',
          background: '#00e5ff',
          color: '#12081c',
          letterSpacing: '0.16em',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        BACK TO HANGAR
      </button>
    </main>
  );
}