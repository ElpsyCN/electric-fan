<script setup lang="ts">
/**
 * Line-art electric fan built from CSS 3D planes: drag to orbit, double-click
 * to reset. A small motor simulation drives it: blades spin up under torque,
 * coast down against drag, gust in natural mode, and the head sweeps on the
 * motor's gear. With `controls`, the fan is operated like the real thing:
 * piano keys on the base, a timer dial beside them and an oscillation knob on
 * top of the motor, each emitting an `action` for the host to apply.
 * Theme with `--fan-color`, `--fan-bg-color` and `--fan-accent` on any ancestor.
 *
 * @example
 * ```vue
 * <ElectricFan :level="2" oscillating controls title="电风扇" @action="dispatch" @motor="onFrame" />
 * ```
 */
import type { FanAction, FanLevel, FanMotor } from './core'
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { createFanMotor, fanMotorRatio, fanTimerMinutesLeft, fanTimerPresets, isFanMotorAtRest, nextFanTimerMinutes, stepFanMotor } from './core'

/** One simulated frame, emitted while the fan is moving. */
export interface FanMotorFrame extends FanMotor {
  /** Blade speed as a share of top speed, 0–1 */
  ratio: number
  /** Where the wind points on screen, in degrees: head yaw plus the camera orbit */
  facing: number
}

const props = withDefaults(defineProps<{
  /** 0 = off, 1–3 = speed */
  level?: FanLevel
  /** Sway the head while running */
  oscillating?: boolean
  /** Gusting natural wind instead of a steady blow */
  natural?: boolean
  /** ISO time the fan turns itself off; winds the timer dial */
  autoOffAt?: string | null
  /** Make the keys, dial and knob pressable */
  controls?: boolean
  /** Let pointer drags orbit the camera */
  orbit?: boolean
  /** Accessible name */
  title?: string
}>(), {
  level: 0,
  oscillating: false,
  natural: false,
  autoOffAt: null,
  controls: false,
  orbit: true,
  title: '',
})

const emit = defineEmits<{
  motor: [frame: FanMotorFrame]
  action: [action: FanAction]
}>()

const CENTER = 120
// Each blade is a petal on its own radius, from under the hub to inside the guard.
const BLADE_PATH = 'M0 -10C16 -10 29 -23 29 -39C29 -67.2 16 -90 0 -90C-16 -90 -29 -67.2 -29 -39C-29 -23 -16 -10 0 -10Z'
const BLADE_ANGLES = [0, 120, 240]
const round = (value: number) => Math.round(value * 100) / 100
const spokes = Array.from({ length: 26 }, (_, index) => {
  const angle = (index * 2 * Math.PI) / 26
  return {
    x1: round(CENTER + Math.sin(angle) * 22),
    y1: round(CENTER - Math.cos(angle) * 22),
    x2: round(CENTER + Math.sin(angle) * 109),
    y2: round(CENTER - Math.cos(angle) * 109),
  }
})

// --- Geometry, in drawing units: 240 wide, 312 tall --------------------------
// x right, y down, z toward the viewer. The pole stands on z = POLE_Z and the
// head yaws around it; the guard's front dome bulges from z = 14 to 30.
const POLE_Z = -40
const BASE = { x: CENTER, top: 284, height: 22, z: -30, width: 184, depth: 116 }
const BASE_FRONT = BASE.z + BASE.depth / 2
const u = (value: number) => `calc(var(--u) * ${round(value)})`
function box(x: number, y: number, z: number, width: number, height: number, then = '') {
  return {
    width: u(width),
    height: u(height),
    transform: `translate3d(${u(x - width / 2)}, ${u(y - height / 2)}, ${u(z)})${then ? ` ${then}` : ''}`,
  }
}
// Light from the upper left front, baked into a darkening overlay so it reads
// the same on light and dark themes.
const LIGHT = [-0.45, -0.6, 0.66]
function shade(normal: number[], depth = 0.42) {
  const lit = Math.max(0, normal[0] * LIGHT[0] + normal[1] * LIGHT[1] + normal[2] * LIGHT[2])
  const alpha = round((1 - lit) * depth)
  return `linear-gradient(rgb(0 0 0 / ${alpha}), rgb(0 0 0 / ${alpha}))`
}
// Cylinders of flat strips around the y axis (pole, collar)...
function aroundY(x: number, y: number, z: number, radius: number, height: number, sides: number, depth?: number) {
  const width = 2 * radius * Math.tan(Math.PI / sides) + 0.6
  return Array.from({ length: sides }, (_, index) => {
    const theta = (index * 360) / sides
    const rad = (theta * Math.PI) / 180
    return { ...box(x, y, z, width, height, `rotateY(${theta}deg) translateZ(${u(radius)})`), backgroundImage: shade([Math.sin(rad), 0, Math.cos(rad)], depth) }
  })
}
// ...or around the z axis (motor housing).
function aroundZ(x: number, y: number, z: number, radius: number, length: number, sides: number) {
  const width = 2 * radius * Math.tan(Math.PI / sides) + 0.6
  return Array.from({ length: sides }, (_, index) => {
    const theta = (index * 360) / sides
    const rad = (theta * Math.PI) / 180
    return { ...box(x, y, z, width, length, `rotateZ(${theta}deg) translateY(${u(-radius)}) rotateX(90deg)`), backgroundImage: shade([Math.sin(rad), -Math.cos(rad), 0]) }
  })
}
// A box's bottom, back, sides and front, centered on (x, y, z); the top is drawn on its own.
function cuboid(x: number, y: number, z: number, width: number, height: number, depth: number) {
  return [
    { ...box(x, y + height / 2, z, width, depth, 'rotateX(90deg)'), backgroundImage: shade([0, 1, 0]) },
    { ...box(x, y, z - depth / 2, width, height, 'rotateY(180deg)'), backgroundImage: shade([0, 0, -1]) },
    { ...box(x - width / 2, y, z, depth, height, 'rotateY(-90deg)'), backgroundImage: shade([-1, 0, 0]) },
    { ...box(x + width / 2, y, z, depth, height, 'rotateY(90deg)'), backgroundImage: shade([1, 0, 0]) },
    { ...box(x, y, z + depth / 2, width, height), backgroundImage: shade([0, 0, 1]) },
  ]
}
function ring(radius: number, z: number, width: number, opacity = 1) {
  return { ...box(CENTER, CENTER, z, radius * 2, radius * 2), borderWidth: u(width), opacity }
}
// The front grille is a shallow dome: spokes slope from the rim to the badge.
const DOME = { rim: 109, rimZ: 14, top: 22, topZ: 30 }
const domeZ = (radius: number) => DOME.rimZ + (DOME.topZ - DOME.rimZ) * (DOME.rim - radius) / (DOME.rim - DOME.top)

// A round control is a flat cap (the button itself) with its side hanging
// below. Cap-local axes after rotateX(90deg): +y toward the viewer, +z up.
function knobSides(radius: number, height: number, sides: number) {
  const width = 2 * radius * Math.tan(Math.PI / sides) + 0.4
  return Array.from({ length: sides }, (_, index) => {
    const theta = (index * 360) / sides
    const rad = (theta * Math.PI) / 180
    return {
      width: u(width),
      height: u(height),
      transform: `translate3d(${u(radius - width / 2)}, ${u(radius - height / 2)}, ${u(-height / 2)}) rotateZ(${theta}deg) translateY(${u(-radius)}) rotateX(90deg)`,
      backgroundImage: shade([Math.sin(rad), 0, -Math.cos(rad)], 0.5),
    }
  })
}

const scene = {
  floor: box(CENTER, 307, BASE.z, 280, 220, 'rotateX(90deg)'),
  base: cuboid(BASE.x, BASE.top + BASE.height / 2, BASE.z, BASE.width, BASE.height, BASE.depth),
  baseTop: box(BASE.x, BASE.top, BASE.z, BASE.width, BASE.depth, 'rotateX(90deg)'),
  nameplate: box(66, BASE.top - 0.3, -40, 60, 16, 'rotateX(90deg)'),
  pole: aroundY(CENTER, 215, POLE_Z, 6, 138, 10),
  collar: aroundY(CENTER, BASE.top - 3, POLE_Z, 10, 6, 14, 0.35),
  housing: aroundZ(CENTER, CENTER, -43, 26, 42, 16),
  housingCap: box(CENTER, CENTER, -64, 52, 52),
  rearGrille: box(CENTER, CENTER, -15, 240, 240),
  rim: [ring(119, -15, 4), ring(118, -8, 1.5, 0.45), ring(118, -1, 1.5, 0.45), ring(118, 6, 1.5, 0.45), ring(120, 14, 8)],
  blur: box(CENTER, CENTER, 2, 186, 186),
  spinner: box(CENTER, CENTER, 2, 240, 240),
  blades: BLADE_ANGLES.map(angle => ({ ...box(CENTER, 70, 0, 58, 80, `rotateZ(${angle}deg) rotateY(24deg)`), transformOrigin: `${u(29)} ${u(90)}` })),
  hub: [17, 15, 11, 6].map((radius, index) => box(CENTER, CENTER, 4 + index * 3, radius * 2, radius * 2)),
  domeRings: [94, 63, 33].map(radius => ring(radius, domeZ(radius), 1.6, 0.6)),
  domeSpokes: spokes.map((_, index) => {
    const theta = (index * 360) / 26
    const length = Math.hypot(DOME.rim - DOME.top, DOME.topZ - DOME.rimZ)
    const tilt = (Math.atan2(DOME.topZ - DOME.rimZ, DOME.rim - DOME.top) * 180) / Math.PI
    return box(CENTER, CENTER, (DOME.rimZ + DOME.topZ) / 2, 1.6, length, `rotateZ(${round(theta)}deg) translateY(${u(-(DOME.rim + DOME.top) / 2)}) rotateX(${round(tilt)}deg)`)
  }),
  badge: box(CENTER, CENTER, DOME.topZ + 0.5, 30, 30),
}

// --- Controls ----------------------------------------------------------------
// Piano keys along the front edge of the base: 关 springs back, 1–3 latch
// (pressing one releases the others), 自然 latches on its own.
const KEY = { width: 28, gap: 4, height: 14, depth: 20, rise: 4, reach: 4 }
const keys: { label: string, ariaLabel: string, hint: string, action: FanAction }[] = [
  { label: '关', ariaLabel: '关闭风扇', hint: '0', action: { type: 'set-level', level: 0 } },
  { label: '1', ariaLabel: '一档风', hint: '1', action: { type: 'set-level', level: 1 } },
  { label: '2', ariaLabel: '二档风', hint: '2', action: { type: 'set-level', level: 2 } },
  { label: '3', ariaLabel: '三档风', hint: '3', action: { type: 'set-level', level: 3 } },
  { label: '自然', ariaLabel: '自然风', hint: 'N', action: { type: 'toggle-natural' } },
]
const keyRow = keys.length * KEY.width + (keys.length - 1) * KEY.gap
const keyFaces = {
  top: { width: u(KEY.width), height: u(KEY.depth), backgroundImage: shade([0, -1, 0], 0.3) },
  left: { width: u(KEY.depth), height: u(KEY.height), backgroundImage: shade([-1, 0, 0]) },
  right: { width: u(KEY.depth), height: u(KEY.height), left: u(KEY.width), backgroundImage: shade([1, 0, 0]) },
}
const keyStyles = keys.map((_, index) => {
  const x = CENTER - keyRow / 2 + KEY.width / 2 + index * (KEY.width + KEY.gap)
  // --sink (set by CSS) pushes the key down and in.
  return box(x, BASE.top - KEY.rise + KEY.height / 2, BASE_FRONT + KEY.reach, KEY.width, KEY.height, `translate3d(0, calc(var(--sink) * ${u(KEY.rise - 1)}), calc(var(--sink) * ${u(-KEY.reach + 1)}))`)
})
function keyDown(action: FanAction) {
  if (action.type === 'set-level')
    return action.level > 0 && action.level === props.level
  return action.type === 'toggle-natural' && props.natural
}
// 关 is momentary, so it has no pressed state to announce.
const keyPressed = (action: FanAction) => action.type === 'set-level' && action.level === 0 ? undefined : keyDown(action)

// The timer dial winds back toward zero as time runs out, like a clockwork timer.
const DIAL = { x: 176, z: -38, radius: 13, height: 7, sweep: 300 }
const dialSides = knobSides(DIAL.radius, DIAL.height, 18)
const dialScale = box(DIAL.x, BASE.top - 0.4, DIAL.z, 44, 44, 'rotateX(90deg)')
const dialTicks = fanTimerPresets.map((preset) => {
  const rad = (((preset ?? 0) / 120) * DIAL.sweep * Math.PI) / 180
  return { x1: round(Math.sin(rad) * 16), y1: round(-Math.cos(rad) * 16), x2: round(Math.sin(rad) * 20), y2: round(-Math.cos(rad) * 20) }
})
const now = shallowRef(Date.now())
const minutesLeft = computed(() => fanTimerMinutesLeft({ autoOffAt: props.autoOffAt }, now.value))
const dialStyle = computed(() => box(DIAL.x, BASE.top - DIAL.height, DIAL.z, DIAL.radius * 2, DIAL.radius * 2, `rotateX(90deg) rotateZ(${round(((minutesLeft.value ?? 0) / 120) * DIAL.sweep)}deg)`))
const dialLabel = computed(() => minutesLeft.value === null ? '定时关闭：未设定' : `定时关闭：剩余 ${Math.ceil(minutesLeft.value)} 分钟`)
let clock: ReturnType<typeof setInterval> | undefined
watch(() => props.autoOffAt, (autoOffAt) => {
  clearInterval(clock)
  now.value = Date.now()
  if (autoOffAt && typeof window !== 'undefined')
    clock = setInterval(() => now.value = Date.now(), 1000)
}, { immediate: true })

// The oscillation knob on top of the motor: pulled up to sweep, pushed down to hold.
const KNOB = { z: -50, radius: 9, height: 14 }
const knobSideStyles = knobSides(KNOB.radius, KNOB.height, 12)
const knobStyle = computed(() => box(CENTER, 94 - (props.oscillating ? 11 : 4), KNOB.z, KNOB.radius * 2, KNOB.radius * 2, 'rotateX(90deg)'))

function press(action: FanAction) {
  if (props.controls)
    emit('action', action)
}

function turnDial() {
  press({ type: 'set-timer', minutes: nextFanTimerMinutes({ autoOffAt: props.autoOffAt }) })
}

// --- Camera ------------------------------------------------------------------
const DEFAULT_ORBIT = -28
const DEFAULT_TILT = -14
const cameraOrbit = shallowRef(DEFAULT_ORBIT)
const cameraTilt = shallowRef(DEFAULT_TILT)
const resetting = shallowRef(false)
const dragging = shallowRef(false)
const cameraStyle = computed(() => ({ transform: `rotateX(${cameraTilt.value}deg) rotateY(${cameraOrbit.value}deg)` }))
let drag: { id: number, x: number, y: number, t: number, vx: number, vy: number } | undefined
let glideFrame = 0
const clampTilt = (tilt: number) => Math.min(8, Math.max(-40, tilt))
const onControl = (event: Event) => !!(event.target as Element | null)?.closest?.('button')

function onPointerDown(event: PointerEvent) {
  if (!props.orbit || event.button !== 0 || onControl(event))
    return
  cancelAnimationFrame(glideFrame)
  resetting.value = false
  dragging.value = true
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, t: event.timeStamp, vx: 0, vy: 0 }
  ;(event.currentTarget as Element).setPointerCapture?.(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id)
    return
  const dx = event.clientX - drag.x
  const dy = event.pointerType === 'mouse' ? event.clientY - drag.y : 0
  const dt = Math.max(1, event.timeStamp - drag.t)
  cameraOrbit.value += dx * 0.45
  cameraTilt.value = clampTilt(cameraTilt.value - dy * 0.3)
  drag = { ...drag, x: event.clientX, y: event.clientY, t: event.timeStamp, vx: (dx * 0.45) / dt, vy: (-dy * 0.3) / dt }
}

// Let a flick keep turning the camera for a moment.
function onPointerUp(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id)
    return
  let { vx, vy } = drag
  drag = undefined
  dragging.value = false
  let last = performance.now()
  const glide = (time: number) => {
    const dt = time - last
    last = time
    vx *= 0.94 ** (dt / 16)
    vy *= 0.94 ** (dt / 16)
    cameraOrbit.value += vx * dt
    cameraTilt.value = clampTilt(cameraTilt.value + vy * dt)
    if (Math.abs(vx) + Math.abs(vy) > 0.002)
      glideFrame = requestAnimationFrame(glide)
  }
  glideFrame = requestAnimationFrame(glide)
}

function resetCamera(event: MouseEvent) {
  if (onControl(event))
    return
  cancelAnimationFrame(glideFrame)
  // Unwind whole turns first, without animating, so the camera takes the short way home.
  cameraOrbit.value = DEFAULT_ORBIT + ((((cameraOrbit.value - DEFAULT_ORBIT) % 360) + 540) % 360) - 180
  glideFrame = requestAnimationFrame(() => {
    glideFrame = requestAnimationFrame(() => {
      resetting.value = true
      cameraOrbit.value = DEFAULT_ORBIT
      cameraTilt.value = DEFAULT_TILT
    })
  })
}

// --- Motor loop --------------------------------------------------------------
const head = useTemplateRef<HTMLDivElement>('head')
const spinner = useTemplateRef<HTMLDivElement>('spinner')
const ghost = useTemplateRef<HTMLDivElement>('ghost')
const blur = useTemplateRef<HTMLDivElement>('blur')

const running = computed(() => props.level > 0)
let motor = createFanMotor()
let frame = 0
let lastTime = 0
let reducedMotion = false

function render() {
  const ratio = fanMotorRatio(motor)
  const angle = reducedMotion ? 0 : motor.angle
  // Motion blur: a trailing copy a few degrees behind, fading in with speed.
  const lag = reducedMotion ? 0 : Math.min(16, motor.speed * 4)
  if (spinner.value)
    spinner.value.style.transform = `${scene.spinner.transform} rotateZ(${round(angle)}deg)`
  if (ghost.value) {
    ghost.value.style.transform = `${scene.spinner.transform} rotateZ(${round(angle - lag)}deg)`
    ghost.value.style.opacity = String(round(0.45 * ratio ** 1.5))
  }
  if (blur.value)
    blur.value.style.opacity = String(round(0.1 * ratio))
  if (head.value)
    head.value.style.transform = `rotateY(${round(reducedMotion ? 0 : motor.yaw)}deg)`
}

function tick(time: number) {
  const dt = lastTime ? (time - lastTime) / 1000 : 0
  lastTime = time
  motor = stepFanMotor(motor, { level: props.level, oscillating: props.oscillating, natural: props.natural, time: time / 1000 }, dt)
  render()
  emit('motor', { ...motor, ratio: fanMotorRatio(motor), facing: motor.yaw + cameraOrbit.value })
  if (isFanMotorAtRest(motor, props.level)) {
    frame = 0
    lastTime = 0
    return
  }
  frame = requestAnimationFrame(tick)
}

function wake() {
  if (!frame && typeof requestAnimationFrame === 'function')
    frame = requestAnimationFrame(tick)
}

let motionQuery: MediaQueryList | undefined
function onMotionPreference() {
  reducedMotion = !!motionQuery?.matches
  render()
}

onMounted(() => {
  if (typeof matchMedia === 'function') {
    motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener?.('change', onMotionPreference)
    reducedMotion = motionQuery.matches
  }
  render()
  wake()
})

watch(() => [props.level, props.oscillating, props.natural], wake)

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  cancelAnimationFrame(glideFrame)
  clearInterval(clock)
  frame = 0
  motionQuery?.removeEventListener?.('change', onMotionPreference)
})
</script>

<template>
  <div
    class="electric-fan"
    :class="{ 'is-running': running, 'is-oscillating': running && oscillating, 'is-natural': running && natural, 'is-orbitable': orbit, 'is-dragging': dragging, 'has-controls': controls }"
    :role="controls ? 'group' : title ? 'img' : undefined"
    :aria-label="title || undefined"
    :aria-hidden="controls || title ? undefined : 'true'"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @dblclick="resetCamera"
  >
    <div class="ef3d__stage">
      <div class="ef3d__camera" :class="{ 'is-resetting': resetting }" :style="cameraStyle" @transitionend.self="resetting = false">
        <div class="ef3d__floor" :style="scene.floor" />
        <div v-for="(face, index) in scene.base" :key="`base${index}`" class="ef3d__solid" :style="face" />
        <div class="ef3d__base-top" :style="scene.baseTop" />
        <div class="ef3d__nameplate" :style="scene.nameplate" aria-hidden="true">
          ELPSY
        </div>
        <div v-for="(face, index) in scene.collar" :key="`collar${index}`" class="ef3d__solid" :style="face" />
        <div v-for="(face, index) in scene.pole" :key="`pole${index}`" class="ef3d__solid" :style="face" />

        <button
          v-for="(key, index) in keys"
          :key="key.label"
          class="ef3d__key"
          :class="{ 'is-down': keyDown(key.action), 'is-wide': key.label.length > 1 }"
          type="button"
          :style="keyStyles[index]"
          :tabindex="controls ? undefined : -1"
          :disabled="!controls"
          :aria-label="key.ariaLabel"
          :aria-pressed="keyPressed(key.action)"
          :title="`${key.ariaLabel}（${key.hint}）`"
          @click="press(key.action)"
        >
          <span class="ef3d__key-label">{{ key.label }}</span>
          <span class="ef3d__key-face ef3d__key-face--top" :style="keyFaces.top" />
          <span class="ef3d__key-face ef3d__key-face--left" :style="keyFaces.left" />
          <span class="ef3d__key-face ef3d__key-face--right" :style="keyFaces.right" />
        </button>

        <svg class="ef3d__dial-scale" :style="dialScale" viewBox="-22 -22 44 44" aria-hidden="true">
          <line v-for="(mark, index) in dialTicks" :key="index" v-bind="mark" />
        </svg>
        <button
          class="ef3d__dial"
          type="button"
          :style="dialStyle"
          :tabindex="controls ? undefined : -1"
          :disabled="!controls"
          :aria-label="dialLabel"
          :title="`${dialLabel}（T）`"
          @click="turnDial"
        >
          <span v-for="(face, index) in dialSides" :key="index" class="ef3d__knob-side" :style="face" />
        </button>

        <div ref="head" class="ef3d__head">
          <div class="ef3d__cap" :style="scene.housingCap" />
          <div v-for="(face, index) in scene.housing" :key="`housing${index}`" class="ef3d__shell" :style="face" />
          <button
            class="ef3d__knob"
            :class="{ 'is-up': oscillating }"
            type="button"
            :style="knobStyle"
            :tabindex="controls ? undefined : -1"
            :disabled="!controls"
            aria-label="摇头"
            :aria-pressed="oscillating"
            title="摇头（O）"
            @click="press({ type: 'toggle-oscillation' })"
          >
            <span v-for="(face, index) in knobSideStyles" :key="index" class="ef3d__knob-side" :style="face" />
          </button>

          <svg class="ef3d__rear" :style="scene.rearGrille" viewBox="0 0 240 240" aria-hidden="true">
            <circle :cx="CENTER" :cy="CENTER" r="33" />
            <circle :cx="CENTER" :cy="CENTER" r="63" />
            <circle :cx="CENTER" :cy="CENTER" r="94" />
            <line v-for="(spoke, index) in spokes" :key="index" v-bind="spoke" />
          </svg>
          <div v-for="(style, index) in scene.rim" :key="`ring${index}`" class="ef3d__ring" :style="style" />

          <div ref="blur" class="ef3d__blur" :style="scene.blur" />
          <div ref="ghost" class="ef3d__spinner ef3d__spinner--ghost" :style="scene.spinner">
            <div v-for="(style, index) in scene.blades" :key="index" class="ef3d__blade" :style="style">
              <svg viewBox="-29 -90 58 80" aria-hidden="true"><path :d="BLADE_PATH" transform="skewX(-8)" /></svg>
            </div>
          </div>
          <div ref="spinner" class="ef3d__spinner" :style="scene.spinner">
            <div v-for="(style, index) in scene.blades" :key="index" class="ef3d__blade" :style="style">
              <svg viewBox="-29 -90 58 80" aria-hidden="true"><path :d="BLADE_PATH" transform="skewX(-8)" /></svg>
            </div>
          </div>
          <div v-for="(style, index) in scene.hub" :key="`hub${index}`" class="ef3d__hub" :style="style" />

          <div v-for="(style, index) in scene.domeSpokes" :key="`spoke${index}`" class="ef3d__spoke" :style="style" />
          <div v-for="(style, index) in scene.domeRings" :key="`dome${index}`" class="ef3d__ring" :style="style" />
          <div class="ef3d__badge" :style="scene.badge" />
        </div>
      </div>
    </div>
  </div>
</template>
