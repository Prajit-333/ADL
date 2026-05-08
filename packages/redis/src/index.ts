import Redis from 'ioredis';

// Export simple singleton pattern or helper methods later
export const getRedisClient = (url: string) => {
  return new Redis(url);
};

export default getRedisClient;
