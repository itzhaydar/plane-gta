# Marshout

Pick up your homies. Take the crew somewhere unexpected.

A GTA-inspired trip built for Unlayer’s [Build with React Image Editor](https://github.com/unlayer/react-image-editor) challenge.

**Live:** [marshout.vercel.app](https://marshout.vercel.app)  
**Repo:** [github.com/itzhaydar/plane-gta](https://github.com/itzhaydar/plane-gta)

Vice City is boarding late. Walk the boulevard. Three doors are waiting.

## Flow

Everything starts on the landing page. There is no separate “select role / select vehicle” menu. You pick a character, then you walk.

```text
Landing
└─ Take a Tour
   └─ Choose character (Male / Female)
      └─ 3…2…1… streets open
         └─ Marshout Boulevard (Vice City)
            ├─ 01 Flyer House            → /homie         flyer studio
            ├─ 02 Gellhorn Departures    → /hangar        paint flags → fly plane
            └─ 03 Mars / Night Flight    → /rock-hangar   mark insignias → fly rocket
```

### Landing

Title screen: **Take a tour.**

See which door gets you a travel flyer and which one gets you to a new destination.

### Character

**Choose your character.** Male or female.

That character stays with you through the trip (Zustand + `localStorage`). After you pick, Vice City loads the block with a short countdown.

### Boulevard

You are on Marshout Boulevard. Walk up to a marked entrance. The city tells you when you are close.

| Door | Destination copy | Route | Role |
| --- | --- | --- | --- |
| Flyer House | Get a travel flyer | `/homie` | Homie |
| Gellhorn Departures | Take a trip to Port Gellhorn | `/hangar` | Pilot |
| Mars / Night Flight | Attend a Party on Mars | `/rock-hangar` | Pilot |

**Controls**

- Arrow keys / on-screen pad — move
- `E` — step inside a door when you are close
- `M` — sound on / off
- Drag — look around

### Flyer House

You are cargo, not the captain.

Open **Vice City Flyer Studio** and build the pickup poster:

1. Pick where you are going — **Port Gellhorn** (plane) or **Mars** (rocket). The ride is auto-matched.
2. Put your name on it.
3. Choose a portrait (stock faces or upload PNG / JPG / WebP).
4. Sign or edit that image in Unlayer’s image editor.

The live flyer is `1080 × 1350`. Download unlocks after you sign or edit the portrait. That flyer is how the crew finds you.

### Plane (Port Gellhorn)

**Hangar** (`/hangar`): inspect the plane, then paint the **left flag** and **right flag**.

Both sides need **80%** paint coverage. Draw on the flag. Do not crop it.

When both flags are ready, **Take off** opens `/fly`.

**Flight:** Vice City → Port Gellhorn on autopilot.

- `G` get in
- `T` take off
- `S` stop after landing
- `E` get out
- `M` sound
- Drag mouse to rotate the camera

### Rocket (Mars)

**Launch bay** (`/rock-hangar`): inspect the ship, then mark the **upper insignia** and **lower insignia**.

Both panels need **80%** coverage.

When both insignias are flight-marked, **Launch to Mars** opens `/fly-rocket`.

**Flight:** Earth → Mars on autopilot.

- `G` get in
- `T` take off
- `E` get out on the surface
- `M` sound
- Drag mouse to rotate the camera

Phases: parked → launch → clouds → space → Mars approach → entry → landing → exited.

## Where the image editor sits

`@unlayer/react-image-editor` is the customization layer.

| Path | What you edit |
| --- | --- |
| `/homie` | Portrait on the pickup flyer (sign / crop / draw / type / stickers) |
| `/hangar` | Left flag / right flag on the plane |
| `/rock-hangar` | Upper insignia / lower insignia on the rocket |

Save writes a data URL into Zustand (`liveries`). The 3D hangar and flight scenes read those textures and put them on the vehicle.

Coverage scoring on the vehicles compares painted pixels against the template. Takeoff / launch stay locked until both faces hit 80%.

### Templates

Files live in `/public/templates/`.

| File | Used on |
| --- | --- |
| `flag-left.svg` | Plane left flag |
| `flag-right.svg` | Plane right flag |
| `insu.svg` | Rocket upper insignia |
| `insl.svg` | Rocket lower insignia |

## Routes

| Path | Page |
| --- | --- |
| `/` | Landing, character select, boulevard |
| `/homie` | Flyer studio |
| `/hangar` | Plane hangar + livery editor |
| `/fly` | Plane flight to Port Gellhorn |
| `/rock-hangar` | Rocket launch bay + insignia editor |
| `/fly-rocket` | Rocket flight to Mars |

## Stack

- React 19, Vite, TypeScript, React Router 7
- Three.js + React Three Fiber + Drei
- Zustand
- `@unlayer/react-image-editor`
- Sharp (image conversion on `predev` / `prebuild`)
- Vercel

## Run

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

`predev` and `prebuild` run `scripts/convert-images.cjs`, which converts PNGs / JPGs in `public/` to WebP.

## Credits
3D GLBs (CC Attribution, Sketchfab):

- Astronaut
- Pilot

Audio: `/public/boot.mp3` on the boulevard, hangars, and flights.

## Challenge

Unlayer React Image Editor challenge: [github.com/unlayer/react-image-editor](https://github.com/unlayer/react-image-editor)
#BuiltWithImageEditor
