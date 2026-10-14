interface ScenarioIllustrationProps {
  id: string;
  title?: string;
  className?: string;
}

const SCENARIOS: Record<string, { background: string; emoji: string }> = {
  rooftop: { background: 'from-orange-100 via-amber-50 to-slate-200', emoji: '🏢' },
  asphalt: { background: 'from-slate-200 via-slate-100 to-orange-100', emoji: '🛣️' },
  park: { background: 'from-emerald-100 via-green-50 to-sky-100', emoji: '🌳' },
  coolroof: { background: 'from-sky-100 via-slate-100 to-orange-100', emoji: '🏙️' },
};

export default function ScenarioIllustration({ id, title, className = '' }: ScenarioIllustrationProps) {
  const scenario = SCENARIOS[id] ?? SCENARIOS.coolroof;

  return (
    <div
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${scenario.background} ${className}`}
    >
      <div className="absolute inset-0 opacity-40" aria-hidden="true">
        <div className="absolute bottom-0 left-0 h-1/3 w-full bg-white/50" />
        <div className="absolute bottom-[18%] left-[12%] h-[38%] w-[14%] rounded-t-lg bg-slate-500/15" />
        <div className="absolute bottom-[14%] right-[18%] h-[55%] w-[18%] rounded-t-lg bg-slate-500/15" />
        <div className="absolute bottom-[14%] right-[42%] h-[28%] w-[12%] rounded-t-lg bg-slate-500/15" />
      </div>
      <span className="relative z-10 text-5xl drop-shadow-sm" aria-hidden="true">{scenario.emoji}</span>
    </div>
  );
}
