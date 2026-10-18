// Talk into the fan: the microphone plays back through a gain the blades chop
// at their blade-pass rate, the warble every kid made shouting "啊——" at a
// fan. Faster blades chop faster and deeper; with the fan off it is just your
// voice. Everything stays on this device.

import { audioContext, unlockAudio } from './audio'

let stream: MediaStream | undefined
let source: MediaStreamAudioSourceNode | undefined
let chop: GainNode | undefined
let depth: GainNode | undefined
let lfo: OscillatorNode | undefined
let analyser: AnalyserNode | undefined
let samples: Float32Array<ArrayBuffer> | undefined
let ratio = 0

/** Start listening. Rejects when the microphone is unavailable or refused. */
export async function startVoice() {
  await unlockAudio()
  const ctx = audioContext()
  if (!ctx || !navigator.mediaDevices?.getUserMedia)
    throw new Error('Microphone is not supported')
  // Echo cancellation keeps laptop speakers from feeding back into the mic.
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true } })
  source = ctx.createMediaStreamSource(stream)
  chop = ctx.createGain()
  depth = ctx.createGain()
  lfo = ctx.createOscillator()
  lfo.type = 'triangle'
  lfo.connect(depth).connect(chop.gain)
  lfo.start()
  analyser = ctx.createAnalyser()
  analyser.fftSize = 512
  samples = new Float32Array(analyser.fftSize)
  source.connect(analyser)
  source.connect(chop).connect(ctx.destination)
  setVoiceWind(ratio)
}

export function stopVoice() {
  stream?.getTracks().forEach(track => track.stop())
  lfo?.stop()
  for (const node of [source, chop, depth, lfo, analyser])
    node?.disconnect()
  stream = source = chop = depth = lfo = analyser = samples = undefined
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
  const amount = Math.min(0.9, value * 1.1)
  const now = ctx.currentTime
  // Gain swings between 1 − amount and 1.
  chop.gain.setTargetAtTime(1 - amount / 2, now, 0.05)
  depth.gain.setTargetAtTime(amount / 2, now, 0.05)
  lfo.frequency.setTargetAtTime(6 + 42 * value, now, 0.05)
}

/** Loudness of the voice right now, 0–1, for a level indicator. */
export function voiceLevel() {
  if (!analyser || !samples)
    return 0
  analyser.getFloatTimeDomainData(samples)
  let sum = 0
  for (const sample of samples)
    sum += sample * sample
  return Math.min(1, Math.sqrt(sum / samples.length) * 6)
}
