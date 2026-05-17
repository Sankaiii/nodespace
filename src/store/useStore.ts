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
  token: string | null;
  username: string | null;
  guestMode: boolean;
  profiles: Profile[];
  activeProfileId: string;
  theme: Theme;
  background: Background;
  searchOpen: boolean;
  saving: boolean;
  firstLaunch: boolean;
  autoSave: boolean;
  animations: boolean;
  shaCache: Record<string, string>;

  setAuth: (token: string, username: string) => void;
  clearAuth: () => void;
  setGuestMode: (v: boolean) => void;
  addProfile: (name: string) => string;
  setActiveProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
  updateProfileFlow: (id: string, flow: FlowState) => void;
  setTheme: (t: Theme) => void;
  setBackground: (b: Background) => void;
  setSearchOpen: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  setFirstLaunch: (v: boolean) => void;
  setAutoSave: (v: boolean) => void;
  setAnimations: (v: boolean) => void;
  setSha: (profileId: string, sha: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      guestMode: false,
      profiles: [initial],
      activeProfileId: initial.id,
      theme: 'dark',
      background: 'dots',
      searchOpen: false,
      saving: false,
      firstLaunch: true,
      autoSave: false,
      animations: true,
      shaCache: {},

      setAuth: (token, username) => set({ token, username, guestMode: false }),
      clearAuth: () => set({ token: null, username: null, guestMode: false }),
      setGuestMode: (guestMode) => set({ guestMode }),

      addProfile: (name) => {
        const p = makeProfile(name);
        set((s) => ({ profiles: [...s.profiles, p], activeProfileId: p.id }));
        return p.id;
      },
      setActiveProfile: (id) => set({ activeProfileId: id }),
      renameProfile: (id, name) =>
        set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, name } : p)) })),
      deleteProfile: (id) =>
        set((s) => {
          const remaining = s.profiles.filter((p) => p.id !== id);
          if (!remaining.length) return s;
          const newActive = remaining.find((p) => p.id !== id)?.id ?? remaining[0].id;
          return { profiles: remaining, activeProfileId: newActive };
        }),
      updateProfileFlow: (id, flow) =>
        set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, flow } : p)) })),

      setTheme: (theme) => set({ theme }),
      setBackground: (background) => set({ background }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setSaving: (saving) => set({ saving }),
      setFirstLaunch: (firstLaunch) => set({ firstLaunch }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setAnimations: (animations) => set({ animations }),
      setSha: (profileId, sha) =>
        set((s) => ({ shaCache: { ...s.shaCache, [profileId]: sha } })),
    }),
    {
      name: 'nodespace-store',
      partialize: (s) => ({
        token: s.token,
        username: s.username,
        guestMode: s.guestMode,
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
        theme: s.theme,
        background: s.background,
        shaCache: s.shaCache,
        firstLaunch: s.firstLaunch,
        autoSave: s.autoSave,
        animations: s.animations,
      }),
    }
  )
);
