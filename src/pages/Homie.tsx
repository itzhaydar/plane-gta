import { useMemo, useRef, useState, type ChangeEvent } from 'react';
type Vehicle = 'Plane' | 'Rocket';
type DefaultPerson = 'man' | 'mann' | 'woman';

const DEFAULT_PEOPLE: Array<{ id: DefaultPerson; label: string; src: string }> = [
  { id: 'man', label: 'MAN', src: '/man.webp' },
  { id: 'mann', label: 'MANN', src: '/mann.webp' },
  { id: 'woman', label: 'WOMAN', src: '/woman.webp' },
];

const DEFAULT_DESTINATION = 'Los Angeles';

export default function Homie() {
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const [vehicle, setVehicle] = useState<Vehicle>('Plane');
  const [selectedPerson, setSelectedPerson] = useState<DefaultPerson>('man');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const personImage = useMemo(() => {
    if (uploadedImage) return uploadedImage;
    return (
      DEFAULT_PEOPLE.find((person) => person.id === selectedPerson)?.src ??
      '/man.webp'
    );
  }, [selectedPerson, uploadedImage]);

  const chooseDefaultPerson = (id: DefaultPerson) => {
    setSelectedPerson(id);
    setUploadedImage(null);
    setUploadName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setUploadedImage(reader.result);
      setUploadName(file.name);
    };

    reader.readAsDataURL(file);
  };

  const reset = () => {
    setDestination(DEFAULT_DESTINATION);
    setVehicle('Plane');
    setSelectedPerson('man');
    setUploadedImage(null);
    setUploadName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadFlyer = async () => {
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = src;
        });

      const drawCover = (
        image: HTMLImageElement,
        x: number,
        y: number,
        width: number,
        height: number,
      ) => {
        const scale = Math.max(width / image.width, height / image.height);
        const sourceWidth = width / scale;
        const sourceHeight = height / scale;
        const sourceX = (image.width - sourceWidth) / 2;
        const sourceY = (image.height - sourceHeight) / 2;

        ctx.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          x,
          y,
          width,
          height,
        );
      };

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
      gradient.addColorStop(0, '#06152d');
      gradient.addColorStop(0.58, '#0b2a52');
      gradient.addColorStop(1, '#06111f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1350);

      // Decorative grid
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 1080; x += 72) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1350);
        ctx.stroke();
      }
      for (let y = 0; y <= 1350; y += 72) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1080, y);
        ctx.stroke();
      }
      ctx.restore();

      // Gold accent
      ctx.fillStyle = '#d3a252';
      ctx.fillRect(72, 72, 90, 8);

      // Brand
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px Inter, Arial, sans-serif';
      ctx.fillText('MARSHOUT', 72, 132);

      ctx.fillStyle = 'rgba(255,255,255,.58)';
      ctx.font = '800 18px Inter, Arial, sans-serif';
      ctx.fillText('DESIGN WHERE YOU WANNA BE TAKEN', 72, 170);

      // Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 86px Inter, Arial, sans-serif';
      ctx.fillText('TAKE ME TO', 72, 300);

      ctx.fillStyle = '#d3a252';
      ctx.font = '900 86px Inter, Arial, sans-serif';

      const printableDestination =
        destination.trim() || DEFAULT_DESTINATION;

      const maxWidth = 900;
      let destinationFontSize = 86;
      while (
        ctx.measureText(printableDestination.toUpperCase()).width > maxWidth &&
        destinationFontSize > 44
      ) {
        destinationFontSize -= 2;
        ctx.font = `900 ${destinationFontSize}px Inter, Arial, sans-serif`;
      }

      ctx.fillText(printableDestination.toUpperCase(), 72, 395);

      // Person portrait
      const image = await loadImage(personImage);
      const portraitX = 480;
      const portraitY = 485;
      const portraitW = 528;
      const portraitH = 690;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(portraitX, portraitY, portraitW, portraitH, 28);
      ctx.clip();
      drawCover(image, portraitX, portraitY, portraitW, portraitH);
      ctx.restore();

      ctx.strokeStyle = 'rgba(255,255,255,.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(portraitX, portraitY, portraitW, portraitH, 28);
      ctx.stroke();

      // Trip details
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '800 18px Inter, Arial, sans-serif';
      ctx.fillText('DESTINATION', 72, 570);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px Inter, Arial, sans-serif';
      ctx.fillText(printableDestination, 72, 615);

      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '800 18px Inter, Arial, sans-serif';
      ctx.fillText('VEHICLE', 72, 700);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px Inter, Arial, sans-serif';
      ctx.fillText(vehicle, 72, 745);

      // Vehicle badge
      ctx.fillStyle = '#d3a252';
      ctx.beginPath();
      ctx.roundRect(72, 810, 310, 72, 12);
      ctx.fill();

      ctx.fillStyle = '#071a38';
      ctx.font = '900 22px Inter, Arial, sans-serif';
      ctx.fillText(
        vehicle === 'Plane' ? '✈  FLY WITH ME' : '▲  LAUNCH WITH ME',
        98,
        856,
      );

      // Footer
      ctx.fillStyle = 'rgba(255,255,255,.42)';
      ctx.font = '800 17px Inter, Arial, sans-serif';
      ctx.fillText('YOUR TRIP. YOUR VEHICLE. YOUR FLYER.', 72, 1265);

      ctx.fillStyle = '#d3a252';
      ctx.fillRect(72, 1295, 936, 4);

      const link = document.createElement('a');
      link.download = `marshout-${printableDestination
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}-${vehicle.toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png', 1);
      link.click();
    } catch (error) {
      console.error(error);
      alert('Could not export the flyer. Please try another image.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="homie">
      <style>{HOMIE_CSS}</style>

      <section className="homie-shell">
        <header className="homie-header">
          <div>
            <span className="homie-kicker">MARSHOUT / FLYER MAKER</span>
            <h1>Design where you wanna be taken.</h1>
          </div>

          <button type="button" className="homie-reset" onClick={reset}>
            RESET
          </button>
        </header>

        <div className="homie-workspace">
          <aside className="homie-controls">
            <section className="homie-control-section">
              <div className="homie-section-number">01</div>
              <div className="homie-control-content">
                <label className="homie-label" htmlFor="destination">
                  WHERE ARE WE GOING?
                </label>

                <input
                  id="destination"
                  className="homie-input"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Los Angeles"
                  maxLength={42}
                />
              </div>
            </section>

            <section className="homie-control-section">
              <div className="homie-section-number">02</div>
              <div className="homie-control-content">
                <span className="homie-label">CHOOSE YOUR VEHICLE</span>

                <div className="homie-vehicle-grid">
                  {(['Plane', 'Rocket'] as Vehicle[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`homie-vehicle ${
                        vehicle === item ? 'is-active' : ''
                      }`}
                      onClick={() => setVehicle(item)}
                    >
                      <span className="homie-vehicle-icon">
                        {item === 'Plane' ? '✈' : '▲'}
                      </span>
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="homie-control-section">
              <div className="homie-section-number">03</div>
              <div className="homie-control-content">
                <span className="homie-label">WHO'S FLYING?</span>

                <div className="homie-people">
                  {DEFAULT_PEOPLE.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      className={`homie-person ${
                        !uploadedImage && selectedPerson === person.id
                          ? 'is-active'
                          : ''
                      }`}
                      onClick={() => chooseDefaultPerson(person.id)}
                      aria-label={`Use ${person.label}`}
                    >
                      <img src={person.src} alt="" />
                      <span>{person.label}</span>
                    </button>
                  ))}
                </div>

                <div className="homie-or">
                  <span />
                  <strong>OR</strong>
                  <span />
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="homie-file-input"
                  onChange={handleUpload}
                />

                <button
                  type="button"
                  className={`homie-upload ${
                    uploadedImage ? 'is-active' : ''
                  }`}
                  onClick={() => fileRef.current?.click()}
                >
                  <span className="homie-upload-icon">＋</span>
                  <span>
                    <strong>
                      {uploadedImage ? 'YOUR IMAGE SELECTED' : 'UPLOAD YOUR IMAGE'}
                    </strong>
                    <small>
                      {uploadName || 'PNG, JPG or WEBP'}
                    </small>
                  </span>
                </button>
              </div>
            </section>
          </aside>

          <section className="homie-editor">
            <div className="homie-editor-top">
              <div>
                <span className="homie-live-dot" />
                LIVE FLYER
              </div>

              <span>1080 × 1350</span>
            </div>

            <div className="homie-stage">
              <article className="homie-flyer">
                <div className="homie-flyer-grid" />
                <div className="homie-flyer-glow" />

                <div className="homie-brand">
                  <span className="homie-brand-line" />
                  <strong>MARSHOUT</strong>
                  <small>DESIGN WHERE YOU WANNA BE TAKEN</small>
                </div>

                <div className="homie-headline">
                  <span>TAKE ME TO</span>
                  <strong>{destination.trim() || DEFAULT_DESTINATION}</strong>
                </div>

                <div className="homie-details">
                  <div>
                    <small>DESTINATION</small>
                    <strong>{destination.trim() || DEFAULT_DESTINATION}</strong>
                  </div>

                  <div>
                    <small>VEHICLE</small>
                    <strong>{vehicle}</strong>
                  </div>

                  <div className="homie-trip-badge">
                    <span>{vehicle === 'Plane' ? '✈' : '▲'}</span>
                    {vehicle === 'Plane' ? 'FLY WITH ME' : 'LAUNCH WITH ME'}
                  </div>
                </div>

                <div className="homie-person-preview">
                  <img src={personImage} alt="Selected flyer person" />
                </div>

                <div className="homie-flyer-footer">
                  <span>YOUR TRIP. YOUR VEHICLE. YOUR FLYER.</span>
                </div>
              </article>
            </div>

            <div className="homie-actions">
              <div className="homie-summary">
                <span>{destination.trim() || DEFAULT_DESTINATION}</span>
                <i />
                <span>{vehicle}</span>
                <i />
                <span>{uploadedImage ? 'Custom photo' : selectedPerson}</span>
              </div>

              <button
                type="button"
                className="homie-download"
                onClick={downloadFlyer}
                disabled={isDownloading}
              >
                <span>{isDownloading ? 'EXPORTING...' : 'DOWNLOAD FLYER'}</span>
                <span>↓</span>
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

const HOMIE_CSS = `
  * {
    box-sizing: border-box;
  }

  .homie {
    min-height: 100vh;
    min-height: 100svh;
    background:
      radial-gradient(circle at 78% 18%, rgba(21, 63, 108, .07), transparent 28%),
      #f7f9fb;
    color: #071a38;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .homie-shell {
    width: min(1500px, calc(100% - 48px));
    margin: 0 auto;
    padding: 34px 0 44px;
  }

  .homie-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 30px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(7, 26, 56, .1);
  }

  .homie-kicker {
    display: block;
    margin-bottom: 8px;
    color: #a77531;
    font-size: 9px;
    font-weight: 950;
    letter-spacing: .19em;
  }

  .homie-header h1 {
    margin: 0;
    max-width: 720px;
    color: #071a38;
    font-size: clamp(28px, 3vw, 52px);
    line-height: .98;
    letter-spacing: -.055em;
  }

  .homie-reset {
    padding: 11px 15px;
    border: 1px solid rgba(7, 26, 56, .12);
    border-radius: 7px;
    background: #fff;
    color: rgba(7, 26, 56, .52);
    font-size: 9px;
    font-weight: 950;
    letter-spacing: .15em;
    cursor: pointer;
  }

  .homie-workspace {
    display: grid;
    grid-template-columns: minmax(330px, .78fr) minmax(560px, 1.35fr);
    gap: 24px;
    padding-top: 24px;
  }

  .homie-controls,
  .homie-editor {
    border: 1px solid rgba(7, 26, 56, .09);
    border-radius: 10px;
    background: rgba(255, 255, 255, .9);
    box-shadow: 0 22px 60px rgba(7, 26, 56, .065);
  }

  .homie-controls {
    padding: 6px 26px;
  }

  .homie-control-section {
    display: grid;
    grid-template-columns: 38px 1fr;
    gap: 14px;
    padding: 27px 0;
    border-bottom: 1px solid rgba(7, 26, 56, .08);
  }

  .homie-control-section:last-child {
    border-bottom: 0;
  }

  .homie-section-number {
    padding-top: 2px;
    color: #c08b43;
    font-size: 9px;
    font-weight: 950;
    letter-spacing: .08em;
  }

  .homie-control-content {
    min-width: 0;
  }

  .homie-label {
    display: block;
    margin-bottom: 12px;
    color: rgba(7, 26, 56, .48);
    font-size: 9px;
    font-weight: 950;
    letter-spacing: .14em;
  }

  .homie-input {
    width: 100%;
    height: 52px;
    padding: 0 15px;
    outline: none;
    border: 1px solid rgba(7, 26, 56, .13);
    border-radius: 7px;
    background: #fbfcfd;
    color: #071a38;
    font: inherit;
    font-size: 16px;
    font-weight: 800;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .homie-input:focus {
    border-color: #173f6d;
    box-shadow: 0 0 0 3px rgba(23, 63, 109, .08);
  }

  .homie-vehicle-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
  }

  .homie-vehicle {
    height: 78px;
    border: 1px solid rgba(7, 26, 56, .1);
    border-radius: 8px;
    background: #f9fbfc;
    color: rgba(7, 26, 56, .5);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 6px;
    padding: 0 16px;
    font-size: 12px;
    font-weight: 900;
    transition: 150ms ease;
  }

  .homie-vehicle:hover {
    transform: translateY(-2px);
    border-color: rgba(192, 139, 67, .5);
  }

  .homie-vehicle.is-active {
    border-color: #0b2a52;
    background: #0b2a52;
    color: #fff;
  }

  .homie-vehicle-icon {
    color: #c8944e;
    font-size: 22px;
  }

  .homie-people {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .homie-person {
    position: relative;
    min-width: 0;
    height: 116px;
    padding: 0;
    overflow: hidden;
    border: 2px solid transparent;
    border-radius: 8px;
    background: #e9eef2;
    cursor: pointer;
  }

  .homie-person img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center top;
  }

  .homie-person span {
    position: absolute;
    left: 7px;
    bottom: 7px;
    padding: 5px 7px;
    border-radius: 4px;
    background: rgba(5, 18, 38, .76);
    color: #fff;
    font-size: 7px;
    font-weight: 950;
    letter-spacing: .12em;
    backdrop-filter: blur(8px);
  }

  .homie-person.is-active {
    border-color: #c8944e;
    box-shadow: 0 0 0 3px rgba(200, 148, 78, .13);
  }

  .homie-or {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
    margin: 16px 0;
  }

  .homie-or span {
    height: 1px;
    background: rgba(7, 26, 56, .08);
  }

  .homie-or strong {
    color: rgba(7, 26, 56, .3);
    font-size: 7px;
    letter-spacing: .15em;
  }

  .homie-file-input {
    display: none;
  }

  .homie-upload {
    width: 100%;
    min-height: 68px;
    padding: 12px 14px;
    border: 1px dashed rgba(7, 26, 56, .2);
    border-radius: 8px;
    background: #f9fbfc;
    color: #071a38;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
  }

  .homie-upload.is-active {
    border-color: #c8944e;
    background: rgba(200, 148, 78, .07);
  }

  .homie-upload-icon {
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #0b2a52;
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 18px;
  }

  .homie-upload strong,
  .homie-upload small {
    display: block;
  }

  .homie-upload strong {
    font-size: 9px;
    letter-spacing: .1em;
  }

  .homie-upload small {
    max-width: 210px;
    margin-top: 4px;
    overflow: hidden;
    color: rgba(7, 26, 56, .42);
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .homie-editor {
    min-width: 0;
    padding: 18px;
  }

  .homie-editor-top {
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: rgba(7, 26, 56, .4);
    font-size: 8px;
    font-weight: 950;
    letter-spacing: .15em;
  }

  .homie-editor-top > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .homie-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #c8944e;
    box-shadow: 0 0 0 4px rgba(200, 148, 78, .1);
  }

  .homie-stage {
    min-height: 660px;
    padding: 34px;
    border-radius: 8px;
    background:
      linear-gradient(rgba(7, 26, 56, .035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(7, 26, 56, .035) 1px, transparent 1px),
      #edf2f5;
    background-size: 32px 32px;
    display: grid;
    place-items: center;
  }

  .homie-flyer {
    position: relative;
    width: min(100%, 510px);
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: 3px;
    background:
      radial-gradient(circle at 76% 36%, rgba(55, 113, 168, .35), transparent 27%),
      linear-gradient(145deg, #06152d, #0b2a52 58%, #06111f);
    box-shadow: 0 28px 70px rgba(7, 26, 56, .25);
    isolation: isolate;
  }

  .homie-flyer-grid {
    position: absolute;
    inset: 0;
    z-index: -2;
    opacity: .13;
    background-image:
      linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px);
    background-size: 34px 34px;
  }

  .homie-flyer-glow {
    position: absolute;
    width: 420px;
    height: 420px;
    right: -150px;
    top: 80px;
    z-index: -1;
    border-radius: 50%;
    background: rgba(63, 137, 204, .16);
    filter: blur(28px);
  }

  .homie-brand {
    position: absolute;
    top: 7%;
    left: 7%;
    display: grid;
    grid-template-columns: 38px auto;
    align-items: center;
    column-gap: 9px;
  }

  .homie-brand-line {
    width: 38px;
    height: 3px;
    background: #d3a252;
  }

  .homie-brand strong {
    color: #fff;
    font-size: clamp(12px, 1.2vw, 17px);
    letter-spacing: .03em;
  }

  .homie-brand small {
    grid-column: 2;
    margin-top: 3px;
    color: rgba(255,255,255,.5);
    font-size: clamp(5px, .55vw, 7px);
    font-weight: 900;
    letter-spacing: .12em;
  }

  .homie-headline {
    position: absolute;
    top: 18%;
    left: 7%;
    right: 7%;
    z-index: 5;
  }

  .homie-headline span,
  .homie-headline strong {
    display: block;
    text-transform: uppercase;
  }

  .homie-headline span {
    color: #fff;
    font-size: clamp(25px, 3.3vw, 46px);
    font-weight: 950;
    line-height: .92;
    letter-spacing: -.05em;
  }

  .homie-headline strong {
    max-width: 92%;
    margin-top: 4px;
    color: #d3a252;
    font-size: clamp(24px, 3vw, 43px);
    font-weight: 950;
    line-height: .95;
    letter-spacing: -.05em;
    overflow-wrap: anywhere;
  }

  .homie-details {
    position: absolute;
    z-index: 4;
    left: 7%;
    bottom: 17%;
    width: 34%;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .homie-details small,
  .homie-details strong {
    display: block;
  }

  .homie-details small {
    margin-bottom: 3px;
    color: rgba(255,255,255,.45);
    font-size: clamp(5px, .55vw, 7px);
    font-weight: 950;
    letter-spacing: .13em;
  }

  .homie-details strong {
    color: #fff;
    font-size: clamp(11px, 1.25vw, 17px);
    line-height: 1.05;
  }

  .homie-trip-badge {
    width: max-content;
    max-width: 100%;
    margin-top: 5px;
    padding: 9px 11px;
    border-radius: 5px;
    background: #d3a252;
    color: #071a38;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: clamp(6px, .65vw, 9px);
    font-weight: 950;
    letter-spacing: .07em;
  }

  .homie-person-preview {
    position: absolute;
    z-index: 2;
    right: 6%;
    bottom: 10%;
    width: 49%;
    height: 54%;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 13px;
    background: #102d4d;
    box-shadow: 0 18px 45px rgba(0,0,0,.22);
  }

  .homie-person-preview img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center top;
  }

  .homie-flyer-footer {
    position: absolute;
    left: 7%;
    right: 7%;
    bottom: 5.5%;
    padding-top: 9px;
    border-top: 2px solid #d3a252;
    color: rgba(255,255,255,.42);
    font-size: clamp(5px, .55vw, 7px);
    font-weight: 950;
    letter-spacing: .12em;
  }

  .homie-actions {
    min-height: 66px;
    padding-top: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .homie-summary {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(7, 26, 56, .42);
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .homie-summary i {
    width: 3px;
    height: 3px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #c8944e;
  }

  .homie-download {
    min-width: 190px;
    height: 48px;
    padding: 0 17px;
    border: 0;
    border-radius: 7px;
    background: #0a2850;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 950;
    letter-spacing: .11em;
    box-shadow: 0 12px 25px rgba(7, 26, 56, .15);
    transition: 150ms ease;
  }

  .homie-download:hover:not(:disabled) {
    transform: translateY(-2px);
    background: #123b6b;
  }

  .homie-download:disabled {
    opacity: .6;
    cursor: wait;
  }

  @media (max-width: 980px) {
    .homie-workspace {
      grid-template-columns: 1fr;
    }

    .homie-stage {
      min-height: 620px;
    }
  }

  @media (max-width: 620px) {
    .homie-shell {
      width: min(100% - 28px, 1500px);
      padding-top: 22px;
    }

    .homie-header {
      align-items: flex-start;
    }

    .homie-reset {
      flex: 0 0 auto;
    }

    .homie-controls {
      padding: 4px 18px;
    }

    .homie-control-section {
      grid-template-columns: 28px 1fr;
      gap: 8px;
    }

    .homie-stage {
      min-height: 0;
      padding: 18px;
    }

    .homie-flyer {
      width: 100%;
    }

    .homie-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .homie-summary {
      flex-wrap: wrap;
    }

    .homie-download {
      width: 100%;
    }
  }
`;
