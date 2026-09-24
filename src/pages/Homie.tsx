import {
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import ImageEditor from '@unlayer/react-image-editor';

type Vehicle = 'Plane' | 'Rocket';
type PersonId = 'man' | 'mann' | 'woman';

const PEOPLE = [
  { id: 'man' as PersonId, label: 'MAN', src: '/man.webp' },
  { id: 'mann' as PersonId, label: 'MANN', src: '/mann.webp' },
  { id: 'woman' as PersonId, label: 'WOMAN', src: '/woman.webp' },
];

const DEFAULT_CITY = 'Los Angeles';

export default function Homie() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [vehicle, setVehicle] = useState<Vehicle>('Plane');
  const [person, setPerson] = useState<PersonId>('man');
  const [portraitSrc, setPortraitSrc] = useState('/man.webp');
  const [uploaded, setUploaded] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [editorOpen, setEditorOpen] = useState(true);
  const [portraitEdited, setPortraitEdited] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fileInput = useRef<HTMLInputElement | null>(null);
  const destination = city.trim() || DEFAULT_CITY;

  const pickPerson = (id: PersonId, src: string) => {
    setPerson(id);
    setPortraitSrc(src);
    setUploaded(false);
    setUploadName('');
    setPortraitEdited(false);
    setEditorOpen(true);

    if (fileInput.current) {
      fileInput.current.value = '';
    }
  };

  const uploadPortrait = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];

    if (!validTypes.includes(file.type)) {
      alert('Please upload PNG, JPG or WEBP.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') return;

      setPortraitSrc(reader.result);
      setUploaded(true);
      setUploadName(file.name);
      setPortraitEdited(false);
      setEditorOpen(true);
    };

    reader.readAsDataURL(file);
  };

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });

  const drawCover = (
    ctx: CanvasRenderingContext2D,
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

  const downloadFlyer = async () => {
    if (!portraitEdited) {
      setEditorOpen(true);
      return;
    }

    setExporting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available.');

      const background = ctx.createLinearGradient(0, 0, 1080, 1350);
      background.addColorStop(0, '#06152d');
      background.addColorStop(0.58, '#0b2a52');
      background.addColorStop(1, '#06111f');

      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 1080, 1350);

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

      ctx.fillStyle = '#d3a252';
      ctx.fillRect(72, 72, 90, 8);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px Arial, sans-serif';
      ctx.fillText('MARSHOUT', 72, 132);

      ctx.fillStyle = 'rgba(255,255,255,.58)';
      ctx.font = '800 18px Arial, sans-serif';
      ctx.fillText('DESIGN WHERE YOU WANNA BE TAKEN', 72, 170);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 86px Arial, sans-serif';
      ctx.fillText('TAKE ME TO', 72, 300);

      let cityFontSize = 86;
      ctx.fillStyle = '#d3a252';
      ctx.font = `900 ${cityFontSize}px Arial, sans-serif`;

      while (
        ctx.measureText(destination.toUpperCase()).width > 900 &&
        cityFontSize > 42
      ) {
        cityFontSize -= 2;
        ctx.font = `900 ${cityFontSize}px Arial, sans-serif`;
      }

      ctx.fillText(destination.toUpperCase(), 72, 395);

      const portrait = await loadImage(portraitSrc);
      const portraitX = 480;
      const portraitY = 485;
      const portraitWidth = 528;
      const portraitHeight = 690;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(
        portraitX,
        portraitY,
        portraitWidth,
        portraitHeight,
        28,
      );
      ctx.clip();

      drawCover(
        ctx,
        portrait,
        portraitX,
        portraitY,
        portraitWidth,
        portraitHeight,
      );

      ctx.restore();

      ctx.strokeStyle = 'rgba(255,255,255,.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(
        portraitX,
        portraitY,
        portraitWidth,
        portraitHeight,
        28,
      );
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '800 18px Arial, sans-serif';
      ctx.fillText('DESTINATION', 72, 570);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px Arial, sans-serif';
      ctx.fillText(destination, 72, 615);

      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '800 18px Arial, sans-serif';
      ctx.fillText('VEHICLE', 72, 700);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px Arial, sans-serif';
      ctx.fillText(vehicle, 72, 745);

      ctx.fillStyle = '#d3a252';
      ctx.beginPath();
      ctx.roundRect(72, 810, 310, 72, 12);
      ctx.fill();

      ctx.fillStyle = '#071a38';
      ctx.font = '900 22px Arial, sans-serif';
      ctx.fillText(
        vehicle === 'Plane' ? 'FLY WITH ME' : 'LAUNCH WITH ME',
        98,
        856,
      );

      ctx.fillStyle = 'rgba(255,255,255,.42)';
      ctx.font = '800 17px Arial, sans-serif';
      ctx.fillText('YOUR TRIP. YOUR VEHICLE. YOUR FLYER.', 72, 1265);

      ctx.fillStyle = '#d3a252';
      ctx.fillRect(72, 1295, 936, 4);

      const link = document.createElement('a');
      link.download = `marshout-${destination
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}-${vehicle.toLowerCase()}.png`;

      link.href = canvas.toDataURL('image/png', 1);
      link.click();
    } catch (error) {
      console.error(error);
      alert('Could not export the flyer.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="homie">
      <style>{CSS}</style>

      <section className="shell">
        <header className="header">
          <div>
            <span className="kicker">MARSHOUT / FLYER MAKER</span>
            <h1>Design where you wanna be taken.</h1>
          </div>

          <div className="headerMeta">
            <span>FLYER STUDIO</span>
            <b>1080 × 1350</b>
          </div>
        </header>

        <div className="workspace">
          <aside className="leftColumn">
            <div className="controls">
              <Step number="01" title="WHERE ARE WE GOING?">
                <input
                  className="city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Los Angeles"
                  maxLength={42}
                />
              </Step>

              <Step number="02" title="CHOOSE YOUR VEHICLE">
                <div className="vehicles">
                  {(['Plane', 'Rocket'] as Vehicle[]).map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`vehicle ${vehicle === item ? 'active' : ''}`}
                      onClick={() => setVehicle(item)}
                    >
                      <b>{item === 'Plane' ? '✈' : '▲'}</b>
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </Step>

              <Step number="03" title="WHO’S FLYING?">
                <div className="people">
                  {PEOPLE.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`person ${
                        !uploaded && person === item.id ? 'active' : ''
                      }`}
                      onClick={() => pickPerson(item.id, item.src)}
                    >
                      <img src={item.src} alt={item.label} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="or">
                  <i />
                  <b>OR</b>
                  <i />
                </div>

                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={uploadPortrait}
                />

                <button
                  type="button"
                  className={`upload ${uploaded ? 'active' : ''}`}
                  onClick={() => fileInput.current?.click()}
                >
                  <b>＋</b>

                  <span>
                    <strong>
                      {uploaded ? 'YOUR IMAGE SELECTED' : 'UPLOAD YOUR IMAGE'}
                    </strong>
                    <small>{uploadName || 'PNG, JPG or WEBP'}</small>
                  </span>
                </button>
              </Step>
            </div>

            <section className="editorPanel">
              <div className="panelTop">
                <div>
                  <span className="panelKicker">IMAGE EDITOR</span>
                  <strong>
                    {portraitEdited
                      ? 'Portrait signed — download unlocked'
                      : 'Sign or edit your image to unlock download'}
                  </strong>
                </div>

                <div className="selectedFace">
                  <img src={portraitSrc} alt="" />
                  <span>SELECTED</span>
                </div>
              </div>

              {editorOpen ? (
                <div className="editorBox">
                  <ImageEditor
                    key={portraitSrc}
                    image={portraitSrc}
                    minHeight="520px"
                    options={{
                      theme: 'light',
                      features: {
                        imageEditor: {
                          tools: {
                            crop: true,
                            resize: true,
                            filter: true,
                            draw: true,
                            text: true,
                            shapes: true,
                            stickers: true,
                            frame: true,
                          },
                        },
                      },
                    }}
                    onSave={({
                      dataUrl,
                    }: {
                      dataUrl: string;
                    }) => {
                      setPortraitSrc(dataUrl);
                      setPortraitEdited(true);
                      setEditorOpen(false);
                    }}
                    onCancel={() => setEditorOpen(false)}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="reopenEditor"
                  onClick={() => setEditorOpen(true)}
                >
                  <img src={portraitSrc} alt="" />

                  <span>
                    <strong>EDIT PORTRAIT</strong>
                    <small>Crop, filter, draw, text & more</small>
                  </span>

                  <b>→</b>
                </button>
              )}
            </section>
          </aside>

          <section className="right">
            <div className="rightTop">
              <div>
                <i />
                <span>LIVE FLYER</span>
              </div>

              <span>1080 × 1350</span>
            </div>

            <div className="stage">
              <article className="flyer">
                <div className="grid" />

                <div className="brand">
                  <i />
                  <strong>MARSHOUT</strong>
                  <small>DESIGN WHERE YOU WANNA BE TAKEN</small>
                </div>

                <div className="headline">
                  <span>TAKE ME TO</span>
                  <strong>{destination}</strong>
                </div>

                <div className="meta">
                  <small>DESTINATION</small>
                  <strong>{destination}</strong>

                  <small>VEHICLE</small>
                  <strong>{vehicle}</strong>

                  <div className="goldButton">
                    {vehicle === 'Plane'
                      ? '✈ FLY WITH ME'
                      : '▲ LAUNCH WITH ME'}
                  </div>
                </div>

                <button
                  type="button"
                  className="portrait"
                  onClick={() => setEditorOpen(true)}
                  aria-label="Edit portrait"
                >
                  <img src={portraitSrc} alt="Selected portrait" />
                  <span>EDIT PORTRAIT</span>
                </button>

                <footer>
                  YOUR TRIP. YOUR VEHICLE. YOUR FLYER.
                </footer>
              </article>
            </div>

            <div className="actions">
              <button
                type="button"
                className="editAgain"
                onClick={() => setEditorOpen(true)}
              >
                {portraitEdited ? 'EDIT AGAIN' : 'SIGN / EDIT IMAGE'}
              </button>

              {portraitEdited ? (
                <button
                  type="button"
                  className="download downloadIcon"
                  disabled={exporting}
                  onClick={downloadFlyer}
                  aria-label="Download flyer"
                  title="Download flyer"
                >
                  {exporting ? (
                    <span className="exportingText">...</span>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="downloadSvg"
                    >
                      <path
                        d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ) : (
                <div className="downloadLocked">
                  To download, sign your image or make an edit in the editor below.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="step">
      <div className="number">{number}</div>

      <div>
        <label>{title}</label>
        {children}
      </div>
    </section>
  );
}

const CSS = `
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

.homie button,
.homie input {
  font: inherit;
}

.shell {
  width: min(1600px, calc(100% - 48px));
  margin: 0 auto;
  padding: 28px 0 42px;
}

.header {
  min-height: 90px;
  padding-bottom: 22px;
  border-bottom: 1px solid rgba(7, 26, 56, .1);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.kicker,
.panelKicker {
  display: block;
  margin-bottom: 8px;
  color: #a77531;
  font-size: 9px;
  font-weight: 950;
  letter-spacing: .19em;
}

.header h1 {
  margin: 0;
  max-width: 720px;
  color: #071a38;
  font-size: clamp(30px, 3vw, 52px);
  line-height: .98;
  letter-spacing: -.055em;
}

.headerMeta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  color: rgba(7, 26, 56, .4);
  font-size: 8px;
  font-weight: 950;
  letter-spacing: .14em;
}

.headerMeta b {
  color: #071a38;
  font-size: 10px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(480px, .95fr) minmax(560px, 1.05fr);
  gap: 22px;
  padding-top: 22px;
  align-items: start;
}

.leftColumn {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls,
.editorPanel,
.right {
  min-width: 0;
  border: 1px solid rgba(7, 26, 56, .09);
  border-radius: 10px;
  background: rgba(255, 255, 255, .96);
  box-shadow: 0 22px 60px rgba(7, 26, 56, .06);
}

.controls {
  padding: 2px 24px;
}

.step {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 14px;
  padding: 23px 0;
  border-bottom: 1px solid rgba(7, 26, 56, .08);
}

.step:last-child {
  border-bottom: 0;
}

.number {
  padding-top: 2px;
  color: #c08b43;
  font-size: 9px;
  font-weight: 950;
  letter-spacing: .08em;
}

.step label {
  display: block;
  margin-bottom: 12px;
  color: rgba(7, 26, 56, .48);
  font-size: 9px;
  font-weight: 950;
  letter-spacing: .14em;
}

.city {
  width: 100%;
  height: 50px;
  padding: 0 15px;
  outline: none;
  border: 1px solid rgba(7, 26, 56, .13);
  border-radius: 7px;
  background: #fbfcfd;
  color: #071a38;
  font-size: 16px;
  font-weight: 800;
}

.city:focus {
  border-color: #173f6d;
  box-shadow: 0 0 0 3px rgba(23, 63, 109, .08);
}

.vehicles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.vehicle {
  height: 70px;
  padding: 0 16px;
  border: 1px solid rgba(7, 26, 56, .1);
  border-radius: 8px;
  background: #f9fbfc;
  color: rgba(7, 26, 56, .5);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 900;
  transition: 150ms ease;
}

.vehicle:hover {
  transform: translateY(-2px);
  border-color: rgba(192, 139, 67, .5);
}

.vehicle b {
  color: #c8944e;
  font-size: 20px;
}

.vehicle.active {
  border-color: #0b2a52;
  background: #0b2a52;
  color: #ffffff;
}

.people {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.person {
  position: relative;
  min-width: 0;
  height: 104px;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #e9eef2;
  cursor: pointer;
}

.person img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center top;
}

.person span {
  position: absolute;
  left: 7px;
  bottom: 7px;
  padding: 5px 7px;
  border-radius: 4px;
  background: rgba(5, 18, 38, .76);
  color: #ffffff;
  font-size: 7px;
  font-weight: 950;
  letter-spacing: .12em;
  backdrop-filter: blur(8px);
}

.person.active {
  border-color: #c8944e;
  box-shadow: 0 0 0 3px rgba(200, 148, 78, .13);
}

.or {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin: 14px 0;
}

.or i {
  height: 1px;
  background: rgba(7, 26, 56, .08);
}

.or b {
  color: rgba(7, 26, 56, .3);
  font-size: 7px;
  letter-spacing: .15em;
}

.upload {
  width: 100%;
  min-height: 62px;
  padding: 10px 14px;
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

.upload.active {
  border-color: #c8944e;
  background: rgba(200, 148, 78, .07);
}

.upload > b {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #0b2a52;
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 17px;
}

.upload strong,
.upload small {
  display: block;
}

.upload strong {
  font-size: 9px;
  letter-spacing: .1em;
}

.upload small {
  max-width: 300px;
  margin-top: 4px;
  overflow: hidden;
  color: rgba(7, 26, 56, .42);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editorPanel {
  padding: 16px;
}

.panelTop {
  min-height: 58px;
  padding: 0 4px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.panelTop strong {
  display: block;
  color: #071a38;
  font-size: 18px;
  letter-spacing: -.025em;
}

.selectedFace {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(7, 26, 56, .4);
  font-size: 7px;
  font-weight: 950;
  letter-spacing: .12em;
}

.selectedFace img {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  object-fit: cover;
  object-position: center top;
}

.editorBox {
  min-height: 520px;
  overflow: hidden;
  border: 1px solid rgba(7, 26, 56, .1);
  border-radius: 8px;
  background: #edf2f5;
  box-shadow:
    0 18px 42px rgba(7, 26, 56, .07),
    inset 0 0 0 1px rgba(255, 255, 255, .45);
}

.editorBox > * {
  width: 100%;
  min-height: 520px;
}

.reopenEditor {
  width: 100%;
  min-height: 94px;
  padding: 10px;
  border: 0;
  border-radius: 8px;
  background: #0b2a52;
  color: #ffffff;
  display: grid;
  grid-template-columns: 70px 1fr auto;
  align-items: center;
  gap: 14px;
  text-align: left;
  cursor: pointer;
}

.reopenEditor img {
  width: 70px;
  height: 70px;
  border-radius: 7px;
  object-fit: cover;
  object-position: center top;
}

.reopenEditor strong,
.reopenEditor small {
  display: block;
}

.reopenEditor strong {
  font-size: 10px;
  letter-spacing: .1em;
}

.reopenEditor small {
  margin-top: 5px;
  color: rgba(255,255,255,.55);
  font-size: 9px;
}

.reopenEditor > b {
  padding-right: 8px;
  color: #d3a252;
  font-size: 22px;
}

.right {
  position: sticky;
  top: 18px;
  padding: 18px;
}

.rightTop {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  color: rgba(7, 26, 56, .4);
  font-size: 8px;
  font-weight: 950;
  letter-spacing: .15em;
}

.rightTop > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.rightTop i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c8944e;
  box-shadow: 0 0 0 4px rgba(200, 148, 78, .1);
}

.stage {
  min-height: 650px;
  padding: 30px;
  border-radius: 8px;
  background:
    linear-gradient(rgba(7, 26, 56, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(7, 26, 56, .035) 1px, transparent 1px),
    #edf2f5;
  background-size: 32px 32px;
  display: grid;
  place-items: center;
}

.flyer {
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

.grid {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: .13;
  background-image:
    linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px);
  background-size: 34px 34px;
}

.brand {
  position: absolute;
  top: 7%;
  left: 7%;
  display: grid;
  grid-template-columns: 38px auto;
  align-items: center;
  column-gap: 9px;
}

.brand i {
  width: 38px;
  height: 3px;
  background: #d3a252;
}

.brand strong {
  color: #ffffff;
  font-size: clamp(12px, 1.2vw, 17px);
  letter-spacing: .03em;
}

.brand small {
  grid-column: 2;
  margin-top: 3px;
  color: rgba(255,255,255,.5);
  font-size: clamp(5px, .55vw, 7px);
  font-weight: 900;
  letter-spacing: .12em;
}

.headline {
  position: absolute;
  top: 18%;
  left: 7%;
  right: 7%;
  z-index: 5;
}

.headline span,
.headline strong {
  display: block;
  text-transform: uppercase;
}

.headline span {
  color: #ffffff;
  font-size: clamp(25px, 3.3vw, 46px);
  font-weight: 950;
  line-height: .92;
  letter-spacing: -.05em;
}

.headline strong {
  max-width: 92%;
  margin-top: 4px;
  color: #d3a252;
  font-size: clamp(24px, 3vw, 43px);
  font-weight: 950;
  line-height: .95;
  letter-spacing: -.05em;
  overflow-wrap: anywhere;
}

.meta {
  position: absolute;
  z-index: 4;
  left: 7%;
  bottom: 17%;
  width: 34%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta small {
  margin-top: 10px;
  color: rgba(255,255,255,.45);
  font-size: clamp(5px, .55vw, 7px);
  font-weight: 950;
  letter-spacing: .13em;
}

.meta strong {
  color: #ffffff;
  font-size: clamp(11px, 1.25vw, 17px);
  line-height: 1.05;
}

.goldButton {
  width: max-content;
  max-width: 100%;
  margin-top: 14px;
  padding: 9px 11px;
  border-radius: 5px;
  background: #d3a252;
  color: #071a38;
  font-size: clamp(6px, .65vw, 9px);
  font-weight: 950;
  letter-spacing: .07em;
}

.portrait {
  position: absolute;
  z-index: 2;
  right: 6%;
  bottom: 10%;
  width: 49%;
  height: 54%;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 13px;
  background: #102d4d;
  box-shadow: 0 18px 45px rgba(0,0,0,.22);
  cursor: pointer;
}

.portrait img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center top;
}

.portrait span {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  padding: 8px 9px;
  border-radius: 5px;
  background: rgba(5, 18, 38, .8);
  color: #ffffff;
  font-size: 7px;
  font-weight: 950;
  letter-spacing: .09em;
  opacity: 0;
  transition: opacity 150ms ease;
  backdrop-filter: blur(8px);
}

.portrait:hover span {
  opacity: 1;
}

.flyer footer {
  position: absolute;
  left: 7%;
  right: 7%;
  bottom: 4%;
  padding-top: 8px;
  border-top: 2px solid #d3a252;
  color: rgba(255,255,255,.42);
  font-size: clamp(5px, .55vw, 7px);
  font-weight: 950;
  letter-spacing: .12em;
}

.actions {
  min-height: 66px;
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
}

.editAgain,
.download {
  height: 48px;
  border-radius: 7px;
  font-size: 9px;
  font-weight: 950;
  letter-spacing: .08em;
}

.editAgain {
  padding: 0 16px;
  border: 1px solid rgba(7, 26, 56, .13);
  background: #ffffff;
  color: #071a38;
  cursor: pointer;
}

.download {
  min-width: 190px;
  padding: 0 17px;
  border: 0;
  background: #0a2850;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  cursor: pointer;
  box-shadow: 0 12px 25px rgba(7, 26, 56, .15);
  transition: 150ms ease;
}

.download:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #123b6b;
}

.download:disabled {
  opacity: .5;
  cursor: not-allowed;
}


.downloadIcon {
  min-width: 48px;
  width: 48px;
  padding: 0;
  display: grid;
  place-items: center;
}

.downloadSvg {
  width: 20px;
  height: 20px;
}

.exportingText {
  font-size: 11px;
  letter-spacing: .08em;
}

.downloadLocked {
  min-height: 48px;
  max-width: 330px;
  padding: 0 14px;
  border: 1px dashed rgba(7, 26, 56, .15);
  border-radius: 7px;
  background: #f7f9fb;
  color: rgba(7, 26, 56, .48);
  display: flex;
  align-items: center;
  font-size: 8px;
  font-weight: 900;
  line-height: 1.45;
  letter-spacing: .06em;
  text-transform: uppercase;
}

@media (max-width: 1150px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .right {
    position: relative;
    top: 0;
  }

  .stage {
    min-height: 620px;
  }
}

@media (max-width: 650px) {
  .shell {
    width: min(100% - 24px, 1600px);
    padding-top: 18px;
  }

  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  .headerMeta {
    align-items: flex-start;
  }

  .controls {
    padding: 2px 16px;
  }

  .step {
    grid-template-columns: 30px 1fr;
    gap: 9px;
  }

  .people {
    gap: 5px;
  }

  .person {
    height: 90px;
  }

  .editorPanel,
  .right {
    padding: 12px;
  }

  .editorBox,
  .editorBox > * {
    min-height: 460px;
  }

  .stage {
    min-height: auto;
    padding: 14px;
  }

  .actions {
    flex-direction: column;
  }

  .editAgain {
    width: 100%;
  }

  .downloadIcon {
    width: 48px;
    min-width: 48px;
  }

  .downloadLocked {
    width: 100%;
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vehicle,
  .download,
  .portrait span {
    transition: none;
  }
}
`;
