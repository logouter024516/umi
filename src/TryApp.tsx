import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import type { Comment, Post } from './types';
import Header from './components/Header';
import ProposalForm from './components/ProposalForm';
import ProposalList from './components/ProposalList';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const GUIDE_KEY = 'heatlab-try-tutorial-v2';

const GUIDE_STEPS = [
  {
    eyebrow: 'WELCOME · 01 / 04',
    title: '열섬랩에 오신 것을 환영해요',
    description: '이 페이지에서는 실제 제안 게시판을 확인하고, 열섬 완화 아이디어를 등록하거나 다른 시민의 의견에 참여할 수 있어요.',
    icon: '✦',
  },
  {
    eyebrow: 'EXPLORE · 02 / 04',
    title: '관심 있는 제안을 찾아보세요',
    description: '검색창과 카테고리·위치 필터로 관심 있는 제안을 찾고, 게시글을 열어 상세 내용과 댓글을 확인할 수 있어요.',
    icon: '⌕',
  },
  {
    eyebrow: 'CREATE · 03 / 04',
    title: '새로운 아이디어를 제안하세요',
    description: '작성자, 카테고리, 위치, 제목과 내용을 입력해 제안을 등록할 수 있어요. 사진은 필요한 경우에만 첨부하면 됩니다.',
    icon: '＋',
  },
  {
    eyebrow: 'PARTICIPATE · 04 / 04',
    title: '공감과 댓글로 함께 개선해요',
    description: '다른 제안에 좋아요를 누르거나 댓글을 남기고 링크를 공유할 수 있어요. 참여 내용은 연결된 서비스에 저장됩니다.',
    icon: '↗',
  },
];

function wasGuideCompleted() {
  try { return window.localStorage.getItem(GUIDE_KEY) === 'completed'; }
  catch { return false; }
}

export default function TryApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [guideOpen, setGuideOpen] = useState(() => !wasGuideCompleted());
  const [guideIndex, setGuideIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const current = GUIDE_STEPS[guideIndex];

  // Always enter this page from the top, regardless of the previous route's scroll position.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    document.title = '열섬랩 | 시민 제안';
    return () => { document.title = '열섬랩 HEATLAB | 시민 참여형 열섬 완화'; };
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!hasSupabase) {
      setPosts([]);
      return;
    }
    try {
      const [postsResponse, commentsResponse] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/posts?select=*&order=created_at.desc`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        }),
        fetch(`${SUPABASE_URL}/rest/v1/comments?select=*`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        }),
      ]);
      if (!postsResponse.ok) throw new Error(await postsResponse.text());
      if (!commentsResponse.ok) throw new Error(await commentsResponse.text());
      const postsData: Post[] = await postsResponse.json();
      const commentsData: Comment[] = await commentsResponse.json();
      setPosts(postsData.map((post) => ({
        ...post,
        comments: commentsData.filter((comment) => comment.post_id === post.id),
      })));
    } catch (error) {
      console.error('제안 목록을 불러오지 못했습니다.', error);
      setNotice('제안 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  }, []);

  useEffect(() => { void fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (!guideOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finishGuide();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [guideOpen]);

  const finishGuide = () => {
    try { window.localStorage.setItem(GUIDE_KEY, 'completed'); } catch { /* storage may be disabled */ }
    setGuideOpen(false);
  };

  const handleSubmitPost = async (post: {
    author: string;
    title: string;
    content: string;
    status: string;
    location: string;
    category: string;
    image_url: string;
  }) => {
    if (!hasSupabase) {
      setNotice('현재 서버 연결이 설정되지 않아 제안을 등록할 수 없습니다.');
      return;
    }
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ ...post, likes: 0 }),
      });
      if (!response.ok) throw new Error(await response.text());
      await fetchPosts();
      setNotice('제안이 등록되었습니다.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('제안을 등록하지 못했습니다.', error);
      setNotice('제안을 등록하지 못했어요. 입력 내용과 서버 연결을 확인해 주세요.');
    }
  };

  const handleLike = async (post: Post) => {
    if (!hasSupabase) {
      setNotice('현재 서버 연결이 설정되지 않아 공감을 저장할 수 없습니다.');
      return;
    }
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ likes: (post.likes || 0) + 1 }),
      });
      if (!response.ok) throw new Error(await response.text());
      await fetchPosts();
    } catch (error) {
      console.error('공감을 저장하지 못했습니다.', error);
      setNotice('공감을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleAddComment = async (postId: number, text: string) => {
    if (!hasSupabase) {
      setNotice('현재 서버 연결이 설정되지 않아 댓글을 저장할 수 없습니다.');
      return;
    }
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ post_id: postId, author: '시민 참여자', text }),
      });
      if (!response.ok) throw new Error(await response.text());
      await fetchPosts();
      setNotice('댓글이 등록되었습니다.');
    } catch (error) {
      console.error('댓글을 등록하지 못했습니다.', error);
      setNotice('댓글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice('제안 링크를 복사했습니다.');
    } catch {
      setNotice(url);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header activeTab="board" onTabChange={() => { window.location.href = '/'; }} isConnected={hasSupabase} onOpenGuide={() => { setGuideIndex(0); setGuideOpen(true); }} />

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-orange-600">HEATLAB · 시민 참여</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">도시 열섬을 줄이는 아이디어를 나눠요</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">제안을 살펴보고, 새로운 해결책을 등록하고, 댓글과 공감으로 함께 개선해 보세요.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-3 py-1.5 font-semibold ${hasSupabase ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {hasSupabase ? '서버 연결됨' : '서버 연결 설정 필요'}
            </span>
            <button type="button" onClick={() => void fetchPosts()} className="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50">새로고침</button>
            <button type="button" onClick={() => { setGuideIndex(0); setGuideOpen(true); }} className="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50">사용법 보기</button>
          </div>
          {!hasSupabase && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">현재 서버 연결 정보가 없어 게시글은 표시되지 않으며, 등록·공감·댓글도 저장되지 않습니다. 실제 기능을 사용하려면 배포 환경에 Supabase 연결 설정이 필요합니다.</p>}
        </section>

        {notice && (
          <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="알림 닫기" className="text-slate-400 hover:text-slate-700">×</button>
          </div>
        )}

        <ProposalForm isConnected={hasSupabase} onSubmit={handleSubmitPost} />
        <ProposalList posts={posts} onLike={handleLike} onAddComment={handleAddComment} onShare={handleShare} />
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-bold text-slate-700">열섬랩 · HEATLAB</span>
          <span>시민 제안과 의견을 함께 나누는 공간</span>
          <a href="/" className="font-semibold text-orange-700 hover:text-orange-800">메인으로 돌아가기 →</a>
        </div>
      </footer>

      {guideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) finishGuide(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-description" className="my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="h-1.5 bg-slate-100"><div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${((guideIndex + 1) / GUIDE_STEPS.length) * 100}%` }} /></div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black tracking-wider text-orange-700">{current.eyebrow}</span>
                <button type="button" onClick={finishGuide} aria-label="가이드 닫기" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 hover:bg-slate-100">×</button>
              </div>
              <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-orange-300">{current.icon}</div>
              <h2 id="guide-title" className="mt-5 text-2xl font-black leading-tight tracking-tight text-slate-950">{current.title}</h2>
              <p id="guide-description" className="mt-3 text-sm leading-7 text-slate-600">{current.description}</p>
              <div className="mt-6 flex items-center gap-1.5" aria-label={`전체 ${GUIDE_STEPS.length}단계 중 ${guideIndex + 1}단계`}>
                {GUIDE_STEPS.map((step, index) => <span key={step.eyebrow} className={`h-1.5 flex-1 rounded-full ${index <= guideIndex ? 'bg-orange-500' : 'bg-slate-100'}`} />)}
              </div>
              <div className="mt-7 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setGuideIndex((index) => Math.max(0, index - 1))} disabled={guideIndex === 0} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30">이전</button>
                <button type="button" onClick={() => guideIndex === GUIDE_STEPS.length - 1 ? finishGuide() : setGuideIndex((index) => index + 1)} className="min-h-11 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white hover:bg-orange-600">{guideIndex === GUIDE_STEPS.length - 1 ? '시작하기' : '다음 단계 →'}</button>
              </div>
              <button type="button" onClick={finishGuide} className="mt-4 w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-700">가이드를 건너뛰고 직접 둘러보기</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
