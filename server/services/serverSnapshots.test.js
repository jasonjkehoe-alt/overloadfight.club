import { beforeEach, describe, expect, it, vi } from 'vitest';

// The snapshot service (S15) with the tracker, the cache and the database
// stood in for: the shared fetch, and what a tick stores on each answer.
const { store } = vi.hoisted(() => ({ store: new Map() }));
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('./cacheService.js', () => ({ default: { get: async key => store.get(key) ?? null, set: async (key, value) => { store.set(key, value); } } }));
vi.mock('../db.js', () => ({ default: { saveServerSnapshot: vi.fn(() => 2) } }));

import axios from 'axios';
import db from '../db.js';
import { fetchServerBrowser, stopSnapshots, takeSnapshot } from './serverSnapshots.js';

const LIST = [{ server: { ip: '10.0.0.1', online: true } }, { server: { ip: '10.0.0.2', online: false } }];
const answer = (data, ms = 20) => new Promise(resolve => setTimeout(() => resolve({ data }), ms));

beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
});

describe('fetchServerBrowser', () => {
    it('is one request for callers that miss the cache together, then served from the cache', async () => {
        axios.get.mockImplementation(() => answer(LIST));
        const [stored, a, b] = await Promise.all([takeSnapshot(1000), fetchServerBrowser(), fetchServerBrowser()]);
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(a).toEqual(LIST);
        expect(b).toEqual(LIST);
        expect(stored).toBe(2);
        expect(db.saveServerSnapshot).toHaveBeenCalledWith(1000, LIST);
        expect(await fetchServerBrowser()).toEqual(LIST);
        expect(axios.get).toHaveBeenCalledTimes(1);
    });
});

describe('takeSnapshot', () => {
    it('stores nothing on a failed fetch, an empty list or an answer that is not a list', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        axios.get.mockRejectedValueOnce(new Error('timeout of 5000ms exceeded'));
        expect(await takeSnapshot()).toBe(0);
        axios.get.mockResolvedValueOnce({ data: [] });
        expect(await takeSnapshot()).toBe(0);
        store.clear();
        axios.get.mockResolvedValueOnce({ data: { servers: LIST } });
        expect(await takeSnapshot()).toBe(0);
        expect(axios.get).toHaveBeenCalledTimes(3);
        expect(db.saveServerSnapshot).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalledTimes(3);
        error.mockRestore();
    });

    it('writes nothing for a fetch still out when the snapshots stop', async () => {
        let resolve;
        axios.get.mockImplementation(() => new Promise(r => { resolve = r; }));
        const pending = takeSnapshot();
        await new Promise(r => setTimeout(r, 0)); // past the cache read, so the request is out
        stopSnapshots();
        resolve({ data: LIST });
        expect(await pending).toBe(0);
        expect(db.saveServerSnapshot).not.toHaveBeenCalled();
    });
});
