import { Kafka, Partitioners } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'adl-api',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  connectionTimeout: 3000,
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

export const connectKafka = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer connected');
  } catch (error) {
    console.error('❌ Kafka Connection Error:', error);
  }
};

export const publishLocation = async (payload: any) => {
  try {
    await producer.send({
      topic: 'location-updates',
      messages: [
        {
          key: payload.vehicleId,
          value: JSON.stringify(payload),
        },
      ],
    });
  } catch (error) {
    console.error('❌ Kafka Publish Error:', error);
  }
};
