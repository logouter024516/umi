import { useState } from 'react';
import type { Post } from '../types';
import { CATEGORIES, LOCATIONS } from '../types';

interface ProposalListProps {
  posts: Post[];
  onLike: (post: Post) => void;
  onAddComment: (postId: number, text: string) => void;
  onShare: (post: Post) => void;
}

export default function ProposalList({ posts, onLike, onAddComment, onShare }: ProposalListProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  const filtered = posts.filter((p) => {
    const matchSearch = !search || p.title.includes(search) || p.content.includes(search) || p.author.includes(search);
    const matchCategory = !filterCategory || p.category === filterCategory;
    const matchLocation = !filterLocation || p.location === filterLocation;
    return matchSearch && matchCategory && matchLocation;
  });

  const handleSubmitComment = (postId: number) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    onAddComment(postId, text.trim());
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded bg-white p-3">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="flex-1 min-w-[150px] px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-orange-400"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-orange-400"
          >
            <option value="">전체 카테고리</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-orange-400"
          >
            <option value="">전체 위치</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length}건</p>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400 border border-gray-100 rounded bg-white">
          제안이 없습니다.
        </div>
      )}

      {filtered.map((post) => (
        <div key={post.id} className="border border-gray-200 rounded bg-white">
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span className="font-medium text-gray-700">{post.author}</span>
              <span>|</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              {post.location && (
                <>
                  <span>|</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{post.location}</span>
                </>
              )}
              {post.category && (
                <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded">{post.category}</span>
              )}
              {post.status && post.status !== '직접 제안' && (
                <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded text-[10px]">{post.status}</span>
              )}
            </div>

            <h3 className="text-sm font-bold text-gray-900 mb-1">{post.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>

            {post.image_url && (
              <div className="mt-3">
                <img src={post.image_url} alt="첨부 이미지" className="max-h-48 rounded border border-gray-200" />
              </div>
            )}

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => onLike(post)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500"
              >
                좋아요 <span className="font-medium">{post.likes || 0}</span>
              </button>
              <button
                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                className="text-xs text-gray-500 hover:text-orange-500"
              >
                댓글 {(post.comments || []).length}개
              </button>
              <button
                onClick={() => onShare(post)}
                className="text-xs text-gray-500 hover:text-orange-500"
              >
                공유
              </button>
            </div>
          </div>

          {expandedPost === post.id && (
            <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
              {(post.comments || []).map((c) => (
                <div key={c.id} className="text-xs">
                  <span className="font-medium text-gray-700">{c.author}: </span>
                  <span className="text-gray-600">{c.text}</span>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                  placeholder="댓글 입력..."
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-orange-400"
                />
                <button
                  onClick={() => handleSubmitComment(post.id)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-100 text-gray-600"
                >
                  등록
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
