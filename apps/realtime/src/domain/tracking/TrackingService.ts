import type { LocationPayload } from '@/domain/tracking/TrackingSession';
import { TrackingSession } from '@/domain/tracking/TrackingSession';
import { publishLocation } from '@/config/kafka';

export class TrackingService {
  private sessions = new Map<string, TrackingSession>();

  private isLocationPayload(data: unknown): data is LocationPayload {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as LocationPayload).lat === 'number' &&
      typeof (data as LocationPayload).lon === 'number'
    );
  }

  handleMessage(
    clientId: string,
    raw: string,
    onLocation: (clientId: string, payload: LocationPayload) => void
  ) {
    try {
      const parsed: unknown = JSON.parse(raw);

      if (this.isLocationPayload(parsed)) {
        let session = this.sessions.get(clientId);

        if (!session) {
          session = new TrackingSession(clientId);
          this.sessions.set(clientId, session);
        }

        session.updateLocation(parsed);
        onLocation(clientId, parsed);

        publishLocation(clientId, parsed.lat, parsed.lon).catch((err) => {
          console.error(`[${clientId}] Kafka publish failed:`, err);
        });
      } else {
        console.warn(`[${clientId}] Invalid payload:`, parsed);
      }
    } catch {
      console.error(`[${clientId}] Failed to parse message:`, raw);
    }
  }

  removeSession(clientId: string) {
    this.sessions.delete(clientId);
  }

  getSession(clientId: string): TrackingSession | undefined {
    return this.sessions.get(clientId);
  }
}
