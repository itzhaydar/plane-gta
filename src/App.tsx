import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HangarPage from './pages/HangarPage';
import FlyPage from './pages/FlyPage';
import ResultPage from './pages/ResultPage';

const link = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? '#ff2bd6' : '#e8e8e8',
  textDecoration: 'none',
  letterSpacing: '0.12em',
  fontSize: 12,
});

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div
      style={{
        minHeight: '100vh',
        margin: 0,
        background: isLanding ? '#fff' : '#0b0612',
        color: isLanding ? '#0b1f4a' : '#f4f0ff',
        fontFamily: isLanding
          ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          : 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: ${isLanding ? '#fff' : '#0b0612'};
        }
      `}</style>

      {!isLanding && (
        <nav
          style={{
            display: 'flex',
            gap: 24,
            padding: '14px 22px',
            borderBottom: '1px solid #2a1638',
            background: '#12081c',
          }}
        >
          <NavLink to="/" style={link}>
            PLANE-GTA
          </NavLink>

          <NavLink to="/hangar" style={link}>
            HANGAR
          </NavLink>

          <NavLink to="/fly" style={link}>
            FLY
          </NavLink>

          <NavLink to="/result" style={link}>
            RESULT
          </NavLink>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/hangar" element={<HangarPage />} />
        <Route path="/fly" element={<FlyPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </div>
  );
}
