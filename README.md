MARSHOUT

Pick up your homies. Take the crew somewhere unexpected.

A GTA-inspired trip built for Unlayer’s Build with React Image Editor challenge.

Live: marshout.vercel.app  
Repo: github.com/itzhaydar/plane-gta

Flow

Everything starts on the landing page.

Landing
  └─ Start Game
       └─ Select role
            ├─ Homie  → flyer design
            └─ Pilot  → select vehicle
                          ├─ Rocket → rocket hangar → fly rocket
                          └─ Plane  → hangar        → fly plane

1. Landing
Title screen. Start Game. Role select.

2. Homie
You are cargo, not the captain.  
Open flyer design and dress the pickup poster and sign your image in Unlayer’s image editor. That flyer is how the crew finds you.

3. Pilot
You fly. First pick the vehicle.

Rocket
Rocket hangar: inspect the ship, paint the flags
Fly rocket: leave Earth, take the crew to Mars

Plane
Hangar: inspect the plane, paint the flags
Fly plane: hop cities, pick up homies, drop in

Where the Image Editor sits

@unlayer/react-image-editor is the customization layer, not a detached demo.

| Path | What you edit |
| --- | --- |
| Homie | Flyer art for the pickup |
| Plane hangar | Left / right flag faces on the plane |
| Rocket hangar | Lower insignias / Upper insignias on the rocket |

Save writes a data URL into Zustand. The 3D hangar / flight scenes read those textures and put them on the vehicle.

Templates live in /public/templates/ (flag-left, flag-right). They are used for both the plane and the rocket (Just different placements and display names).

Stack

React 19, Vite, TypeScript, React Router
Three.js + React Three Fiber + Drei
Zustand
@unlayer/react-image-editor
Sharp for image conversion on predev / prebuild
Vercel

Run

npm install
npm run dev

npm run build
npm run preview

Credits

Landing page image  
AI-generated.

3D GLBs (CC Attribution, Sketchfab)  
Astronaut  
Pilot  
Homies on the plane landing  
Rocket landing homies

Challenge  
Unlayer React Image Editor challenge.  
https://github.com/unlayer/react-image-editor
