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
  getRoutes: () => client.get<ApiResponse<Route[]>>('/routes').then(r => r.data),
  getDrivers: () => client.get<ApiResponse<Driver[]>>('/drivers').then(r => r.data),
  getStops: () => client.get<ApiResponse<Stop[]>>('/stops').then(r => r.data),
  getVehicles: () => client.get<ApiResponse<Bus[]>>('/vehicles').then(r => r.data),
  getActiveBuses: () => client.get<ApiResponse<Bus[]>>('/buses/active').then(r => r.data),
  getDriverProfile: (id: string) => client.get<ApiResponse<Driver>>(`/drivers/${id}`).then(r => r.data),
  createRoute: (data: { code: string; name: string; city: string }) =>
    client.post<ApiResponse<Route>>('/admin/routes', data).then((r) => r.data),
  createStop: (data: { routeId: string; name: string; latitude: number; longitude: number }) =>
    client.post<ApiResponse<Stop>>('/admin/stops', data).then((r) => r.data),
  createDriver: (data: { name: string; email: string; phone?: string; licenseNo?: string }) =>
    client.post<ApiResponse<Driver>>('/admin/drivers', data).then((r) => r.data),
  createVehicle: (data: {
    registration: string;
    type: string;
    capacity?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  }) => client.post<ApiResponse<Bus>>('/admin/vehicles', data).then((r) => r.data),
  updateVehicleStatus: (id: string, status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE') =>
    client.patch<ApiResponse<Bus>>(`/admin/vehicles/${id}/status`, { status }).then((r) => r.data),
  updateLocation: (data: {
    vehicleId: string;
    routeId?: string;
    tripId?: string;
    latitude: number;
    longitude: number;
    speed?: number;
  }) => client.post('/telemetry', data).then(r => r.data),
};
