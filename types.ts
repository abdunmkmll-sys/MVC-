
export type EntryCategory = 'slip' | 'joke';

export interface SlipEntry {
  id: string; // الوثيقة في Firestore
  userId: string; // UID من Firebase Auth
  userName: string;
  content: string; // نص التعليق/الكلجة
  category: EntryCategory;
  timestamp: any; // Firebase Timestamp
  postId: string; // معرف الصفحة أو التصنيف
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