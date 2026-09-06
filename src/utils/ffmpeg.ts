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
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

            console.log('Loading FFmpeg (ST) from CDN (v0.12.6)...', baseURL);
            ffmpeg.on('log', ({ message }) => {
                console.log('FFmpeg log:', message);
            });

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            this.instance = ffmpeg;
            return ffmpeg;
        })();

        return this.loadingPromise;
    }
}
