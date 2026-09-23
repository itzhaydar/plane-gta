import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const go = useNavigate();

  return (
    <main style={{ padding: '18vh 8vw', maxWidth: 900 }}>
      <p style={{ color: '#00e5ff', letterSpacing: '0.4em', fontSize: 12, margin: 0 }}>
        VICE HANGAR
      </p>
      <h1
        style={{
          fontSize: 'clamp(48px, 10vw, 104px)',
          lineHeight: 0.9,
          margin: '12px 0 20px',
          color: '#ffe600',
          textShadow: '4px 4px 0 #ff2bd6',
        }}
      >
        PLANE-GTA
      </h1>
      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 18, color: '#c9b8ff', maxWidth: 520 }}>
        Paint a plane in the hangar, then extract your homies. Travel faster. Not a flight sim.
      </p>
      <button
        onClick={() => go('/hangar')}
        style={{
          marginTop: 28,
          padding: '14px 28px',
          border: '0',
          background: '#ff2bd6',
          color: '#12081c',
          letterSpacing: '0.18em',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ENTER HANGAR
      </button>
    </main>
  );
}