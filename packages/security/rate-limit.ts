import { Ratelimit, type RatelimitConfig } from '@upstash/ratelimit';
import { redis } from './cache';


export const createRateLimiter = (props: Omit<RatelimitConfig, 'redis'>) =>
  new Ratelimit({
    redis,
    limiter: props.limiter ?? Ratelimit.slidingWindow(10, '10 s'),
    prefix: props.prefix ?? 'next-forge',
  });

export const { slidingWindow } = Ratelimit;
