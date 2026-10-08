import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    fetchAdminAuthStatus,
    fetchAdminExtendedStats,
    fetchVersionInfo,
    postAdminBackfillJobAction,
    submitAdminLogin,
    syncAdminMaps
} from './apiService';

// The admin functions replaced axios calls in AdminPanel; these pin the axios
// behaviour the panel's catch blocks read (err.message, err.response.status/data).
const stubFetch = (impl: (url: string, init: RequestInit) => Promise<Response>) => {
    const mock = vi.fn(impl);
    vi.stubGlobal('fetch', mock);
    return mock;
};

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('admin panel requests', () => {
    it('GET resolves the parsed body and sends the cache-busted URL with no body or Content-Type', async () => {
        vi.spyOn(Date, 'now').mockReturnValue(1759800000000);
        const mock = stubFetch(async () => new Response('{"isAuthenticated":true}', { status: 200 }));
        await expect(fetchAdminAuthStatus()).resolves.toEqual({ isAuthenticated: true });
        const [url, init] = mock.mock.calls[0];
        expect(url).toBe('/api/admin/auth-status?t=1759800000000');
        expect(init.method).toBe('GET');
        expect(init.body).toBeUndefined();
        expect(init.headers).toEqual({ Accept: 'application/json, text/plain, */*' });
        expect(init.credentials).toBeUndefined();
    });

    it('POST with a payload sends it as JSON with Content-Type application/json', async () => {
        const mock = stubFetch(async () => new Response('{"success":true}', { status: 200 }));
        await submitAdminLogin('hunter2');
        const [url, init] = mock.mock.calls[0];
        expect(url).toBe('/api/admin/login');
        expect(init.method).toBe('POST');
        expect(init.body).toBe('{"password":"hunter2"}');
        expect(init.headers).toEqual({ Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json' });
    });

    it('POST without a payload sends no body and no Content-Type', async () => {
        const mock = stubFetch(async () => new Response('{"count":3}', { status: 200 }));
        await expect(syncAdminMaps()).resolves.toEqual({ count: 3 });
        const [, init] = mock.mock.calls[0];
        expect(init.body).toBeUndefined();
        expect(init.headers).toEqual({ Accept: 'application/json, text/plain, */*' });
    });

    it('rejects a non-2xx status with axios-style message, status and parsed body', async () => {
        stubFetch(async () => new Response('{"error":"Unauthorized - Admin access required"}', { status: 401 }));
        const err: any = await fetchAdminExtendedStats().catch((e) => e);
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Request failed with status code 401');
        expect(err.response).toEqual({ status: 401, data: { error: 'Unauthorized - Admin access required' } });
    });

    it('keeps a non-JSON error body as text, so response.data.error is undefined', async () => {
        stubFetch(async () => new Response('<pre>Cannot POST /api/admin/backfill/pause/17</pre>', { status: 404 }));
        const err: any = await postAdminBackfillJobAction('pause', 17).catch((e) => e);
        expect(err.message).toBe('Request failed with status code 404');
        expect(err.response.data).toBe('<pre>Cannot POST /api/admin/backfill/pause/17</pre>');
        expect(err.response.data.error).toBeUndefined();
    });

    it('resolves a 2xx non-JSON body as text and an empty body as an empty string', async () => {
        stubFetch(async () => new Response('<!doctype html>', { status: 200 }));
        await expect(fetchVersionInfo()).resolves.toBe('<!doctype html>');
        stubFetch(async () => new Response('', { status: 200 }));
        await expect(fetchVersionInfo()).resolves.toBe('');
    });

    it('rejects a network failure with "Network Error" and no response', async () => {
        stubFetch(async () => { throw new TypeError('Failed to fetch'); });
        const err: any = await syncAdminMaps().catch((e) => e);
        expect(err.message).toBe('Network Error');
        expect(err.response).toBeUndefined();
    });
});
