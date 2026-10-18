<script setup lang="ts">
import type { FanMotorFrame } from '@yunlefun-home/electric-fan'
import { ElectricFan } from '@yunlefun-home/electric-fan'
import { setHumLevel } from '~/composables'
import { fanState, level, motorFrame, view, windRatio } from '~/stores'
import '@yunlefun-home/electric-fan/style.css'

const wind = useTemplateRef<{ wake: () => void }>('wind')
let sampledAt = 0

function onMotor(frame: FanMotorFrame) {
  motorFrame.speed = frame.speed
  motorFrame.ratio = frame.ratio
  motorFrame.yaw = frame.yaw
  motorFrame.facing = frame.facing
  wind.value?.wake()
  // Sound and UI only need a dozen updates a second.
  const now = performance.now()
  if (now - sampledAt > 80 || frame.ratio === 0) {
    sampledAt = now
    windRatio.value = Math.round(frame.ratio * 1000) / 1000
    setHumLevel(frame.ratio)
  }
}
</script>

<template>
  <section class="stage" :class="`stage--${view}`">
    <div class="stage__fan">
      <FanWind ref="wind" />
      <ElectricFan
        :level="level"
        :oscillating="fanState.oscillating"
        :natural="fanState.natural"
        :view="view"
        title="电风扇"
        @motor="onMotor"
      />
    </div>
    <Transition name="fade">
      <p v-if="view === '3d'" class="stage__hint">
        <i-carbon-drag-horizontal aria-hidden="true" /> 拖动旋转视角 · 双击复位
      </p>
    </Transition>
  </section>
</template>

<style lang="scss">
.stage {
  position: relative;
  padding: 1.5rem 0 0.5rem;
}

.stage__fan {
  position: relative;
  width: min(250px, 64vw);
  margin: 0 auto;

  .electric-fan {
    position: relative;
    z-index: 0;
  }
}

.stage--3d .stage__fan {
  width: min(280px, 72vw);
}

.stage__hint {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.75rem 0 0;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  color: var(--muted);
}
</style>
