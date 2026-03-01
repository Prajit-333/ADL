import { create } from 'zustand';
import type { BusLocationUpdate, Bus } from '@repo/utils/types';

interface BusState {
  locations: Record<string, BusLocationUpdate>;
  activeBuses: Bus[];
  selectedBusId: string | null;
  setLocations: (locations: Record<string, BusLocationUpdate>) => void;
  updateLocation: (update: BusLocationUpdate) => void;
  setActiveBuses: (buses: Bus[]) => void;
  setSelectedBus: (id: string | null) => void;
}

export const useBusStore = create<BusState>((set) => ({
  locations: {},
  activeBuses: [],
  selectedBusId: null,
  setLocations: (locations) => set({ locations }),
  updateLocation: (update) =>
    set((state) => ({
      locations: { ...state.locations, [update.vehicleId]: update }
    })),
  setActiveBuses: (activeBuses) => set({ activeBuses }),
  setSelectedBus: (selectedBusId) => set({ selectedBusId }),
}));
