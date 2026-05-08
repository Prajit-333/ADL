import { HttpServer } from '@/core/server/HttpServer';
import { WebSocketServer } from '@/core/server/WebSocketServer';
import { connectKafkaProducer } from '@/config/kafka';
import { LocationConsumer } from '@/infrastructure/kafka/LocationConsumer';

export class App {
  private httpServer: HttpServer;
  private wsServer: WebSocketServer;
  private locationConsumer: LocationConsumer;

  constructor() {
    connectKafkaProducer();
    this.httpServer = new HttpServer();
    this.wsServer = new WebSocketServer(this.httpServer.getServer());
    this.locationConsumer = new LocationConsumer(this.wsServer.getConnectionManager());
  }

start() {
  this.httpServer.start();
  this.wsServer.start();
  this.locationConsumer.start();
}
};
