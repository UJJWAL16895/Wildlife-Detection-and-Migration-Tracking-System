export interface Detection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [xmin, ymin, xmax, ymax]
}

export interface ApiResponse {
  detections: Detection[];
  image_size: [number, number]; // [width, height]
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
}
