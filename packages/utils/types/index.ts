export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export interface Bus {
  id: string;
  registration: string;
  type: string;
  capacity?: number;
  status: VehicleStatus;
}

export interface Route {
  id: string;
  code: string;
  name: string;
  city: string;
  isActive: boolean;
  stops: RouteStop[];
}

export interface RouteStop {
  id: string;
  routeId: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  licenseNo?: string;
}

export interface ServiceAlert {
  id: string;
  type: 'DELAY' | 'DETOUR' | 'CANCELLED';
  message: string;
  routeId?: string;
  active: boolean;
  createdAt: string;
}

export interface GPSReading {
  vehicleId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  recordedAt: string;
}

export interface BusLocationUpdate extends GPSReading {
  nextStopId?: string;
  etaNextStop?: number; // minutes
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
