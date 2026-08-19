import type { Post } from '../types';

interface StatsProps {
  posts: Post[];
}

export default function Stats({ posts }: StatsProps) {
  const locationCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  posts.forEach((p) => {
    if (p.location) locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
    if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxLocation = sortedLocations[0]?.[1] || 1;
  const maxCategory = sortedCategories[0]?.[1] || 1;

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-gray-200 rounded bg-white p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
          <div className="text-xs text-gray-500 mt-1">전체 제안</div>
        </div>
        <div className="border border-gray-200 rounded bg-white p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalLikes}</div>
          <div className="text-xs text-gray-500 mt-1">전체 좋아요</div>
        </div>
        <div className="border border-gray-200 rounded bg-white p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalComments}</div>
          <div className="text-xs text-gray-500 mt-1">전체 댓글</div>
        </div>
      </div>

      <div className="border border-gray-200 rounded bg-white p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">카테고리별 제안 수</h3>
        {sortedCategories.length === 0 ? (
          <p className="text-xs text-gray-400">데이터 없음</p>
        ) : (
          <div className="space-y-2">
            {sortedCategories.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-16 shrink-0">{cat}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded"
                    style={{ width: `${(count / maxCategory) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded bg-white p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">위치별 제안 수</h3>
        {sortedLocations.length === 0 ? (
          <p className="text-xs text-gray-400">데이터 없음</p>
        ) : (
          <div className="space-y-2">
            {sortedLocations.map(([loc, count]) => (
              <div key={loc} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-16 shrink-0">{loc}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded"
                    style={{ width: `${(count / maxLocation) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
