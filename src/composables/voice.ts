// Talk into the fan. A gain chopped at the blade-pass rate gives the warble
// every kid made shouting "啊——" at a fan; faster blades chop faster.
// Two ways to hear it:
// - live: the mic goes straight through the blades while held, like a real
//   fan. Needs headphones, or your own voice in the room masks it and the
//   speakers feed back.
// - replay: walkie-talkie style, hold to record and release to hear the clip.
// Audio stays on this device.

import { audioContext, duckHum, unlockAudio } from './audio'

const MAX_SECONDS = 10

let stream: MediaStream | undefined
let recorder: MediaRecorder | undefined
let chunks: Blob[] = []
let input: MediaStreamAudioSourceNode | undefined
let meter: AnalyserNode | undefined
let samples: Float32Array<ArrayBuffer> | undefined
let chop: GainNode | undefined
let depth: GainNode | undefined
let lfo: OscillatorNode | undefined
let playing: AudioBufferSourceNode | undefined
let stopTimer: ReturnType<typeof setTimeout> | undefined
let ratio = 0

function ensureMeter(ctx: AudioContext) {
  meter ??= ctx.createAnalyser()
  meter.fftSize = 512
  samples ??= new Float32Array(meter.fftSize)
  return meter
}

// playback → chop → compressor → gain → speakers, built once.
function ensureChain(ctx: AudioContext) {
  if (chop)
    return chop
  chop = ctx.createGain()
  depth = ctx.createGain()
  lfo = ctx.createOscillator()
  // A rounded square: choppier than a sine, softer than a click.
  lfo.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0]), new Float32Array([0, 1, 0, 1 / 3, 0, 1 / 5])))
  lfo.connect(depth).connect(chop.gain)
  lfo.start()
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -24
  compressor.ratio.value = 4
  const loud = ctx.createGain()
  loud.gain.value = 1.8
  chop.connect(compressor).connect(loud).connect(ctx.destination)
  chop.connect(ensureMeter(ctx))
  setVoiceWind(ratio)
  return chop
}

/** Whether the microphone is open and a press can start recording right away. */
export function isVoiceReady() {
  return !!stream?.active
}

/** Ask for the microphone. Rejects when it is unavailable or refused. */
export async function prepareVoice() {
  await unlockAudio()
  const ctx = audioContext()
  if (!ctx || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined')
    throw new Error('Recording is not supported')
  if (isVoiceReady())
    return
  // No echo cancellation: it would fight the live playback. Ask for the
  // shortest capture buffer the device offers.
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true, latency: { ideal: 0.01 } } as MediaTrackConstraints })
  input = ctx.createMediaStreamSource(stream)
  input.connect(ensureMeter(ctx))
}

/** Route the microphone through the blades until {@link stopLive}. */
export function startLive() {
  const ctx = audioContext()
  if (!ctx || !input)
    return false
  stopPlayback()
  input.connect(ensureChain(ctx))
  duckHum(true)
  return true
}

export function stopLive() {
  if (input && chop) {
    try {
      input.disconnect(chop)
    }
    catch {}
  }
  duckHum(false)
}

/** Start recording; `onLimit` fires if the clip hits its maximum length. */
export function startRecording(onLimit: () => void) {
  if (!stream?.active)
    return false
  stopPlayback()
  chunks = []
  recorder = new MediaRecorder(stream)
  recorder.ondataavailable = event => event.data.size && chunks.push(event.data)
  recorder.start()
  stopTimer = setTimeout(onLimit, MAX_SECONDS * 1000)
  return true
}

/**
 * Stop recording and play the clip through the fan.
 *
 * @returns Resolves when playback ends, with the clip length in seconds
 */
export async function stopRecording(): Promise<number> {
  clearTimeout(stopTimer)
  const ctx = audioContext()
  const active = recorder
  recorder = undefined
  if (!ctx || !active || active.state === 'inactive')
    return 0
  const stopped = new Promise(resolve => active.addEventListener('stop', resolve, { once: true }))
  active.stop()
  await stopped
  const clip = await ctx.decodeAudioData(await new Blob(chunks, { type: active.mimeType }).arrayBuffer())
  const source = ctx.createBufferSource()
  source.buffer = clip
  source.connect(ensureChain(ctx))
  playing = source
  duckHum(true)
  const ended = new Promise(resolve => source.addEventListener('ended', resolve, { once: true }))
  source.start()
  await ended
  if (playing === source) {
    playing = undefined
    duckHum(false)
  }
  return clip.duration
}

/** Drop the clip being recorded without playing it. */
export function cancelRecording() {
  clearTimeout(stopTimer)
  if (recorder?.state === 'recording')
    recorder.stop()
  recorder = undefined
}

function stopPlayback() {
  playing?.stop()
  playing = undefined
  duckHum(false)
}

/** Close the microphone and stop any clip. */
export function stopVoice() {
  cancelRecording()
  stopLive()
  stopPlayback()
  stream?.getTracks().forEach(track => track.stop())
  input?.disconnect()
  stream = input = undefined
}

/**
 * Follow the blades.
 *
 * @param value - Blade speed as a share of top speed, 0–1
 */
export function setVoiceWind(value: number) {
  ratio = value
  const ctx = audioContext()
  if (!ctx || !chop || !depth || !lfo)
    return
  // Any spin chops hard; more speed chops faster.
  const amount = value < 0.03 ? 0 : 0.8 + 0.15 * value
  const now = ctx.currentTime
  // Gain swings between about 1 − amount and 1.
  chop.gain.setTargetAtTime(1 - amount / 2, now, 0.05)
  depth.gain.setTargetAtTime(amount / 2, now, 0.05)
  lfo.frequency.setTargetAtTime(12 + 33 * value, now, 0.05)
}

/** Loudness of the voice being recorded or played, 0–1, for a level indicator. */
export function voiceLevel() {
  if (!meter || !samples)
    return 0
  meter.getFloatTimeDomainData(samples)
  let sum = 0
  for (const sample of samples)
    sum += sample * sample
  return Math.min(1, Math.sqrt(sum / samples.length) * 6)
}
