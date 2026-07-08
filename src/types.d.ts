interface Window {
  supabase: {
    createClient: (url: string, key: string) => ReturnType<any>;
  };
  tmImage: {
    load: (modelURL: string, metadataURL: string) => Promise<any>;
    Webcam: new (width: number, height: number, flip: boolean) => any;
  };
}
