import axios from 'axios';
import type { ApiResponse, Route, Stop, Bus, Driver } from '@repo/utils/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getRoutes: () => client.get<ApiResponse<Route[]>>('/routes').then(r => r.data),
  getStops: () => client.get<ApiResponse<Stop[]>>('/stops').then(r => r.data),
  getActiveBuses: () => client.get<ApiResponse<Bus[]>>('/buses/active').then(r => r.data),
  getDriverProfile: (id: string) => client.get<ApiResponse<Driver>>(`/drivers/${id}`).then(r => r.data),
  updateLocation: (data: { lat: number; lon: number; speed?: number }) =>
    client.post('/ingest/location', data).then(r => r.data),
};
