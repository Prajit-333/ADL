import { useBusStore } from '../store/useBusStore';
import type { BusLocationUpdate } from '@repo/utils/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3004';

class RealtimeService {
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
    };
  }

  disconnect() {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  // These are no-ops now (the server broadcasts to all; filtering happens client-side by routeId)
  subscribeToRoute(_routeId: string) {}
  unsubscribeFromRoute(_routeId: string) {}
}

export const realtime = new RealtimeService();
