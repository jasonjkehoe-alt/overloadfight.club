import { AudioManager, AudioBufferClone } from './audio-manager'

function encodeAudioBuffer (buffer, options) {
  let lastProgressReported = undefined
  const onProgress = (blocksProcessed, blocksTotal) => {
    const pct = blocksProcessed / blocksTotal
    const progress = Math.floor(pct * 100)
    if (progress !== lastProgressReported) {
      lastProgressReported = progress
      globalThis.postMessage({ progress })
    }
  }

  const chunks = AudioManager.audioBufferToMp3Chunks(buffer, { ...options, onProgress })
  const arrayLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const ArrayClass = chunks[0].constructor
  const resultingBuffer = new ArrayClass(arrayLength)

  let bytesWritten = 0
  for (const chunk of chunks) {
    resultingBuffer.set(chunk, bytesWritten)
    bytesWritten += chunk.byteLength
  }

  return { buffer: resultingBuffer }
}

globalThis.onmessage = (event) => {
  const { audioBuffer, options } = event.data
  const audioBufferInstance = new AudioBufferClone(audioBuffer)
  const { buffer } = encodeAudioBuffer(audioBufferInstance, options)
  globalThis.postMessage({ encodedBuffer: buffer }, [ buffer.buffer ])
}
