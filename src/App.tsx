import { useState, useEffect, useCallback } from 'react';
import type { Post, TabType, Comment } from './types';
import Header from './components/Header';
import ProposalForm from './components/ProposalForm';
import ProposalList from './components/ProposalList';
import Stats from './components/Stats';
import Leaderboard from './components/Leaderboard';
import LandingPage from './components/LandingPage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const headers = () => ({
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: 'return=representation',
});


const GUIDE_KEY = 'heatlab-dashboard-guide-v2';

const GUIDE_STEPS: { tab: TabType; eyebrow: string; title: string; description: string; icon: string; tip: string }[] = [
  { tab: 'home', eyebrow: 'WELCOME · 01 / 06', title: '열섬랩 대시보드에 오신 것을 환영해요', description: '이 대시보드에서 도시 열섬 문제를 살펴보고, 시민 제안을 작성하고, 다른 참여자의 아이디어와 현황을 확인할 수 있어요.', icon: '✦', tip: '상단 메뉴를 이용하면 언제든 다른 영역으로 이동할 수 있어요.' },
  { tab: 'board', eyebrow: 'EXPLORE · 02 / 06', title: '시민 제안부터 둘러보세요', description: '게시판에서 도시 열섬 완화에 관한 제안을 살펴보고, 관심 있는 주제에 공감하거나 댓글로 의견을 나눌 수 있어요.', icon: '⌕', tip: '실제 게시글은 서버 연결 상태에 따라 불러오거나 등록할 수 있어요.' },
  { tab: 'board', eyebrow: 'CREATE · 03 / 06', title: '새 제안을 구체적으로 작성하세요', description: '작성자, 카테고리, 위치, 제목과 상세 내용을 입력해 도시 열섬 완화 아이디어를 제안할 수 있어요. 필요한 경우 참고 이미지를 첨부할 수도 있어요.', icon: '＋', tip: '실제 등록에는 서버 연결이 필요해요. 연결되지 않은 상태에서는 제안이 저장되지 않을 수 있어요.' },
  { tab: 'board', eyebrow: 'COMMUNITY · 04 / 06', title: '다른 시민의 제안에 참여하세요', description: '제안 목록에서 제목이나 내용으로 검색하고, 카테고리·위치 필터로 관심 있는 글을 좁힐 수 있어요. 공감, 댓글, 공유 기능으로 의견을 나눠보세요.', icon: '↗', tip: '공유 버튼은 해당 제안으로 이동할 수 있는 링크를 복사해요.' },
  { tab: 'stats', eyebrow: 'INSIGHTS · 05 / 06', title: '현황에서 참여 흐름을 읽어보세요', description: '전체 제안·좋아요·댓글 수와 카테고리별·위치별 제안 분포를 확인할 수 있어요. 어떤 주제와 장소에 관심이 모이는지 파악할 때 유용합니다.', icon: '▥', tip: '현황은 현재 불러온 제안 데이터를 바탕으로 계산돼요.' },
  { tab: 'leaderboard', eyebrow: 'COMMUNITY · 06 / 06', title: '리더보드에서 참여를 확인하세요', description: '참여자별 제안 수, 좋아요, 댓글을 모아 순위를 보여줘요. 다양한 시민의 활동을 살펴보고 새로운 아이디어를 발견해 보세요.', icon: '♛', tip: '순위는 좋아요 수를 우선으로 정렬하고, 제안 수를 보조 기준으로 사용해요.' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [guideOpen, setGuideOpen] = useState(() => {
    try { return window.localStorage.getItem(GUIDE_KEY) !== 'completed'; }
    catch { return true; }
  });
  const [guideIndex, setGuideIndex] = useState(0);
  const guideStep = GUIDE_STEPS[guideIndex];

  const fetchPosts = useCallback(async () => {
    if (!hasSupabase) return;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/posts?select=*&order=created_at.desc`,
        { headers: headers() }
      );
      if (!res.ok) throw new Error(await res.text());
      const postsData: Post[] = await res.json();

      const resComments = await fetch(
        `${SUPABASE_URL}/rest/v1/comments?select=*`,
        { headers: headers() }
      );
      if (!resComments.ok) throw new Error(await resComments.text());
      const commentsData: Comment[] = await resComments.json();

      const structured = postsData.map((p) => ({
        ...p,
        comments: commentsData.filter((c) => c.post_id === p.id),
      }));
      setPosts(structured);
    } catch (err) {
      console.error('데이터 로드 오류:', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!hasSupabase) return;
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  useEffect(() => {
    if (!guideOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGuideOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [guideOpen]);

  const finishGuide = () => {
    try { window.localStorage.setItem(GUIDE_KEY, 'completed'); } catch { /* storage may be disabled */ }
    setGuideOpen(false);
  };

  const openGuide = () => {
    setGuideIndex(0);
    setActiveTab('home');
    setGuideOpen(true);
  };

  const moveGuide = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(GUIDE_STEPS.length - 1, nextIndex));
    setGuideIndex(safeIndex);
    setActiveTab(GUIDE_STEPS[safeIndex].tab);
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
      alert('Supabase 연결 정보가 없습니다.');
      return;
    }
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ ...post, likes: 0 }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchPosts();
      alert('등록 완료');
    } catch (err) {
      console.error('등록 오류:', err);
      alert('등록 실패');
    }
  };

  const handleLike = async (post: Post) => {
    if (!hasSupabase) return;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/posts?id=eq.${post.id}`,
        {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ likes: (post.likes || 0) + 1 }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await fetchPosts();
    } catch (err) {
      console.error('좋아요 오류:', err);
    }
  };

  const handleAddComment = async (postId: number, text: string) => {
    if (!hasSupabase) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ post_id: postId, author: '시민 참여자', text }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNotifications((prev) => [...prev, '댓글이 등록되었습니다.']);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 3000);
      await fetchPosts();
    } catch (err) {
      console.error('댓글 오류:', err);
    }
  };

  const handleShare = (post: Post) => {
    const url = `${window.location.origin}#post-${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setNotifications((prev) => [...prev, '링크가 복사되었습니다.']);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header activeTab={activeTab} onTabChange={setActiveTab} isConnected={hasSupabase} onOpenGuide={openGuide} />

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:py-10">
        {activeTab === 'home' && (
          <LandingPage onStartDemo={() => window.location.assign('/try')} onOpenBoard={() => setActiveTab('board')} />
        )}
        {activeTab === 'board' && (
          <div className="space-y-4">
            <ProposalForm
              isConnected={hasSupabase}
              onSubmit={handleSubmitPost}
            />
            <ProposalList
              posts={posts}
              onLike={handleLike}
              onAddComment={handleAddComment}
              onShare={handleShare}
            />
          </div>
        )}

        {activeTab === 'stats' && <Stats posts={posts} />}
        {activeTab === 'leaderboard' && <Leaderboard posts={posts} />}
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-bold text-slate-700">열섬랩 · HEATLAB</span>
          <span>시민 참여형 도심 열섬 완화 프로토타입</span>
          <span>시연 결과는 실제 기상·위성 측정값이 아닐 수 있습니다.</span>
        </div>
      </footer>


      {guideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) finishGuide(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="dashboard-guide-title" aria-describedby="dashboard-guide-description" className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25">
            <div className="h-1.5 bg-slate-100">
              <div className="h-full rounded-r-full bg-orange-500 transition-all duration-300" style={{ width: `${((guideIndex + 1) / GUIDE_STEPS.length) * 100}%` }} />
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[10px] font-black tracking-[.14em] text-orange-700">{guideStep.eyebrow}</span>
                <button type="button" onClick={finishGuide} aria-label="가이드 닫기" className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">×</button>
              </div>
              <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-black text-orange-300 shadow-lg shadow-slate-200">{guideStep.icon}</div>
              <h2 id="dashboard-guide-title" className="mt-5 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">{guideStep.title}</h2>
              <p id="dashboard-guide-description" className="mt-3 text-sm leading-7 text-slate-600">{guideStep.description}</p>
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
                <span className="mt-0.5 text-orange-600" aria-hidden>ⓘ</span>
                <p className="text-xs leading-6 text-orange-950">{guideStep.tip}</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5" aria-label={`전체 ${GUIDE_STEPS.length}단계 중 ${guideIndex + 1}단계`}>
                {GUIDE_STEPS.map((step, index) => <span key={step.eyebrow} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= guideIndex ? 'bg-orange-500' : 'bg-slate-100'}`} />)}
              </div>
              <div className="mt-7 flex items-center justify-between gap-3">
                <button type="button" onClick={() => moveGuide(guideIndex - 1)} disabled={guideIndex === 0} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30">이전</button>
                <button type="button" onClick={() => guideIndex === GUIDE_STEPS.length - 1 ? finishGuide() : moveGuide(guideIndex + 1)} className="min-h-11 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2">{guideIndex === GUIDE_STEPS.length - 1 ? '대시보드 시작하기' : '다음 단계 →'}</button>
              </div>
              <button type="button" onClick={finishGuide} className="mt-4 w-full py-2 text-xs font-medium text-slate-400 transition hover:text-slate-700">가이드를 건너뛰고 직접 둘러보기</button>
            </div>
          </section>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {notifications.map((msg, i) => (
            <div key={i} className="px-4 py-2 bg-gray-900 text-white text-sm rounded shadow-lg">
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
