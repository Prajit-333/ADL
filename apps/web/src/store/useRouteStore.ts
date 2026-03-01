import { create } from 'zustand';
import type { Route, Stop } from '@repo/utils/types';

interface RouteState {
  routes: Route[];
  stops: Stop[];
  selectedRouteId: string | null;
  isLoading: boolean;
  setRoutes: (routes: Route[]) => void;
  setStops: (stops: Stop[]) => void;
  setSelectedRoute: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  routes: [],
  stops: [],
  selectedRouteId: null,
  isLoading: false,
  setRoutes: (routes) => set({ routes }),
  setStops: (stops) => set({ stops }),
  setSelectedRoute: (selectedRouteId) => set({ selectedRouteId }),
  setLoading: (isLoading) => set({ isLoading }),
}));
