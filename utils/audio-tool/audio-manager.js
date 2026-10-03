import lamejs from 'lamejs'

export class AudioManager {

  static applyExponentialGainToChannels (audioBuffersData, params = {}) {
    const {
      timeStart,
      duration = 6,
      rising = true,
      easingFunction = (t) => t
    } = params
    if (duration <= 0) {
      return
    }
    const { src, dst, totalDuration } = audioBuffersData
    const timeEnd = timeStart + duration
    const sampleIndexStartPct = Math.max(0, Math.min(timeStart / totalDuration, 1))
    const sampleIndexEndPct = Math.max(0, Math.min(timeEnd / totalDuration, 1))
    const channelsCount = Math.min(src.length, dst.length)
    const samplesLength = Math.min(src[0].length, dst[0].length)
    const easingMemo = new Array(1e4)
      .fill()
      .map((_, index, src) => easingFunction(index / (src.length - 1)))
    for (let channelIndex = 0; channelIndex < channelsCount; channelIndex++) {
      const samplesSrc = src[channelIndex]
      const samplesDst = dst[channelIndex]
      const indexFrom = Math.floor(samplesLength * sampleIndexStartPct)
      const indexTo = Math.floor(samplesLength * sampleIndexEndPct)
      for (let index = indexFrom; index <= indexTo; index++) {
        const t = (index - indexFrom) / (indexTo - indexFrom)
        const tIndex = Math.floor(t * easingMemo.length)
        const factor = easingMemo[tIndex]
        samplesDst[index] = samplesSrc[index] * (rising ? factor : 1 - factor)
      }
    }
  }

  static cloneAudioBuffer (audioBuffer) {
    const result = new AudioBuffer({
      length: audioBuffer.length,
      numberOfChannels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate
    })
    for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex++) {
      const samples = audioBuffer.getChannelData(channelIndex)
      result.copyToChannel(samples, channelIndex)
    }
    return result
  }

  static getAudioBufferChannelsSamples (audioBuffer) {
    const channels = new Array(audioBuffer.numberOfChannels)
      .fill(0)
      .map((_, index) => audioBuffer.getChannelData(index).slice())
    return channels
  }

  static renderAudioBufferToCanvas (canvas, audioBuffer, options = {}) {
    const {
      plotColor = '#3d5',
      paddingX = 0,
      amplitudeFactor = 0.5,
      trimTimeStart = 0,
      trimTimeEnd = Infinity,
      forceWaveFormRender = false,
      scaleY = 1
    } = options
    const width = canvas.width - 2 * paddingX
    const height = canvas.height
    const midY = height >> 1
    const ampMax = Math.max(Math.floor(height * amplitudeFactor), 20)

    let cachedWaveFormImage = canvas._cachedWaveFormImage
    let renderWaveForm = forceWaveFormRender

    if (!cachedWaveFormImage) {
      cachedWaveFormImage = document.createElement('canvas')
      canvas._cachedWaveFormImage = cachedWaveFormImage
      cachedWaveFormImage.width = canvas.width
      cachedWaveFormImage.height = canvas.height
      renderWaveForm = true
    }

    if (renderWaveForm) {
      const cacheCtx = cachedWaveFormImage.getContext('2d')
      cacheCtx.clearRect(0, 0, canvas.width, canvas.height)
      cacheCtx.lineWidth = 1
      cacheCtx.strokeStyle = 'white'
      const samples = audioBuffer.getChannelData(0)
      const max = 1

      const halfWindowSize = Math.min(75, ((audioBuffer.length / width) >> 2) - 1)
      for (let x = 0; x < width; x++) {
        const pctX = x / width
        const sampleIndexBase = Math.floor(pctX * audioBuffer.length)
        const sampleIndexFrom = Math.max(0, sampleIndexBase - halfWindowSize)
        const sampleIndexTo = Math.min(audioBuffer.length - 1, sampleIndexBase + halfWindowSize)
        let sampleValueTop = 0
        for (let sampleIndex = sampleIndexFrom; sampleIndex <= sampleIndexTo; sampleIndex++) {
          sampleValueTop += Math.abs(samples[sampleIndex])
        }
        sampleValueTop /= sampleIndexTo - sampleIndexFrom + 1
        const ampTop = Math.max(1, Math.floor((sampleValueTop / max) * ampMax))
        cacheCtx.beginPath()
        cacheCtx.moveTo(x + paddingX, midY + ampTop)
        cacheCtx.lineTo(x + paddingX, midY - ampTop)
        cacheCtx.stroke()
      }
    }

    const ctx = canvas.getContext('2d')
    const imageHeight = canvas.height * scaleY
    const dx = (canvas.height - imageHeight) >> 1
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(cachedWaveFormImage, 0, dx, canvas.width, imageHeight)
    const globalCompositeOperation = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = 'source-atop'

    const trimmedColorValue = typeof plotColor === 'function'
      ? plotColor(ctx, canvas, { trimmed: true })
      : plotColor

    const plotColorValue = typeof plotColor === 'function'
      ? plotColor(ctx, canvas, { trimmed: false })
      : plotColor

    const { duration } = audioBuffer
    const plotColorStartX = Math.floor(trimTimeStart / duration * width)
    const plotColorEndX = Math.ceil(Math.min(trimTimeEnd, duration) / duration * width)

    ctx.fillStyle = trimmedColorValue
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = plotColorValue
    ctx.fillRect(paddingX + plotColorStartX, 0, plotColorEndX - plotColorStartX, canvas.height)

    ctx.globalCompositeOperation = globalCompositeOperation
  }

  static audioBufferToMp3Chunks (audioBuffer, options = {}) {
    const {
      kbps = 256,
      onProgress,
      timeFrom = 0,
      timeTo = Infinity,
      amplitudeFactor = 1
    } = options
    const mp3Encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, kbps)
    const channels = [
      audioBuffer.getChannelData(0),
      audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : []
    ]
      .map(channel => {
        const sampleFrom = Math.max(0, Math.floor(timeFrom / audioBuffer.duration * channel.length))
        const sampleTo = Math.min(channel.length, Math.ceil(timeTo / audioBuffer.duration * channel.length))
        return channel.slice(sampleFrom, sampleTo)
      })
    const length = channels[0].length
    const blockSize = 576 * 2
    const resultChunks = []
    const leftData = new Int16Array(blockSize)
    const rightData = audioBuffer.numberOfChannels > 1 ? new Int16Array(blockSize) : undefined

    const totalBlocks = Math.ceil(length / blockSize)
    let blocksProcessed = 0

    for (let sampleBaseIndex = 0; sampleBaseIndex < length; sampleBaseIndex += blockSize) {
      const thisBlockSize = Math.min(length - sampleBaseIndex, blockSize)
      for (let sampleDeltaIndex = 0; sampleDeltaIndex < thisBlockSize; sampleDeltaIndex++) {
        const sampleIndex = sampleDeltaIndex + sampleBaseIndex
        let sampleFloatScaled = channels[0][sampleIndex] * amplitudeFactor
        let sampleClampedFloat = Math.max(-1, Math.min(sampleFloatScaled, 1))
        let sampleInt16 = Math.floor(
          sampleClampedFloat >= 0
            ? sampleClampedFloat * 32767
            : sampleClampedFloat * 32768
        )
        leftData[sampleDeltaIndex] = sampleInt16
        if (audioBuffer.numberOfChannels > 1) {
          sampleFloatScaled = channels[1][sampleIndex] * amplitudeFactor
          sampleClampedFloat = Math.max(-1, Math.min(sampleFloatScaled, 1))
          sampleInt16 = Math.floor(
            sampleClampedFloat >= 0
              ? sampleClampedFloat * 32767
              : sampleClampedFloat * 32768
          )
          rightData[sampleDeltaIndex] = sampleInt16
        }
      }
      const encodedChunk = thisBlockSize !== blockSize
        ? mp3Encoder.encodeBuffer(leftData.slice(0, thisBlockSize), rightData && rightData.slice(0, thisBlockSize))
        : mp3Encoder.encodeBuffer(leftData, rightData)
      resultChunks.push(encodedChunk)
      blocksProcessed++
      if (typeof onProgress === 'function') {
        onProgress(blocksProcessed, totalBlocks)
      }
    }
    resultChunks.push(mp3Encoder.flush())
    return resultChunks
  }

  constructor () {
    this.context = null
    this.audioBuffer = null
    this.channelsData = null

    this.gain = null
    this.volume = 1
    this.volumeGain = 0
    this.isMute = false

    this.hasStarted = false
    this.isPlaying = false
    this.lastPlayTimestamp = undefined
    this.seekTimestamp = 0

    this.easingFunction = (t) => t

    this.effects = []
    this.onEndCallbacks = []

    this.initContext()
  }

  initContext () {
    if (this.context) {
      this.close()
    }

    this.context = new AudioContext()
    this.gain = new GainNode(this.context)
    this.gain.connect(this.context.destination)
    this.updateGainNodeValue()
  }

  decodeBuffer (arrayBuffer) {
    return new Promise((resolve, reject) => {
      try {
        this.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
          this.audioBuffer = audioBuffer
          this.channelsDataOriginal = AudioManager.getAudioBufferChannelsSamples(audioBuffer)
          this.channelsData = AudioManager.getAudioBufferChannelsSamples(audioBuffer)
          resolve(audioBuffer)
        }, reject)
      } catch (err) {
        reject(err)
      }
    })
  }

  addEffect (effectData) {
    let effect = this.effects.find(eff => eff.type === effectData.type)

    if (effect) {
      let hasChanges = false
      for (const key in effect) {
        if (effect[key] !== effectData[key]) {
          hasChanges = true
          break
        }
      }
      if (!hasChanges) {
        return false
      }
      Object.assign(effect, effectData)
    } else {
      effect = effectData
      this.effects.push(effectData)
    }

    this.applyEffects()
    this.start(this.getCurrentTime(), this.isPlaying)
    return true
  }

  applyEffects () {
    for (let channelIndex = 0; channelIndex < this.channelsData.length; channelIndex++) {
      const src = this.channelsDataOriginal[channelIndex]
      const dst = this.channelsData[channelIndex]
      dst.set(src)
    }

    for (const effect of this.effects) {
      if (/^fade(In|Out)$/.test(effect.type)) {
        AudioManager.applyExponentialGainToChannels(
          {
            dst: this.channelsData,
            src: this.channelsDataOriginal,
            totalDuration: this.audioBuffer.duration
          },
          {
            timeStart: effect.timeStart,
            duration: effect.duration,
            rising: effect.type === 'fadeIn',
            easingFunction: this.easingFunction
          }
        )
      }
    }

    for (let channelIndex = 0; channelIndex < this.channelsData.length; channelIndex++) {
      this.audioBuffer.copyToChannel(this.channelsData[channelIndex], channelIndex)
    }
  }

  addOnEndCallback (callback) {
    if (typeof callback === 'function') {
      this.onEndCallbacks.push(callback)
      return true
    }
  }

  setEasingFunction (func) {
    this.easingFunction = func
  }

  setMute (isMute = true) {
    this.isMute = isMute
    this.updateGainNodeValue()
  }

  setVolume (value) {
    value = Math.max(0, Math.min(value, 5))
    this.volume = value
    this.updateGainNodeValue()
  }

  setVolumeGain (value) {
    this.volumeGain = Math.max(-1, Math.min(value, 2))
    this.updateGainNodeValue()
  }

  getVolumeGainMultiplier () {
    return 1 + this.volumeGain
  }

  updateGainNodeValue () {
    const gainValue = (this.isMute ? 0 : this.volume) * this.getVolumeGainMultiplier()
    this.gain.gain.value = gainValue
  }

  getGain () {
    return this.isMute
      ? 0
      : this.gain.gain.value
  }

  getVolume () {
    return this.volume
  }

  getCurrentTime () {
    let time = this.seekTimestamp
    if (this.lastPlayTimestamp !== undefined) {
      time += this.context.currentTime - this.lastPlayTimestamp
    }
    return time
  }

  start (time = 0, play = true) {
    if (!this.audioBuffer) {
      return
    }
    if (this.source) {
      this.source.stop()
      this.source.disconnect()
    }
    const source = this.context.createBufferSource()
    source.buffer = this.audioBuffer
    source.connect(this.gain)
    source.start(0, time > this.audioBuffer.duration ? this.audioBuffer.duration : time)
    source.onended = () => {
      if (this.source === source) {
        this.seekTimestamp += this.context.currentTime - this.lastPlayTimestamp
        this.lastPlayTimestamp = undefined
        this.isPlaying = false
        this.hasStarted = false
        this.onEndCallbacks.forEach(cb => cb())
      }
    }
    this.source = source
    this.hasStarted = true
    this.seekTimestamp = 0
    this.lastPlayTimestamp = this.context.currentTime - time
    this.isPlaying = true
    if (play) {
      this.context.resume()
    } else {
      this.pause()
    }
  }

  resume () {
    if (!this.hasStarted) {
      this.start()
    } else if (!this.isPlaying) {
      this.context.resume()
      this.isPlaying = true
      this.lastPlayTimestamp = this.context.currentTime
    }
  }

  pause () {
    if (this.isPlaying) {
      this.context.suspend()
      this.isPlaying = false
      this.seekTimestamp += this.context.currentTime - this.lastPlayTimestamp
      this.lastPlayTimestamp = undefined
    }
  }

  close () {
    this.gain.disconnect()
    this.context.suspend()
    this.context.close()
  }

}

export class AudioBufferClone {

  constructor (audioBuffer) {
    this.duration = audioBuffer.duration
    this.length = audioBuffer.length
    this.numberOfChannels = audioBuffer.numberOfChannels
    this.sampleRate = audioBuffer.sampleRate
    this.isAudioBufferClone = true
    this.channels = audioBuffer.channels || [
      new Float32Array(audioBuffer.getChannelData(0)),
      new Float32Array(audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : [])
    ]
  }

  getChannelData (index) {
    return this.channels[index]
  }

  getTransferable () {
    return {
      data: { ...this },
      buffers: this.channels.map(channel => channel.buffer).filter(v => v)
    }
  }

}
