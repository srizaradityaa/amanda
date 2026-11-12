import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from '@/components/ui';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-ink text-sm text-mist-dim">Memuat…</div>}>
        <App />
      </Suspense>
    </ToastProvider>
  </StrictMode>
);
