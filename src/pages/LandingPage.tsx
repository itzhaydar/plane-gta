import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaneStore } from '../store';

type Role = 'pilot' | 'homie';

type GameImageProps = {
  src: string;
  fallback: string;
  alt: string;
  className: string;
  width: number;
  height: number;
  priority?: boolean;
};

const webpCache = new Map<string, string>();

function canEncodeWebp(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

async function pngToWebpUrl(pngSrc: string): Promise<string | null> {
  const cached = webpCache.get(pngSrc);
  if (cached) return cached;

  if (!canEncodeWebp()) return null;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${pngSrc}`));
    img.src = pngSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext('2d');
  if (!context) return null;

  context.drawImage(image, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.82);
  });

  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  webpCache.set(pngSrc, url);
  return url;
}

function GameImage({
  src,
  fallback,
  alt,
  className,
  width,
  height,
  priority = false,
}: GameImageProps) {
  const pngSrc = fallback || src.replace(/\.webp$/i, '.png');
  const [webpSrc, setWebpSrc] = useState<string | null>(
    webpCache.get(pngSrc) ?? null
  );

  useEffect(() => {
    let cancelled = false;

    pngToWebpUrl(pngSrc)
      .then((url) => {
        if (!cancelled && url) setWebpSrc(url);
      })
      .catch(() => {
        if (!cancelled) setWebpSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pngSrc]);

  return (
    <picture>
      {webpSrc ? <source srcSet={webpSrc} type="image/webp" /> : null}
      <img
        src={pngSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </picture>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const setRole = usePlaneStore((state) => state.setRole);
  const [rolePanelOpen, setRolePanelOpen] = useState(false);

  useEffect(() => {
    if (!rolePanelOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRolePanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [rolePanelOpen]);

  const selectRole = (role: Role) => {
    setRole(role);
    setRolePanelOpen(false);
    navigate('/hangar');
  };

  return (
    <>
      <style>{LANDING_CSS}</style>

      <div className="landing-page">
        <div className="landing-grid" />
        <div className="landing-scene-glow" />

        <header className="landing-header">
          <div className="landing-brand">
            <span className="landing-brand-dot" />
            MARSHOUT
          </div>

          <div className="landing-hud">
            <span className="landing-hud-status">ONLINE</span>
            <span className="landing-hud-line" />
            <span>WORLD 01</span>
          </div>
        </header>

        <main className="landing-main">
<section className="landing-scene" aria-label="Marshout game scene">
  <div className="landing-horizon" />
  <div className="landing-horizon-label">Destination unknown</div>

  <picture className="landing-art">
    <source srcSet="/landing.webp" type="image/webp" />

    <img
      src="/landing.png"
      alt="Marshout crew with a plane and rocket"
      width={1600}
      height={900}
      loading="eager"
      fetchPriority="high"
      decoding="async"
    />
  </picture>
</section>

          <section className="landing-scene" aria-label="Marshout game scene">
            <div className="landing-horizon" />
            <div className="landing-horizon-label">Destination unknown</div>

            <GameImage
              src="/rocket.webp"
              fallback="/rocket.png"
              alt="Rocket"
              width={300}
              height={450}
              className="landing-vehicle landing-rocket"
              priority
            />

            <GameImage
              src="/plane.webp"
              fallback="/plane.png"
              alt="Plane"
              width={620}
              height={400}
              className="landing-vehicle landing-plane"
              priority
            />

            <div className="landing-people">
              <GameImage
                src="/man.webp"
                fallback="/man.png"
                alt="Passenger"
                width={300}
                height={450}
                className="landing-person"
                priority
              />
              <GameImage
                src="/mann.webp"
                fallback="/mann.png"
                alt="Passenger"
                width={300}
                height={450}
                className="landing-person"
                priority
              />
              <GameImage
                src="/woman.webp"
                fallback="/woman.png"
                alt="Passenger"
                width={300}
                height={450}
                className="landing-person"
                priority
              />
            </div>
          </section>
        </main>

        <div className="landing-footer">
          <span className="landing-footer-dot" />
          Flight system ready
        </div>

        {rolePanelOpen && (
          <div
            className="landing-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) {
                setRolePanelOpen(false);
              }
            }}
          >
            <div
              className="landing-role-screen"
              role="dialog"
              aria-modal="true"
              aria-labelledby="landing-role-title"
            >
              <button
                type="button"
                className="landing-close"
                aria-label="Close"
                onClick={() => setRolePanelOpen(false)}
              >
                ×
              </button>

              <div className="landing-role-header">
                <p className="landing-role-kicker">Before takeoff</p>
                <h2 id="landing-role-title" className="landing-role-title">
                  Choose your role
                </h2>
              </div>

              <div className="landing-role-grid">
                <button
                  type="button"
                  className="landing-role"
                  onClick={() => selectRole('pilot')}
                >
                  <span className="landing-role-number">01</span>
                  <span className="landing-role-content">
                    <span className="landing-role-name">Pilot</span>
                    <span className="landing-role-description">
                      Take control, choose where you're going, and fly the crew
                      there.
                    </span>
                    <span className="landing-role-enter">Enter cockpit →</span>
                  </span>
                </button>

                <button
                  type="button"
                  className="landing-role"
                  onClick={() => selectRole('homie')}
                >
                  <span className="landing-role-number">02</span>
                  <span className="landing-role-content">
                    <span className="landing-role-name">Homie</span>
                    <span className="landing-role-description">
                      Get picked up, join the crew, and see where they take you.
                    </span>
                    <span className="landing-role-enter">Join the crew →</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const LANDING_CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
html, body, #root { margin: 0; min-height: 100%; }
body { background: #f5f7f9; }
button { font: inherit; }

.landing-page {
  min-height: 100vh;
  min-height: 100svh;
  position: relative;
  overflow: hidden;
  color: #071a38;
  background:
    radial-gradient(circle at 72% 35%, rgba(31, 71, 119, 0.075), transparent 28%),
    linear-gradient(135deg, #fbfcfc 0%, #f5f7f9 52%, #eef2f6 100%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.landing-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.25;
  background-image:
    linear-gradient(rgba(7, 26, 56, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(7, 26, 56, 0.035) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(to bottom, black, transparent 82%);
}

.landing-header {
  position: absolute;
  z-index: 30;
  top: 0; left: 0; right: 0;
  height: 78px;
  padding: 0 clamp(22px, 5vw, 76px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(7, 26, 56, 0.08);
  background: linear-gradient(to bottom, rgba(255,255,255,0.68), rgba(255,255,255,0));
}

.landing-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #071a38;
  font-size: 13px;
  font-weight: 950;
  letter-spacing: 0.2em;
}

.landing-brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c58b3c;
  box-shadow: 0 0 0 4px rgba(197, 139, 60, 0.10);
}

.landing-hud {
  display: flex;
  align-items: center;
  gap: 18px;
  color: rgba(7, 26, 56, 0.38);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.landing-hud-status {
  display: flex;
  align-items: center;
  gap: 7px;
}

.landing-hud-status::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c58b3c;
}

.landing-hud-line {
  width: 32px;
  height: 1px;
  background: rgba(7, 26, 56, 0.14);
}

.landing-main {
  position: relative;
  z-index: 5;
  min-height: 100vh;
  min-height: 100svh;
  max-width: 1680px;
  margin: 0 auto;
  padding: 105px clamp(24px, 5vw, 78px) 45px;
  display: grid;
  grid-template-columns: minmax(350px, 0.78fr) minmax(540px, 1.22fr);
  align-items: center;
  gap: clamp(30px, 4vw, 80px);
}

.landing-copy {
  position: relative;
  z-index: 20;
  max-width: 610px;
}

.landing-kicker {
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 11px;
  color: rgba(7, 26, 56, 0.46);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.landing-kicker::before {
  content: "";
  width: 27px;
  height: 1px;
  background: #c58b3c;
}

.landing-title {
  margin: 0;
  color: #071a38;
  font-size: clamp(58px, 7.2vw, 112px);
  line-height: 0.84;
  letter-spacing: -0.075em;
  font-weight: 950;
  text-transform: uppercase;
}

.landing-title-accent {
  display: block;
  color: #123b6b;
}

.landing-description {
  max-width: 430px;
  margin: 28px 0 0;
  color: rgba(7, 26, 56, 0.52);
  font-size: 15px;
  line-height: 1.65;
}

.landing-start {
  margin-top: 34px;
  display: inline-flex;
  align-items: center;
  gap: 15px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #071a38;
  cursor: pointer;
  text-transform: uppercase;
}

.landing-start-icon {
  width: 59px;
  height: 59px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #0a2850;
  box-shadow: 0 12px 26px rgba(7, 26, 56, 0.17);
  transition: transform 160ms ease, background 160ms ease;
}

.landing-start-icon::after {
  content: "";
  width: 0;
  height: 0;
  margin-left: 3px;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 10px solid white;
}

.landing-start:hover .landing-start-icon {
  transform: scale(1.07);
  background: #123b6b;
}

.landing-start-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.landing-start-main {
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.18em;
}

.landing-start-sub {
  color: rgba(7, 26, 56, 0.36);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.landing-scene {
  position: relative;
  min-width: 0;
  height: min(760px, 79vh);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.landing-scene-glow {
  position: absolute;
  width: 650px;
  height: 650px;
  right: 0;
  bottom: -180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(22, 61, 106, 0.12), transparent 68%);
  pointer-events: none;
}

.landing-horizon {
  position: absolute;
  left: -15%;
  right: -15%;
  bottom: 13%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(7, 26, 56, 0.16), transparent);
}

.landing-horizon-label {
  position: absolute;
  right: 8%;
  bottom: calc(13% + 12px);
  color: rgba(7, 26, 56, 0.23);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.landing-vehicle {
  position: absolute;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(0 28px 24px rgba(7, 26, 56, 0.18));
}

.landing-plane {
  width: min(58%, 620px);
  top: 7%;
  right: -1%;
  z-index: 4;
  transform: rotate(-4deg);
  animation: planeFloat 6s ease-in-out infinite;
}

.landing-rocket {
  width: min(29%, 300px);
  top: 23%;
  left: 1%;
  z-index: 3;
  opacity: 0.88;
  transform: rotate(-11deg);
  animation: rocketFloat 5s ease-in-out infinite;
}

@keyframes planeFloat {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-4deg); }
  50% { transform: translate3d(-7px, -10px, 0) rotate(-2.5deg); }
}

@keyframes rocketFloat {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-11deg); }
  50% { transform: translate3d(5px, -13px, 0) rotate(-8deg); }
}

.landing-people {
  position: absolute;
  z-index: 8;
  width: 91%;
  bottom: 5%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.landing-person {
  width: 33%;
  max-width: 300px;
  height: auto;
  object-fit: contain;
  margin-left: -3%;
  user-select: none;
  filter: drop-shadow(0 28px 20px rgba(7, 26, 56, 0.22));
  transition: transform 220ms ease;
}

.landing-person:first-child {
  margin-left: 0;
  transform: translateY(15px) rotate(-2deg);
}

.landing-person:nth-child(2) {
  z-index: 3;
  transform: translateY(-5px);
}

.landing-person:nth-child(3) {
  transform: translateY(17px) rotate(2deg);
}

.landing-people:hover .landing-person:first-child {
  transform: translateX(-7px) translateY(15px) rotate(-3deg);
}

.landing-people:hover .landing-person:nth-child(2) {
  transform: translateY(-9px) scale(1.015);
}

.landing-people:hover .landing-person:nth-child(3) {
  transform: translateX(7px) translateY(17px) rotate(3deg);
}

.landing-footer {
  position: absolute;
  z-index: 20;
  left: clamp(24px, 5vw, 78px);
  bottom: 28px;
  display: flex;
  align-items: center;
  gap: 9px;
  color: rgba(7, 26, 56, 0.28);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.landing-footer-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c58b3c;
}

.landing-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: rgba(4, 15, 30, 0.48);
  backdrop-filter: blur(12px);
  animation: overlayIn 150ms ease both;
}

@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.landing-role-screen {
  position: relative;
  width: min(900px, 100%);
  animation: roleIn 190ms ease both;
}

@keyframes roleIn {
  from { opacity: 0; transform: translateY(15px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.landing-role-header { margin-bottom: 22px; }

.landing-role-kicker {
  margin: 0 0 9px;
  color: #c58b3c;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.23em;
  text-transform: uppercase;
}

.landing-role-title {
  margin: 0;
  color: white;
  font-size: clamp(40px, 6vw, 70px);
  line-height: 0.9;
  letter-spacing: -0.065em;
  font-weight: 950;
  text-transform: uppercase;
}

.landing-role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.landing-role {
  min-height: 260px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 25px;
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 4px;
  background: linear-gradient(145deg, rgba(22, 61, 106, 0.75), rgba(5, 20, 39, 0.94));
  color: white;
  text-align: left;
  cursor: pointer;
  transition: transform 170ms ease, border-color 170ms ease;
}

.landing-role::after {
  content: "";
  position: absolute;
  width: 220px;
  height: 220px;
  right: -90px;
  top: -90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(197,139,60,0.18), transparent 68%);
  pointer-events: none;
}

.landing-role:hover {
  transform: translateY(-5px);
  border-color: rgba(197,139,60,0.58);
}

.landing-role-number {
  position: absolute;
  top: 18px;
  right: 19px;
  color: rgba(255,255,255,0.28);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.landing-role-content {
  position: relative;
  z-index: 2;
}

.landing-role-name {
  display: block;
  font-size: clamp(35px, 5vw, 58px);
  line-height: 0.9;
  letter-spacing: -0.06em;
  font-weight: 950;
  text-transform: uppercase;
}

.landing-role-description {
  display: block;
  max-width: 240px;
  margin-top: 11px;
  color: rgba(255,255,255,0.52);
  font-size: 12px;
  line-height: 1.5;
}

.landing-role-enter {
  display: block;
  margin-top: 19px;
  color: #d8a35c;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.landing-close {
  position: absolute;
  top: -50px;
  right: 0;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
  color: white;
  cursor: pointer;
  font-size: 18px;
  transition: background 150ms ease, border-color 150ms ease;
}

.landing-close:hover {
  background: rgba(255,255,255,0.10);
  border-color: rgba(197,139,60,0.55);
}

@media (max-width: 1050px) {
  .landing-main {
    grid-template-columns: 1fr;
    padding-top: 120px;
    gap: 15px;
  }
  .landing-copy { max-width: 700px; }
  .landing-title { font-size: clamp(64px, 12vw, 105px); }
  .landing-scene { height: 53vh; min-height: 420px; margin-top: -30px; }
  .landing-plane { width: min(55%, 550px); }
  .landing-rocket { width: 25%; }
  .landing-people { width: 78%; }
}

@media (max-width: 650px) {
  .landing-header { height: 67px; padding: 0 22px; }
  .landing-hud { display: none; }
  .landing-main {
    min-height: 100svh;
    padding: 96px 22px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0;
  }
  .landing-kicker { margin-bottom: 16px; font-size: 9px; }
  .landing-title { font-size: clamp(54px, 16vw, 82px); }
  .landing-description { max-width: 340px; margin-top: 19px; font-size: 13px; }
  .landing-start { margin-top: 24px; }
  .landing-start-icon { width: 53px; height: 53px; }
  .landing-scene { width: 100%; height: 43vh; min-height: 300px; margin-top: -5px; }
  .landing-plane { width: 67%; right: -8%; top: 4%; }
  .landing-rocket { width: 29%; left: -2%; top: 20%; }
  .landing-people { width: 110%; left: -5%; bottom: 4%; }
  .landing-person { width: 34%; }
  .landing-horizon-label, .landing-footer { display: none; }
  .landing-overlay { align-items: flex-end; padding: 0; }
  .landing-role-screen {
    width: 100%;
    padding: 25px 20px 30px;
    background: linear-gradient(to bottom, #092443, #06172d);
    border-top: 1px solid rgba(255,255,255,0.12);
  }
  .landing-role-header { padding-right: 50px; margin-bottom: 17px; }
  .landing-role-title { font-size: 42px; }
  .landing-close { top: 20px; right: 20px; }
  .landing-role-grid { grid-template-columns: 1fr; gap: 9px; }
  .landing-role { min-height: 145px; padding: 20px; }
  .landing-role-name { font-size: 39px; }
  .landing-role-description { margin-top: 7px; }
  .landing-role-enter { margin-top: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .landing-plane,
  .landing-rocket,
  .landing-overlay,
  .landing-role-screen {
    animation: none;
  }
  .landing-person,
  .landing-start-icon,
  .landing-role {
    transition: none;
  }
}
`;
