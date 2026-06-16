import { SetMetadata } from '@nestjs/common';

export const THROTTLE_TIER_KEY = 'throttle_tier';

export type ThrottleTier = 'generate' | 'public' | 'strict';

export const ThrottleTier = (tier: ThrottleTier) => SetMetadata(THROTTLE_TIER_KEY, tier);
