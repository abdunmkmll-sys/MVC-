
export type EntryCategory = 'slip' | 'joke';

export interface SlipEntry {
  id: string;
  name: string;
  content: string;
  category: EntryCategory;
  timestamp: number;
  aiAnalysis?: string;
  isAnalyzing?: boolean;
}

export interface StatsData {
  name: string;
  count: number;
}

export interface AppConfig {
  appName: string;
  successMessage: string;
  slipPrompt: string;
  jokePrompt: string;
}
