import { useState, useRef, useEffect, useCallback } from 'react';
import type { Prediction } from '../types';

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/MHE9y_TuM/';

interface ImageAnalyzerProps {
  onAnalysisComplete: (result: string) => void;
}

export default function ImageAnalyzer({ onAnalysisComplete }: ImageAnalyzerProps) {
  const [loadingModel, setLoadingModel] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isHeatIsland, setIsHeatIsland] = useState<boolean | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);

  const modelRef = useRef<{ predict: (input: HTMLCanvasElement | HTMLImageElement) => Promise<Prediction[]> } | null>(null);
  const webcamRef = useRef<{ canvas: HTMLCanvasElement; active: boolean; setup: () => Promise<void>; play: () => Promise<void>; stop: () => void; update: () => void } | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number>(0);

  const classify = useCallback((preds: Prediction[]) => {
    const top = preds.reduce((a, b) => (a.probability > b.probability ? a : b));
    const isHeat = top.className.toLowerCase().includes('heat') ||
      top.className.includes('열섬') ||
      top.className.toLowerCase().includes('urban');
    setIsHeatIsland(isHeat);
    const label = `${top.className} (${(top.probability * 100).toFixed(0)}%)`;
    setPredictions(preds);
    onAnalysisComplete(label);
  }, [onAnalysisComplete]);

  const analyzeImage = useCallback(async (img: HTMLImageElement | HTMLCanvasElement) => {
    if (!modelRef.current) return;
    setAnalyzing(true);
    try {
      const preds = await modelRef.current.predict(img);
      classify(preds);
    } catch (err) {
      console.error('분석 실패:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [classify]);

  useEffect(() => {
    const tfScript = document.createElement('script');
    tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js';
    tfScript.async = true;

    tfScript.onerror = () => {
      setModelError(true);
      setLoadingModel(false);
    };

    tfScript.onload = () => {
      const tmScript = document.createElement('script');
      tmScript.src = 'https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js';
      tmScript.async = true;

      tmScript.onerror = () => {
        setModelError(true);
        setLoadingModel(false);
      };

      tmScript.onload = async () => {
        try {
          const modelURL = MODEL_URL + 'model.json';
          const metadataURL = MODEL_URL + 'metadata.json';
          if (window.tmImage) {
            modelRef.current = await window.tmImage.load(modelURL, metadataURL);
          }
        } catch {
          setModelError(true);
        } finally {
          setLoadingModel(false);
        }
      };

      document.head.appendChild(tmScript);
    };

    document.head.appendChild(tfScript);

    return () => {
      if (webcamRef.current) {
        webcamRef.current.stop();
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopWebcam();
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setImageSrc(src);
      const img = new Image();
      img.src = src;
      img.onload = () => analyzeImage(img);
    };
    reader.readAsDataURL(file);
  };

  const startWebcam = async () => {
    if (!modelRef.current || !window.tmImage) return;
    try {
      setImageSrc(null);
      const webcam = new window.tmImage.Webcam(360, 270, true);
      await webcam.setup();
      await webcam.play();
      webcamRef.current = webcam;
      setWebcamActive(true);

      if (videoRef.current) {
        videoRef.current.innerHTML = '';
        videoRef.current.appendChild(webcam.canvas);
      }

      const loop = async () => {
        if (!webcam.active) return;
        webcam.update();
        const preds = await modelRef.current!.predict(webcam.canvas);
        classify(preds);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error('웹캠 실패:', err);
      alert('웹캠을 켜는데 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  const stopWebcam = () => {
    if (webcamRef.current) {
      webcamRef.current.stop();
      webcamRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
    setWebcamActive(false);
    if (videoRef.current) {
      videoRef.current.innerHTML = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded bg-white">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">도심 이미지 AI 분석</h2>
          <p className="text-xs text-gray-500 mt-0.5">이미지를 업로드하거나 웹캠으로 열섬 위험을 판정합니다.</p>
        </div>

        <div className="p-4">
          {loadingModel && (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded">
              AI 모델 로딩 중...
            </div>
          )}

          {modelError && (
            <div className="h-48 flex items-center justify-center text-sm text-red-500 border border-dashed border-red-200 rounded bg-red-50">
              모델 로딩 실패. 페이지를 새로고침하거나 네트워크를 확인하세요.
            </div>
          )}

          {!loadingModel && !modelError && (
            <>
              <div className="relative aspect-[4/3] w-full bg-gray-50 border border-gray-100 rounded flex items-center justify-center overflow-hidden">
                {imageSrc && <img src={imageSrc} alt="업로드 이미지" className="w-full h-full object-contain" />}
                {webcamActive && (
                  <div ref={videoRef} className="w-full h-full [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-contain" />
                )}
                {!imageSrc && !webcamActive && (
                  <p className="text-xs text-gray-400">이미지를 업로드하거나 웹캠을 시작하세요.</p>
                )}
                {analyzing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <span className="text-sm text-gray-600">분석 중...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 text-gray-700"
                >
                  사진 업로드
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  accept="image/*"
                  className="hidden"
                />
                {webcamActive ? (
                  <button
                    onClick={stopWebcam}
                    className="flex-1 px-3 py-2 text-sm border border-red-200 rounded hover:bg-red-50 text-red-600"
                  >
                    웹캠 종료
                  </button>
                ) : (
                  <button
                    onClick={startWebcam}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 text-gray-700"
                  >
                    웹캠 시작
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {predictions.length > 0 && (
        <div className="border border-gray-200 rounded bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase">분석 결과</h3>
            {isHeatIsland !== null && (
              <span className={`text-xs px-2 py-0.5 rounded ${isHeatIsland ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                {isHeatIsland ? '열섬 우려' : '정상'}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {predictions.map((pred, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-24 truncate">{pred.className}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${i === 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
                    style={{ width: `${pred.probability * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">{(pred.probability * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
