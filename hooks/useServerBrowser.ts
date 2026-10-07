import { useSyncExternalStore } from 'react';
import { fetchActiveGames } from '../services/apiService';
import { BrowserApiResponse } from '../types';

const POLL_MS = 10000;

export interface ServerBrowserSnapshot {
  // null until the first successful fetch; a failed fetch keeps the last list
  games: BrowserApiResponse[] | null;
  updatedAt: Date | null;
  // the first fetch has finished, whether or not it succeeded
  settled: boolean;
}

// One /api/browser poll for the whole page, shared by every component that
// calls useServerBrowser(). It runs while at least one component is
// subscribed and the tab is visible, and refetches as soon as the tab
// becomes visible again.
let snapshot: ServerBrowserSnapshot = { games: null, updatedAt: null, settled: false };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let latestPoll = 0;

async function poll() {
  const id = ++latestPoll;
  const games = await fetchActiveGames();
  // A poll started after this one (the tab was hidden and shown again) has the newer answer.
  if (id !== latestPoll) return;
  if (games !== null) snapshot = { games, updatedAt: new Date(), settled: true };
  else if (!snapshot.settled) snapshot = { ...snapshot, settled: true };
  else return;
  listeners.forEach(listener => listener());
}

function start() {
  if (timer !== undefined || document.hidden) return;
  poll();
  timer = setInterval(poll, POLL_MS);
}

function stop() {
  clearInterval(timer);
  timer = undefined;
}

function onVisibilityChange() {
  if (document.hidden) stop();
  else start();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener('visibilitychange', onVisibilityChange);
    start();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
    }
  };
}

const getSnapshot = () => snapshot;

export function useServerBrowser(): ServerBrowserSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot);
}
