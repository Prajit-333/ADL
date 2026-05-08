export interface LocationPayload {
  lat: number;
  lon: number;
}

export class TrackingSession {
  readonly clientId: string;
  private lastLocation: LocationPayload | null = null;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  updateLocation(payload: LocationPayload) {
    this.lastLocation = payload;
  }

  getLastLocation(): LocationPayload | null {
    return this.lastLocation;
  }
}
