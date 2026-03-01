import { create } from 'zustand';
import type { Driver } from '@repo/utils/types';

interface AuthState {
  user: { id: string; name: string; role: 'ADMIN' | 'DRIVER' | 'PASSENGER' } | null;
  driverProfile: Driver | null;
  isAuthenticated: boolean;
  login: (user: AuthState['user'], profile?: Driver) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  driverProfile: null,
  isAuthenticated: false,
  login: (user, driverProfile) => set({ user, driverProfile, isAuthenticated: true }),
  logout: () => set({ user: null, driverProfile: null, isAuthenticated: false }),
}));
