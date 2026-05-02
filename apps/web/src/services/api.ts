import axios from 'axios';
import type { ApiResponse, Route, Stop, Bus, Driver } from '@repo/utils/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3009';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getRoutes: () => client.get<ApiResponse<Route[]>>('/routes').then((r) => r.data),
  getStops: () => client.get<ApiResponse<Stop[]>>('/stops').then((r) => r.data),
  getActiveBuses: () => client.get<ApiResponse<Bus[]>>('/buses/active').then((r) => r.data),
  getDrivers: () => client.get<ApiResponse<Driver[]>>('/drivers').then((r) => r.data),
  getAssignments: () =>
    client
      .get<
        ApiResponse<
          Array<{
            id: string;
            vehicleId: string;
            routeId: string;
            driverId: string;
            startDate: string;
            endDate?: string;
            vehicleRegistration: string;
            routeCode: string;
            driverName: string;
          }>
        >
      >('/assignments')
      .then((r) => r.data),
  getDriverProfile: (id: string) =>
    client.get<ApiResponse<Driver>>(`/drivers/${id}`).then((r) => r.data),
  createRoute: (data: { code: string; name: string; city: string }) =>
    client.post<ApiResponse<Route>>('/admin/routes', data).then((r) => r.data),
  createStop: (data: {
    routeId: string;
    name: string;
    latitude: number;
    longitude: number;
    sequence?: number;
  }) => client.post<ApiResponse<Stop>>('/admin/stops', data).then((r) => r.data),
  createVehicle: (data: {
    registration: string;
    type: string;
    capacity?: number;
    status?: string;
  }) => client.post<ApiResponse<Bus>>('/admin/vehicles', data).then((r) => r.data),
  createAssignment: (data: {
    vehicleId: string;
    routeId: string;
    driverId: string;
    startDate?: string;
    endDate?: string;
  }) =>
    client
      .post<
        ApiResponse<{
          id: string;
          vehicleId: string;
          routeId: string;
          driverId: string;
          startDate: string;
          endDate?: string;
        }>
      >('/admin/assignments', data)
      .then((r) => r.data),
  updateLocation: (data: {
    vehicleId: string;
    routeId?: string;
    tripId?: string;
    latitude: number;
    longitude: number;
    speed?: number;
  }) => client.post('/telemetry', data).then((r) => r.data),
};
