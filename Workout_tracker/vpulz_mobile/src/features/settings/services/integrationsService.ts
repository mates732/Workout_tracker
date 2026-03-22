export type IntegrationConnectionResult = {
  connected: boolean;
  message: string;
};

export interface WearableSyncProvider {
  syncNow: () => Promise<IntegrationConnectionResult>;
}

export async function connectAppleHealth(): Promise<IntegrationConnectionResult> {
  return { connected: false, message: 'Apple Health integration placeholder.' };
}

export async function connectGoogleFit(): Promise<IntegrationConnectionResult> {
  return { connected: false, message: 'Google Fit integration placeholder.' };
}

export async function syncWearableData(): Promise<IntegrationConnectionResult> {
  return { connected: false, message: 'Wearable sync interface placeholder.' };
}
