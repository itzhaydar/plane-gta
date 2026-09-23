import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store';

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
        className="landing-asset-placeholder"
        style={{ width, height }}
        aria-label={`${alt} placeholder`}
      >
        {alt}
      </div>
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
  const setRole = useGameStore((state) => state.setRole);

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
        .landing-page {
          min-height: 100vh;
          background: #fff;
          color: #0b1f4a;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          overflow: hidden;
        }

        .landing-bar {
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 5vw;
        }

        .landing-wordmark {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .landing-main {
          min-height: calc(100vh - 72px);
          max-width: 1380px;
          margin: 0 auto;
          padding: 4vh 5vw 7vh;
          display: grid;
          grid-template-columns: minmax(320px, 0.85fr) minmax(520px, 1.15fr);
          align-items: center;
          gap: clamp(30px, 5vw, 90px);
          box-sizing: border-box;
        }

        .landing-copy {
          max-width: 600px;
        }

        .landing-kicker {
          margin: 0 0 18px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.55;
        }

        .landing-title {
          margin: 0;
          max-width: 650px;
          font-size: clamp(48px, 5.5vw, 82px);
          line-height: 0.98;
          letter-spacing: -0.055em;
          font-weight: 800;
        }

        .landing-description {
          max-width: 500px;
          margin: 24px 0 0;
          color: #52627f;
          font-size: clamp(16px, 1.4vw, 19px);
          line-height: 1.55;
        }

        .landing-button {
          margin-top: 32px;
          min-height: 54px;
          padding: 0 28px;
          border: 1px solid #0b1f4a;
          border-radius: 999px;
          background: #0b1f4a;
          color: #fff;
          font: inherit;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition:
            background 160ms ease,
            color 160ms ease,
            transform 160ms ease;
        }

        .landing-button:hover {
          background: #fff;
          color: #0b1f4a;
          transform: translateY(-1px);
        }

        .landing-button:focus-visible,
        .landing-role-button:focus-visible,
        .landing-close:focus-visible {
          outline: 3px solid rgba(11, 31, 74, 0.25);
          outline-offset: 4px;
        }

        .landing-scene {
          min-width: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
          min-height: 470px;
        }

        .landing-vehicle {
          position: absolute;
          object-fit: contain;
          z-index: 1;
          opacity: 0.96;
        }

        .landing-plane {
          width: min(48%, 430px);
          height: auto;
          right: 4%;
          top: 7%;
        }

        .landing-rocket {
          width: min(29%, 250px);
          height: auto;
          left: 3%;
          top: 18%;
        }

        .landing-people {
          width: 82%;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: clamp(0px, 1vw, 16px);
          position: relative;
          z-index: 2;
          margin-top: 100px;
        }

        .landing-person {
          width: 33.33%;
          max-width: 235px;
          height: auto;
          object-fit: contain;
        }

        .landing-asset-placeholder {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed #aeb9cc;
          border-radius: 12px;
          color: #70809e;
          background: #f7f9fc;
          font-size: 11px;
          text-align: center;
          box-sizing: border-box;
        }

        .landing-people .landing-asset-placeholder {
          width: 33.33% !important;
          height: 260px !important;
        }

        .landing-backdrop {
          position: fixed;
          inset: 0;
          z-index: 20;
          background: rgba(11, 31, 74, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
        }

        .landing-modal {
          width: min(440px, 100%);
          padding: 28px;
          background: #fff;
          border: 1px solid #e3e8f0;
          border-radius: 24px;
          box-shadow: 0 24px 80px rgba(11, 31, 74, 0.18);
          position: relative;
          box-sizing: border-box;
        }

        .landing-modal h2 {
          margin: 0;
          font-size: 27px;
          letter-spacing: -0.035em;
        }

        .landing-modal-intro {
          margin: 8px 0 22px;
          color: #687895;
          font-size: 14px;
          line-height: 1.5;
        }

        .landing-role-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 17px 18px;
          margin-top: 10px;
          border: 1px solid #dce2ec;
          border-radius: 14px;
          background: #fff;
          color: #0b1f4a;
          text-align: left;
          cursor: pointer;
          font: inherit;
          transition:
            border-color 160ms ease,
            background 160ms ease,
            transform 160ms ease;
        }

        .landing-role-button:hover {
          border-color: #0b1f4a;
          background: #f7f9fc;
          transform: translateY(-1px);
        }

        .landing-role-name {
          display: block;
          font-size: 16px;
          font-weight: 750;
        }

        .landing-role-description {
          display: block;
          margin-top: 3px;
          color: #71809b;
          font-size: 13px;
        }

        .landing-role-arrow {
          font-size: 20px;
          opacity: 0.5;
        }

        .landing-close {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 50%;
          background: #f3f5f8;
          color: #0b1f4a;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .landing-page {
            overflow: auto;
          }

          .landing-main {
            min-height: auto;
            grid-template-columns: 1fr;
            padding-top: 5vh;
            gap: 48px;
          }

          .landing-copy {
            max-width: 700px;
          }

          .landing-scene {
            min-height: 390px;
          }

          .landing-title {
            font-size: clamp(46px, 10vw, 72px);
          }

          .landing-people {
            width: 88%;
            margin-top: 90px;
          }
        }

        @media (max-width: 600px) {
          .landing-bar {
            height: 64px;
            padding: 0 24px;
          }

          .landing-main {
            padding: 30px 24px 48px;
            gap: 36px;
          }

          .landing-kicker {
            margin-bottom: 14px;
          }

          .landing-title {
            font-size: clamp(43px, 13vw, 62px);
          }

          .landing-description {
            margin-top: 18px;
            font-size: 16px;
          }

          .landing-button {
            width: 100%;
            margin-top: 24px;
          }

          .landing-scene {
            min-height: 360px;
          }

          .landing-people {
            width: 100%;
            gap: 2px;
            margin-top: 75px;
          }

          .landing-person {
            width: 33.33%;
          }

          .landing-plane {
            width: 45%;
            right: 0;
            top: 4%;
          }

          .landing-rocket {
            width: 27%;
            left: 0;
            top: 12%;
          }

          .landing-people .landing-asset-placeholder {
            height: 190px !important;
          }

          .landing-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .landing-modal {
            width: 100%;
            border-radius: 24px 24px 0 0;
            padding: 26px 22px 30px;
          }
        }
      `}</style>

      <div className="landing-page">
        <header className="landing-bar">
          <div className="landing-wordmark">MARSHOUT</div>
        </header>

        <main className="landing-main">
          <section className="landing-copy">
            <p className="landing-kicker">A trip worth taking</p>

            <h1 className="landing-title">
              Pick up your homies. Fly them somewhere new.
            </h1>

            <p className="landing-description">
              Take a plane to a new city or country. Or take a rocket to a
              party on Mars.
            </p>

            <button
              type="button"
              className="landing-button"
              onClick={() => setRolePanelOpen(true)}
            >
              Select game type
            </button>
          </section>

          <section className="landing-scene" aria-label="Plane, rocket and passengers">
            <AssetImage
              webp="/rocket.webp"
              png="/rocket.png"
              alt="Rocket"
              width={250}
              height={400}
              className="landing-vehicle landing-rocket"
            />

            <AssetImage
              webp="/plane.webp"
              png="/plane.png"
              alt="Plane"
              width={430}
              height={280}
              className="landing-vehicle landing-plane"
            />

            <div className="landing-people">
              <AssetImage
                webp="/homie-1.webp"
                png="/homie-1.png"
                alt="Homie 1"
                width={235}
                height={350}
                className="landing-person"
                priority
              />

              <AssetImage
                webp="/homie-2.webp"
                png="/homie-2.png"
                alt="Homie 2"
                width={235}
                height={350}
                className="landing-person"
                priority
              />

              <AssetImage
                webp="/homie-3.webp"
                png="/homie-3.png"
                alt="Homie 3"
                width={235}
                height={350}
                className="landing-person"
                priority
              />
            </div>
          </section>
        </main>
      </div>

      {rolePanelOpen && (
        <div
          className="landing-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setRolePanelOpen(false);
            }
          }}
        >
          <div
            className="landing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-role-title"
          >
            <button
              type="button"
              className="landing-close"
              aria-label="Close game type selection"
              onClick={() => setRolePanelOpen(false)}
            >
              ×
            </button>

            <h2 id="landing-role-title">How are you playing?</h2>

            <p className="landing-modal-intro">
              Choose your role before heading into the hangar.
            </p>

            <button
              type="button"
              className="landing-role-button"
              onClick={() => selectRole('pilot')}
            >
              <span>
                <span className="landing-role-name">Pilot</span>
                <span className="landing-role-description">
                  Fly the plane or rocket
                </span>
              </span>
              <span className="landing-role-arrow" aria-hidden="true">
                →
              </span>
            </button>

            <button
              type="button"
              className="landing-role-button"
              onClick={() => selectRole('homie')}
            >
              <span>
                <span className="landing-role-name">Homie</span>
                <span className="landing-role-description">
                  Get picked up on a plane or rocket
                </span>
              </span>
              <span className="landing-role-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
