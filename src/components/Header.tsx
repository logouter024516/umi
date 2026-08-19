import type { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isConnected: boolean;
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'analyzer', label: '이미지 분석' },
  { key: 'board', label: '제안 게시판' },
  { key: 'stats', label: '통계' },
  { key: 'leaderboard', label: '리더보드' },
];

export default function Header({ activeTab, onTabChange, isConnected }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-base font-bold text-gray-900">
            열섬 완화 제안 플랫폼
          </h1>
          <span className={`text-xs px-2 py-0.5 rounded ${isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
            {isConnected ? '온라인' : '로컬 모드'}
          </span>
        </div>
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
