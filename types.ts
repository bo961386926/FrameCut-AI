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
