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

const FALLBACK_POSTS: Post[] = [
  {
    id: 1,
    author: '그린시티 연구원',
    title: '쿨루프 설치 지원 사업 제안',
    content: '건물 옥상에 햇빛을 반사하는 차열 페인트를 도포하면 실내 온도 2~3도 감소 효과가 있습니다.',
    status: '열섬 지역 판정 (89%)',
    location: '3-1',
    category: '쿨루프',
    image_url: '',
    likes: 12,
    comments: [
      { id: 1, post_id: 1, author: '김환경', text: '실제로 저희 집 옥상에 칠해봤는데 에어컨 사용량이 확실히 줄었습니다.' },
      { id: 2, post_id: 1, author: '이지혜', text: '상가 건물들도 필수적으로 도입하면 좋겠어요.' },
    ],
    created_at: '2026-07-08T12:00:00Z',
  },
  {
    id: 2,
    author: '에코디자이너',
    title: '투수성 잔디 블록 주차장 활성화 방안',
    content: '아스팔트 포장은 주간의 열을 강하게 축적해 야간 열섬을 유발합니다. 잔디 블록으로 개선하면 열기를 효과적으로 증발시킬 수 있습니다.',
    status: '열섬 지역 판정 (94%)',
    location: '운동장',
    category: '바닥재',
    image_url: '',
    likes: 8,
    comments: [
      { id: 3, post_id: 2, author: '박지성', text: '미관상으로도 아름답고 빗물 순환에도 좋을 것 같습니다.' },
    ],
    created_at: '2026-07-07T15:30:00Z',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [posts, setPosts] = useState<Post[]>(FALLBACK_POSTS);
  const [isConnected, setIsConnected] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createClient(url: string, key: string): any {
    return window.supabase.createClient(url, key);
  }

  const fetchPosts = useCallback(async (client?: ReturnType<typeof createClient>) => {
    const active = client || supabaseClient;
    if (!active) return;
    try {
      const { data: postsData, error: postsError } = await active
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (postsError) throw postsError;

      const { data: commentsData, error: commentsError } = await active
        .from('comments')
        .select('*');
      if (commentsError) throw commentsError;

      const structured = (postsData as Post[] || []).map((p) => ({
        ...p,
        comments: (commentsData as Comment[] || []).filter((c) => c.post_id === p.id),
      }));
      setPosts(structured.length > 0 ? structured : FALLBACK_POSTS);
    } catch (err) {
      console.error('데이터 로드 오류:', err);
    }
  }, [supabaseClient]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => {
      if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
        try {
          const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          setSupabaseClient(client);
          setIsConnected(true);
          fetchPosts(client);
        } catch (err) {
          console.error('Supabase 연결 실패:', err);
        }
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Realtime notifications via polling (Supabase realtime channel would need additional setup)
  useEffect(() => {
    if (!isConnected || !supabaseClient) return;
    const interval = setInterval(() => {
      fetchPosts();
    }, 30000);
    return () => clearInterval(interval);
  }, [isConnected, supabaseClient, fetchPosts]);

  const handleSubmitPost = async (post: {
    author: string;
    title: string;
    content: string;
    status: string;
    location: string;
    category: string;
    image_url: string;
  }) => {
    if (isConnected && supabaseClient) {
      try {
        const { error } = await supabaseClient.from('posts').insert([{ ...post, likes: 0 }]);
        if (error) throw error;
        await fetchPosts();
        alert('등록 완료');
      } catch (err) {
        console.error('등록 오류:', err);
        alert('등록 실패');
      }
    } else {
      const localPost: Post = {
        id: Date.now(),
        ...post,
        likes: 0,
        comments: [],
        created_at: new Date().toISOString(),
      };
      setPosts([localPost, ...posts]);
      alert('임시 저장 완료');
    }
  };

  const handleLike = async (post: Post) => {
    if (isConnected && supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('posts')
          .update({ likes: (post.likes || 0) + 1 })
          .eq('id', post.id);
        if (error) throw error;
        await fetchPosts();
      } catch (err) {
        console.error('좋아요 오류:', err);
      }
    } else {
      setPosts(posts.map((p) => p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p));
    }
  };

  const handleAddComment = async (postId: number, text: string) => {
    if (isConnected && supabaseClient) {
      try {
        const { error } = await supabaseClient.from('comments').insert([{
          post_id: postId,
          author: '시민 참여자',
          text,
        }]);
        if (error) throw error;
        setNotifications((prev) => [...prev, `댓글이 등록되었습니다.`]);
        setTimeout(() => setNotifications((prev) => prev.slice(1)), 3000);
        await fetchPosts();
      } catch (err) {
        console.error('댓글 오류:', err);
      }
    } else {
      setPosts(posts.map((p) => {
        if (p.id !== postId) return p;
        const newComment: Comment = {
          id: Date.now(),
          post_id: postId,
          author: '시민 참여자',
          text,
          created_at: new Date().toISOString(),
        };
        return { ...p, comments: [...(p.comments || []), newComment] };
      }));
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
      <Header activeTab={activeTab} onTabChange={setActiveTab} isConnected={isConnected} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'analyzer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ImageAnalyzer onAnalysisComplete={setAnalysisResult} />
            <ProposalForm
              isConnected={isConnected}
              analysisResult={analysisResult}
              onSubmit={handleSubmitPost}
            />
          </div>
        )}

        {activeTab === 'board' && (
          <ProposalList
            posts={posts}
            onLike={handleLike}
            onAddComment={handleAddComment}
            onShare={handleShare}
          />
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
