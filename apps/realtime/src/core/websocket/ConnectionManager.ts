import { WebSocket } from 'ws';
import { Connection } from '@/core/websocket/Connection';
import { TrackingService } from '@/domain/tracking/TrackingService';
import type { LocationPayload } from '@/domain/tracking/TrackingSession';
import { randomUUID } from 'crypto';

type BusLocationEvent = {
  vehicleId: string;
  routeId?: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  recordedAt: string;
};

export class ConnectionManager {
  private connections = new Map<string, Connection>();
<<<<<<< HEAD
  private latestByVehicle = new Map<string, BusLocationEvent>();
=======
  private trackingService = new TrackingService();
>>>>>>> c8830d5974eb3a3a2251c74c5429b40835c640aa

  register(socket: WebSocket) {
    const id = randomUUID();
    const conn = new Connection(socket, id);
    this.connections.set(id, conn);

    socket.on('message', (msg) => {
<<<<<<< HEAD
      this.handleMessage(conn, msg.toString());
=======
      this.trackingService.handleMessage(id, msg.toString(), this.onLocation);
>>>>>>> c8830d5974eb3a3a2251c74c5429b40835c640aa
    });

    socket.on('close', () => {
      this.connections.delete(id);
      this.trackingService.removeSession(id);
    });
  }

  private onLocation(clientId: string, payload: LocationPayload) {
    console.log(`[${clientId}] lat: ${payload.lat}, lon: ${payload.lon}`);
  }

  broadcast(event: string, data: any) {
    const payload = JSON.stringify({ event, data });
    this.connections.forEach((conn) => {
      conn.send(payload);
    });

    conn.send({
      type: 'active_buses.snapshot',
      payload: Array.from(this.latestByVehicle.values()),
    });
  }

  private handleMessage(conn: Connection, rawMessage: string) {
    try {
      const parsed = JSON.parse(rawMessage) as {
        type?: string;
        id?: string;
      };
      const id = parsed.id?.trim();
      if (!parsed.type || !id) return;

      if (parsed.type === 'subscribe.route') {
        conn.subscribeRoute(id);
        return;
      }
      if (parsed.type === 'unsubscribe.route') {
        conn.unsubscribeRoute(id);
        return;
      }
      if (parsed.type === 'subscribe.bus') {
        conn.subscribeBus(id);
        return;
      }
      if (parsed.type === 'unsubscribe.bus') {
        conn.unsubscribeBus(id);
      }
    } catch (error) {
      console.warn('Invalid websocket payload', error);
    }
  }

  broadcastLocation(update: BusLocationEvent) {
    this.latestByVehicle.set(update.vehicleId, update);

    for (const conn of this.connections.values()) {
      if (!conn.matches(update)) continue;
      conn.send({ type: 'vehicle.location.updated', payload: update });
    }
  }

  getLatestSnapshot() {
    return Array.from(this.latestByVehicle.values());
  }
}
