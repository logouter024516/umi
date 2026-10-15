import { useState, useRef, useEffect } from 'react';
import { MOCK_IMAGES, MOCK_CHAT, QUICK_REPLIES, MOCK_PROPOSALS } from '../data/mockDemo';
import type { MockMessage, MockProposal } from '../data/mockDemo';
import { CATEGORIES } from '../types';
import ScenarioIllustration from './ScenarioIllustration';
import type { Category } from '../types';

const AVATAR: Record<string, { bg: string; emoji: string }> = {
  시민: { bg: 'bg-emerald-100 text-emerald-700', emoji: '🧑' },
  연구원: { bg: 'bg-blue-100 text-blue-700', emoji: '🔬' },
  나: { bg: 'bg-orange-500 text-white', emoji: '🙂' },
};

function tempColor(t: number) {
  if (t >= 37) return 'bg-red-500';
  if (t >= 33) return 'bg-orange-400';
  if (t >= 30) return 'bg-amber-400';
  return 'bg-emerald-500';
}

export default function DemoExperience() {
  const [selectedId, setSelectedId] = useState(MOCK_IMAGES[0].id);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzedId, setAnalyzedId] = useState<string | null>(MOCK_IMAGES[0].id);
  const [messages, setMessages] = useState<MockMessage[]>(MOCK_CHAT[MOCK_IMAGES[0].id]);
  const [input, setInput] = useState('');
  const [mockPosts, setMockPosts] = useState<MockProposal[]>(MOCK_PROPOSALS);
  const [mAuthor, setMAuthor] = useState('');
  const [mTitle, setMTitle] = useState('');
  const [mContent, setMContent] = useState('');
  const [mCategory, setMCategory] = useState<Category | ''>('');
  const [appliedStatus, setAppliedStatus] = useState(`${MOCK_IMAGES[0].probs[0].className} (${(MOCK_IMAGES[0].probs[0].probability * 100).toFixed(0)}%)`);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [expandedMock, setExpandedMock] = useState<number | null>(MOCK_PROPOSALS[0].id);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mockFormRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>(0);

  const selected = MOCK_IMAGES.find((m) => m.id === selectedId)!;
  const analyzed = MOCK_IMAGES.find((m) => m.id === analyzedId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, selectedId]);

  useEffect(() => () => window.clearInterval(timerRef.current), []);

  const handleSelect = (id: string) => {
    if (id === selectedId && analyzedId === id) return;
    window.clearInterval(timerRef.current);
    setSelectedId(id);
    setAnalyzedId(null);
    setMessages(MOCK_CHAT[id]);
    setAnalyzing(true);
    setProgress(8);
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

  const sendMessage = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), author: '나', role: '나', text: t, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setInput('');
  };

  const applyToMockForm = () => {
    if (!analyzed) return;
    setAppliedStatus(`${analyzed.probs[0].className} (${(analyzed.probs[0].probability * 100).toFixed(0)}%)`);
    mockFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitMockProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mAuthor.trim() || !mTitle.trim() || !mContent.trim() || !mCategory) {
      alert('작성자, 제목, 내용, 카테고리를 모두 입력하세요.');
      return;
    }
    const post: MockProposal = {
      id: Date.now(),
      author: mAuthor.trim(),
      title: mTitle.trim(),
      content: mContent.trim(),
      category: mCategory,
      status: appliedStatus || '직접 제안',
      location: selected.location,
      likes: 0,
      comments: [],
      created_at: new Date().toLocaleDateString('ko-KR'),
    };
    setMockPosts((prev) => [post, ...prev]);
    setExpandedMock(post.id);
    setMAuthor('');
    setMTitle('');
    setMContent('');
    setMCategory('');
  };

  const likeMock = (id: number) => {
    setMockPosts((prev) => prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p)));
  };

  const addMockComment = (id: number) => {
    const text = (commentInputs[id] || '').trim();
    if (!text) return;
    setMockPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, comments: [...p.comments, { id: Date.now(), author: '나', text }] } : p
      )
    );
    setCommentInputs((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="space-y-4">
      {/* Demo introduction and tutorial */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-5 py-7 text-white sm:px-8 sm:py-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-400/15 px-3 py-1 text-[11px] font-bold tracking-wide text-orange-200">TRY LAB</span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-slate-300">예시 데이터 · 로컬 체험</span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">4단계로 열섬 완화 과정을 체험해 보세요.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">장소를 선택하고, 예시 분류 결과를 살펴본 뒤, 토론과 제안 작성까지 이어집니다. 별도 계정 없이 인터랙션을 둘러볼 수 있습니다.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-lg bg-white/10 px-3 py-2">✓ 설치 불필요</span>
            <span className="rounded-lg bg-white/10 px-3 py-2">✓ 제안·댓글 상호작용</span>
            <span className="rounded-lg bg-white/10 px-3 py-2">✓ 새로고침 시 초기화</span>
          </div>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-4 sm:p-5">
          {[
            { n: '01', title: '장소 선택', hint: '관심 있는 예시를 고르세요.' },
            { n: '02', title: '결과 확인', hint: '분류와 제안 가이드를 봅니다.' },
            { n: '03', title: '토론 참여', hint: '빠른 답변 또는 직접 의견을 남깁니다.' },
            { n: '04', title: '제안 작성', hint: '내용을 작성하고 등록해 봅니다.' },
          ].map((step, i) => (
            <div key={step.n} className={`rounded-2xl border p-3 sm:p-4 ${i === 0 ? 'border-orange-200 bg-orange-50/70' : 'border-slate-100 bg-slate-50'}`}>
              <span className={`text-[11px] font-black tracking-widest ${i === 0 ? 'text-orange-600' : 'text-slate-400'}`}>{step.n}</span>
              <p className="mt-2 text-sm font-extrabold text-slate-900">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{step.hint}</p>
            </div>
          ))}
        </div>
        <div className="mx-4 mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 sm:mx-5 sm:mb-5">
          <span className="mt-0.5 text-amber-700" aria-hidden>ⓘ</span>
          <p className="text-xs leading-5 text-amber-900"><strong>예시 데이터 안내:</strong> 이 페이지의 진행률·온도·분류 확률은 미리 준비한 예시를 보여주는 연출입니다. 실제 AI 추론이나 실측 온도 데이터가 아니며, 이 화면에서 작성한 제안과 댓글은 서버에 저장되지 않습니다.</p>
        </div>
      </section>

      <div className="space-y-4">
            {/* STEP 1 */}
            <section aria-label="예시 이미지 선택" className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-extrabold text-gray-900">STEP 1 · 장소 예시 고르기</h3>
                <span className="text-[11px] text-gray-400">모바일: 좌우 스와이프</span>
              </div>
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 md:grid md:grid-cols-4 md:overflow-visible">
                {MOCK_IMAGES.map((m) => {
                  const active = selectedId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelect(m.id)}
                      aria-pressed={active}
                      className={`shrink-0 w-60 snap-start md:w-auto text-left rounded-xl overflow-hidden touch-manipulation active:scale-[0.98] transition-all min-h-[44px] border-2 ${
                        active ? 'border-orange-500 shadow-lg shadow-orange-100' : 'border-gray-100 hover:border-gray-300 hover:shadow'
                      }`}
                    >
                      <div className={`relative flex h-36 items-center justify-center overflow-hidden ${m.id === 'rooftop' ? 'bg-gradient-to-br from-orange-100 via-amber-50 to-slate-200' : m.id === 'asphalt' ? 'bg-gradient-to-br from-slate-200 via-slate-100 to-orange-100' : m.id === 'park' ? 'bg-gradient-to-br from-emerald-100 via-green-50 to-sky-100' : 'bg-gradient-to-br from-sky-100 via-slate-100 to-orange-100'}`}>
                        <div className="absolute inset-0 opacity-40" aria-hidden>
                          <div className="absolute bottom-0 left-0 h-12 w-full bg-white/50" />
                          <div className="absolute bottom-5 left-5 h-14 w-10 rounded-t-lg bg-slate-500/15" />
                          <div className="absolute bottom-4 right-7 h-20 w-12 rounded-t-lg bg-slate-500/15" />
                          <div className="absolute bottom-4 right-20 h-10 w-8 rounded-t-lg bg-slate-500/15" />
                        </div>
                        <span className="relative z-10 text-5xl drop-shadow-sm" aria-hidden>{m.id === 'rooftop' ? '🏢' : m.id === 'asphalt' ? '🛣️' : m.id === 'park' ? '🌳' : '🏙️'}</span>
                        <span className="absolute top-2 left-2 text-[11px] font-bold px-2 py-1 rounded-full bg-slate-950/80 text-white shadow">예시 시나리오</span>
                        {active && (
                          <span className="absolute top-2 right-2 text-[11px] font-bold px-2 py-1 rounded-full bg-gray-900 text-white">선택됨 ✓</span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-[13px] font-bold text-gray-900 leading-tight">{m.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{m.location}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* STEP 2 */}
            <section aria-label="예시 분류 결과" className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3">STEP 2 · 예시 분류 결과</h3>
              {analyzing && (
                <div className="py-6" aria-live="polite">
                  <div className="flex items-center gap-3 mb-2">
                    <ScenarioIllustration id={selected.id} className="h-14 w-14 shrink-0 rounded-lg border border-gray-200" />
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-gray-800">{selected.title} 분석 중… {progress}%</p>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400">열 분포 · 표면 재질 · 녹피율을 스캔하고 있습니다 (예시로 보여주는 진행 효과)</p>
                </div>
              )}
              {!analyzing && analyzed && (
                <div className="md:flex gap-4">
                  <ScenarioIllustration id={analyzed.id} title={`${analyzed.title} 분석 이미지`} className="h-40 w-full rounded-lg border border-gray-200 md:w-56" />
                  <div className="flex-1 mt-3 md:mt-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-extrabold text-gray-900">{analyzed.title} · 예시 시나리오</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${analyzed.isHeat ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {analyzed.isHeat ? '🔥 열섬 우려' : '🌿 정상'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{analyzed.location} · {analyzed.desc} · 표시 수치는 가상 예시</p>
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
                        onClick={applyToMockForm}
                        className="flex-1 min-h-[48px] px-5 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:scale-[0.98] touch-manipulation shadow-sm"
                      >
                        이 결과로 예시 제안서 쓰기 ↓
                      </button>

                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* STEP 3 */}
            <section aria-label="시민 연구원 채팅" className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-extrabold text-gray-900">STEP 3 · 현장 토론 채팅</h3>
                <span className="text-[11px] text-gray-400">{selected.title} · {messages.length}건</span>
              </div>
              <div className="h-72 overflow-y-auto space-y-3 bg-gray-50 rounded-xl p-3 border border-gray-100 overscroll-contain [-webkit-overflow-scrolling:touch]">
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-2 ${m.role === '나' ? 'justify-end' : 'justify-start'}`}>
                    {m.role !== '나' && (
                      <span className={`w-8 h-8 rounded-full shrink-0 inline-flex items-center justify-center text-sm font-bold ${AVATAR[m.role].bg}`} aria-hidden>
                        {AVATAR[m.role].emoji}
                      </span>
                    )}
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      m.role === '나'
                        ? 'bg-orange-500 text-white rounded-br-md'
                        : m.role === '연구원'
                          ? 'bg-white text-gray-800 border border-blue-200 rounded-bl-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    }`}>
                      {m.role !== '나' && (
                        <p className="text-[10px] font-bold mb-0.5">
                          <span className={m.role === '연구원' ? 'text-blue-600' : 'text-emerald-600'}>{m.author} · {m.role}</span>
                          <span className="text-gray-400 font-normal"> · {m.time}</span>
                        </p>
                      )}
                      <p>{m.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="shrink-0 min-h-[44px] px-3.5 text-[13px] border border-gray-200 rounded-full bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600 active:scale-95 touch-manipulation"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <form
                className="flex gap-2 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
              >
                <label htmlFor="demo-chat-input" className="sr-only">의견 입력</label>
                <input
                  id="demo-chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="의견 입력… (체험, 저장 안 됨)"
                  autoComplete="off"
                  className="flex-1 min-h-[48px] px-3.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="submit"
                  className="min-h-[48px] min-w-[72px] px-5 text-sm font-bold bg-gray-900 text-white rounded-xl active:scale-95 touch-manipulation disabled:opacity-40"
                  disabled={!input.trim()}
                >
                  전송
                </button>
              </form>
            </section>

            {/* STEP 4: 예시 제안서 — 실제 게시판(Supabase)과 완전 분리, 로컬 전용 */}
            <section aria-label="예시 제안서 작성" className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-sm font-extrabold text-gray-900">STEP 4 · 예시 제안서 쓰기</h3>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">로컬 전용 · 저장 안 됨</span>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">현재 브라우저에서 장소 선택부터 제안·공감·댓글까지 체험할 수 있습니다. 작성 내용은 이 페이지 안에서만 유지됩니다.</p>
              <div ref={mockFormRef} className="scroll-mt-4" />
              <form onSubmit={submitMockProposal} className="space-y-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="mock-author" className="block text-xs text-gray-500 mb-1">작성자 *</label>
                    <input
                      id="mock-author"
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="mock-status" className="block text-xs text-gray-500 mb-1">예시 분류 결과 (자동)</label>
                    <input
                      id="mock-status"
                      disabled
                      value={appliedStatus || '장소 선택 후 자동 기입'}
                      className="w-full min-h-[48px] px-3 text-sm border border-gray-100 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="mock-location" className="block text-xs text-gray-500 mb-1">위치 (자동)</label>
                    <input
                      id="mock-location"
                      disabled
                      value={selected.location}
                      className="w-full min-h-[48px] px-3 text-sm border border-gray-100 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="mock-title" className="block text-xs text-gray-500 mb-1">제목 *</label>
                  <input
                    id="mock-title"
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
                    value={mContent}
                    onChange={(e) => setMContent(e.target.value)}
                    placeholder="열섬 완화를 위한 구체적 제안을 작성하세요."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-orange-400 resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="min-h-[48px] px-5 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:scale-[0.98] touch-manipulation"
                  >
                    예시 제안 등록
                  </button>
                </div>
              </form>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-400">{mockPosts.length}건의 예시 제안</p>
                {mockPosts.map((p) => (
                  <article key={p.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5 flex-wrap">
                      <span className="font-bold text-gray-700">{p.author}</span>
                      <span className="text-gray-300">|</span>
                      <span>{p.created_at}</span>
                      {p.location && <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{p.location}</span>}
                      {p.category && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded">{p.category}</span>}
                      {p.status && p.status !== '직접 제안' && (
                        <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded text-[10px]">{p.status}</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{p.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mt-0.5">{p.content}</p>
                    <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-gray-100">
                      <button onClick={() => likeMock(p.id)} aria-label={`${p.title} 좋아요`} className="min-h-[44px] flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500 active:scale-95 touch-manipulation">
                        좋아요 <span className="font-bold">{p.likes}</span>
                      </button>
                      <button
                        onClick={() => setExpandedMock(expandedMock === p.id ? null : p.id)}
                        aria-expanded={expandedMock === p.id}
                        className="min-h-[44px] text-xs text-gray-500 hover:text-orange-500 touch-manipulation"
                      >
                        댓글 {p.comments.length}개
                      </button>
                    </div>
                    {expandedMock === p.id && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-2">
                        {p.comments.map((c) => (
                          <p key={c.id} className="text-xs">
                            <span className="font-bold text-gray-700">{c.author}: </span>
                            <span className="text-gray-600">{c.text}</span>
                          </p>
                        ))}
                        <div className="flex gap-2">
                          <label htmlFor={`mock-comment-${p.id}`} className="sr-only">댓글 입력</label>
                          <input
                            id={`mock-comment-${p.id}`}
                            value={commentInputs[p.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [p.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && addMockComment(p.id)}
                            placeholder="댓글 입력…"
                            autoComplete="off"
                            className="flex-1 min-h-[44px] px-3 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-orange-400"
                          />
                          <button
                            onClick={() => addMockComment(p.id)}
                            className="min-h-[44px] px-4 text-xs border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 active:scale-95 touch-manipulation"
                          >
                            등록
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
      </div>
    </div>
  );
}
