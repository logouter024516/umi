import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Keep the demo in its own lazy-loaded application chunk.
// The public site never mounts or imports the interactive demo at runtime.
const isTryRoute = window.location.pathname.replace(/\/+$/, '') === '/try';
const RouteApp = lazy(() => isTryRoute ? import('./TryApp') : import('./App'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="min-h-screen bg-slate-950" aria-label="불러오는 중" />}>
      <RouteApp />
    </Suspense>
  </StrictMode>,
);
