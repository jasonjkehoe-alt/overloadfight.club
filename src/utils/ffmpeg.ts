import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class FFmpegService {
    private static instance: FFmpeg | null = null;
    private static loadingPromise: Promise<FFmpeg> | null = null;

    static async getInstance(): Promise<FFmpeg> {
        if (this.instance) {
            return this.instance;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = (async () => {
            const ffmpeg = new FFmpeg();

            ffmpeg.on('log', ({ message }) => {
                console.log('FFmpeg log:', message);
            });

            // 1. Try local self-hosted ESM build first (fastest, offline, zero CORS issues)
            try {
                const origin = window.location.origin;
                console.log('Loading local FFmpeg ESM core from', origin + '/ffmpeg');
                const coreURL = await toBlobURL(`${origin}/ffmpeg/ffmpeg-core.js`, 'text/javascript');
                const wasmURL = await toBlobURL(`${origin}/ffmpeg/ffmpeg-core.wasm`, 'application/wasm');

                await ffmpeg.load({ coreURL, wasmURL });
                console.log('FFmpeg loaded successfully from local bundle.');
                this.instance = ffmpeg;
                return ffmpeg;
            } catch (localErr) {
                console.warn('Local FFmpeg load failed, attempting CDN ESM fallback:', localErr);
            }

            // 2. Fallback to unpkg ESM build if local failed
            const cdnBase = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
            console.log('Loading FFmpeg ESM from CDN...', cdnBase);
            const coreURL = await toBlobURL(`${cdnBase}/ffmpeg-core.js`, 'text/javascript');
            const wasmURL = await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, 'application/wasm');

            await ffmpeg.load({ coreURL, wasmURL });
            this.instance = ffmpeg;
            return ffmpeg;
        })();

        return this.loadingPromise;
    }
}
