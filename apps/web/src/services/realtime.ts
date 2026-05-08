import { useBusStore } from '../store/useBusStore';
import type { BusLocationUpdate } from '@repo/utils/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3004';

class RealtimeService {
<<<<<<< HEAD
  private socket: WebSocket | null = null;

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log('Connected to realtime gateway');
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as {
          type: string;
          payload: BusLocationUpdate | BusLocationUpdate[];
        };

        if (message.type === 'vehicle.location.updated') {
          useBusStore.getState().updateLocation(message.payload as BusLocationUpdate);
          return;
        }

        if (message.type === 'active_buses.snapshot') {
          const snapshot = message.payload as BusLocationUpdate[];
          const locations = snapshot.reduce<Record<string, BusLocationUpdate>>((acc, update) => {
            acc[update.vehicleId] = update;
            return acc;
          }, {});
          useBusStore.getState().setLocations(locations);
        }
      } catch (error) {
        console.warn('Invalid realtime message', error);
      }
    };

    this.socket.onclose = () => {
      console.log('Disconnected from realtime gateway');
=======
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    this.destroyed = false;
    console.log('[Realtime] Connecting to', WS_URL);

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('[Realtime] Connected to realtime server');
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.event === 'vehicle.location.updated' && msg.data) {
          const d = msg.data;
          const update: BusLocationUpdate = {
            vehicleId:    d.vehicleId,
            latitude:     d.latitude,
            longitude:    d.longitude,
            speed:        d.speed ?? 0,
            status:       d.status,
            stopsCrossed: d.stopsCrossed,
            registration: d.registration,
            routeId:      d.routeId,
            recordedAt:   d.recordedAt ?? new Date().toISOString(),
            timestamp:    d.recordedAt ? new Date(d.recordedAt).getTime() : Date.now(),
          };
          useBusStore.getState().updateLocation(update);
        }
      } catch (err) {
        console.warn('[Realtime] Failed to parse message', err);
      }
    };

    this.ws.onerror = () => {
      console.warn('[Realtime] WebSocket error');
    };

    this.ws.onclose = () => {
      console.log('[Realtime] Disconnected – reconnecting in 3s…');
      if (!this.destroyed) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
>>>>>>> c8830d5974eb3a3a2251c74c5429b40835c640aa
    };
  }

  disconnect() {
<<<<<<< HEAD
    this.socket?.close();
    this.socket = null;
  }

  subscribeToRoute(routeId: string) {
    this.send({ type: 'subscribe.route', id: routeId });
  }

  unsubscribeFromRoute(routeId: string) {
    this.send({ type: 'unsubscribe.route', id: routeId });
  }

  subscribeToBus(busId: string) {
    this.send({ type: 'subscribe.bus', id: busId });
  }

  unsubscribeFromBus(busId: string) {
    this.send({ type: 'unsubscribe.bus', id: busId });
  }

  private send(payload: { type: string; id: string }) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }
=======
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  // These are no-ops now (the server broadcasts to all; filtering happens client-side by routeId)
  subscribeToRoute(_routeId: string) {}
  unsubscribeFromRoute(_routeId: string) {}
>>>>>>> c8830d5974eb3a3a2251c74c5429b40835c640aa
}

export const realtime = new RealtimeService();
