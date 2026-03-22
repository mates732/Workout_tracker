import type { SubscriptionTier } from '../state/settings.types';

const PREMIUM_FEATURES = ['adaptive-rest-timer', 'advanced-analytics', 'coach-priority'] as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

export function hasPremiumAccess(tier: SubscriptionTier, feature: PremiumFeature): boolean {
  if (tier === 'premium') {
    return true;
  }
  return feature === 'coach-priority' ? false : false;
}

export function listPremiumFeatures(): PremiumFeature[] {
  return [...PREMIUM_FEATURES];
}
