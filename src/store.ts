import { create } from 'zustand';
export type PlaneFace = 'flag-left' | 'flag-right';
export type RocketFace = 'insu' | 'insl';
export type Face = PlaneFace | RocketFace;

export type Liveries = Record<Face, string | null>;

export type LastRun = {
  picked: number;
  score: number;
} | null;

export type Role = 'pilot' | 'homie';
export type Gender = 'man' | 'woman';

type State = {
  liveries: Liveries;
  activeFace: Face;
  lastRun: LastRun;
  role: Role | null;
  gender: Gender | null;

  setActiveFace: (face: Face) => void;
  saveFace: (face: Face, dataUrl: string) => void;
  setLastRun: (run: LastRun) => void;
  setRole: (role: Role) => void;
  setGender: (gender: Gender) => void;
};

function readSavedGender(): Gender | null {
  if (typeof window === 'undefined') return null;
  const saved = window.localStorage.getItem('marshout-gender');
  return saved === 'man' || saved === 'woman' ? saved : null;
}

export const usePlaneStore = create<State>((set) => ({
  // Plane and rocket artwork have different keys, so their designs cannot bleed
  // into one another.
  liveries: {
    'flag-left': null,
    'flag-right': null,
    insu: null,
    insl: null,
  },

  activeFace: 'flag-right',
  lastRun: null,
  role: null,
  gender: readSavedGender(),

  setActiveFace: (face) => set({ activeFace: face }),

  saveFace: (face, dataUrl) =>
    set((state) => ({
      liveries: {
        ...state.liveries,
        [face]: dataUrl,
      },
    })),

  setLastRun: (lastRun) => set({ lastRun }),
  setRole: (role) => set({ role }),

  setGender: (gender) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('marshout-gender', gender);
    }
    set({ gender });
  },
}));
