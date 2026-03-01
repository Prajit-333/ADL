import type { Route, Stop, Bus, BusLocationUpdate } from '@repo/utils/types';

export const mockData = {
  routes: [
    { id: 'r1', code: '101', name: 'Downtown Express', city: 'City A', isActive: true, stops: [] },
    { id: 'r2', code: '202', name: 'Airport Link', city: 'City A', isActive: true, stops: [] },
  ] as Route[],
  stops: [
    { id: 's1', name: 'Central Station', latitude: 12.9716, longitude: 77.5946 },
    { id: 's2', name: 'Mall of City', latitude: 12.9816, longitude: 77.5946 },
  ] as Stop[],
  buses: [
    { id: 'b1', registration: 'KA-01-F-1234', type: 'AC', status: 'ACTIVE' },
  ] as Bus[],
};

export const startSimulation = (onUpdate: (update: BusLocationUpdate) => void) => {
  let lat = 12.9716;
  setInterval(() => {
    lat += 0.0001;
    onUpdate({
      vehicleId: 'b1',
      latitude: lat,
      longitude: 77.5946,
      recordedAt: new Date().toISOString(),
      speed: 40,
    });
  }, 3000);
};
