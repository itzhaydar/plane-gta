import { create } from 'zustand';

export type Face = 'top' | 'bottom' | 'left' | 'right' | 'flag';

export type Liveries = Record<Face, string | null>;

export type LastRun = {
  picked: number;
  score: number;
} | null;

export type Role = 'pilot' | 'homie';

type State = {
  liveries: Liveries;
  activeFace: Face;
  lastRun: LastRun;
  role: Role | null;

  setActiveFace: (face: Face) => void;
  saveFace: (face: Face, dataUrl: string) => void;
  setLastRun: (run: LastRun) => void;
  setRole: (role: Role) => void;
};

export const usePlaneStore = create<State>((set) => ({
  liveries: {
    top: null,
    bottom: null,
    left: null,
    right: null,
    flag: null,
  },

  activeFace: 'top',
  lastRun: null,
  role: null,

  setActiveFace: (face) => set({ activeFace: face }),

  saveFace: (face, dataUrl) =>
    set((s) => ({
      liveries: {
        ...s.liveries,
        [face]: dataUrl,
      },
    })),

  setLastRun: (lastRun) => set({ lastRun }),

  setRole: (role) => set({ role }),
}));
