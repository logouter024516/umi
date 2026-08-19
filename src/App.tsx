import { useState, useEffect, useCallback } from 'react';
import type { Post, TabType, Comment } from './types';
import Header from './components/Header';
import ImageAnalyzer from './components/ImageAnalyzer';
import ProposalForm from './components/ProposalForm';
import ProposalList from './components/ProposalList';
import Stats from './components/Stats';
import Leaderboard from './components/Leaderboard';

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
  const [activeTab, setActiveTab] = useState<TabType>('board');
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

      <main className="max-w-4xl mx-auto px-4 py-6">
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

        {activeTab === 'stats' && <Stats posts={posts} />}
        {activeTab === 'leaderboard' && <Leaderboard posts={posts} />}
      </main>

      <footer className="border-t border-gray-200 py-6 mt-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            열섬 완화 제안 플랫폼 | Supabase 연동형 프로토타입
          </p>
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
