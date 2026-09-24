export default function Homie() {
  return (
    <main className="coming-soon">
      <div className="glow" />

      <div className="content">
        <h1>COMING SOON</h1>
        <p>Check back in a few hours.</p>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .coming-soon {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at center,
              #20242a 0%,
              #101216 45%,
              #08090b 100%
            );
          color: #fff;
          font-family: Inter, system-ui, sans-serif;
        }

        .glow {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          filter: blur(100px);
          animation: breathe 4s ease-in-out infinite;
        }

        .content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 24px;
        }

        h1 {
          margin: 0;
          font-size: clamp(3.5rem, 10vw, 9rem);
          line-height: 0.85;
          font-weight: 900;
          letter-spacing: -0.07em;
          text-transform: uppercase;
          background: linear-gradient(
            180deg,
            #ffffff 0%,
            #bfc3c9 48%,
            #686c72 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        p {
          margin: 28px 0 0;
          color: rgba(255, 255, 255, 0.48);
          font-size: 14px;
          letter-spacing: 0.08em;
        }

        @keyframes breathe {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.5;
          }

          50% {
            transform: scale(1.1);
            opacity: 0.9;
          }
        }
      `}</style>
    </main>
  );
}
