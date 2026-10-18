<script setup lang="ts">
/**
 * Line-art electric fan, drawn flat in SVG (`view="2d"`) or built from CSS 3D
 * planes (`view="3d"`, drag to orbit, double-click to reset). A small motor
 * simulation drives both: blades spin up under torque, coast down against
 * drag, gust in natural mode, and the head sweeps on the motor's gear.
 * Theme with `--fan-color` and `--fan-bg-color` on any ancestor.
 *
 * @example
 * ```vue
 * <ElectricFan :level="2" oscillating natural view="3d" title="电风扇" @motor="onFrame" />
 * ```
 */
import type { FanLevel, FanMotor } from './core'
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { createFanMotor, fanMotorRatio, isFanMotorAtRest, stepFanMotor } from './core'

export type FanView = '2d' | '3d'

/** One simulated frame, emitted while the fan is moving. */
export interface FanMotorFrame extends FanMotor {
  /** Blade speed as a share of top speed, 0–1 */
  ratio: number
  /** Where the wind points on screen, in degrees: head yaw plus the 3D camera orbit */
  facing: number
}

const props = withDefaults(defineProps<{
  /** 0 = off, 1–3 = speed */
  level?: FanLevel
  /** Sway the head while running */
  oscillating?: boolean
  /** Gusting natural wind instead of a steady blow */
  natural?: boolean
  /** Flat SVG or CSS 3D */
  view?: FanView
  /** Let pointer drags orbit the 3D camera */
  orbit?: boolean
  /** Accessible title; decorative when empty */
  title?: string
}>(), {
  level: 0,
  oscillating: false,
  natural: false,
  view: '2d',
  orbit: true,
  title: '',
})

const emit = defineEmits<{
  motor: [frame: FanMotorFrame]
}>()

const CENTER = 120
// Each blade is a petal on its own radius, from under the hub to inside the guard.
const BLADE_PATH = 'M0 -10C16 -10 29 -23 29 -39C29 -67.2 16 -90 0 -90C-16 -90 -29 -67.2 -29 -39C-29 -23 -16 -10 0 -10Z'
const BLADE_ANGLES = [0, 120, 240]
const GHOSTS = [1, 2]
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

// --- 3D geometry, in drawing units (the 2D viewBox is 240 × 312) ----------
// x right, y down, z toward the viewer. The pole stands on z = POLE_Z and the
// head yaws around it; the guard's front dome bulges from z = 14 to 30.
const POLE_Z = -40
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
// A cylinder of flat strips around the y axis (pole, base rim)...
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
function ring(radius: number, z: number, width: number, opacity = 1) {
  return { ...box(CENTER, CENTER, z, radius * 2, radius * 2), borderWidth: u(width), opacity }
}
// The front grille is a shallow dome: spokes slope from the rim to the badge.
const DOME = { rim: 109, rimZ: 14, top: 22, topZ: 30 }
const domeZ = (radius: number) => DOME.rimZ + (DOME.topZ - DOME.rimZ) * (DOME.rim - radius) / (DOME.rim - DOME.top)
const scene = {
  floor: box(CENTER, 307, POLE_Z + 10, 230, 230, 'rotateX(90deg)'),
  baseTop: box(CENTER, 296, POLE_Z, 144, 144, 'rotateX(90deg)'),
  baseRim: aroundY(CENTER, 301, POLE_Z, 72, 10, 36, 0.3),
  pole: aroundY(CENTER, 221, POLE_Z, 6, 150, 10),
  housing: aroundZ(CENTER, CENTER, -43, 26, 42, 16),
  housingCap: box(CENTER, CENTER, -64, 52, 52),
  knob: box(CENTER, 93, -52, 10, 10, 'rotateX(90deg)'),
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

// --- Camera (3D only) -------------------------------------------------------
const DEFAULT_ORBIT = -28
const DEFAULT_TILT = -14
const cameraOrbit = shallowRef(DEFAULT_ORBIT)
const cameraTilt = shallowRef(DEFAULT_TILT)
const resetting = shallowRef(false)
const dragging = shallowRef(false)
const cameraStyle = computed(() => ({ transform: `rotateX(${cameraTilt.value}deg) rotateY(${cameraOrbit.value}deg)` }))
let drag: { id: number, x: number, y: number, t: number, vx: number, vy: number } | undefined
let glideFrame = 0

function onPointerDown(event: PointerEvent) {
  if (props.view !== '3d' || !props.orbit || event.button !== 0)
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
  cameraTilt.value = Math.min(20, Math.max(-40, cameraTilt.value - dy * 0.3))
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
  const glide = (now: number) => {
    const dt = now - last
    last = now
    vx *= 0.94 ** (dt / 16)
    vy *= 0.94 ** (dt / 16)
    cameraOrbit.value += vx * dt
    cameraTilt.value = Math.min(20, Math.max(-40, cameraTilt.value + vy * dt))
    if (Math.abs(vx) + Math.abs(vy) > 0.002)
      glideFrame = requestAnimationFrame(glide)
  }
  glideFrame = requestAnimationFrame(glide)
}

function resetCamera() {
  if (props.view !== '3d')
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

// --- Motor loop ---------------------------------------------------------------
const head2d = useTemplateRef<SVGGElement>('head2d')
const blades2d = useTemplateRef<SVGGElement>('blades2d')
const ghosts2d = useTemplateRef<SVGGElement>('ghosts2d')
const blur2d = useTemplateRef<SVGCircleElement>('blur2d')
const head3d = useTemplateRef<HTMLDivElement>('head3d')
const spinner3d = useTemplateRef<HTMLDivElement>('spinner3d')
const ghost3d = useTemplateRef<HTMLDivElement>('ghost3d')
const blur3d = useTemplateRef<HTMLDivElement>('blur3d')

const running = computed(() => props.level > 0)
let motor = createFanMotor()
let frame = 0
let lastTime = 0
let reducedMotion = false

function render() {
  const ratio = fanMotorRatio(motor)
  const angle = reducedMotion ? 0 : motor.angle
  const yaw = reducedMotion ? 0 : motor.yaw
  const yawRad = (yaw * Math.PI) / 180
  // Motion blur: trailing copies a few degrees behind, fading in with speed.
  const lag = reducedMotion ? 0 : Math.min(16, motor.speed * 4)
  const ghostOpacity = String(round(0.45 * ratio ** 1.5))
  if (props.view === '2d') {
    blades2d.value?.setAttribute('transform', `rotate(${round(angle)} ${CENTER} ${CENTER})`)
    ghosts2d.value?.querySelectorAll('g').forEach((ghost, index) => {
      ghost.setAttribute('transform', `rotate(${round(angle - lag * (index + 1))} ${CENTER} ${CENTER})`)
      ghost.style.opacity = String(round(Number(ghostOpacity) / (index + 1)))
    })
    if (blur2d.value)
      blur2d.value.style.opacity = String(round(0.1 * ratio))
    // Seen from the front, a turning head shifts toward where it points and narrows.
    if (head2d.value)
      head2d.value.style.transform = `translateX(${round(Math.sin(yawRad) * 10)}px) scaleX(${round(Math.cos(yawRad) * 1000) / 1000})`
  }
  else {
    if (spinner3d.value)
      spinner3d.value.style.transform = `${scene.spinner.transform} rotateZ(${round(angle)}deg)`
    if (ghost3d.value) {
      ghost3d.value.style.transform = `${scene.spinner.transform} rotateZ(${round(angle - lag)}deg)`
      ghost3d.value.style.opacity = ghostOpacity
    }
    if (blur3d.value)
      blur3d.value.style.opacity = String(round(0.1 * ratio))
    if (head3d.value)
      head3d.value.style.transform = `rotateY(${round(yaw)}deg)`
  }
}

function tick(now: number) {
  const dt = lastTime ? (now - lastTime) / 1000 : 0
  lastTime = now
  motor = stepFanMotor(motor, { level: props.level, oscillating: props.oscillating, natural: props.natural, time: now / 1000 }, dt)
  render()
  emit('motor', { ...motor, ratio: fanMotorRatio(motor), facing: motor.yaw + (props.view === '3d' ? cameraOrbit.value : 0) })
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
// The other view's elements mount on switch; draw the current pose into them.
watch(() => props.view, () => {
  render()
  wake()
}, { flush: 'post' })

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  cancelAnimationFrame(glideFrame)
  frame = 0
  motionQuery?.removeEventListener?.('change', onMotionPreference)
})
</script>

<template>
  <svg
    v-if="view === '2d'"
    class="electric-fan electric-fan--2d"
    :class="{ 'is-running': running, 'is-oscillating': running && oscillating, 'is-natural': running && natural }"
    viewBox="0 0 240 312"
    role="img"
    focusable="false"
    :aria-hidden="title ? undefined : 'true'"
  >
    <title v-if="title">{{ title }}</title>
    <ellipse class="electric-fan__shadow" cx="120" cy="306" rx="84" ry="6" />
    <rect class="electric-fan__base" x="45" y="296" width="150" height="10" rx="3" />
    <rect class="electric-fan__neck" x="115" y="236" width="10" height="62" />
    <g ref="head2d" class="electric-fan__head">
      <circle class="electric-fan__face" :cx="CENTER" :cy="CENTER" r="110" />
      <g class="electric-fan__grille">
        <circle :cx="CENTER" :cy="CENTER" r="33" />
        <circle :cx="CENTER" :cy="CENTER" r="63" />
        <circle :cx="CENTER" :cy="CENTER" r="94" />
        <line v-for="(spoke, index) in spokes" :key="index" v-bind="spoke" />
      </g>
      <circle ref="blur2d" class="electric-fan__blur" :cx="CENTER" :cy="CENTER" r="92" />
      <g ref="ghosts2d" class="electric-fan__ghosts">
        <g v-for="ghost in GHOSTS" :key="ghost">
          <path
            v-for="angle in BLADE_ANGLES" :key="angle" :d="BLADE_PATH"
            :transform="`translate(${CENTER} ${CENTER}) rotate(${angle}) skewX(-8)`"
          />
        </g>
      </g>
      <g ref="blades2d" class="electric-fan__blades">
        <path
          v-for="angle in BLADE_ANGLES" :key="angle" class="electric-fan__blade" :d="BLADE_PATH"
          :transform="`translate(${CENTER} ${CENTER}) rotate(${angle}) skewX(-8)`"
        />
      </g>
      <circle class="electric-fan__hub" :cx="CENTER" :cy="CENTER" r="17" />
      <circle class="electric-fan__ring" :cx="CENTER" :cy="CENTER" r="115" />
    </g>
  </svg>

  <div
    v-else
    class="electric-fan electric-fan--3d"
    :class="{ 'is-running': running, 'is-oscillating': running && oscillating, 'is-natural': running && natural, 'is-orbitable': orbit, 'is-dragging': dragging }"
    :role="title ? 'img' : undefined"
    :aria-label="title || undefined"
    :aria-hidden="title ? undefined : 'true'"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @dblclick="resetCamera"
  >
    <div class="ef3d__stage">
      <div class="ef3d__camera" :class="{ 'is-resetting': resetting }" :style="cameraStyle" @transitionend="resetting = false">
        <div class="ef3d__floor" :style="scene.floor" />
        <div v-for="(face, index) in scene.baseRim" :key="`rim${index}`" class="ef3d__solid" :style="face" />
        <div class="ef3d__base-top" :style="scene.baseTop" />
        <div v-for="(face, index) in scene.pole" :key="`pole${index}`" class="ef3d__solid" :style="face" />

        <div ref="head3d" class="ef3d__head">
          <div class="ef3d__cap" :style="scene.housingCap" />
          <div v-for="(face, index) in scene.housing" :key="`housing${index}`" class="ef3d__shell" :style="face" />
          <div class="ef3d__knob" :style="scene.knob" />

          <svg class="ef3d__rear" :style="scene.rearGrille" viewBox="0 0 240 240" aria-hidden="true">
            <circle :cx="CENTER" :cy="CENTER" r="33" />
            <circle :cx="CENTER" :cy="CENTER" r="63" />
            <circle :cx="CENTER" :cy="CENTER" r="94" />
            <line v-for="(spoke, index) in spokes" :key="index" v-bind="spoke" />
          </svg>
          <div v-for="(style, index) in scene.rim" :key="`ring${index}`" class="ef3d__ring" :style="style" />

          <div ref="blur3d" class="ef3d__blur" :style="scene.blur" />
          <div ref="ghost3d" class="ef3d__spinner ef3d__spinner--ghost" :style="scene.spinner">
            <div v-for="(style, index) in scene.blades" :key="index" class="ef3d__blade" :style="style">
              <svg viewBox="-29 -90 58 80" aria-hidden="true"><path :d="BLADE_PATH" transform="skewX(-8)" /></svg>
            </div>
          </div>
          <div ref="spinner3d" class="ef3d__spinner" :style="scene.spinner">
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
