import type { Post } from '../types';

interface LeaderboardProps {
  posts: Post[];
}

export default function Leaderboard({ posts }: LeaderboardProps) {
  const authorStats: Record<string, { count: number; likes: number; comments: number }> = {};

  posts.forEach((p) => {
    if (!authorStats[p.author]) {
      authorStats[p.author] = { count: 0, likes: 0, comments: 0 };
    }
    authorStats[p.author].count += 1;
    authorStats[p.author].likes += p.likes || 0;
    authorStats[p.author].comments += p.comments?.length || 0;
  });

  const ranked = Object.entries(authorStats)
    .map(([author, stats]) => ({ author, ...stats }))
    .sort((a, b) => b.likes - a.likes || b.count - a.count);

  return (
    <div className="border border-gray-200 rounded bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">리더보드</h2>
        <p className="text-xs text-gray-500 mt-0.5">좋아요 순으로 정렬</p>
      </div>

      {ranked.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">
          아직 제안이 없습니다.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {ranked.map((r, i) => (
            <div key={r.author} className="flex items-center gap-3 px-4 py-3">
              <span className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                i === 0 ? 'bg-yellow-100 text-yellow-700' :
                i === 1 ? 'bg-gray-100 text-gray-600' :
                i === 2 ? 'bg-orange-50 text-orange-600' :
                'bg-gray-50 text-gray-400'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate block">{r.author}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                <span>제안 {r.count}</span>
                <span>좋아요 {r.likes}</span>
                <span>댓글 {r.comments}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
