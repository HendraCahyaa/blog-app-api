import { Redis } from "ioredis";

export const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});

export const getValues = async (key: string) => {
  return await connection.get(key);
};
export const setValues = async (key: string, value: string, ttl?: number) => {
  if (ttl) {
    await connection.setex(key, ttl, value);
  } else {
    await connection.set(key, value);
  }
};
