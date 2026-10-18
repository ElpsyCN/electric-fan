<script setup lang="ts">
// Air streaks rushing out of the fan toward the viewer. They spiral with the
// blades, thin out in natural-wind lulls and swing with the head.
import { motorFrame } from '~/stores'

interface Streak {
  angle: number
  radius: number
  born: number
  life: number
  swirl: number
}

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const streaks: Streak[] = []
let frame = 0
let last = 0
let debt = 0
let color = '#06b6d4'
let frames = 0

function readColor() {
  if (canvas.value)
    color = getComputedStyle(canvas.value).color || color
}

function draw(now: number) {
  const el = canvas.value
  const ctx = el?.getContext('2d')
  const host = el?.parentElement
  if (!el || !ctx || !host) {
    frame = 0
    return
  }
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
  last = now
  if (frames++ % 60 === 0)
    readColor()

  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const box = el.getBoundingClientRect()
  if (el.width !== Math.round(box.width * dpr) || el.height !== Math.round(box.height * dpr)) {
    el.width = Math.round(box.width * dpr)
    el.height = Math.round(box.height * dpr)
  }
  const fan = host.getBoundingClientRect()
  // The fan face is the top square of the drawing.
  const cx = fan.left + fan.width / 2 - box.left
  const cy = fan.top + fan.width * 0.5 - box.top
  const reach = fan.width * 0.46

  const { ratio, facing } = motorFrame
  debt += dt * 70 * ratio
  while (debt >= 1) {
    debt -= 1
    streaks.push({
      angle: Math.random() * Math.PI * 2,
      radius: (0.2 + Math.random() * 0.75) * reach,
      born: now,
      life: (900 + Math.random() * 700) / (0.6 + ratio),
      swirl: 0.25 + Math.random() * 0.35,
    })
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, box.width, box.height)
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  const drift = Math.sin((facing * Math.PI) / 180) * fan.width * 1.1
  const point = (streak: Streak, t: number) => {
    const angle = streak.angle - streak.swirl * t
    const radius = streak.radius * (1 + 1.5 * t ** 1.4)
    return [cx + Math.cos(angle) * radius + drift * t, cy + Math.sin(angle) * radius * 0.92 + t * t * 12]
  }
  for (let i = streaks.length - 1; i >= 0; i--) {
    const streak = streaks[i]
    const t = (now - streak.born) / streak.life
    if (t >= 1) {
      streaks.splice(i, 1)
      continue
    }
    const [x0, y0] = point(streak, Math.max(0, t - 0.08))
    const [x1, y1] = point(streak, t)
    ctx.globalAlpha = Math.sin(Math.PI * t) * 0.5 * Math.min(1, 0.3 + ratio)
    ctx.lineWidth = 0.8 + 2.4 * t
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }

  if (streaks.length || ratio > 0) {
    frame = requestAnimationFrame(draw)
  }
  else {
    frame = 0
    last = 0
  }
}

/** Start drawing; the loop stops by itself once the air is still. */
function wake() {
  if (frame || typeof requestAnimationFrame !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches)
    return
  frame = requestAnimationFrame(draw)
}

onBeforeUnmount(() => cancelAnimationFrame(frame))

defineExpose({ wake })
</script>

<template>
  <canvas ref="canvas" class="fan-wind" aria-hidden="true" />
</template>

<style scoped>
.fan-wind {
  position: absolute;
  top: -45%;
  left: -70%;
  width: 240%;
  height: 165%;
  pointer-events: none;
  color: var(--accent);
  z-index: 1;
}
</style>
