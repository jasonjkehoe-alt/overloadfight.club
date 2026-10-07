import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// A deploy replaces the hashed chunks, so a tab opened before it cannot load its next
// view. Reload once to pick up the new build; the timestamp stops a reload loop.
window.addEventListener('vite:preloadError', () => {
  try {
    const last = Number(sessionStorage.getItem('chunk_reload_at') || 0);
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem('chunk_reload_at', String(Date.now()));
    window.location.reload();
  } catch {
    // storage blocked: no way to tell a first reload from a loop, so do not reload
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// The top-level boundary catches what App's own boundary cannot: App itself,
// Layout and the providers. A crash there shows the recovery screen, not a blank page.
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);