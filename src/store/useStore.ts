import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Profile, Background, Theme, FlowState } from '../types';

const makeProfile = (name: string): Profile => ({
  id: nanoid(8),
  name,
  flow: { nodes: [], edges: [] },
});

const initial = makeProfile('Perso');

interface StoreState {
  /* Auth */
  token: string | null;
  username: string | null;

  /* Profiles */
  profiles: Profile[];
  activeProfileId: string;

  /* UI */
  theme: Theme;
  background: Background;
  searchOpen: boolean;
  saving: boolean;

  /* GitHub file SHA (nécessaire pour les mises à jour) */
  shaCache: Record<string, string>;

  /* Actions */
  setAuth: (token: string, username: string) => void;
  clearAuth: () => void;

  addProfile: (name: string) => string;
  setActiveProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
  updateProfileFlow: (id: string, flow: FlowState) => void;

  setTheme: (t: Theme) => void;
  setBackground: (b: Background) => void;
  setSearchOpen: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  setSha: (profileId: string, sha: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      token: null,
      username: null,

      profiles: [initial],
      activeProfileId: initial.id,

      theme: 'dark',
      background: 'dots',
      searchOpen: false,
      saving: false,
      shaCache: {},

      setAuth: (token, username) => set({ token, username }),
      clearAuth: () => set({ token: null, username: null }),

      addProfile: (name) => {
        const p = makeProfile(name);
        set((s) => ({ profiles: [...s.profiles, p], activeProfileId: p.id }));
        return p.id;
      },

      setActiveProfile: (id) => set({ activeProfileId: id }),

      renameProfile: (id, name) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      deleteProfile: (id) =>
        set((s) => {
          const remaining = s.profiles.filter((p) => p.id !== id);
          if (!remaining.length) return s;
          const newActive = remaining.find((p) => p.id !== id)?.id ?? remaining[0].id;
          return { profiles: remaining, activeProfileId: newActive };
        }),

      updateProfileFlow: (id, flow) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, flow } : p)),
        })),

      setTheme: (theme) => set({ theme }),
      setBackground: (background) => set({ background }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setSaving: (saving) => set({ saving }),
      setSha: (profileId, sha) =>
        set((s) => ({ shaCache: { ...s.shaCache, [profileId]: sha } })),
    }),
    {
      name: 'nodespace-store',
      partialize: (s) => ({
        token: s.token,
        username: s.username,
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
        theme: s.theme,
        background: s.background,
        shaCache: s.shaCache,
      }),
    }
  )
);
