interface Window {
  supabase: {
    createClient: (url: string, key: string) => SupabaseClient;
  };
  tmImage: {
    load: (modelURL: string, metadataURL: string) => Promise<TMModel>;
    Webcam: new (width: number, height: number, flip: boolean) => TMWebcam;
  };
}

interface SupabaseClient {
  from: (table: string) => SupabaseQuery;
}

interface SupabaseQuery {
  select: (cols?: string) => SupabaseQuery;
  insert: (rows: Record<string, unknown>[]) => Promise<{ data: unknown; error: { message: string } | null }>;
  update: (data: Record<string, unknown>) => SupabaseQuery;
  delete: () => SupabaseQuery;
  eq: (col: string, val: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
  order: (col: string, opts?: { ascending: boolean }) => SupabaseQuery;
  then: (resolve: (result: { data: unknown; error: { message: string } | null }) => void) => void;
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
