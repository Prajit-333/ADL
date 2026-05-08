export const KafkaTopics = {
  BUS_LOCATION_UPDATED: 'bus.location.updated',
  TRIP_STARTED: 'trip.started',
  TRIP_ENDED: 'trip.ended',
  EMERGENCY_ALERT: 'emergency.alert',
} as const;

export * from 'kafkajs';
