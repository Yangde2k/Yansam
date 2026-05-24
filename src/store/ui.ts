import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { makeId } from '../lib/utils';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: 'default' | 'success' | 'error';
}

export interface AppLockSettings {
  enabled: boolean;
  passcode: string;
  lockOnBackground: boolean;
  autoLockMinutes: number;
}

export interface UISettings {
  memoriesView: 'timeline' | 'grid' | 'stack';
  gallerySort: 'latest' | 'title';
  gallerySearch: string;
  lastRoute: string;
}

interface UIState {
  toasts: ToastItem[];
  security: AppLockSettings;
  preferences: UISettings;
  isLocked: boolean;
  lastInteractionAt: number;
  lastUnlockedAt: number | null;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  setSecurity: (patch: Partial<AppLockSettings>) => void;
  clearSecurity: () => void;
  resetSessionLockState: () => void;
  initializeLockForSession: (hasSession: boolean) => void;
  lockApp: () => void;
  unlockApp: (passcode: string) => boolean;
  registerInteraction: () => void;
  setMemoriesView: (view: UISettings['memoriesView']) => void;
  setGallerySort: (sort: UISettings['gallerySort']) => void;
  setGallerySearch: (search: string) => void;
  setLastRoute: (route: string) => void;
}

const defaultSecurity: AppLockSettings = {
  enabled: false,
  passcode: '',
  lockOnBackground: true,
  autoLockMinutes: 5,
};

const defaultPreferences: UISettings = {
  memoriesView: 'timeline',
  gallerySort: 'latest',
  gallerySearch: '',
  lastRoute: '/app/home',
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      toasts: [],
      security: defaultSecurity,
      preferences: defaultPreferences,
      isLocked: false,
      lastInteractionAt: Date.now(),
      lastUnlockedAt: null,
      addToast: (toast) => {
        const id = makeId('toast');
        set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
        window.setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
        }, 3200);
      },
      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
      setSecurity: (patch) =>
        set((state) => {
          const nextSecurity = { ...state.security, ...patch };
          const shouldLock = nextSecurity.enabled && Boolean(nextSecurity.passcode);
          return {
            security: nextSecurity,
            isLocked: shouldLock ? state.isLocked : false,
            lastUnlockedAt: shouldLock ? state.lastUnlockedAt ?? Date.now() : null,
          };
        }),
      clearSecurity: () =>
        set({
          security: defaultSecurity,
          isLocked: false,
          lastUnlockedAt: null,
        }),
      resetSessionLockState: () =>
        set({
          isLocked: false,
          lastUnlockedAt: null,
          lastInteractionAt: Date.now(),
        }),
      initializeLockForSession: (hasSession) => {
        if (!hasSession) {
          set({ isLocked: false, lastUnlockedAt: null });
          return;
        }

        const { security } = get();
        set({
          isLocked: security.enabled && Boolean(security.passcode),
          lastInteractionAt: Date.now(),
        });
      },
      lockApp: () => {
        const { security } = get();
        if (!security.enabled || !security.passcode) return;
        set({ isLocked: true });
      },
      unlockApp: (passcode) => {
        const { security } = get();
        if (!security.enabled || !security.passcode) {
          set({ isLocked: false, lastInteractionAt: Date.now(), lastUnlockedAt: Date.now() });
          return true;
        }

        const matched = security.passcode === passcode.trim();
        if (!matched) return false;

        set({
          isLocked: false,
          lastInteractionAt: Date.now(),
          lastUnlockedAt: Date.now(),
        });
        return true;
      },
      registerInteraction: () => {
        if (get().isLocked) return;
        set({ lastInteractionAt: Date.now() });
      },
      setMemoriesView: (memoriesView) =>
        set((state) => ({
          preferences: { ...state.preferences, memoriesView },
        })),
      setGallerySort: (gallerySort) =>
        set((state) => ({
          preferences: { ...state.preferences, gallerySort },
        })),
      setGallerySearch: (gallerySearch) =>
        set((state) => ({
          preferences: { ...state.preferences, gallerySearch },
        })),
      setLastRoute: (lastRoute) =>
        set((state) => ({
          preferences: { ...state.preferences, lastRoute },
        })),
    }),
    {
      name: 'yansam-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        security: state.security,
        preferences: state.preferences,
      }),
    },
  ),
);