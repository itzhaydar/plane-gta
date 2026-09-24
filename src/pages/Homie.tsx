import {
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
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

  const [editorOpen, setEditorOpen] = useState(false);

  const [signature, setSignature] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);

  const [exporting, setExporting] = useState(false);

  const fileInput = useRef<HTMLInputElement | null>(null);
  const signatureCanvas = useRef<HTMLCanvasElement | null>(null);

  const destination = city.trim() || DEFAULT_CITY;

  // ============================================================
  // PERSON / PORTRAIT
  // ============================================================

  const pickPerson = (id: PersonId, src: string) => {
    setPerson(id);
    setPortraitSrc(src);

    setUploaded(false);
    setUploadName('');

    if (fileInput.current) {
      fileInput.current.value = '';
    }
  };

  const uploadPortrait = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

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

      // Open Unlayer immediately after upload.
      setEditorOpen(true);
    };

    reader.readAsDataURL(file);
  };

  // ============================================================
  // SIGNATURE
  // ============================================================

  const getSignaturePoint = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = signatureCanvas.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) / rect.width) *
        canvas.width,

      y:
        ((event.clientY - rect.top) / rect.height) *
        canvas.height,
    };
  };

  const signatureStart = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = signatureCanvas.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    const point = getSignaturePoint(event);

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = '#071a38';

    setDrawing(true);
  };

  const signatureMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!drawing) return;

    const canvas = signatureCanvas.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const point = getSignaturePoint(event);

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const signatureEnd = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!drawing) return;

    const canvas = signatureCanvas.current;

    if (!canvas) return;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }

    setDrawing(false);

    setSignature(
      canvas.toDataURL('image/png'),
    );
  };

  const clearSignature = () => {
    const canvas = signatureCanvas.current;
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }

    setSignature(null);
    setDrawing(false);
  };

  // ============================================================
  // EXPORT HELPERS
  // ============================================================

  const loadImage = (
    url: string,
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = reject;

      image.src = url;
    });
  };

  const drawCover = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const scale = Math.max(
      width / image.width,
      height / image.height,
    );

    const sourceWidth = width / scale;
    const sourceHeight = height / scale;

    const sourceX =
      (image.width - sourceWidth) / 2;

    const sourceY =
      (image.height - sourceHeight) / 2;

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

  // ============================================================
  // DOWNLOAD 1080 × 1350
  // ============================================================

  const downloadFlyer = async () => {
    if (!signature) {
      alert(
        'Sign the flyer before downloading.',
      );
      return;
    }

    setExporting(true);

    try {
      const canvas =
        document.createElement('canvas');

      canvas.width = 1080;
      canvas.height = 1350;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error(
          'Canvas is not available.',
        );
      }

      // --------------------------------------------------------
      // BACKGROUND
      // --------------------------------------------------------

      const background =
        ctx.createLinearGradient(
          0,
          0,
          1080,
          1350,
        );

      background.addColorStop(
        0,
        '#06152d',
      );

      background.addColorStop(
        0.58,
        '#0b2a52',
      );

      background.addColorStop(
        1,
        '#06111f',
      );

      ctx.fillStyle = background;

      ctx.fillRect(
        0,
        0,
        1080,
        1350,
      );

      // --------------------------------------------------------
      // GRID
      // --------------------------------------------------------

      ctx.save();

      ctx.globalAlpha = 0.09;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;

      for (
        let x = 0;
        x <= 1080;
        x += 72
      ) {
        ctx.beginPath();

        ctx.moveTo(
          x,
          0,
        );

        ctx.lineTo(
          x,
          1350,
        );

        ctx.stroke();
      }

      for (
        let y = 0;
        y <= 1350;
        y += 72
      ) {
        ctx.beginPath();

        ctx.moveTo(
          0,
          y,
        );

        ctx.lineTo(
          1080,
          y,
        );

        ctx.stroke();
      }

      ctx.restore();

      // --------------------------------------------------------
      // BRAND
      // --------------------------------------------------------

      ctx.fillStyle = '#d3a252';

      ctx.fillRect(
        72,
        72,
        90,
        8,
      );

      ctx.fillStyle = '#ffffff';

      ctx.font =
        '900 34px Arial, sans-serif';

      ctx.fillText(
        'MARSHOUT',
        72,
        132,
      );

      ctx.fillStyle =
        'rgba(255,255,255,.58)';

      ctx.font =
        '800 18px Arial, sans-serif';

      ctx.fillText(
        'DESIGN WHERE YOU WANNA BE TAKEN',
        72,
        170,
      );

      // --------------------------------------------------------
      // TITLE
      // --------------------------------------------------------

      ctx.fillStyle = '#ffffff';

      ctx.font =
        '900 86px Arial, sans-serif';

      ctx.fillText(
        'TAKE ME TO',
        72,
        300,
      );

      let cityFontSize = 86;

      ctx.fillStyle = '#d3a252';

      ctx.font =
        `900 ${cityFontSize}px Arial, sans-serif`;

      while (
        ctx.measureText(
          destination.toUpperCase(),
        ).width > 900 &&
        cityFontSize > 42
      ) {
        cityFontSize -= 2;

        ctx.font =
          `900 ${cityFontSize}px Arial, sans-serif`;
      }

      ctx.fillText(
        destination.toUpperCase(),
        72,
        395,
      );

      // --------------------------------------------------------
      // PORTRAIT
      // --------------------------------------------------------

      const portrait =
        await loadImage(
          portraitSrc,
        );

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

      ctx.strokeStyle =
        'rgba(255,255,255,.2)';

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

      // --------------------------------------------------------
      // DESTINATION
      // --------------------------------------------------------

      ctx.fillStyle =
        'rgba(255,255,255,.5)';

      ctx.font =
        '800 18px Arial, sans-serif';

      ctx.fillText(
        'DESTINATION',
        72,
        570,
      );

      ctx.fillStyle = '#ffffff';

      ctx.font =
        '900 34px Arial, sans-serif';

      ctx.fillText(
        destination,
        72,
        615,
      );

      // --------------------------------------------------------
      // VEHICLE
      // --------------------------------------------------------

      ctx.fillStyle =
        'rgba(255,255,255,.5)';

      ctx.font =
        '800 18px Arial, sans-serif';

      ctx.fillText(
        'VEHICLE',
        72,
        700,
      );

      ctx.fillStyle = '#ffffff';

      ctx.font =
        '900 34px Arial, sans-serif';

      ctx.fillText(
        vehicle,
        72,
        745,
      );

      // --------------------------------------------------------
      // GOLD BUTTON
      // --------------------------------------------------------

      ctx.fillStyle = '#d3a252';

      ctx.beginPath();

      ctx.roundRect(
        72,
        810,
        310,
        72,
        12,
      );

      ctx.fill();

      ctx.fillStyle = '#071a38';

      ctx.font =
        '900 22px Arial, sans-serif';

      ctx.fillText(
        vehicle === 'Plane'
          ? 'FLY WITH ME'
          : 'LAUNCH WITH ME',

        98,
        856,
      );

      // --------------------------------------------------------
      // SIGNATURE
      // --------------------------------------------------------

      const signatureImage =
        await loadImage(
          signature,
        );

      ctx.fillStyle = '#d3a252';

      ctx.beginPath();

      ctx.roundRect(
        72,
        950,
        330,
        160,
        16,
      );

      ctx.fill();

      ctx.fillStyle = '#071a38';

      ctx.font =
        '900 15px Arial, sans-serif';

      ctx.fillText(
        'SIGNED',
        96,
        985,
      );

      ctx.drawImage(
        signatureImage,

        96,
        992,

        270,
        95,
      );

      // --------------------------------------------------------
      // FOOTER
      // --------------------------------------------------------

      ctx.fillStyle =
        'rgba(255,255,255,.42)';

      ctx.font =
        '800 17px Arial, sans-serif';

      ctx.fillText(
        'YOUR TRIP. YOUR VEHICLE. YOUR FLYER.',
        72,
        1265,
      );

      ctx.fillStyle = '#d3a252';

      ctx.fillRect(
        72,
        1295,
        936,
        4,
      );

      // --------------------------------------------------------
      // DOWNLOAD
      // --------------------------------------------------------

      const link =
        document.createElement('a');

      link.download =
        `marshout-${destination
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            '-',
          )}-${vehicle.toLowerCase()}.png`;

      link.href =
        canvas.toDataURL(
          'image/png',
          1,
        );

      link.click();
    } catch (error) {
      console.error(error);

      alert(
        'Could not export the flyer.',
      );
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="homie">
      <style>{CSS}</style>

      <section className="shell">

        {/* HEADER */}

        <header className="header">
          <div>
            <span className="kicker">
              MARSHOUT / FLYER MAKER
            </span>

            <h1>
              Design where you wanna be taken.
            </h1>
          </div>
        </header>

        <div
          className={
            `workspace ${
              editorOpen
                ? 'editing'
                : ''
            }`
          }
        >

          {/* ===================================================
              LEFT CONTROLS
          =================================================== */}

          <aside className="controls">

            {/* 01 */}

            <Step
              number="01"
              title="WHERE ARE WE GOING?"
            >
              <input
                className="city"
                value={city}
                onChange={(event) =>
                  setCity(
                    event.target.value,
                  )
                }
                placeholder="Los Angeles"
                maxLength={42}
              />
            </Step>

            {/* 02 */}

            <Step
              number="02"
              title="CHOOSE YOUR VEHICLE"
            >
              <div className="vehicles">
                {(
                  [
                    'Plane',
                    'Rocket',
                  ] as Vehicle[]
                ).map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={
                      `vehicle ${
                        vehicle === item
                          ? 'active'
                          : ''
                      }`
                    }
                    onClick={() =>
                      setVehicle(item)
                    }
                  >
                    <b>
                      {item === 'Plane'
                        ? '✈'
                        : '▲'}
                    </b>

                    <span>
                      {item}
                    </span>
                  </button>
                ))}
              </div>
            </Step>

            {/* 03 */}

            <Step
              number="03"
              title="WHO’S FLYING?"
            >
              <div className="people">
                {PEOPLE.map(
                  (item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={
                        `person ${
                          !uploaded &&
                          person === item.id
                            ? 'active'
                            : ''
                        }`
                      }
                      onClick={() =>
                        pickPerson(
                          item.id,
                          item.src,
                        )
                      }
                    >
                      <img
                        src={item.src}
                        alt={item.label}
                      />

                      <span>
                        {item.label}
                      </span>
                    </button>
                  ),
                )}
              </div>

              <div className="or">
                <i />

                <b>
                  OR
                </b>

                <i />
              </div>

              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={
                  uploadPortrait
                }
              />

              <button
                type="button"
                className={
                  `upload ${
                    uploaded
                      ? 'active'
                      : ''
                  }`
                }
                onClick={() =>
                  fileInput.current?.click()
                }
              >
                <b>
                  ＋
                </b>

                <span>
                  <strong>
                    {uploaded
                      ? 'YOUR IMAGE SELECTED'
                      : 'UPLOAD YOUR IMAGE'}
                  </strong>

                  <small>
                    {uploadName ||
                      'PNG, JPG or WEBP'}
                  </small>
                </span>
              </button>
            </Step>

            {/* 04 */}

            <Step
              number="04"
              title="STYLE YOUR FACE"
            >
              <button
                type="button"
                className="editFace"
                onClick={() =>
                  setEditorOpen(true)
                }
              >
                <img
                  src={portraitSrc}
                  alt=""
                />

                <span>
                  <strong>
                    EDIT IN IMAGE EDITOR
                  </strong>

                  <small>
                    Crop, resize, filter,
                    draw, text & more
                  </small>
                </span>

                <b>
                  →
                </b>
              </button>
            </Step>

            {/* 05 */}

            <Step
              number="05"
              title="SIGN THE FLYER"
            >
              <div className="signature">
                <canvas
                  ref={signatureCanvas}

                  width={700}
                  height={220}

                  onPointerDown={
                    signatureStart
                  }

                  onPointerMove={
                    signatureMove
                  }

                  onPointerUp={
                    signatureEnd
                  }

                  onPointerCancel={
                    signatureEnd
                  }
                />

                {!signature && (
                  <span>
                    DRAW YOUR SIGNATURE
                  </span>
                )}
              </div>

              <div className="signatureBottom">

                {signature ? (
                  <span className="signedStatus">
                    SIGNED ✓
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  className="clear"
                  onClick={
                    clearSignature
                  }
                >
                  CLEAR SIGNATURE
                </button>
              </div>
            </Step>
          </aside>

          {/* ===================================================
              RIGHT WORKSPACE
          =================================================== */}

          <section className="right">

            <div className="rightTop">

              <div>
                <i />

                {editorOpen
                  ? 'LIVE EDITOR'
                  : 'LIVE FLYER'}
              </div>

              <div>

                {editorOpen && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditorOpen(false)
                    }
                  >
                    VIEW FLYER
                  </button>
                )}

                <span>
                  {editorOpen
                    ? 'IMAGE WORKSPACE'
                    : '1080 × 1350'}
                </span>

              </div>
            </div>

            {/* =================================================
                UNLAYER
            ================================================= */}

            {editorOpen ? (

              <div className="editorWorkspace">

                <div className="editorHeading">

                  <div>
                    <span>
                      04 / STYLE YOUR FACE
                    </span>

                    <h2>
                      Make the portrait yours.
                    </h2>
                  </div>

                  <img
                    src={portraitSrc}
                    alt=""
                  />
                </div>

                <div className="unlayer">

                  <ImageEditor
                    image={
                      portraitSrc
                    }

                    minHeight="700px"

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
                      setPortraitSrc(
                        dataUrl,
                      );

                      setEditorOpen(
                        false,
                      );
                    }}

                    onCancel={() =>
                      setEditorOpen(
                        false,
                      )
                    }
                  />

                </div>
              </div>

            ) : (

              <>

                {/* ===============================================
                    LIVE FLYER
                =============================================== */}

                <div className="stage">

                  <article className="flyer">

                    <div className="grid" />

                    {/* BRAND */}

                    <div className="brand">

                      <i />

                      <strong>
                        MARSHOUT
                      </strong>

                      <small>
                        DESIGN WHERE YOU WANNA BE TAKEN
                      </small>

                    </div>

                    {/* TITLE */}

                    <div className="headline">

                      <span>
                        TAKE ME TO
                      </span>

                      <strong>
                        {destination}
                      </strong>

                    </div>

                    {/* META */}

                    <div className="meta">

                      <small>
                        DESTINATION
                      </small>

                      <strong>
                        {destination}
                      </strong>

                      <small>
                        VEHICLE
                      </small>

                      <strong>
                        {vehicle}
                      </strong>

                      <div className="goldButton">

                        {vehicle ===
                        'Plane'
                          ? '✈ FLY WITH ME'
                          : '▲ LAUNCH WITH ME'}

                      </div>

                    </div>

                    {/* PORTRAIT */}

                    <button
                      type="button"
                      className="portrait"
                      onClick={() =>
                        setEditorOpen(
                          true,
                        )
                      }
                    >

                      <img
                        src={
                          portraitSrc
                        }
                        alt="Selected portrait"
                      />

                      <span>
                        EDIT IN IMAGE EDITOR
                      </span>

                    </button>

                    {/* SIGNATURE */}

                    {signature && (

                      <div className="signed">

                        <small>
                          SIGNED
                        </small>

                        <img
                          src={
                            signature
                          }
                          alt="Signature"
                        />

                      </div>

                    )}

                    {/* FOOTER */}

                    <footer>
                      YOUR TRIP. YOUR VEHICLE.
                      YOUR FLYER.
                    </footer>

                  </article>

                </div>

                {/* ===============================================
                    ACTIONS
                =============================================== */}

                <div className="actions">

                  <button
                    type="button"
                    className="editAgain"
                    onClick={() =>
                      setEditorOpen(
                        true,
                      )
                    }
                  >
                    EDIT PORTRAIT
                  </button>

                  <button
                    type="button"
                    className="download"

                    disabled={
                      !signature ||
                      exporting
                    }

                    onClick={
                      downloadFlyer
                    }
                  >

                    <span>
                      {exporting
                        ? 'EXPORTING...'
                        : signature
                          ? 'DOWNLOAD FLYER'
                          : 'SIGN TO DOWNLOAD'}
                    </span>

                    <b>
                      ↓
                    </b>

                  </button>

                </div>

              </>

            )}

          </section>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// STEP
// ============================================================

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

      <div className="number">
        {number}
      </div>

      <div>

        <label>
          {title}
        </label>

        {children}

      </div>

    </section>
  );
}

// ============================================================
// STYLES
// ============================================================

const CSS = `

* {
  box-sizing: border-box;
}

.homie {
  min-height: 100vh;
  min-height: 100svh;

  background:
    radial-gradient(
      circle at 78% 18%,
      rgba(21, 63, 108, .07),
      transparent 28%
    ),
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
  width: min(
    1500px,
    calc(100% - 48px)
  );

  margin: 0 auto;

  padding:
    34px
    0
    45px;
}

/* ============================================================
   HEADER
============================================================ */

.header {
  padding-bottom: 24px;

  border-bottom:
    1px solid
    rgba(7, 26, 56, .1);
}

.kicker {
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

  font-size:
    clamp(
      30px,
      3vw,
      52px
    );

  line-height: .98;

  letter-spacing: -.055em;
}

/* ============================================================
   WORKSPACE
============================================================ */

.workspace {
  display: grid;

  grid-template-columns:
    minmax(330px, .78fr)
    minmax(560px, 1.35fr);

  gap: 24px;

  padding-top: 24px;

  transition:
    grid-template-columns
    180ms ease;
}

/*
  When Unlayer opens,
  it becomes the hero.
*/

.workspace.editing {
  grid-template-columns:
    minmax(320px, .52fr)
    minmax(720px, 1.85fr);
}

.controls,
.right {
  border:
    1px solid
    rgba(7, 26, 56, .09);

  border-radius: 10px;

  background:
    rgba(
      255,
      255,
      255,
      .96
    );

  box-shadow:
    0
    22px
    60px
    rgba(7, 26, 56, .06);
}

/* ============================================================
   LEFT
============================================================ */

.controls {
  padding:
    6px
    26px;
}

.step {
  display: grid;

  grid-template-columns:
    38px
    1fr;

  gap: 14px;

  padding:
    27px
    0;

  border-bottom:
    1px solid
    rgba(7, 26, 56, .08);
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

  color:
    rgba(
      7,
      26,
      56,
      .48
    );

  font-size: 9px;

  font-weight: 950;

  letter-spacing: .14em;
}

/* ============================================================
   CITY
============================================================ */

.city {
  width: 100%;

  height: 52px;

  padding:
    0
    15px;

  outline: none;

  border:
    1px solid
    rgba(7, 26, 56, .13);

  border-radius: 7px;

  background: #fbfcfd;

  color: #071a38;

  font-size: 16px;

  font-weight: 800;

  transition:
    border-color
    150ms ease,
    box-shadow
    150ms ease;
}

.city:focus {
  border-color: #173f6d;

  box-shadow:
    0
    0
    0
    3px
    rgba(23, 63, 109, .08);
}

/* ============================================================
   VEHICLES
============================================================ */

.vehicles {
  display: grid;

  grid-template-columns:
    1fr
    1fr;

  gap: 9px;
}

.vehicle {
  height: 78px;

  padding:
    0
    16px;

  border:
    1px solid
    rgba(7, 26, 56, .1);

  border-radius: 8px;

  background: #f9fbfc;

  color:
    rgba(
      7,
      26,
      56,
      .5
    );

  cursor: pointer;

  display: flex;

  flex-direction: column;

  align-items: flex-start;

  justify-content: center;

  gap: 6px;

  font-size: 12px;

  font-weight: 900;

  transition:
    transform
    150ms ease,
    border-color
    150ms ease,
    background
    150ms ease;
}

.vehicle:hover {
  transform:
    translateY(-2px);

  border-color:
    rgba(
      192,
      139,
      67,
      .5
    );
}

.vehicle b {
  color: #c8944e;

  font-size: 22px;
}

.vehicle.active {
  border-color: #0b2a52;

  background: #0b2a52;

  color: #ffffff;
}

/* ============================================================
   PEOPLE
============================================================ */

.people {
  display: grid;

  grid-template-columns:
    repeat(
      3,
      1fr
    );

  gap: 8px;
}

.person {
  position: relative;

  min-width: 0;

  height: 116px;

  padding: 0;

  overflow: hidden;

  border:
    2px solid
    transparent;

  border-radius: 8px;

  background: #e9eef2;

  cursor: pointer;
}

.person img {
  width: 100%;

  height: 100%;

  display: block;

  object-fit: cover;

  object-position:
    center top;
}

.person span {
  position: absolute;

  left: 7px;

  bottom: 7px;

  padding:
    5px
    7px;

  border-radius: 4px;

  background:
    rgba(
      5,
      18,
      38,
      .76
    );

  color: #ffffff;

  font-size: 7px;

  font-weight: 950;

  letter-spacing: .12em;

  backdrop-filter:
    blur(8px);
}

.person.active {
  border-color: #c8944e;

  box-shadow:
    0
    0
    0
    3px
    rgba(200, 148, 78, .13);
}

/* ============================================================
   OR
============================================================ */

.or {
  display: grid;

  grid-template-columns:
    1fr
    auto
    1fr;

  align-items: center;

  gap: 10px;

  margin:
    16px
    0;
}

.or i {
  height: 1px;

  background:
    rgba(
      7,
      26,
      56,
      .08
    );
}

.or b {
  color:
    rgba(
      7,
      26,
      56,
      .3
    );

  font-size: 7px;

  letter-spacing: .15em;
}

/* ============================================================
   UPLOAD
============================================================ */

.upload {
  width: 100%;

  min-height: 68px;

  padding:
    12px
    14px;

  border:
    1px dashed
    rgba(7, 26, 56, .2);

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

  background:
    rgba(
      200,
      148,
      78,
      .07
    );
}

.upload > b {
  width: 36px;

  height: 36px;

  flex:
    0
    0
    auto;

  border-radius: 50%;

  background: #0b2a52;

  color: #ffffff;

  display: grid;

  place-items: center;

  font-size: 18px;
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
  max-width: 210px;

  margin-top: 4px;

  overflow: hidden;

  color:
    rgba(
      7,
      26,
      56,
      .42
    );

  font-size: 9px;

  text-overflow:
    ellipsis;

  white-space:
    nowrap;
}

/* ============================================================
   EDIT FACE
============================================================ */

.editFace {
  width: 100%;

  min-height: 72px;

  padding: 8px;

  border: 0;

  border-radius: 8px;

  background: #0b2a52;

  color: #ffffff;

  display: grid;

  grid-template-columns:
    50px
    1fr
    auto;

  align-items: center;

  gap: 11px;

  text-align: left;

  cursor: pointer;

  box-shadow:
    0
    10px
    25px
    rgba(7, 26, 56, .1);
}

.editFace img {
  width: 50px;

  height: 50px;

  border-radius: 6px;

  object-fit: cover;

  object-position:
    center top;
}

.editFace strong,
.editFace small {
  display: block;
}

.editFace strong {
  font-size: 9px;

  letter-spacing: .08em;
}

.editFace small {
  margin-top: 4px;

  color:
    rgba(
      255,
      255,
      255,
      .55
    );

  font-size: 8px;

  line-height: 1.35;
}

.editFace > b {
  color: #d3a252;

  font-size: 20px;
}

/* ============================================================
   SIGNATURE
============================================================ */

.signature {
  position: relative;

  width: 100%;

  height: 112px;

  overflow: hidden;

  border:
    1px solid
    rgba(7, 26, 56, .13);

  border-radius: 8px;

  background:
    linear-gradient(
      to bottom,
      transparent 74%,
      rgba(7, 26, 56, .09) 75%,
      transparent 76%
    ),
    #ffffff;
}

.signature canvas {
  position: relative;

  z-index: 2;

  width: 100%;

  height: 100%;

  display: block;

  touch-action: none;

  cursor: crosshair;
}

.signature > span {
  position: absolute;

  z-index: 1;

  inset: 0;

  display: grid;

  place-items: center;

  color:
    rgba(
      7,
      26,
      56,
      .23
    );

  font-size: 8px;

  font-weight: 950;

  letter-spacing: .14em;

  pointer-events: none;
}

.signatureBottom {
  margin-top: 8px;

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 10px;
}

.signedStatus {
  color: #a77531;

  font-size: 8px;

  font-weight: 950;

  letter-spacing: .1em;
}

.clear {
  padding: 0;

  border: 0;

  background:
    transparent;

  color:
    rgba(
      7,
      26,
      56,
      .4
    );

  font-size: 8px;

  font-weight: 950;

  letter-spacing: .1em;

  cursor: pointer;
}

/* ============================================================
   RIGHT
============================================================ */

.right {
  min-width: 0;

  padding: 18px;
}

.rightTop {
  min-height: 42px;

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 15px;

  color:
    rgba(
      7,
      26,
      56,
      .4
    );

  font-size: 8px;

  font-weight: 950;

  letter-spacing: .15em;
}

.rightTop > div {
  display: flex;

  align-items: center;

  gap: 9px;
}

.rightTop > div:first-child i {
  width: 7px;

  height: 7px;

  border-radius: 50%;

  background: #c8944e;

  box-shadow:
    0
    0
    0
    4px
    rgba(200, 148, 78, .1);
}

.rightTop button {
  padding:
    7px
    10px;

  border:
    1px solid
    rgba(7, 26, 56, .1);

  border-radius: 5px;

  background: #ffffff;

  color: #071a38;

  font-size: 8px;

  font-weight: 950;

  letter-spacing: .08em;

  cursor: pointer;
}

/* ============================================================
   UNLAYER — MAIN WORKSPACE
============================================================ */

.editorWorkspace {
  min-height: 790px;

  padding: 22px;

  border-radius: 8px;

  background: #f1f4f6;
}

.editorHeading {
  min-height: 72px;

  margin-bottom: 16px;

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 20px;
}

.editorHeading span {
  color: #a77531;

  font-size: 8px;

  font-weight: 950;

  letter-spacing: .14em;
}

.editorHeading h2 {
  margin:
    5px
    0
    0;

  color: #071a38;

  font-size:
    clamp(
      24px,
      2.5vw,
      38px
    );

  line-height: 1;

  letter-spacing: -.045em;
}

.editorHeading img {
  width: 54px;

  height: 54px;

  border-radius: 7px;

  object-fit: cover;

  object-position:
    center top;

  box-shadow:
    0
    7px
    20px
    rgba(7, 26, 56, .12);
}

.unlayer {
  min-height: 700px;

  overflow: hidden;

  border:
    1px solid
    rgba(7, 26, 56, .1);

  border-radius: 8px;

  background: #ffffff;

  box-shadow:
    0
    12px
    30px
    rgba(7, 26, 56, .06);
}

/* ============================================================
   FLYER STAGE
============================================================ */

.stage {
  min-height: 660px;

  padding: 34px;

  border-radius: 8px;

  background:
    linear-gradient(
      rgba(7, 26, 56, .035)
      1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(7, 26, 56, .035)
      1px,
      transparent 1px
    ),
    #edf2f5;

  background-size:
    32px
    32px;

  display: grid;

  place-items: center;
}

/* ============================================================
   FLYER
============================================================ */

.flyer {
  position: relative;

  width:
    min(
      100%,
      510px
    );

  aspect-ratio:
    4 / 5;

  overflow: hidden;

  border-radius: 3px;

  background:
    radial-gradient(
      circle at 76% 36%,
      rgba(55, 113, 168, .35),
      transparent 27%
    ),
    linear-gradient(
      145deg,
      #06152d,
      #0b2a52 58%,
      #06111f
    );

  box-shadow:
    0
    28px
    70px
    rgba(7, 26, 56, .25);

  isolation: isolate;
}

.grid {
  position: absolute;

  inset: 0;

  z-index: -1;

  opacity: .13;

  background-image:
    linear-gradient(
      rgba(255,255,255,.15)
      1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(255,255,255,.15)
      1px,
      transparent 1px
    );

  background-size:
    34px
    34px;
}

/* ============================================================
   FLYER BRAND
============================================================ */

.brand {
  position: absolute;

  top: 7%;

  left: 7%;

  display: grid;

  grid-template-columns:
    38px
    auto;

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

  font-size:
    clamp(
      12px,
      1.2vw,
      17px
    );

  letter-spacing: .03em;
}

.brand small {
  grid-column: 2;

  margin-top: 3px;

  color:
    rgba(
      255,
      255,
      255,
      .5
    );

  font-size:
    clamp(
      5px,
      .55vw,
      7px
    );

  font-weight: 900;

  letter-spacing: .12em;
}

/* ============================================================
   HEADLINE
============================================================ */

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

  text-transform:
    uppercase;
}

.headline span {
  color: #ffffff;

  font-size:
    clamp(
      25px,
      3.3vw,
      46px
    );

  font-weight: 950;

  line-height: .92;

  letter-spacing: -.05em;
}

.headline strong {
  max-width: 92%;

  margin-top: 4px;

  color: #d3a252;

  font-size:
    clamp(
      24px,
      3vw,
      43px
    );

  font-weight: 950;

  line-height: .95;

  letter-spacing: -.05em;

  overflow-wrap:
    anywhere;
}

/* ============================================================
   META
============================================================ */

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

  color:
    rgba(
      255,
      255,
      255,
      .45
    );

  font-size:
    clamp(
      5px,
      .55vw,
      7px
    );

  font-weight: 950;

  letter-spacing: .13em;
}

.meta strong {
  color: #ffffff;

  font-size:
    clamp(
      11px,
      1.25vw,
      17px
    );

  line-height: 1.05;
}

.goldButton {
  width: max-content;

  max-width: 100%;

  margin-top: 14px;

  padding:
    9px
    11px;

  border-radius: 5px;

  background: #d3a252;

  color: #071a38;

  font-size:
    clamp(
      6px,
      .65vw,
      9px
    );

  font-weight: 950;

  letter-spacing: .07em;
}

/* ============================================================
   PORTRAIT
============================================================ */

.portrait {
  position: absolute;

  z-index: 2;

  right: 6%;

  bottom: 10%;

  width: 49%;

  height: 54%;

  padding: 0;

  overflow: hidden;

  border:
    1px solid
    rgba(255,255,255,.18);

  border-radius: 13px;

  background: #102d4d;

  box-shadow:
    0
    18px
    45px
    rgba(0,0,0,.22);

  cursor: pointer;
}

.portrait img {
  width: 100%;

  height: 100%;

  display: block;

  object-fit: cover;

  object-position:
    center top;
}

.portrait span {
  position: absolute;

  left: 10px;

  right: 10px;

  bottom: 10px;

  padding:
    8px
    9px;

  border-radius: 5px;

  background:
    rgba(
      5,
      18,
      38,
      .8
    );

  color: #ffffff;

  font-size: 7px;

  font-weight: 950;

  letter-spacing: .09em;

  opacity: 0;

  transition:
    opacity
    150ms ease;

  backdrop-filter:
    blur(8px);
}

.portrait:hover span {
  opacity: 1;
}

/* ============================================================
   FLYER SIGNATURE
============================================================ */

.signed {
  position: absolute;

  z-index: 6;

  left: 7%;

  bottom: 7.5%;

  width: 31%;

  height: 10%;

  padding:
    7px
    10px;

  border-radius: 7px;

  background: #d3a252;
}

.signed small {
  display: block;

  color: #071a38;

  font-size: 5px;

  font-weight: 950;

  letter-spacing: .12em;
}

.signed img {
  width: 100%;

  height:
    calc(
      100% - 10px
    );

  display: block;

  object-fit: contain;

  object-position:
    left center;
}

/* ============================================================
   FLYER FOOTER
============================================================ */

.flyer footer {
  position: absolute;

  left: 7%;

  right: 7%;

  bottom: 4%;

  padding-top: 8px;

  border-top:
    2px solid
    #d3a252;

  color:
    rgba(
      255,
      255,
      255,
      .42
    );

  font-size:
    clamp(
      5px,
      .55vw,
      7px
    );

  font-weight: 950;

  letter-spacing: .12em;
}

/* ============================================================
   ACTIONS
============================================================ */

.actions {
  min-height: 66px;

  padding-top: 16px;

  display: flex;

  align-items: center;

  justify-content:
    flex-end;

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
  padding:
    0
    16px;

  border:
    1px solid
    rgba(7, 26, 56, .13);

  background: #ffffff;

  color: #071a38;

  cursor: pointer;
}

.download {
  min-width: 190px;

  padding:
    0
    17px;

  border: 0;

  background: #0a2850;

  color: #ffffff;

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 20px;

  cursor: pointer;

  box-shadow:
    0
    12px
    25px
    rgba(7, 26, 56, .15);

  transition:
    transform
    150ms ease,
    background
    150ms ease;
}

.download:hover:not(:disabled) {
  transform:
    translateY(-2px);

  background: #123b6b;
}

.download:disabled {
  opacity: .42;

  cursor:
    not-allowed;

  box-shadow: none;
}

/* ============================================================
   RESPONSIVE
============================================================ */

@media (
  max-width: 1100px
) {

  .workspace,
  .workspace.editing {
    grid-template-columns:
      1fr;
  }

  .stage {
    min-height: 620px;
  }

}

@media (
  max-width: 620px
) {

  .shell {
    width:
      calc(
        100% - 28px
      );

    padding-top: 22px;
  }

  .controls {
    padding:
      4px
      18px;
  }

  .step {
    grid-template-columns:
      28px
      1fr;

    gap: 8px;
  }

  .stage {
    min-height: 0;

    padding: 18px;
  }

  .flyer {
    width: 100%;
  }

  .rightTop {
    align-items:
      flex-start;

    flex-direction:
      column;

    padding-bottom: 12px;
  }

  .editorWorkspace {
    padding: 12px;
  }

  .editorHeading {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .actions {
    align-items:
      stretch;

    flex-direction:
      column;
  }

  .editAgain,
  .download {
    width: 100%;
  }

}
`;
