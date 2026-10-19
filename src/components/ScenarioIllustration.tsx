import { SCENARIO_PHOTOS } from '../data/scenarioPhotos';

interface ScenarioIllustrationProps {
  id: string;
  title?: string;
  className?: string;
  imageSrc?: string;
}

export default function ScenarioIllustration({ id, title, className = '', imageSrc }: ScenarioIllustrationProps) {
  const photo = SCENARIO_PHOTOS[id] ?? SCENARIO_PHOTOS.coolroof;
  const src = imageSrc ?? photo.imageUrl;

  return (
    <div
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`relative overflow-hidden bg-slate-100 ${className}`}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" aria-hidden="true" />
    </div>
  );
}
