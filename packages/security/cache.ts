import { Redis } from '@upstash/redis';
import { keys } from './keys';


export const redis = new Redis({
    url: keys().UPSTASH_REDIS_REST_URL,
    token: keys().UPSTASH_REDIS_REST_TOKEN,
  });