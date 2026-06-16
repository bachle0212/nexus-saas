import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TierThrottleGuard } from './tier-throttle.guard';
import { THROTTLE_TIER_KEY } from './throttle.decorator';

function makeContext(userId: number | null, plan: string, tier = 'generate'): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: userId !== null ? { id: userId, plan } : null,
        ip: '127.0.0.1',
      }),
    }),
  } as any;
}

describe('TierThrottleGuard', () => {
  let guard: TierThrottleGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TierThrottleGuard(reflector);
    // Override getAllAndOverride to always return 'generate' tier
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('generate');
  });

  afterEach(() => jest.restoreAllMocks());

  it('passes when no tier metadata is set on handler', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    // Any context — guard returns true when no tier is configured
    const ctx = makeContext(1, 'Free');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows Free user within 5 requests per minute', () => {
    // Each test run uses a unique user ID to avoid state bleed from other tests
    const userId = Date.now(); // unique per test run
    const ctx = makeContext(userId, 'Free');

    for (let i = 0; i < 5; i++) {
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('throws 429 when Free user exceeds 5 requests per minute', () => {
    const userId = Date.now() + 1000;
    const ctx = makeContext(userId, 'Free');

    // Exhaust the limit
    for (let i = 0; i < 5; i++) guard.canActivate(ctx);

    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
    try {
      guard.canActivate(ctx);
    } catch (e: any) {
      expect(e.getStatus()).toBe(429);
      expect(e.getResponse()).toMatchObject({
        statusCode: 429,
        limit: 5,
        plan: 'Free',
      });
    }
  });

  it('allows Pro user higher limit of 60 requests per minute', () => {
    const userId = Date.now() + 2000;
    const ctx = makeContext(userId, 'Pro');

    // Pro gets 60 — go up to 60 without throwing
    for (let i = 0; i < 60; i++) {
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('throws 429 when Pro user exceeds 60 requests per minute', () => {
    const userId = Date.now() + 3000;
    const ctx = makeContext(userId, 'Pro');

    for (let i = 0; i < 60; i++) guard.canActivate(ctx);

    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
  });

  it('Enterprise user gets effectively unlimited (10000) requests', () => {
    const userId = Date.now() + 4000;
    const ctx = makeContext(userId, 'Enterprise');

    // Spot check: 500 calls should not throw
    for (let i = 0; i < 500; i++) {
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('strict tier limits to 3 requests regardless of plan', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('strict');
    const userId = Date.now() + 5000;
    const ctx = makeContext(userId, 'Pro');

    for (let i = 0; i < 3; i++) guard.canActivate(ctx);

    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
    try {
      guard.canActivate(ctx);
    } catch (e: any) {
      expect(e.getResponse()).toMatchObject({ limit: 3 });
    }
  });

  it('falls back to IP when user is not authenticated', () => {
    const ctx = makeContext(null, 'Free');
    // Should not throw on first request — IP-based key works
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
