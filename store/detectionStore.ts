import { create } from 'zustand';
import { UploadedImage, ApiResponse } from '../types/detection';

interface DetectionState {
  image: UploadedImage | null;
  results: ApiResponse | null;
  isLoading: boolean;
  error: string | null;
  setImage: (image: UploadedImage | null) => void;
  setResults: (results: ApiResponse | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDetectionStore = create<DetectionState>((set) => ({
  image: null,
  results: null,
  isLoading: false,
  error: null,
  setImage: (image) => set({ image }),
  setResults: (results) => set({ results }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
