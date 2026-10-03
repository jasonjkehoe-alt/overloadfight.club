// Generates synthetic audio files in-memory using Web Audio API
export const generatePresetAudio = async (type: 'alarm' | 'target' | 'chatter'): Promise<File> => {
    const sampleRate = 44100;
    const duration = type === 'alarm' ? 2.5 : type === 'target' ? 1.8 : 2.0;
    const numFrames = sampleRate * duration;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    const buffer = audioCtx.createBuffer(1, numFrames, sampleRate);
    const channelData = buffer.getChannelData(0);

    if (type === 'alarm') {
        // Dual-tone alternating high-tech klaxon
        for (let i = 0; i < numFrames; i++) {
            const t = i / sampleRate;
            const freq = Math.floor(t * 4) % 2 === 0 ? 880 : 660;
            const env = (1 - (t % 0.25) * 4);
            channelData[i] = Math.sin(2 * Math.PI * freq * t) * 0.5 * Math.max(0, env);
        }
    } else if (type === 'target') {
        // Fast triple beep "Target Locked"
        for (let i = 0; i < numFrames; i++) {
            const t = i / sampleRate;
            let sample = 0;
            if (t < 0.15 || (t > 0.25 && t < 0.4) || (t > 0.5 && t < 0.9)) {
                const freq = t > 0.5 ? 1760 : 1320;
                sample = Math.sin(2 * Math.PI * freq * t) * 0.4;
            }
            channelData[i] = sample;
        }
    } else {
        // Sci-Fi Radio static burst & blip
        for (let i = 0; i < numFrames; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * 0.15;
            const beep = Math.sin(2 * Math.PI * 1200 * t) * (t < 0.3 ? 0.35 : 0);
            const fade = Math.max(0, 1 - t / duration);
            channelData[i] = (noise + beep) * fade;
        }
    }

    // Convert AudioBuffer to WAV Blob
    const wavBlob = audioBufferToWav(buffer);
    const filename = type === 'alarm' ? 'combat_alarm.wav' : type === 'target' ? 'target_locked.wav' : 'radio_chatter.wav';
    return new File([wavBlob], filename, { type: 'audio/wav' });
};

function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
        out.setUint16(pos, data, true);
        pos += 2;
    }
    function setUint32(data: number) {
        out.setUint32(pos, data, true);
        pos += 4;
    }

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit precision

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (offset < buffer.length) {
        for (let i = 0; i < numOfChan; i++) {
            let sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            out.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
}
