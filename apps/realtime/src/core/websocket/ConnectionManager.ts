import { WebSocket } from 'ws';
import { Connection } from '@/core/websocket/Connection';
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
  private latestByVehicle = new Map<string, BusLocationEvent>();

  register(socket: WebSocket) {
    const id = randomUUID();
    const conn = new Connection(socket, id);
    this.connections.set(id, conn);

    socket.on('message', (msg) => {
      this.handleMessage(conn, msg.toString());
    });

    socket.on('close', () => {
      this.connections.delete(id);
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
