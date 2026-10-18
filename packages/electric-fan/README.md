# @yunlefun-home/electric-fan

> 夏日清凉小风扇：一台用 CSS 3D 搭出来的电风扇 Vue 组件，外加与框架无关的风扇状态机和电机模拟。

[在线体验](https://fan.yunle.fun) · [GitHub](https://github.com/ElpsyCN/electric-fan)

- **CSS 3D 风扇**：线稿风格，可拖动旋转视角、双击复位，不需要 WebGL
- **像真风扇一样操作**：底座琴键调风速、发条式定时旋钮、机头顶部摇头钮
- **有惯性的电机**：开机逐渐加速，关机滑行停下；自然风模式下风速随阵风起伏
- **`/core` 子路径**：状态机与电机模拟不依赖 Vue，网页、原生 App 与 [Yun Home](https://github.com/ElpsyCN/electric-fan/tree/master/packages/home-plugin) 插件共用

## 安装

```bash
pnpm add @yunlefun-home/electric-fan
```

使用 Vue 组件需要 `vue >= 3.5`；只用 `/core` 时不需要 Vue。

## 组件

把风扇状态交给 `fanReducer` 管理，组件只负责显示和把用户操作作为 `action` 抛出来：

```vue
<script setup lang="ts">
import type { FanAction } from '@yunlefun-home/electric-fan'
import { createFanState, ElectricFan, expireFanTimer, fanLevel, fanReducer } from '@yunlefun-home/electric-fan'
import { onBeforeUnmount, shallowRef } from 'vue'
import '@yunlefun-home/electric-fan/style.css'

const fan = shallowRef(createFanState())

function dispatch(action: FanAction) {
  fan.value = fanReducer(fan.value, action)
}

// 定时关闭需要宿主按时钟检查
const clock = setInterval(() => fan.value = expireFanTimer(fan.value), 1000)
onBeforeUnmount(() => clearInterval(clock))
</script>

<template>
  <ElectricFan
    :level="fanLevel(fan)"
    :oscillating="fan.oscillating"
    :natural="fan.natural"
    :auto-off-at="fan.autoOffAt"
    controls
    ribbons
    title="电风扇"
    @action="dispatch"
  />
</template>
```

组件宽度跟随容器，高宽比固定为 240 : 312。

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `level` | `0 \| 1 \| 2 \| 3` | `0` | 0 为关闭，1–3 为风速 |
| `oscillating` | `boolean` | `false` | 摇头 |
| `natural` | `boolean` | `false` | 自然风：风速随阵风起伏 |
| `autoOffAt` | `string \| null` | `null` | 定时关闭的 ISO 时间，用来转动定时旋钮 |
| `controls` | `boolean` | `false` | 让琴键、定时旋钮和摇头钮可以点按 |
| `ribbons` | `boolean` | `false` | 在防护罩上系三条随风飘动的彩带 |
| `orbit` | `boolean` | `true` | 允许拖动旋转视角 |
| `title` | `string` | `''` | 无障碍名称；为空时作为装饰元素对辅助技术隐藏 |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `action` | `FanAction` | 点按风扇上的控件时触发（需开启 `controls`），可以直接交给 `fanReducer` |
| `motor` | `FanMotorFrame` | 风扇转动时逐帧触发：叶片角度、转速、摇头角度，`ratio` 为转速占最高转速的比例（0–1），`facing` 为风吹向的屏幕方向（度） |

`motor` 适合用来驱动声音、风效或风力表；停稳后不再触发。

### 控件

| 控件 | 位置 | 动作 |
| --- | --- | --- |
| 琴键 关 / 1 / 2 / 3 | 底座前沿 | `set-level`；「关」按下后回弹，1–3 互斥锁定 |
| 琴键 自然 | 底座前沿 | `toggle-natural` |
| 定时旋钮 | 底座右侧 | `set-timer`，依次切换 30 分钟、1 小时、2 小时、不定时；随剩余时间转回零位 |
| 摇头钮 | 机头顶部 | `toggle-oscillation`；拔起表示摇头，按下表示定向 |

控件都是真实的 `<button>`，带 `aria-label` 和 `aria-pressed`，可以用键盘聚焦。拖动风扇空白处旋转视角，双击复位。

### 换肤

在任意祖先元素上设置 CSS 变量：

```css
.my-fan {
  --fan-color: #2a2f35; /* 线条与机身 */
  --fan-bg-color: #fff; /* 叶片、琴键等填充 */
  --fan-accent: #06b6d4; /* 按下的琴键、运转指示 */
}
```

深色模式下把前两个颜色对调即可。光影是叠加的半透明暗色，两种主题都适用。

### 浏览器要求

需要支持 CSS 3D 变换、容器查询单位（`cqw`）和 `color-mix()`：Chrome / Edge 111+、Safari 16.2+、Firefox 113+。开启「减少动态效果」时，叶片、摇头和彩带保持静止。

## `/core`：状态机与电机模拟

`@yunlefun-home/electric-fan/core` 不引入 Vue，可以在任何 JavaScript 环境中运行（包括 Yun Home 的沙箱）。

### 状态

```ts
import { createFanState, fanReducer, fanSummary, isFanAction, normalizeFanState } from '@yunlefun-home/electric-fan/core'

let state = createFanState()
state = fanReducer(state, { type: 'set-level', level: 2 })
state = fanReducer(state, { type: 'toggle-natural' })
fanSummary(state) // "2 档 · 定向 · 自然风"

// 处理不可信输入（存储、网络）
const restored = normalizeFanState(JSON.parse(saved))
if (isFanAction(message))
  state = fanReducer(restored, message)
```

`FanState` 包含 `power`、`speed`（1–3）、`oscillating`、`natural`、`autoOffAt` 和 `stateChangedAt`。支持的动作：

| 动作 | 说明 |
| --- | --- |
| `{ type: 'toggle' }` | 开关电源 |
| `{ type: 'set-level', level }` | 前面板档位：0 关闭，1–3 以该档开启 |
| `{ type: 'set-speed', speed }` | 设置风速并开启 |
| `{ type: 'toggle-oscillation' }` / `{ type: 'set-oscillation', oscillating }` | 摇头 |
| `{ type: 'toggle-natural' }` / `{ type: 'set-natural', natural }` | 自然风 |
| `{ type: 'set-timer', minutes }` | 定时关闭，`null` 取消，最长 1440 分钟 |

定时相关：`expireFanTimer` 在到点后关机，`fanTimerMinutesLeft` 返回剩余分钟，`nextFanTimerMinutes` 返回定时预设 `fanTimerPresets` 中的下一档。

### 电机

`stepFanMotor` 是纯函数，按经过的时间推进叶片和机头：开机时按扭矩逐渐加速（约 2.5 秒到达目标转速），关机后受轴承摩擦和风阻（∝ω²）滑行，三档约 6 秒停稳；摇头由电机齿轮带动，关机后停在原位。与帧率无关，后台标签页回来时会补算长时间间隔。

```ts
import { createFanMotor, fanMotorRatio, isFanMotorAtRest, stepFanMotor } from '@yunlefun-home/electric-fan/core'

let motor = createFanMotor()
let last = performance.now()

function frame(now: number) {
  motor = stepFanMotor(motor, { level: 3, oscillating: true, natural: false, time: now / 1000 }, (now - last) / 1000)
  last = now
  draw(motor.angle, motor.yaw, fanMotorRatio(motor))
  if (!isFanMotorAtRest(motor, 3))
    requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
```

还导出了 `naturalBreeze`（自然风的阵风系数）、`fanTargetSpeed`、`fanMaxRevsPerSecond`、`fanYawAmplitude` 和 `fanOscillationSeconds`。

## License

[MIT](https://github.com/ElpsyCN/electric-fan/blob/master/LICENSE) © [YunYouJun](https://www.yunyoujun.cn)
