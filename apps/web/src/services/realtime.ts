import { io, Socket } from 'socket.io-client';
import { useBusStore } from '../store/useBusStore';
import type { BusLocationUpdate } from '@repo/utils/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

class RealtimeService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to realtime gateway');
    });

    this.socket.on('vehicle.location.updated', (update: BusLocationUpdate) => {
      useBusStore.getState().updateLocation(update);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from realtime gateway');
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribeToRoute(routeId: string) {
    this.socket?.emit('subscribe', { type: 'route', id: routeId });
  }

  unsubscribeFromRoute(routeId: string) {
    this.socket?.emit('unsubscribe', { type: 'route', id: routeId });
  }
}

export const realtime = new RealtimeService();
