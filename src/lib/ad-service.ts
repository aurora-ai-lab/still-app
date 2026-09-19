export interface AdService {
  isAvailable(): boolean;
  showRewardedAd(): Promise<{ completed: boolean }>;
}

/** V1 adapter: intentionally no SDK, always resolves immediately in local builds. */
export const MockAdService: AdService = {
  isAvailable: () => false,
  showRewardedAd: async () => ({ completed: false }),
};
