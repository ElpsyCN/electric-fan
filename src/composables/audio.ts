// Fan hum on the Web Audio API. The recording's steady middle loops without
// gaps, and its volume and pitch follow the simulated blade speed, so the
// motor audibly winds up, gusts in natural mode and sighs down when switched off.

const LOOP_START = 3.2
const LOOP_END = 6.2

let context: AudioContext | undefined
let gain: GainNode | undefined
let hum: AudioBufferSourceNode | undefined
let humBuffer: AudioBuffer | undefined
let clickBuffer: AudioBuffer | undefined
let loading: Promise<void> | undefined
let level = 0
let isMuted = false

async function load(ctx: AudioContext, url: string) {
  const response = await fetch(url)
  return ctx.decodeAudioData(await response.arrayBuffer())
}

function startHum() {
  if (!context || !gain || !humBuffer || hum)
    return
  hum = context.createBufferSource()
  hum.buffer = humBuffer
  hum.loop = true
  hum.loopStart = LOOP_START
  hum.loopEnd = Math.min(LOOP_END, humBuffer.duration)
  hum.playbackRate.value = 0.6
  hum.connect(gain)
  hum.start(0, LOOP_START)
}

function stopHum() {
  hum?.stop()
  hum?.disconnect()
  hum = undefined
}

/**
 * Create the audio graph. Browsers only allow this inside a user gesture, so
 * call it from click and key handlers; later calls are cheap.
 */
export function unlockAudio() {
  if (typeof window === 'undefined' || !('AudioContext' in window))
    return
  if (!context) {
    context = new AudioContext()
    gain = context.createGain()
    gain.gain.value = 0
    gain.connect(context.destination)
    loading = Promise.all([load(context, '/audio/fan.mp3'), load(context, '/audio/switch.mp3')])
      .then(([fan, click]) => {
        humBuffer = fan
        clickBuffer = click
        setHumLevel(level)
      })
      .catch(() => undefined)
  }
  if (context.state === 'suspended')
    void context.resume()
  return loading
}

/** The shared audio context, once {@link unlockAudio} has created it. */
export function audioContext() {
  return context
}

/** Play the switch click. */
export function playClick() {
  if (!context || !clickBuffer || isMuted)
    return
  const source = context.createBufferSource()
  source.buffer = clickBuffer
  source.connect(context.destination)
  source.start()
}

/**
 * Follow the blades: 0 is silent, 1 is full speed.
 *
 * @param ratio - Blade speed as a share of top speed
 */
export function setHumLevel(ratio: number) {
  level = ratio
  if (!context || !gain)
    return
  const audible = isMuted ? 0 : ratio
  if (audible > 0.005)
    startHum()
  const now = context.currentTime
  gain.gain.setTargetAtTime(0.85 * audible ** 1.3, now, 0.06)
  hum?.playbackRate.setTargetAtTime(0.6 + 0.4 * ratio, now, 0.06)
  if (audible <= 0.005)
    stopHum()
}

export function setAudioMuted(value: boolean) {
  isMuted = value
  setHumLevel(level)
}
