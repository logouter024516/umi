import { useState, useEffect, useCallback } from 'react';
import type { Post, TabType, Comment } from './types';
import Header from './components/Header';
import ProposalForm from './components/ProposalForm';
import ProposalList from './components/ProposalList';
import ImageAnalyzer from './components/ImageAnalyzer';
import DemoExperience from './components/DemoExperience';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [analysisResult, setAnalysisResult] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);

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
      <Header activeTab={activeTab} onTabChange={setActiveTab} isConnected={hasSupabase} />

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:py-10">
        {activeTab === 'home' && (
          <LandingPage onStartDemo={() => setActiveTab('demo')} onOpenBoard={() => setActiveTab('board')} />
        )}
        {activeTab === 'board' && (
          <div className="space-y-4">
            <ImageAnalyzer onAnalysisComplete={setAnalysisResult} />
            <ProposalForm
              isConnected={hasSupabase}
              analysisResult={analysisResult}
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

        {activeTab === 'demo' && (
          <DemoExperience onGoToBoard={() => setActiveTab('board')} onUseResult={setAnalysisResult} />
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
