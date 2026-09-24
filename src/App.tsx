import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HangarPage from './pages/HangarPage';
import FlyPage from './pages/FlyPage';
import RockHangarPage from './pages/RockHangarPage';
import FlyRocket from './pages/FlyRocket';
import Homie from './pages/Homie';

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className={`app-shell ${isLanding ? 'app-landing' : ''}`}>
      <style>{APP_CSS}</style>

      {!isLanding && (
        <header className="app-header">
          <NavLink to="/" className="app-brand">
            <span className="app-brand-dot" />
            MARSHOUT
          </NavLink>

          <div className="app-header-status">
            <span className="app-status-dot" />
            <span>WORLD 01</span>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/hangar" element={<HangarPage />} />

        <Route path="/fly" element={<FlyPage />} />

        <Route path="/rock-hangar" element={<RockHangarPage />} />

        <Route path="/fly-rocket" element={<FlyRocket />} />

        <Route path="/homie" element={<Homie />} />
      </Routes>
    </div>
  );
}

const APP_CSS = `
:root {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  background: #f5f7f9;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  min-height: 100svh;
  position: relative;
  background:
    radial-gradient(
      circle at 72% 25%,
      rgba(31, 71, 119, 0.075),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      #fbfcfc 0%,
      #f5f7f9 52%,
      #eef2f6 100%
    );
  color: #071a38;
}

.app-shell.app-landing {
  background: transparent;
}

.app-header {
  position: relative;
  z-index: 100;
  height: 78px;
  padding: 0 clamp(22px, 5vw, 76px);

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-bottom: 1px solid rgba(7, 26, 56, 0.08);

  background:
    linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.82),
      rgba(255, 255, 255, 0.48)
    );

  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.app-brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;

  color: #071a38;
  text-decoration: none;

  font-size: 13px;
  font-weight: 950;
  letter-spacing: 0.2em;
}

.app-brand-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;

  border-radius: 50%;
  background: #c58b3c;

  box-shadow:
    0 0 0 4px rgba(197, 139, 60, 0.1);
}

.app-header-status {
  display: flex;
  align-items: center;
  gap: 8px;

  color: rgba(7, 26, 56, 0.32);

  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.18em;
}

.app-status-dot {
  width: 5px;
  height: 5px;
  flex: 0 0 auto;

  border-radius: 50%;
  background: #c58b3c;
}

@media (max-width: 650px) {
  .app-header {
    height: 67px;
    padding: 0 22px;
  }

  .app-header-status {
    font-size: 8px;
  }
}
`;
