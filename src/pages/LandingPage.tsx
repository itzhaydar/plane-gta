import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaneStore } from '../store';

// Before deploy: compress image exports to WebP (80–200KB) with Squoosh.

type Role = 'pilot' | 'homie';

type AssetImageProps = {
  webp: string;
  png: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

function AssetImage({
  webp,
  png,
  alt,
  width,
  height,
  className,
  priority = false,
}: AssetImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="game-asset-placeholder"
        style={{ width, height }}
        aria-label={`${alt} placeholder`}
      />
    );
  }

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />

      <img
        src={png}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={() => setFailed(true)}
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
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
      <style>{`
        * {
          box-sizing: border-box;
        }

        .game-page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          color: #f5f1e8;
          background:
            radial-gradient(
              circle at 72% 38%,
              rgba(214, 126, 58, 0.18),
              transparent 28%
            ),
            radial-gradient(
              circle at 18% 78%,
              rgba(55, 91, 111, 0.2),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              #071014 0%,
              #0b171c 45%,
              #111a1c 100%
            );
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /*
          ATMOSPHERE
        */

        .game-page::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.22;
          background-image:
            linear-gradient(
              rgba(255,255,255,0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.025) 1px,
              transparent 1px
            );
          background-size: 56px 56px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 85%
          );
        }

        .game-page::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              ellipse at center,
              transparent 45%,
              rgba(0,0,0,0.55) 100%
            );
        }

        /*
          TOP HUD
        */

        .game-topbar {
          position: absolute;
          z-index: 20;
          top: 0;
          left: 0;
          right: 0;

          height: 86px;
          padding: 0 clamp(22px, 4vw, 64px);

          display: flex;
          align-items: center;
          justify-content: space-between;

          border-bottom: 1px solid rgba(255,255,255,0.08);

          background:
            linear-gradient(
              to bottom,
              rgba(4, 9, 11, 0.72),
              rgba(4, 9, 11, 0)
            );

          pointer-events: none;
        }

        .game-brand {
          display: flex;
          align-items: center;
          gap: 13px;

          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.22em;
        }

        .game-brand-mark {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #e99b52;
          box-shadow:
            0 0 0 4px rgba(233,155,82,0.1),
            0 0 18px rgba(233,155,82,0.5);
        }

        .game-status {
          display: flex;
          align-items: center;
          gap: 18px;

          color: rgba(245,241,232,0.55);

          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .game-status-line {
          width: 34px;
          height: 1px;
          background: rgba(255,255,255,0.2);
        }

        /*
          MAIN
        */

        .game-main {
          min-height: 100vh;
          position: relative;
          z-index: 5;

          display: grid;
          grid-template-columns: 0.78fr 1.22fr;
          align-items: center;

          max-width: 1700px;
          margin: 0 auto;

          padding:
            100px
            clamp(24px, 5vw, 80px)
            60px;
        }

        /*
          LEFT
        */

        .game-copy {
          position: relative;
          z-index: 12;
          max-width: 650px;
        }

        .game-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;

          margin: 0 0 22px;

          color: rgba(245,241,232,0.55);

          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        .game-eyebrow::before {
          content: "";
          width: 28px;
          height: 1px;
          background: #e99b52;
        }

        .game-title {
          margin: 0;

          max-width: 700px;

          font-size: clamp(
            68px,
            8vw,
            132px
          );

          line-height: 0.82;
          letter-spacing: -0.075em;
          font-weight: 950;

          text-transform: uppercase;

          color: #f4eee2;

          text-shadow:
            0 5px 30px rgba(0,0,0,0.3);
        }

        .game-title span {
          display: block;
          color: #e99b52;
        }

        .game-description {
          max-width: 440px;

          margin: 30px 0 0;

          color: rgba(245,241,232,0.62);

          font-size: 15px;
          line-height: 1.65;
        }

        /*
          PLAY BUTTON
        */

        .game-play {
          margin-top: 38px;

          display: inline-flex;
          align-items: center;
          gap: 18px;

          padding: 0;

          border: 0;
          background: transparent;

          color: #f5f1e8;

          font: inherit;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.17em;
          text-transform: uppercase;

          cursor: pointer;
        }

        .game-play-icon {
          width: 64px;
          height: 64px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(233,155,82,0.75);
          border-radius: 50%;

          background: rgba(233,155,82,0.08);

          transition:
            transform 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .game-play-icon::after {
          content: "";
          width: 0;
          height: 0;

          margin-left: 4px;

          border-top: 7px solid transparent;
          border-bottom: 7px solid transparent;
          border-left: 10px solid #e99b52;
        }

        .game-play:hover .game-play-icon {
          transform: scale(1.08);
          background: rgba(233,155,82,0.16);

          box-shadow:
            0 0 0 8px rgba(233,155,82,0.05),
            0 0 30px rgba(233,155,82,0.16);
        }

        .game-play-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .game-play-sub {
          color: rgba(245,241,232,0.38);
          font-size: 9px;
          letter-spacing: 0.18em;
        }

        /*
          SCENE
        */

        .game-scene {
          min-width: 0;
          height: min(760px, 78vh);

          position: relative;

          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .game-scene::before {
          content: "";

          position: absolute;

          width: 80%;
          height: 60%;

          right: 5%;
          bottom: 5%;

          background:
            radial-gradient(
              ellipse,
              rgba(220,126,55,0.18),
              transparent 68%
            );

          filter: blur(30px);
        }

        /*
          HORIZON
        */

        .game-horizon {
          position: absolute;
          left: -10%;
          right: -10%;
          bottom: 13%;

          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.16),
              transparent
            );
        }

        .game-horizon-label {
          position: absolute;
          right: 9%;
          bottom: calc(13% + 12px);

          color: rgba(245,241,232,0.25);

          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        /*
          VEHICLES
        */

        .game-vehicle {
          position: absolute;

          object-fit: contain;

          pointer-events: none;

          filter:
            drop-shadow(
              0 30px 30px rgba(0,0,0,0.42)
            );
        }

        .game-plane {
          width: min(58%, 620px);

          right: -2%;
          top: 9%;

          z-index: 4;

          transform: rotate(-4deg);

          animation:
            planeFloat 5s ease-in-out infinite;
        }

        .game-rocket {
          width: min(30%, 300px);

          left: 0;
          top: 22%;

          z-index: 3;

          transform: rotate(-12deg);

          opacity: 0.84;

          animation:
            rocketFloat 4.5s ease-in-out infinite;
        }

        @keyframes planeFloat {
          0%, 100% {
            transform:
              translate3d(0, 0, 0)
              rotate(-4deg);
          }

          50% {
            transform:
              translate3d(-8px, -12px, 0)
              rotate(-2deg);
          }
        }

        @keyframes rocketFloat {
          0%, 100% {
            transform:
              translate3d(0, 0, 0)
              rotate(-12deg);
          }

          50% {
            transform:
              translate3d(5px, -16px, 0)
              rotate(-9deg);
          }
        }

        /*
          CHARACTERS
        */

        .game-people {
          position: absolute;

          width: 88%;

          bottom: 7%;

          display: flex;
          align-items: flex-end;
          justify-content: center;

          z-index: 8;
        }

        .game-person {
          width: 32%;
          max-width: 290px;

          height: auto;

          object-fit: contain;

          margin-left: -3%;

          filter:
            drop-shadow(
              0 28px 22px rgba(0,0,0,0.5)
            );

          transition:
            transform 220ms ease;
        }

        .game-person:first-child {
          margin-left: 0;
          transform: translateY(15px) rotate(-2deg);
        }

        .game-person:nth-child(2) {
          z-index: 3;
          transform: translateY(-4px);
        }

        .game-person:nth-child(3) {
          transform: translateY(18px) rotate(2deg);
        }

        .game-people:hover .game-person:first-child {
          transform:
            translateX(-8px)
            translateY(15px)
            rotate(-3deg);
        }

        .game-people:hover .game-person:nth-child(2) {
          transform:
            translateY(-8px)
            scale(1.015);
        }

        .game-people:hover .game-person:nth-child(3) {
          transform:
            translateX(8px)
            translateY(18px)
            rotate(3deg);
        }

        /*
          CORNER GAME INFO
        */

        .game-corner {
          position: absolute;
          z-index: 15;

          left: clamp(24px, 5vw, 80px);
          bottom: 30px;

          display: flex;
          align-items: center;
          gap: 12px;

          color: rgba(245,241,232,0.3);

          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .game-corner-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #e99b52;
        }

        /*
          ROLE SCREEN
        */

        .game-overlay {
          position: fixed;
          inset: 0;

          z-index: 100;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 30px;

          background:
            rgba(3, 8, 10, 0.76);

          backdrop-filter: blur(14px);

          animation:
            overlayIn 180ms ease both;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .game-role-screen {
          width: min(900px, 100%);

          position: relative;

          animation:
            roleIn 240ms ease both;
        }

        @keyframes roleIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .game-role-header {
          margin-bottom: 24px;
        }

        .game-role-kicker {
          margin: 0 0 10px;

          color: #e99b52;

          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        .game-role-title {
          margin: 0;

          font-size: clamp(38px, 6vw, 70px);
          line-height: 0.9;
          letter-spacing: -0.06em;
          text-transform: uppercase;
        }

        .game-role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .game-role {
          min-height: 260px;

          position: relative;
          overflow: hidden;

          display: flex;
          flex-direction: column;
          justify-content: flex-end;

          padding: 25px;

          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 3px;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,0.09),
              rgba(255,255,255,0.025)
            );

          color: #f5f1e8;

          text-align: left;

          cursor: pointer;

          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease;
        }

        .game-role::before {
          content: "";

          position: absolute;
          inset: 0;

          background:
            radial-gradient(
              circle at 80% 20%,
              rgba(233,155,82,0.2),
              transparent 42%
            );

          opacity: 0.5;

          transition: opacity 180ms ease;
        }

        .game-role:hover {
          transform: translateY(-5px);

          border-color: rgba(233,155,82,0.55);

          background:
            linear-gradient(
              145deg,
              rgba(233,155,82,0.12),
              rgba(255,255,255,0.035)
            );
        }

        .game-role:hover::before {
          opacity: 1;
        }

        .game-role-number {
          position: absolute;
          top: 20px;
          right: 20px;

          color: rgba(255,255,255,0.24);

          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        .game-role-content {
          position: relative;
          z-index: 2;
        }

        .game-role-name {
          margin: 0;

          font-size: clamp(34px, 5vw, 58px);
          line-height: 0.9;
          letter-spacing: -0.06em;
          text-transform: uppercase;
        }

        .game-role-description {
          margin: 12px 0 0;

          max-width: 230px;

          color: rgba(245,241,232,0.48);

          font-size: 12px;
          line-height: 1.5;
        }

        .game-role-enter {
          margin-top: 20px;

          color: #e99b52;

          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .game-close {
          position: absolute;
          top: -50px;
          right: 0;

          width: 36px;
          height: 36px;

          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 50%;

          background: rgba(255,255,255,0.04);

          color: #f5f1e8;

          font-size: 18px;

          cursor: pointer;
        }

        .game-close:hover {
          border-color: rgba(233,155,82,0.5);
          color: #e99b52;
        }

        .game-asset-placeholder {
          flex: 0 0 auto;
          opacity: 0;
          pointer-events: none;
        }

        /*
          TABLET
        */

        @media (max-width: 1050px) {
          .game-main {
            grid-template-columns: 1fr;
            padding-top: 130px;
          }

          .game-copy {
            max-width: 700px;
          }

          .game-title {
            font-size: clamp(68px, 13vw, 110px);
          }

          .game-scene {
            height: 52vh;
            min-height: 420px;
            margin-top: -40px;
          }

          .game-plane {
            width: min(55%, 520px);
            right: 0;
          }

          .game-rocket {
            width: 25%;
            left: 4%;
          }

          .game-people {
            width: 78%;
          }
        }

        /*
          MOBILE
        */

        @media (max-width: 650px) {
          .game-topbar {
            height: 68px;
            padding: 0 22px;
          }

          .game-status {
            display: none;
          }

          .game-main {
            min-height: 100svh;

            padding:
              100px
              22px
              30px;

            display: flex;
            flex-direction: column;

            justify-content: space-between;
          }

          .game-copy {
            width: 100%;
          }

          .game-eyebrow {
            margin-bottom: 17px;
            font-size: 9px;
          }

          .game-title {
            font-size: clamp(55px, 16vw, 82px);
            line-height: 0.84;
          }

          .game-description {
            max-width: 330px;
            margin-top: 20px;

            font-size: 13px;
          }

          .game-play {
            margin-top: 24px;
          }

          .game-play-icon {
            width: 54px;
            height: 54px;
          }

          .game-scene {
            width: 100%;
            height: 45vh;
            min-height: 310px;
            margin-top: -10px;
          }

          .game-plane {
            width: 64%;
            right: -5%;
            top: 5%;
          }

          .game-rocket {
            width: 28%;
            left: 0;
            top: 20%;
          }

          .game-people {
            width: 108%;
            left: -4%;
            bottom: 4%;
          }

          .game-person {
            width: 34%;
          }

          .game-corner {
            display: none;
          }

          .game-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .game-role-screen {
            width: 100%;
            padding: 24px 20px 28px;

            background:
              linear-gradient(
                to bottom,
                rgba(11,17,19,0.96),
                rgba(7,12,14,1)
              );

            border-top: 1px solid rgba(255,255,255,0.12);
          }

          .game-close {
            top: 20px;
            right: 20px;
          }

          .game-role-header {
            padding-right: 50px;
            margin-bottom: 18px;
          }

          .game-role-title {
            font-size: 43px;
          }

          .game-role-grid {
            grid-template-columns: 1fr;
          }

          .game-role {
            min-height: 145px;
            padding: 20px;
          }

          .game-role-name {
            font-size: 40px;
          }

          .game-role-description {
            margin-top: 8px;
          }

          .game-role-enter {
            margin-top: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .game-plane,
          .game-rocket,
          .game-role-screen,
          .game-overlay {
            animation: none;
          }

          .game-role,
          .game-play-icon,
          .game-person {
            transition: none;
          }
        }
      `}</style>

      <div className="game-page">

        {/* GAME HUD */}

        <header className="game-topbar">
          <div className="game-brand">
            <span className="game-brand-mark" />
            MARSHOUT
          </div>

          <div className="game-status">
            <span>ONLINE</span>
            <span className="game-status-line" />
            <span>WORLD 01</span>
          </div>
        </header>

        {/* MAIN GAME SCREEN */}

        <main className="game-main">

          <section className="game-copy">

            <p className="game-eyebrow">
              A trip worth taking
            </p>

            <h1 className="game-title">
              Pick up
              <span>your homies.</span>
            </h1>

            <p className="game-description">
              Fly somewhere new. Cross the world, leave the planet,
              or just pick up your friends and figure out where you're
              going next.
            </p>

            <button
              type="button"
              className="game-play"
              onClick={() => setRolePanelOpen(true)}
            >
              <span className="game-play-icon" />

              <span className="game-play-text">
                <span>Start Game</span>
                <span className="game-play-sub">
                  Choose your role
                </span>
              </span>
            </button>

          </section>

          <section
            className="game-scene"
            aria-label="Plane, rocket and passengers"
          >

            <div className="game-horizon" />

            <div className="game-horizon-label">
              Destination unknown
            </div>

            <AssetImage
              webp="/rocket.webp"
              png="/rocket.png"
              alt="Rocket"
              width={300}
              height={450}
              className="game-vehicle game-rocket"
            />

            <AssetImage
              webp="/plane.webp"
              png="/plane.png"
              alt="Plane"
              width={620}
              height={400}
              className="game-vehicle game-plane"
            />

            <div className="game-people">

              <AssetImage
                webp="/homie-1.webp"
                png="/homie-1.png"
                alt="Homie 1"
                width={290}
                height={430}
                className="game-person"
                priority
              />

              <AssetImage
                webp="/homie-2.webp"
                png="/homie-2.png"
                alt="Homie 2"
                width={290}
                height={430}
                className="game-person"
                priority
              />

              <AssetImage
                webp="/homie-3.webp"
                png="/homie-3.png"
                alt="Homie 3"
                width={290}
                height={430}
                className="game-person"
                priority
              />

            </div>
          </section>
        </main>

        <div className="game-corner">
          <span className="game-corner-dot" />
          Flight system ready
        </div>

        {/* ROLE SELECTION */}

        {rolePanelOpen && (
          <div
            className="game-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) {
                setRolePanelOpen(false);
              }
            }}
          >
            <div
              className="game-role-screen"
              role="dialog"
              aria-modal="true"
              aria-labelledby="game-role-title"
            >

              <button
                type="button"
                className="game-close"
                aria-label="Close"
                onClick={() => setRolePanelOpen(false)}
              >
                ×
              </button>

              <div className="game-role-header">

                <p className="game-role-kicker">
                  Before takeoff
                </p>

                <h2
                  id="game-role-title"
                  className="game-role-title"
                >
                  Choose your role
                </h2>

              </div>

              <div className="game-role-grid">

                <button
                  type="button"
                  className="game-role"
                  onClick={() => selectRole('pilot')}
                >
                  <span className="game-role-number">
                    01
                  </span>

                  <span className="game-role-content">
                    <span className="game-role-name">
                      Pilot
                    </span>

                    <span className="game-role-description">
                      Take control. Pick your destination and
                      fly the crew there.
                    </span>

                    <span className="game-role-enter">
                      Enter cockpit →
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="game-role"
                  onClick={() => selectRole('homie')}
                >
                  <span className="game-role-number">
                    02
                  </span>

                  <span className="game-role-content">
                    <span className="game-role-name">
                      Homie
                    </span>

                    <span className="game-role-description">
                      Get picked up. Travel with your crew
                      and see where they take you.
                    </span>

                    <span className="game-role-enter">
                      Join the crew →
                    </span>
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
