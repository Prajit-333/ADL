import { useBusStore } from '../store/useBusStore';
import type { BusLocationUpdate } from '@repo/utils/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

class RealtimeService {
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
    };
  }

  disconnect() {
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
}

export const realtime = new RealtimeService();
