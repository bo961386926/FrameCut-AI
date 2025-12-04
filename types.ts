export interface ExtractedFrame {
  id: string;
  timestamp: number; // in seconds
  dataUrl: string; // Base64 image
  analysis?: string; // AI description
  isAnalyzing?: boolean;
}

export enum FrameSortOrder {
  TIME_ASC = 'TIME_ASC',
  TIME_DESC = 'TIME_DESC',
}

export interface VideoMeta {
  name: string;
  duration: number;
  width: number;
  height: number;
}

export type Language = 'en' | 'zh-CN' | 'zh-TW';

export interface I18nTexts {
  appTitle: string;
  uploadClick: string;
  uploadHint: string;
  signalData: string;
  duration: string;
  dimensions: string;
  frames: string;
  toggleTheme: string;
  collapse: string;
  expand: string;
  
  // Gallery
  galleryTitle: string;
  gallerySubtitle: string;
  selectAll: string;
  deselectAll: string;
  selected: string;
  download: string;
  delete: string;
  clearAll: string;
  clearAllConfirm: string;
  deleteConfirm: (count: number) => string;
  galleryEmpty: string;
  galleryEmptyHint: string;
  
  // Editor
  noSignal: string;
  uploadToInit: string;
  snapshot: string;
  batchInterval: string;
  batchCount: string;
  batchSmart: string;
  startBatch: string;
  
  // Frame Card
  downloadFrame: string;
  deleteFrame: string;
  analyzeFrame: string;
  analyzing: string;
  aiAnalysis: string;
  analysisError: string;
}