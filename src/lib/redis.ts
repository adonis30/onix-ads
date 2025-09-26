// src/lib/redis.ts
import Redis from "ioredis";

if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not set");

export const redisPublisher = new Redis(process.env.REDIS_URL);
export const redisSubscriber = new Redis(process.env.REDIS_URL);
export const redis = new Redis(process.env.REDIS_URL); // general-purpose
export const redisCache = new Redis(process.env.REDIS_URL + "/1"); // cache database