import { useState, useRef, useEffect } from 'react';
import { MOCK_IMAGES } from '../data/mockDemo';
import type { MockProposal } from '../data/mockDemo';
import { CATEGORIES } from '../types';
import type { Prediction } from '../types';
import ScenarioIllustration from './ScenarioIllustration';
import { SCENARIO_PHOTOS } from '../data/scenarioPhotos';
import type { Category } from '../types';

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/MHE9y_TuM/';
const TFJS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js';
const TM_IMAGE_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

interface UploadedPhoto {
  fileName: string;
  src: string;
  predictions: Prediction[] | null;
}

let sharedModelPromise: Promise<TMModel> | null = null;

function loadScript(src: string, isReady: () => boolean): Promise<void> {
  if (isReady()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => isReady()
      ? resolve()
      : reject(new Error('라이브러리가 준비되지 않았습니다.'));
    script.onerror = () => reject(new Error('AI 라이브러리를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });
}

function loadTeachableMachineModel(): Promise<TMModel> {
  if (!sharedModelPromise) {
    sharedModelPromise = (async () => {
      await loadScript(TFJS_SCRIPT_URL, () => Boolean((window as Window & { tf?: unknown }).tf));
      await loadScript(TM_IMAGE_SCRIPT_URL, () => Boolean(window.tmImage));
      if (!window.tmImage) throw new Error('Teachable Machine 라이브러리를 사용할 수 없습니다.');
      return window.tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`);
    })().catch((error) => {
      sharedModelPromise = null;
      throw error;
    });
  }

  return sharedModelPromise;
}

type HeatClass = 'hot' | 'cold' | 'unknown';

function classifyHeatLabel(className: string): HeatClass {
  const normalized = className.trim().toLowerCase();

  // The deployed Teachable Machine model uses hot/cold-style class labels.
  // Keep the model's original class name for the probability list, but map
  // known label variants to a clear UI state.
  if (/\\bhot\\b|heat|warm|더움|고온|열섬|urban/.test(normalized)) return 'hot';
  if (/\\bcold\\b|cool|normal|추움|저온|냉/.test(normalized)) return 'cold';
  return 'unknown';
}

function isHeatLabel(className: string): boolean {
  return classifyHeatLabel(className) === 'hot';
}

export default function DemoExperience() {
  const [selectedId, setSelectedId] = useState(MOCK_IMAGES[0].id);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzedId, setAnalyzedId] = useState<string | null>(MOCK_IMAGES[0].id);
  const [mockPosts, setMockPosts] = useState<MockProposal[]>([]);
  const [mAuthor, setMAuthor] = useState('');
  const [mTitle, setMTitle] = useState('');
  const [mContent, setMContent] = useState('');
  const [mCategory, setMCategory] = useState<Category | ''>('');
  const [activeStep, setActiveStep] = useState(1);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [draftScenarioId, setDraftScenarioId] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadedPhoto | null>(null);
  const [customSelected, setCustomSelected] = useState(false);
  const [customAnalyzing, setCustomAnalyzing] = useState(false);
  const [customAnalysisError, setCustomAnalysisError] = useState('');
  const mockFormRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>(0);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadedObjectUrlRef = useRef<string | null>(null);

  const baseSelected = MOCK_IMAGES.find((m) => m.id === selectedId)!;
  const uploadPredictions = uploadedPhoto?.predictions ?? [];
  const uploadTop = uploadPredictions[0];
  const selected = customSelected && uploadedPhoto
    ? {
        ...baseSelected,
        id: 'uploaded',
        title: '업로드한 사진',
        location: '직접 업로드한 사진',
        desc: uploadTop ? `Teachable Machine 예측: ${uploadTop.className}` : 'Teachable Machine 모델 분석',
        temp: '측정 안 함',
        tempValue: 0,
        isHeat: uploadTop ? classifyHeatLabel(uploadTop.className) === 'hot' : false,
        heatClass: uploadTop ? classifyHeatLabel(uploadTop.className) : 'unknown',
        probs: uploadPredictions,
        suggestion: uploadTop
          ? (classifyHeatLabel(uploadTop.className) === 'hot'
            ? '모델이 HOT(더움) 클래스로 분류했습니다. 실제 현장 조건과 표면 온도도 별도로 확인하세요.'
            : classifyHeatLabel(uploadTop.className) === 'cold'
              ? '모델이 COLD(추움) 클래스로 분류했습니다. 사진 분류 결과만으로 실제 온도나 안전 여부를 확정할 수는 없습니다.'
              : '모델의 원본 클래스명을 확인해 주세요. 이 분류 결과는 실제 온도 측정값이 아닙니다.')
          : '사진을 모델로 분석하고 있습니다.',
      }
    : baseSelected;
  const analyzed = customSelected
    ? (uploadedPhoto?.predictions?.length ? selected : undefined)
    : MOCK_IMAGES.find((m) => m.id === analyzedId);

  useEffect(() => () => window.clearInterval(timerRef.current), []);

  useEffect(() => () => {
    if (uploadedObjectUrlRef.current) URL.revokeObjectURL(uploadedObjectUrlRef.current);
  }, []);

  const handleUploadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCustomAnalysisError('이미지 파일을 선택해 주세요.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setCustomAnalysisError('사진 크기는 10MB 이하로 선택해 주세요.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (uploadedObjectUrlRef.current) URL.revokeObjectURL(uploadedObjectUrlRef.current);
    uploadedObjectUrlRef.current = objectUrl;

    setUploadedPhoto({ fileName: file.name, src: objectUrl, predictions: null });
    setCustomSelected(true);
    setCustomAnalysisError('');
    setCustomAnalyzing(true);
    window.clearInterval(timerRef.current);
    setAnalyzing(false);
    setAnalyzedId(null);
    setDraftGenerated(false);
    setDraftScenarioId(null);
    setActiveStep(2);
    window.setTimeout(() => {
      document.getElementById('try-step-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    void (async () => {
      try {
        const model = await loadTeachableMachineModel();
        if (uploadedObjectUrlRef.current !== objectUrl) return;

        const image = new Image();
        image.decoding = 'async';
        image.src = objectUrl;
        await image.decode();

        const predictions = (await model.predict(image))
          .sort((a, b) => b.probability - a.probability)
          .map((prediction) => ({ className: prediction.className, probability: prediction.probability }));

        if (uploadedObjectUrlRef.current !== objectUrl) return;
        setUploadedPhoto((current) => current?.src === objectUrl ? { ...current, predictions } : current);
      } catch (error) {
        console.error('Teachable Machine 이미지 분석 실패:', error);
        if (uploadedObjectUrlRef.current === objectUrl) {
          setCustomAnalysisError('모델을 불러오거나 사진을 분석하지 못했어요. 네트워크와 이미지 파일을 확인한 뒤 다시 시도해 주세요.');
        }
      } finally {
        if (uploadedObjectUrlRef.current === objectUrl) setCustomAnalyzing(false);
      }
    })();
  };

  const handleSelect = (id: string) => {
    setCustomSelected(false);
    setCustomAnalyzing(false);
    setCustomAnalysisError('');
    if (id === selectedId && analyzedId === id) {
      setActiveStep(2);
      window.setTimeout(() => document.getElementById('try-step-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
      return;
    }
    window.clearInterval(timerRef.current);
    setSelectedId(id);
    setDraftGenerated(false);
    setActiveStep(2);
    setAnalyzedId(null);
    setAnalyzing(true);
    setProgress(8);
    window.setTimeout(() => {
      document.getElementById('try-step-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 96) {
          window.clearInterval(timerRef.current);
          setAnalyzedId(id);
          setAnalyzing(false);
          return 100;
        }
        return p + 14;
      });
    }, 120);
  };

  const generateProposalDraft = () => {
    const drafts: Record<string, { title: string; category: Category; content: string }> = {
      rooftop: {
        title: '본관 옥상 쿨루프·옥상 녹화 시범사업 제안',
        category: '쿨루프',
        content: `현황\n${selected.location}은 ${selected.desc} 조건을 가진 장소 예시입니다. 여름철 옥상 표면의 열 축적을 줄일 방안을 검토할 필요가 있습니다.\n\n제안 내용\n1. 시설 담당자가 방수층 상태와 구조 하중을 먼저 점검합니다.\n2. 적용 가능한 구역에 고반사 쿨루프 도장을 시범 적용합니다.\n3. 하중·배수 조건이 허용되는 곳은 이동식 화분이나 상자형 녹화를 함께 검토합니다.\n4. 적용 전후 같은 시간대에 표면 온도와 실내 온도, 유지관리 비용을 기록합니다.\n\n기대 효과\n옥상 열 축적 완화 가능성을 확인하고, 측정 결과와 관리 부담을 바탕으로 확대 여부를 판단할 수 있습니다.\n\n요청 사항\n안전·방수 점검을 포함한 소규모 시범사업과 전후 비교 측정을 검토해 주세요.\n\n※ 체험용 초안입니다. 실제 현장 조건과 측정 결과를 확인한 뒤 수정해 주세요.`,
      },
      asphalt: {
        title: '통학로 차열 포장 및 그늘 개선 제안',
        category: '바닥재',
        content: `현황\n${selected.location}은 ${selected.desc} 조건을 가진 장소 예시입니다. 보행자가 햇볕과 포장면의 복사열에 오래 노출될 수 있습니다.\n\n제안 내용\n1. 보행 동선과 차량 안전을 확인한 뒤 그늘이 부족한 구간을 우선 선정합니다.\n2. 보행로 보수 시 밝은 색 차열성 포장재의 내구성·미끄럼 저항·유지관리 비용을 비교합니다.\n3. 시야와 보행 폭을 해치지 않는 위치에 가로수 또는 그늘 시설을 보완합니다.\n4. 개선 전후 이용자 의견과 같은 시간대의 표면 온도·그늘 면적을 기록합니다.\n\n기대 효과\n통학 시간대의 그늘을 늘리고, 실제 측정과 이용자 의견을 바탕으로 효과적인 구간부터 개선할 수 있습니다.\n\n요청 사항\n학교·시설 담당자와 함께 우선 구간을 조사하고 소규모 개선안과 관리 비용을 검토해 주세요.\n\n※ 체험용 초안입니다. 보행 안전과 현장 조건을 확인한 뒤 수정해 주세요.`,
      },
      park: {
        title: '운동장 인접 녹지의 그늘 및 수목 관리 개선 제안',
        category: '녹화',
        content: `현황\n${selected.location}은 ${selected.desc} 조건을 가진 녹지 예시입니다. 기존 나무와 녹지를 건강하게 유지하면서 사람들이 이용하는 공간의 그늘을 보완하는 방안을 검토할 수 있습니다.\n\n제안 내용\n1. 기존 수목의 건강 상태와 여름철 그늘 분포를 조사합니다.\n2. 그늘이 부족한 보행·휴식 구간을 우선 선정해 적합한 수종과 식재 위치를 검토합니다.\n3. 빗물 활용과 토양 수분을 고려해 과도한 물 사용 없이 관수·멀칭 관리를 개선합니다.\n4. 식재 전후 그늘 면적, 생육 상태, 이용자 의견을 정기적으로 기록합니다.\n\n기대 효과\n기존 녹지의 효과를 유지하고, 그늘이 필요한 구간을 단계적으로 개선할 수 있습니다.\n\n요청 사항\n수목 관리 담당자와 함께 그늘 현황을 조사하고 관리 계획에 반영해 주세요.\n\n※ 체험용 초안입니다. 생태·배수·유지관리 조건을 확인한 뒤 수정해 주세요.`,
      },
      coolroof: {
        title: '강당동 쿨루프 효과 점검 및 우수 사례 공유 제안',
        category: '쿨루프',
        content: `현황\n${selected.location}은 고반사 차열 도장이 적용된 장소 예시입니다. 효과가 지속되는지 확인하고 다른 건물에 적용할 수 있는 조건을 정리할 필요가 있습니다.\n\n제안 내용\n1. 도장 상태와 오염·박리 여부를 확인하고 유지관리 주기를 정합니다.\n2. 비교 가능한 일반 지붕 구역이 있다면 같은 시간대·기상 조건에서 표면 온도를 함께 기록합니다.\n3. 실내 온도와 냉방 사용량을 확보할 수 있는 범위에서 함께 비교합니다.\n4. 시공 비용, 점검 주기, 효과 측정 방법을 정리해 다른 건물의 참고 자료로 공유합니다.\n\n기대 효과\n쿨루프 효과와 관리 비용을 근거로 평가하고, 적용하기 적합한 건물을 구분할 수 있습니다.\n\n요청 사항\n시설 담당자와 함께 정기 점검 및 전후 비교 측정 결과를 공유할 수 있도록 검토해 주세요.\n\n※ 체험용 초안입니다. 실제 기록을 바탕으로 수치와 결론을 보완해 주세요.`,
      },
      uploaded: {
        title: '업로드 사진 기반 열섬 완화 개선 제안',
        category: '기타',
        content: `현황
직접 업로드한 사진을 서비스의 Teachable Machine 이미지 분류 모델로 분석했습니다.

모델 분류 결과
${selected.probs.map((prediction) => `- ${prediction.className}: ${(prediction.probability * 100).toFixed(1)}%`).join('\n')}

검토 제안
1. 사진에 나타난 장소의 실제 위치와 이용 환경을 확인합니다.
2. 열섬 관련 개선 필요성이 있다면 현장 표면 온도, 그늘, 포장 재질 등을 별도로 측정합니다.
3. 측정 결과를 바탕으로 녹화·쿨루프·차열 포장 등의 적용 가능성을 검토합니다.

※ 모델은 이미지 분류 결과만 제공합니다. 실제 온도나 열섬 강도를 직접 측정하는 진단은 아닙니다.`,
      },
    };

    const draft = drafts[selected.id] ?? drafts.rooftop;
    setMTitle(draft.title);
    setMCategory(draft.category);
    setMContent(draft.content);
    setDraftScenarioId(selected.id);
    setDraftGenerated(true);
    setActiveStep(3);
    window.setTimeout(() => {
      mockFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('mock-author')?.focus({ preventScroll: true });
    }, 40);
  };

  const submitMockProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage('');
    if (!mAuthor.trim() || !mTitle.trim() || !mContent.trim() || !mCategory) {
      setSubmitMessage('작성자, 제목, 내용, 카테고리를 모두 확인해 주세요.');
      return;
    }
    const post: MockProposal = {
      id: Date.now(),
      author: mAuthor.trim(),
      title: mTitle.trim(),
      content: mContent.trim(),
      category: mCategory,
      status: '직접 제안',
      location: selected.location,
      likes: 0,
      comments: [],
      created_at: new Date().toLocaleDateString('ko-KR'),
    };
    setMockPosts((prev) => [post, ...prev]);
    setMAuthor('');
    setMTitle('');
    setMContent('');
    setMCategory('');
    setDraftGenerated(false);
    setDraftScenarioId(null);
    setActiveStep(3);
    setSubmitMessage('제안이 등록됐어요. 아래에서 제안에 대한 토론 예시를 확인해 보세요.');
  };

  return (
    <div className="space-y-4">
      {/* Focused introduction and progress */}
      <section className="bg-white px-5 py-6 sm:px-7 sm:py-7">
        <div className="max-w-3xl">
          <h2 className="max-w-2xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">장소를 고르고, 제안을 완성하세요.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">장소 예시를 선택하면 결과가 열리고, 그 결과를 바탕으로 제안 초안을 작성할 수 있어요.</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">모든 결과는 체험용 예시이며, 작성한 제안은 서버에 저장되지 않습니다.</p>
        </div>
        <ol className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3" aria-label="체험 진행 단계">
          {[
            { title: '장소 선택', hint: '체험할 장소를 고르세요.' },
            { title: '결과 확인', hint: '예시 결과와 제안 가이드를 살펴보세요.' },
            { title: '제안서 작성', hint: '초안을 검토하고 등록하세요.' },
          ].map((step, i) => {
            const number = i + 1;
            const completed = activeStep > number;
            const current = activeStep === number;
            return (
              <li key={step.title} aria-current={current ? 'step' : undefined} className="min-w-0">
                <div className={`mb-3 h-1 w-10 rounded-full ${current ? 'bg-orange-500' : completed ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <p className={`text-sm font-bold ${current ? 'text-slate-950' : completed ? 'text-emerald-800' : 'text-slate-500'}`}>{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{step.hint}</p>
                <p className={`mt-2 text-xs font-semibold ${current ? 'text-orange-700' : completed ? 'text-emerald-700' : 'text-slate-400'}`}>{current ? '지금 할 일' : completed ? '완료' : '다음 단계'}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="space-y-4">
            {/* STEP 1 */}
            <section id="try-step-place" aria-label="1단계: 장소 선택" className="scroll-mt-24 border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-extrabold text-gray-900">STEP 1 · 장소 예시 고르기</h3>
                <span className="text-[11px] text-gray-400">모바일: 좌우 스와이프</span>
              </div>
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 md:grid md:grid-cols-4 md:overflow-visible">
                {MOCK_IMAGES.map((m) => {
                  const active = !customSelected && selectedId === m.id;
                  const photo = SCENARIO_PHOTOS[m.id] ?? SCENARIO_PHOTOS.coolroof;
                  return (
                    <article
                      key={m.id}
                      className={`shrink-0 w-60 snap-start md:w-auto overflow-hidden rounded-xl border-2 transition-all ${
                        active ? 'border-orange-500 shadow-lg shadow-orange-100' : 'border-gray-100 hover:border-gray-300 hover:shadow'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(m.id)}
                        aria-pressed={active}
                        className="block min-h-[44px] w-full text-left touch-manipulation transition-transform active:scale-[0.98]"
                      >
                        <div className="relative h-36 overflow-hidden bg-slate-100">
                          <img src={photo.imageUrl} alt={photo.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          <span className="absolute left-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[11px] font-bold text-white shadow">실제 사진 · 참고용</span>
                          {active && <span className="absolute right-2 top-2 rounded-full bg-gray-900 px-2 py-1 text-[11px] font-bold text-white">선택됨 ✓</span>}
                        </div>
                        <div className="p-2.5 pb-1">
                          <p className="text-[13px] font-bold leading-tight text-gray-900">{m.title}</p>
                          <p className="mt-0.5 text-[11px] text-gray-500">{m.location}</p>
                          <p className="mt-0.5 truncate text-[11px] text-gray-400">{m.desc}</p>
                        </div>
                      </button>
                      <div className="px-2.5 pb-2 text-[10px] leading-4 text-slate-500">
                        사진: <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-800">{photo.photographer}</a> · Unsplash
                      </div>
                    </article>
                  );
                })}
                <article
                  className={`shrink-0 w-60 snap-start md:w-auto overflow-hidden rounded-xl border-2 transition-all ${
                    customSelected ? 'border-orange-500 shadow-lg shadow-orange-100' : 'border-dashed border-slate-300 hover:border-orange-300 hover:shadow'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => { setCustomAnalysisError(''); uploadInputRef.current?.click(); }}
                    aria-pressed={customSelected}
                    className="block min-h-[44px] w-full text-left touch-manipulation transition-transform active:scale-[0.98]"
                    aria-label={uploadedPhoto ? '다른 사진 업로드하기' : '직접 사진 업로드하기'}
                  >
                    <div className="relative h-36 overflow-hidden bg-slate-50">
                      {uploadedPhoto ? (
                        <img src={uploadedPhoto.src} alt="직접 업로드한 사진 미리보기" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-3xl font-light text-orange-600" aria-hidden>＋</span>
                          <span className="text-sm font-bold">사진 업로드</span>
                          <span className="text-[10px]">JPG · PNG · WEBP</span>
                        </div>
                      )}
                      {uploadedPhoto && <span className="absolute left-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[11px] font-bold text-white shadow">내 사진 · 모델 분석</span>}
                      {customSelected && <span className="absolute right-2 top-2 rounded-full bg-gray-900 px-2 py-1 text-[11px] font-bold text-white">선택됨 ✓</span>}
                    </div>
                    <div className="p-2.5 pb-1">
                      <p className="truncate text-[13px] font-bold leading-tight text-gray-900">{uploadedPhoto ? uploadedPhoto.fileName : '내 사진으로 분석'}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">사진 선택 시 자동 분석</p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-400">{uploadedPhoto ? '다른 사진을 올리려면 누르세요' : '최대 10MB · 이미지 파일'}</p>
                    </div>
                  </button>
                  <div className="px-2.5 pb-2 text-[10px] leading-4 text-slate-500">브라우저에서 모델 실행</div>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFileChange}
                    className="hidden"
                    aria-label="분석할 사진 선택"
                  />
                </article>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">직접 업로드한 이미지는 서버에 업로드하지 않고, 이 브라우저에서 서비스의 Teachable Machine 모델로 분류합니다. 모델 확률은 실제 온도 측정값이 아닙니다.</p>
              {customAnalysisError && <p role="alert" className="mt-2 text-xs leading-5 text-red-700">{customAnalysisError}</p>}
            </section>

            {/* STEP 2 */}
            {activeStep >= 2 && <section id="try-step-result" aria-label="2단계: 예시 분류 결과" className="scroll-mt-24 border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3">STEP 2 · 예시 분류 결과</h3>
              {(analyzing || (customSelected && customAnalyzing)) && (
                <div className="py-6" aria-live="polite">
                  <div className="flex items-center gap-3 mb-2">
                    <ScenarioIllustration id={customSelected ? 'uploaded' : selected.id} imageSrc={customSelected ? uploadedPhoto?.src : undefined} className="h-14 w-14 shrink-0 rounded-lg border border-gray-200" />
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-gray-800">{customSelected ? 'Teachable Machine 모델로 사진 분석 중…' : `${selected.title} 분석 중… ${progress}%`}</p>
                      {!customSelected && <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
                      </div>}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400">{customSelected ? '실 서비스에서 사용하는 이미지 분류 모델을 브라우저에서 실행하고 있어요.' : '예시 시나리오의 진행 효과이며, 실제 AI 추론이 아닙니다.'}</p>
                </div>
              )}
              {customSelected && customAnalysisError && !customAnalyzing && !analyzed && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {customAnalysisError}
                  <button type="button" onClick={() => uploadInputRef.current?.click()} className="ml-2 font-bold underline underline-offset-2">다시 시도</button>
                </div>
              )}
              {!analyzing && !(customSelected && customAnalyzing) && analyzed && (
                <div className="md:flex gap-4">
                  <ScenarioIllustration id={analyzed.id} imageSrc={customSelected ? uploadedPhoto?.src : undefined} title={`${analyzed.title} 분석 이미지`} className="h-40 w-full rounded-lg border border-gray-200 md:w-56" />
                  <div className="flex-1 mt-3 md:mt-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-extrabold text-gray-900">{analyzed.title} · {customSelected ? 'Teachable Machine 분석' : '예시 시나리오'}</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${customSelected
                        ? classifyHeatLabel(uploadTop?.className ?? '') === 'hot'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : classifyHeatLabel(uploadTop?.className ?? '') === 'cold'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        : analyzed.isHeat ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {customSelected
                          ? classifyHeatLabel(uploadTop?.className ?? '') === 'hot'
                            ? '🔥 HOT · 더움'
                            : classifyHeatLabel(uploadTop?.className ?? '') === 'cold'
                              ? '❄️ COLD · 추움'
                              : `모델 분류: ${uploadTop?.className ?? '확인 필요'}`
                          : analyzed.isHeat ? '🔥 열섬 우려' : '🌿 정상'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{analyzed.location} · {analyzed.desc} · {customSelected ? '모델 예측 확률이며 실제 온도를 측정하지 않습니다' : '표시 수치는 가상 예시'}</p>
                    <div className="space-y-2 mt-3">
                      {analyzed.probs.map((p, i) => (
                        <div key={p.className} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-32 truncate">{p.className}</span>
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${i === 0 ? (analyzed.isHeat ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500') : 'bg-gray-300'}`}
                              style={{ width: `${p.probability * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-11 text-right tabular-nums">{(p.probability * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-start gap-1.5 text-[13px] bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                      <span>💡</span>
                      <span className="text-gray-700"><b>제안 가이드:</b> {analyzed.suggestion}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => { setActiveStep(3); window.setTimeout(() => document.getElementById("try-step-proposal")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40); }}
                        className="flex-1 min-h-[48px] px-5 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:scale-[0.98] touch-manipulation shadow-sm"
                      >
                        다음 단계: 제안서 작성 ↓
                      </button>

                    </div>
                  </div>
                </div>
              )}
            </section>}

            {/* STEP 3: 제안서 작성은 결과 확인 후 열립니다. */}

            {activeStep >= 3 && <section id="try-step-proposal" aria-label="3단계: 예시 제안서 작성" className="scroll-mt-24 border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="text-sm font-extrabold text-gray-900">STEP 3 · 제안서 작성</h3>
                <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">작성 내용은 이 페이지에서만 유지</span>
              </div>
              <p className="text-sm leading-6 text-gray-600 mb-3">직접 작성해도 되고, 아래 버튼으로 <strong>{selected.title}</strong>에 맞는 초안을 자동으로 채운 다음 수정해도 됩니다.</p>
              <ol className="mb-4 grid gap-2 text-xs text-gray-600 sm:grid-cols-3" aria-label="제안서 작성 순서">
                <li className="rounded-lg bg-slate-50 p-2"><strong className="block text-slate-800">1. 초안 생성</strong>선택 장소에 맞춰 채우기</li>
                <li className="rounded-lg bg-slate-50 p-2"><strong className="block text-slate-800">2. 확인·수정</strong>제목과 내용을 검토</li>
                <li className="rounded-lg bg-slate-50 p-2"><strong className="block text-slate-800">3. 등록</strong>작성자 입력 후 완료</li>
              </ol>
              <div ref={mockFormRef} className="scroll-mt-24" />
              <div className="mb-3 rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">제안서 초안 자동 작성</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">선택 장소에 맞춰 제목·분야·내용을 채워요. 작성 후 자유롭게 편집할 수 있습니다.</p>
                  </div>
                  <button type="button" onClick={generateProposalDraft} className="min-h-[48px] shrink-0 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-sm hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2">
                    {draftGenerated ? '초안 다시 생성하기' : '선택 장소에 맞춰 자동 작성'}
                  </button>
                </div>
                {draftGenerated && <p role="status" className="mt-3 text-xs font-semibold text-emerald-700">초안이 작성됐어요. 제목과 내용을 확인한 뒤 필요한 부분을 수정하세요.</p>}
                {draftScenarioId && draftScenarioId !== selected.id && (mTitle.trim() || mContent.trim()) && <p role="status" className="mt-3 text-xs leading-5 font-semibold text-amber-800">선택 장소가 바뀌었어요. 입력된 초안은 이전 장소 기준이므로, 새 장소에 맞추려면 자동 작성 버튼을 다시 눌러 주세요.</p>}
              </div>
              <form onSubmit={submitMockProposal} className="space-y-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="mock-author" className="block text-xs text-gray-500 mb-1">작성자 *</label>
                    <input
                      id="mock-author"
                      required
                      value={mAuthor}
                      onChange={(e) => setMAuthor(e.target.value)}
                      placeholder="이름 입력"
                      autoComplete="off"
                      className="w-full min-h-[48px] px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="mock-category" className="block text-xs text-gray-500 mb-1">카테고리 *</label>
                    <select
                      id="mock-category"
                      required
                      value={mCategory}
                      onChange={(e) => setMCategory(e.target.value as Category)}
                      className="w-full min-h-[48px] px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-orange-400"
                    >
                      <option value="">선택</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="mock-location" className="block text-xs text-gray-500 mb-1">선택한 장소</label>
                    <input
                      id="mock-location"
                      disabled
                      value={selected.location}
                      className="w-full min-h-[48px] px-3 text-sm border border-gray-100 rounded-lg bg-gray-100 text-gray-500"
                    />
                </div>
                <div>
                  <label htmlFor="mock-title" className="block text-xs text-gray-500 mb-1">제목 *</label>
                  <input
                    id="mock-title"
                    required
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="제안 제목"
                    autoComplete="off"
                    className="w-full min-h-[48px] px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label htmlFor="mock-content" className="block text-xs text-gray-500 mb-1">상세 내용 *</label>
                  <textarea
                    id="mock-content"
                    required
                    value={mContent}
                    onChange={(e) => setMContent(e.target.value)}
                    placeholder="열섬 완화를 위한 구체적 제안을 작성하세요."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-orange-400 resize-none"
                  />
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => { setMAuthor(''); setMTitle(''); setMContent(''); setMCategory(''); setDraftGenerated(false); setDraftScenarioId(null); setSubmitMessage(''); }} className="min-h-[48px] rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    입력 지우기
                  </button>
                  <button
                    type="submit"
                    className="min-h-[48px] px-5 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:scale-[0.98] touch-manipulation"
                  >
                    제안 등록
                  </button>
                </div>
              </form>

              {submitMessage && (
                <p role="status" aria-live="polite" className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">{submitMessage}</p>
              )}

              {mockPosts.length > 0 && (
                <div className="mt-5 space-y-3" aria-live="polite">
                  <h4 className="text-sm font-bold text-slate-900">이번 체험에서 작성한 제안 ({mockPosts.length})</h4>
                  {mockPosts.map((p) => (
                    <article key={p.id} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{p.author}</span>
                        <span>{p.location}</span>
                        <span className="rounded bg-white px-2 py-1 text-emerald-700">{p.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{p.content}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>}
      </div>
    </div>
  );
}
