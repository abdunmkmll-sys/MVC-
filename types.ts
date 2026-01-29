
export type EntryCategory = 'slip' | 'joke';

export interface SlipEntry {
  id: string;
  userId: string;
  userEmail?: string;
  userPhoto?: string;
  victimName: string;
  content: string;
  category: EntryCategory;
  timestamp: number;
  aiAnalysis?: string;
}

export interface StatsData {
  name: string;
  count: number;
}

export interface AppConfig {
  appName: string;
  successMessage: string;
}
