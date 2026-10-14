import { useEffect, useState } from 'react';
import DemoExperience from './components/DemoExperience';

const GUIDE_KEY = 'heatlab-try-tutorial-completed';

const GUIDE_STEPS = [
  {
    eyebrow: 'STEP 1 OF 4',
    title: '관심 있는 장소를 골라보세요',
    description: '체험 페이지에서 카드 형태로 제공되는 예시 장소 중 하나를 선택합니다. 선택한 장소를 기준으로 시연 흐름이 바뀝니다.',
    icon: '⌖',
  },
  {
    eyebrow: 'STEP 2 OF 4',
    title: '분류 결과와 아이디어를 확인하세요',
    description: '진행 표시가 끝나면 예시 분류 결과와 열섬 완화에 참고할 아이디어를 살펴보세요. 화면의 수치는 실제 측정 결과가 아닙니다.',
    icon: '◉',
  },
  {
    eyebrow: 'STEP 3 OF 4',
    title: '토론 영역에서 의견을 남겨보세요',
    description: '빠른 답변을 누르거나 직접 메시지를 입력해 대화 흐름을 체험할 수 있습니다. 메시지는 이 페이지 안에서만 유지됩니다.',
    icon: '↗',
  },
  {
    eyebrow: 'STEP 4 OF 4',
    title: '제안서를 작성하고 등록해보세요',
    description: '작성자·카테고리·제목·내용을 입력한 다음 목업 제안 등록을 누르세요. 좋아요와 댓글도 시험해 볼 수 있으며 실제 게시판에는 전송되지 않습니다.',
    icon: '✳',
  },
];

function wasGuideCompleted() {
  try { return window.localStorage.getItem(GUIDE_KEY) === 'yes'; }
  catch { return false; }
}

export default function TryApp() {
  const [guideOpen, setGuideOpen] = useState(() => !wasGuideCompleted());
  const [guideIndex, setGuideIndex] = useState(0);
  const current = GUIDE_STEPS[guideIndex];

  useEffect(() => {
    document.title = 'Try Lab | 열섬랩 HEATLAB';
    return () => { document.title = '열섬랩 HEATLAB | 시민 참여형 열섬 완화'; };
  }, []);

  useEffect(() => {
    if (!guideOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finishGuide();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [guideOpen]);

  const finishGuide = () => {
    try { window.localStorage.setItem(GUIDE_KEY, 'yes'); } catch { /* storage may be disabled */ }
    setGuideOpen(false);
  };

  const goNext = () => {
    if (guideIndex === GUIDE_STEPS.length - 1) finishGuide();
    else setGuideIndex((index) => index + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-lg font-black text-white">↗</span>
            <span>
              <span className="block text-sm font-black">열섬랩 <span className="text-orange-500">/ HEATLAB</span></span>
              <span className="block text-xs text-slate-500">독립 체험 공간 · TRY LAB</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 sm:inline-flex">DEMO · 독립 실행</span>
            <button type="button" onClick={() => { setGuideIndex(0); setGuideOpen(true); }} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">가이드 다시 보기</button>
            <a href="/" className="inline-flex min-h-10 items-center rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">메인으로</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange-700">Sandbox / Try Lab</p>
            <h1 className="mt-1 text-lg font-black">메인 서비스와 분리된 체험 페이지</h1>
            <p className="mt-1 text-sm leading-6 text-orange-950/80">이곳의 제안·공감·댓글은 브라우저 안의 예시 상태만 바꾸며, 실제 게시판이나 데이터베이스에 저장되지 않습니다.</p>
          </div>
          <button type="button" onClick={() => { setGuideIndex(0); setGuideOpen(true); }} className="min-h-11 shrink-0 rounded-xl border border-orange-300 bg-white px-4 text-sm font-bold text-orange-800 hover:bg-orange-100">사용법 보기</button>
        </div>
        <DemoExperience onGoToBoard={() => window.location.assign('/')} onUseResult={() => undefined} />
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-bold text-slate-700">열섬랩 · TRY LAB</span>
          <span>독립 체험 환경 · 예시 데이터만 사용</span>
          <a href="/" className="font-semibold text-orange-700 hover:text-orange-800">메인 서비스로 돌아가기 →</a>
        </div>
      </footer>

      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-description" className="my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="h-1.5 bg-slate-100">
              <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${((guideIndex + 1) / GUIDE_STEPS.length) * 100}%` }} />
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black tracking-wider text-orange-700">{current.eyebrow}</span>
                <button type="button" onClick={finishGuide} aria-label="가이드 닫기" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">×</button>
              </div>
              <div className="mt-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl text-orange-600">{current.icon}</div>
              <h2 id="guide-title" className="mt-5 text-2xl font-black leading-tight tracking-tight text-slate-950">{current.title}</h2>
              <p id="guide-description" className="mt-3 text-sm leading-7 text-slate-600">{current.description}</p>
              <div className="mt-6 flex items-center gap-2" aria-label={`전체 ${GUIDE_STEPS.length}단계 중 ${guideIndex + 1}단계`}>
                {GUIDE_STEPS.map((step, index) => <span key={step.eyebrow} className={`h-1.5 flex-1 rounded-full ${index <= guideIndex ? 'bg-orange-500' : 'bg-slate-100'}`} />)}
              </div>
              <div className="mt-7 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setGuideIndex((index) => Math.max(0, index - 1))} disabled={guideIndex === 0} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30">이전</button>
                <button type="button" onClick={goNext} className="min-h-11 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2">{guideIndex === GUIDE_STEPS.length - 1 ? '체험 시작하기' : '다음 단계 →'}</button>
              </div>
              <button type="button" onClick={finishGuide} className="mt-4 w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-700">가이드를 건너뛰고 직접 둘러보기</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
