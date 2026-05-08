import axios from 'axios';
import type { ApiResponse, Route, Stop, Bus } from '@repo/utils/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // ── Auth ───────────────────────────────────────────────────────────────────
  login: (data: any) => client.post<ApiResponse<any>>('/auth/login', data).then(r => r.data),

  // ── Passenger / Common ─────────────────────────────────────────────────────
  getRoutes: () => client.get<ApiResponse<Route[]>>('/routes').then(r => r.data),
  getStops: () => client.get<ApiResponse<Stop[]>>('/stops').then(r => r.data),
  getActiveBuses: () => client.get<ApiResponse<Bus[]>>('/buses/active').then(r => r.data),
  getAssignmentByDriverId: (driverId: string) =>
    client.get<ApiResponse<any>>(`/assignments/active?driverId=${driverId}`).then(r => r.data),
  updateLocation: (data: { vehicleId: string; latitude: number; longitude: number; speed?: number; status?: string; stopsCrossed?: number }) =>
    client.post('/location/update', data).then(r => r.data),

  // ── Transit Admin – Drivers ─────────────────────────────────────────────────
  createDriver: (data: any) => client.post<ApiResponse<any>>('/admin/drivers', data).then(r => r.data),
  getDrivers: () => client.get<ApiResponse<any[]>>('/admin/drivers').then(r => r.data),
  deleteDriver: (id: string) => client.delete<ApiResponse<any>>(`/admin/drivers/${id}`).then(r => r.data),

  // ── Transit Admin – Routes & Stops ──────────────────────────────────────────
  createAdminRoute: (data: any) => client.post<ApiResponse<any>>('/admin/routes', data).then(r => r.data),
  deleteAdminRoute: (id: string) => client.delete<ApiResponse<any>>(`/admin/routes/${id}`).then(r => r.data),
  createAdminStop: (data: any) => client.post<ApiResponse<any>>('/admin/stops', data).then(r => r.data),
  deleteAdminStop: (id: string) => client.delete<ApiResponse<any>>(`/admin/stops/${id}`).then(r => r.data),

  // ── Transit Admin – Vehicles ────────────────────────────────────────────────
  getBuses: () => client.get<ApiResponse<Bus[]>>('/buses/buses').then(r => r.data),
  createVehicle: (data: { registration: string; type: string; capacity: string | number; status: string }) =>
    client.post<ApiResponse<Bus>>('/buses/buses', data).then(r => r.data),
  deleteVehicle: (id: string) => client.delete<ApiResponse<any>>(`/buses/buses/${id}`).then(r => r.data),

  // ── Transit Admin – Assignments ─────────────────────────────────────────────
  getAssignments: () => client.get<ApiResponse<any[]>>('/admin/assignments').then(r => r.data),
  createAssignment: (data: { driverId: string; vehicleId: string; routeId: string; startDate?: string }) =>
    client.post<ApiResponse<any>>('/admin/assignments', data).then(r => r.data),
  endAssignment: (id: string) =>
    client.patch<ApiResponse<any>>(`/admin/assignments/${id}/end`, {}).then(r => r.data),
  deleteAssignment: (id: string) => client.delete<ApiResponse<any>>(`/admin/assignments/${id}`).then(r => r.data),

  // ── Trips ──────────────────────────────────────────────────────────────────
  startTrip: (data: { vehicleId: string; routeId: string }) =>
    client.post<ApiResponse<any>>('/trips/start', data).then(r => r.data),
  endTrip: (id: string) =>
    client.patch<ApiResponse<any>>(`/trips/${id}/end`, {}).then(r => r.data),
};
