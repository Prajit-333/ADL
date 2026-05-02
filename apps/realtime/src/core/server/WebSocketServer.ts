import { WebSocketServer as WsServer } from 'ws';
import http from 'http';
import { ConnectionManager } from '@/core/websocket/ConnectionManager';
import { Kafka } from 'kafkajs';

export class WebSocketServer {
  private wss: WsServer;
  private connectionManager = new ConnectionManager();
  private kafkaConsumerStarted = false;

  private kafkaTopic = process.env.KAFKA_TOPIC || 'bus.location.updated';
  private kafkaClientId = process.env.KAFKA_CLIENT_ID || 'adl-realtime';
  private kafkaBrokers = (process.env.KAFKA_BROKERS || 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);

  constructor(server: http.Server) {
    this.wss = new WsServer({ server });
  }

  start() {
    this.wss.on('connection', (socket) => {
      this.connectionManager.register(socket);
    });
    console.log('WebSocket server started');

    void this.startKafkaConsumer();
  }

  private async startKafkaConsumer() {
    if (this.kafkaConsumerStarted) return;
    this.kafkaConsumerStarted = true;

    const kafka = new Kafka({
      clientId: this.kafkaClientId,
      brokers: this.kafkaBrokers,
    });
    const consumer = kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'adl-realtime-broadcast',
    });

    try {
      await consumer.connect();
      await consumer.subscribe({ topic: this.kafkaTopic, fromBeginning: false });
      await consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value) return;

          const parsed = JSON.parse(message.value.toString()) as {
            vehicleId: string;
            routeId?: string;
            tripId?: string;
            latitude: number;
            longitude: number;
            speed?: number;
            recordedAt?: string;
          };

          if (
            !parsed.vehicleId ||
            typeof parsed.latitude !== 'number' ||
            typeof parsed.longitude !== 'number'
          ) {
            return;
          }

          this.connectionManager.broadcastLocation({
            ...parsed,
            recordedAt: parsed.recordedAt || new Date().toISOString(),
          });
        },
      });
      console.log(`Kafka consumer connected to topic ${this.kafkaTopic}`);
    } catch (error) {
      this.kafkaConsumerStarted = false;
      console.error('Failed to consume Kafka telemetry', error);
    }
  }
}
