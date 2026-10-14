import { MOCK_IMAGES } from '../data/mockDemo';

interface LandingPageProps {
  onStartDemo: () => void;
  onOpenBoard: () => void;
}

const STEPS = [
  { number: '01', title: '현장 선택', text: '예시 이미지 중 살펴보고 싶은 장소를 고릅니다.', icon: '⌖' },
  { number: '02', title: '결과 살펴보기', text: '시연용 분류 결과와 완화 아이디어를 확인합니다.', icon: '◉' },
  { number: '03', title: '의견 나누기', text: '시민 토론에 참여하고 해결 아이디어를 구체화합니다.', icon: '↗' },
  { number: '04', title: '제안 남기기', text: '아이디어를 제안으로 정리해 참여 흐름을 체험합니다.', icon: '✳' },
];

export default function LandingPage({ onStartDemo, onOpenBoard }: LandingPageProps) {
  const featured = MOCK_IMAGES[0];

  return (
    <div className="space-y-20">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 left-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-orange-200">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              시민 참여형 도시 열섬 완화 프로젝트
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              더 뜨거워지는 도시,
              <span className="mt-2 block text-orange-400">함께 바꾸는 아이디어.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              우리 주변의 열이 모이는 장소를 살펴보고, 시민의 아이디어로 더 시원한 도시를 만들어 가는 참여형 플랫폼입니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={onStartDemo} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                데모 바로 체험하기 <span aria-hidden>→</span>
              </button>
              <button onClick={onOpenBoard} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                시민 제안 둘러보기
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">참고: 첫 체험은 예시 데이터로 진행됩니다. 시연 결과는 실제 온도 측정이나 전문 진단을 대신하지 않습니다.</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-orange-500/30 to-emerald-400/10 blur-xl" />
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.07] p-3 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between px-2 py-3">
                <div>
                  <p className="text-xs font-semibold text-slate-300">DEMO / SAMPLE SITE</p>
                  <p className="mt-1 text-sm font-bold text-white">{featured.title}</p>
                </div>
                <span className="rounded-full bg-red-400/15 px-3 py-1 text-xs font-bold text-red-200">{featured.temp}</span>
              </div>
              <img src={featured.src} alt={featured.title + ' 시연용 예시 이미지'} className="aspect-[4/3] w-full rounded-xl object-cover" />
              <div className="grid grid-cols-2 gap-3 p-2 pt-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] text-slate-400">예시 분류</p>
                  <p className="mt-1 text-sm font-bold text-orange-200">열섬 우려</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] text-slate-400">아이디어</p>
                  <p className="mt-1 text-sm font-bold text-emerald-200">쿨루프 · 녹화</p>
                </div>
              </div>
              <div className="px-2 pb-2 pt-1 text-[10px] leading-4 text-slate-400">예시 화면 · 표시된 수치는 실제 센서 측정값이 아닌 시연용 데이터입니다.</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[.22em] text-orange-600">How it works</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">문제 발견에서 시민 제안까지</h2>
          <p className="mt-4 leading-7 text-slate-600">처음 방문한 사람도 네 단계만 따라가면 서비스의 핵심 흐름을 이해할 수 있어요.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step) => (
            <article key={step.number} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl font-bold text-orange-600">{step.icon}</span>
                <span className="text-xs font-black tracking-widest text-slate-300">{step.number}</span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-emerald-700">From insight to action</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">도시를 바꾸는 첫 번째 제안을 남겨보세요.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">쿨루프, 녹화, 차열 포장, 바람길 등 다양한 해결 방향을 살펴보고 아이디어를 공유할 수 있습니다.</p>
        </div>
        <button onClick={onStartDemo} className="min-h-12 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">가이드와 함께 시작하기 →</button>
      </section>
    </div>
  );
}
