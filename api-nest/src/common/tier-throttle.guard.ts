import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { THROTTLE_TIER_KEY, ThrottleTier } from './throttle.decorator';

// Simple in-memory rate limiter (per IP + user)
const store = new Map<string, { count: number; resetAt: number }>();

function checkLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

@Injectable()
export class TierThrottleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const tier = this.reflector.getAllAndOverride<ThrottleTier>(THROTTLE_TIER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!tier) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip;
    const key = `${tier}:${user?.id ?? ip}`;

    // Limits: Free=5/min, Pro=60/min, Enterprise=unlimited
    let limit = 5;
    if (user?.plan === 'Pro') limit = 60;
    if (user?.plan === 'Enterprise') limit = 10000;

    if (tier === 'strict') limit = 3;

    const allowed = checkLimit(key, limit, 60 * 1000);

    if (!allowed) {
      throw new HttpException(
        {
          statusCode: 429,
          message: 'Too many requests. Upgrade your plan for higher rate limits.',
          plan: user?.plan ?? 'Free',
          limit,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
