export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  currentIndex: number;
  total: number;
  progress: number;
}

export interface ImageConfig {
  aspectRatio: string;
  imageSize: string;
}
