import { Kafka, Partitioners } from 'kafkajs';
import type { Producer } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'realtime-service',
  brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
});

const producer: Producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

export async function connectKafkaProducer() {
  await producer.connect();
  console.log('Kafka producer connected');
}

export async function publishLocation(clientId: string, lat: number, lon: number) {
  await producer.send({
    topic: 'location-updates',
    messages: [
      {
        key: clientId,
        value: JSON.stringify({ clientId, lat, lon, timestamp: Date.now() }),
      },
    ],
  });
}

export async function disconnectKafkaProducer() {
  await producer.disconnect();
}
