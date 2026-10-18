<script setup lang="ts">
import type { FanMotorFrame } from '@yunlefun-home/electric-fan'
import { ElectricFan } from '@yunlefun-home/electric-fan'
import { operate, setHumLevel } from '~/composables'
import { fanState, level, motorFrame, windRatio } from '~/stores'
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
  <section class="stage">
    <div class="stage__fan">
      <FanWind ref="wind" />
      <ElectricFan
        :level="level"
        :oscillating="fanState.oscillating"
        :natural="fanState.natural"
        :auto-off-at="fanState.autoOffAt"
        controls
        title="电风扇"
        @action="operate"
        @motor="onMotor"
      />
    </div>
    <p class="stage__hint">
      按底座琴键调风速 · 拧右侧旋钮定时 · 按机头顶钮摇头
      <br>
      <i-carbon-drag-horizontal aria-hidden="true" /> 拖动空白处旋转视角 · 双击复位
    </p>
  </section>
</template>

<style lang="scss">
.stage {
  position: relative;
  padding: 1.5rem 0 0.5rem;
}

.stage__fan {
  position: relative;
  width: min(320px, 84vw);
  margin: 0 auto;

  .electric-fan {
    position: relative;
    z-index: 0;
  }
}

.stage__hint {
  margin: 1.75rem 0 0;
  font-size: 0.75rem;
  line-height: 1.8;
  letter-spacing: 0.04em;
  color: var(--muted);

  svg { vertical-align: -0.15em; }
}
</style>
