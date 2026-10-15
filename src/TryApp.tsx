import { useEffect, useLayoutEffect, useState } from 'react';
import DemoExperience from './components/DemoExperience';

const GUIDE_STEPS = [
  {
    eyebrow: 'STEP 1 OF 3',
    title: '장소를 선택하세요',
    description: '예시 장소 카드 중 하나를 누르면 결과 확인 단계가 열립니다.',
    icon: '⌖',
  },
  {
    eyebrow: 'STEP 2 OF 3',
    title: '결과를 확인하세요',
    description: '예시 분류 결과와 제안 가이드를 확인한 다음, ‘제안서 작성’ 버튼을 누르세요. 실제 AI 추론이나 실측 데이터는 아닙니다.',
    icon: '◉',
  },
  {
    eyebrow: 'STEP 3 OF 3',
    title: '제안서를 완성하세요',
    description: '선택 장소에 맞춰 자동 작성 버튼을 누르면 제목·분야·내용이 채워집니다. 내용을 검토·수정하고 작성자 이름을 입력한 뒤 등록하세요.',
    icon: '✳',
  },
];

export default function TryApp() {
  const [guideOpen, setGuideOpen] = useState(true);
  const [guideIndex, setGuideIndex] = useState(0);
  const [discussion, setDiscussion] = useState<{ author: string; title: string; content: string } | null>(null);
  const [discussionVisibleCount, setDiscussionVisibleCount] = useState(0);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const current = GUIDE_STEPS[guideIndex];

  const discussionSummary = discussion?.content.replace(/\s+/g, ' ').trim() ?? '';
  const discussionMessages = discussion ? [
    { role: '진행자', text: `“${discussion.title}” 제안이 공유됐어요. 핵심 내용은 “${discussionSummary.slice(0, 100)}${discussionSummary.length > 100 ? '…' : ''}”입니다.` },
    { role: '참여자 A', text: '실제로 적용하기 전에 현장 여건과 안전성, 유지관리 비용을 먼저 확인하면 좋겠어요.' },
    { role: '참여자 B', text: '적용 전후를 같은 시간대와 비슷한 날씨 조건에서 비교할 측정 기준도 정해 두면 효과를 판단하기 쉬워요.' },
    { role: '진행자', text: '의견을 반영해 소규모 시범 적용과 결과 기록을 다음 검토 항목으로 정리했어요.' },
  ] : [];

  const handleProposalSubmitCapture = (event: React.FormEvent<HTMLElement>) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.querySelector('#mock-author')) return;

    const author = form.querySelector<HTMLInputElement>('#mock-author')?.value.trim() ?? '';
    const title = form.querySelector<HTMLInputElement>('#mock-title')?.value.trim() ?? '';
    const content = form.querySelector<HTMLTextAreaElement>('#mock-content')?.value.trim() ?? '';
    const category = form.querySelector<HTMLSelectElement>('#mock-category')?.value ?? '';
    if (!author || !title || !content || !category) return;

    setDiscussion({ author, title, content });
    setDiscussionVisibleCount(0);
    setEndModalOpen(false);
  };

  useEffect(() => {
    if (!discussion || discussionVisibleCount >= discussionMessages.length) return;
    const timer = window.setTimeout(() => {
      setDiscussionVisibleCount((count) => Math.min(count + 1, discussionMessages.length));
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [discussion, discussionVisibleCount, discussionMessages.length]);

  useEffect(() => {
    if (!endModalOpen) return;
    if (secondsLeft <= 0) {
      window.location.assign('/try');
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [endModalOpen, secondsLeft]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [guideOpen]);

  const finishGuide = () => {
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
              <span className="block text-xs text-slate-500">시민 참여 체험 · TRY LAB</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 sm:inline-flex">TRY LAB 체험</span>
            <button type="button" onClick={() => { setGuideIndex(0); setGuideOpen(true); }} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">가이드 다시 보기</button>
            <a href="/" className="inline-flex min-h-10 items-center rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">메인으로</a>
          </div>
        </div>
      </header>

      <main onSubmitCapture={handleProposalSubmitCapture} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange-700">TRY LAB · 시민 참여 체험</p>
            <h1 className="mt-1 text-lg font-black">열섬 완화 과정을 직접 체험해 보세요</h1>
            <p className="mt-1 text-sm leading-6 text-orange-950/80">이곳의 제안·공감·댓글은 브라우저 안의 예시 상태만 바꾸며, 실제 게시판이나 데이터베이스에 저장되지 않습니다.</p>
          </div>
          <button type="button" onClick={() => { setGuideIndex(0); setGuideOpen(true); }} className="min-h-11 shrink-0 rounded-xl border border-orange-300 bg-white px-4 text-sm font-bold text-orange-800 hover:bg-orange-100">사용법 보기</button>
        </div>
        <DemoExperience />

        {discussion && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm" aria-label="제안 기반 토론 시뮬레이션">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-4">
              <div>
                <p className="text-xs font-black tracking-wide text-emerald-700">TRY LAB · DISCUSSION</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">제안 내용을 바탕으로 토론을 진행해요</h2>
              </div>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700">체험용 시뮬레이션</span>
            </div>
            <div className="p-5">
              <p className="mb-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">{discussion.author}</strong>님이 올린 <strong className="text-slate-900">{discussion.title}</strong> 제안에 대해 의견을 정리하고 있습니다.</p>
              <div className="space-y-3" aria-live="polite">
                {discussionMessages.slice(0, discussionVisibleCount).map((message, index) => (
                  <article key={index} className="animate-[fadeIn_.35s_ease-out] rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <p className="text-xs font-extrabold text-emerald-800">{message.role}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{message.text}</p>
                  </article>
                ))}
                {discussionVisibleCount < discussionMessages.length && (
                  <p className="flex items-center gap-2 py-2 text-xs font-medium text-slate-400" role="status">
                    <span className="inline-flex gap-1" aria-hidden><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 [animation-delay:300ms]" /></span>
                    다음 의견을 정리하고 있어요…
                  </p>
                )}
              </div>
              {discussionVisibleCount === discussionMessages.length && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="mb-3 text-sm leading-6 text-slate-600">토론 예시가 끝났어요. 실제 참여자나 AI가 작성한 의견이 아닌, 체험을 위한 미리 준비된 시뮬레이션입니다.</p>
                  <button type="button" onClick={() => { setSecondsLeft(5); setEndModalOpen(true); }} className="min-h-12 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                    체험 종료하기
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-bold text-slate-700">열섬랩 · TRY LAB</span>
          <span>장소 선택부터 제안 작성까지 직접 체험</span>
          <a href="/" className="font-semibold text-orange-700 hover:text-orange-800">메인 서비스로 돌아가기 →</a>
        </div>
      </footer>

      {endModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="end-title" className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-700" aria-hidden>✓</div>
            <h2 id="end-title" className="mt-5 text-2xl font-black text-slate-950">체험 종료!</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">참여해 줘서 고마워요. <strong className="text-emerald-700">{secondsLeft}초</strong> 뒤에 체험 페이지를 새로고침하고 처음부터 다시 시작합니다.</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(secondsLeft / 5) * 100}%` }} />
            </div>
            <button type="button" onClick={() => window.location.assign('/try')} className="mt-5 min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700">지금 다시 시작하기</button>
          </section>
        </div>
      )}

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
