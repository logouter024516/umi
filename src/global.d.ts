interface Window {
  tmImage: {
    load: (modelURL: string, metadataURL: string) => Promise<TMModel>;
    Webcam: new (width: number, height: number, flip: boolean) => TMWebcam;
  };
}

interface TMModel {
  predict: (input: HTMLCanvasElement | HTMLImageElement) => Promise<{ className: string; probability: number }[]>;
}

interface TMWebcam {
  canvas: HTMLCanvasElement;
  active: boolean;
  setup: () => Promise<void>;
  play: () => Promise<void>;
  stop: () => void;
  update: () => void;
}
