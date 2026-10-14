import type { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isConnected: boolean;
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'home', label: '홈' },
  { key: 'demo', label: '체험하기' },
  { key: 'board', label: '시민 제안' },
  { key: 'stats', label: '현황' },
  { key: 'leaderboard', label: '리더보드' },
];

export default function Header({ activeTab, onTabChange, isConnected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <button type="button" onClick={() => onTabChange('home')} className="flex min-h-14 items-center gap-3 self-start text-left" aria-label="열섬랩 홈으로">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-lg text-white shadow-lg shadow-orange-200" aria-hidden>↗</span>
          <span>
            <span className="block text-sm font-black tracking-tight text-slate-950">열섬랩 <span className="font-semibold text-orange-500">/ HEATLAB</span></span>
            <span className="block text-[11px] text-slate-500">도시의 열을 읽고, 바꾸는 아이디어</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <nav aria-label="주요 메뉴" className="-mx-1 flex flex-1 gap-1 overflow-x-auto pb-1 lg:pb-0">
            {TABS.map((tab) => (
              <button key={tab.key} type="button" onClick={() => onTabChange(tab.key)} aria-current={activeTab === tab.key ? 'page' : undefined}
                className={`min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${activeTab === tab.key ? 'bg-orange-50 text-orange-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
          <span className={`hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${isConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isConnected ? '서버 연결' : '체험 모드'}
          </span>
        </div>
      </div>
    </header>
  );
}
