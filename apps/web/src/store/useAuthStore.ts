import { create } from 'zustand';
import type { Driver } from '@repo/utils/types';

export type UserRole = 'ADMIN' | 'TRANSIT_ADMIN' | 'DRIVER' | 'PASSENGER';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
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
