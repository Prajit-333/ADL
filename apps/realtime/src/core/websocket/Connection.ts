import { WebSocket } from "ws";

export class Connection {
  private subscriptions = {
    routes: new Set<string>(),
    buses: new Set<string>(),
  };

  constructor(
    public readonly socket: WebSocket,
    public readonly clientId: string
  ) {}

  subscribeRoute(routeId: string) {
    this.subscriptions.routes.add(routeId);
  }

  unsubscribeRoute(routeId: string) {
    this.subscriptions.routes.delete(routeId);
  }

  subscribeBus(busId: string) {
    this.subscriptions.buses.add(busId);
  }

  unsubscribeBus(busId: string) {
    this.subscriptions.buses.delete(busId);
  }

  matches(update: { routeId?: string; vehicleId: string }) {
    const hasRouteSubscription = this.subscriptions.routes.size > 0;
    const hasBusSubscription = this.subscriptions.buses.size > 0;

    if (!hasRouteSubscription && !hasBusSubscription) {
      return true;
    }

    if (hasBusSubscription && this.subscriptions.buses.has(update.vehicleId)) {
      return true;
    }

    if (hasRouteSubscription && update.routeId && this.subscriptions.routes.has(update.routeId)) {
      return true;
    }

    return false;
  }

  send(data: any) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.socket.send(message);
  }
}
