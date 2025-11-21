import IORedis from 'ioredis';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
};

export const connection = new IORedis(redisConfig);
export const subscriber = new IORedis(redisConfig);
export const publisher = new IORedis(redisConfig);

