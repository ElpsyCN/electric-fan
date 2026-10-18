# CHANGELOG

## @yunlefun-home/electric-fan 0.2.0

首个发布到 npm 的版本（0.1.0 没有发布）。用法见 [包的 README](packages/electric-fan/README.md)。

### 组件 `ElectricFan`

- CSS 3D 搭建的线稿风扇，宽度跟随容器；可拖动旋转视角、双击复位（`orbit`）
- `controls`：底座琴键（关 / 1 / 2 / 3 / 自然）、定时旋钮和摇头钮可以点按，触发 `action` 事件，参数是 `FanAction`
- `ribbons`：防护罩上的三条彩带随风飘动
- `natural` 和 `autoOffAt` 属性分别驱动自然风和定时旋钮
- `motor` 事件逐帧给出叶片角度、转速、摇头角度、`ratio` 和 `facing`，并导出 `FanMotorFrame` 类型
- 用 `--fan-color`、`--fan-bg-color`、`--fan-accent` 换肤；遵循「减少动态效果」设置

### `/core`

- 状态新增 `natural` 字段，以及 `toggle-natural` / `set-natural` 动作；`fanSummary` 会显示「自然风」
- 电机模拟：`createFanMotor`、`stepFanMotor`、`fanMotorRatio`、`isFanMotorAtRest`、`fanTargetSpeed`、`naturalBreeze`，以及 `fanMaxRevsPerSecond`、`fanYawAmplitude`、`fanOscillationSeconds` 常量
- 定时：`fanTimerPresets`、`fanTimerMinutesLeft`、`nextFanTimerMinutes`

### Yun Home 插件 0.2.0

- 新增「风型」控件（直吹 / 自然风）；没有 `natural` 字段的旧状态按直吹读取

## 2026-10-19

- 防护罩上系了三条彩带：关机时垂下，风越大飘得越高，扇叶转动时抖动
- 对着风扇说话：「实时」边说边听（需戴耳机），「回放」按住录音、松开播放；声音被扇叶「切碎」，档位越高颤得越快（只在本机处理）

## 2026-10-18

- 风扇改为 CSS 3D 搭建（可拖动旋转视角、双击复位），去掉 2D 视图
- 控件做到风扇上：底座琴键（关 / 1 / 2 / 3 / 自然）、发条式定时旋钮、机头顶部摇头钮
- 电机模拟：开机按扭矩逐渐加速，关机受摩擦与风阻滑行停止 ([#8](https://github.com/ElpsyCN/electric-fan/issues/8), [#11](https://github.com/ElpsyCN/electric-fan/issues/11))
- 逐帧计算叶片角度并加入运动模糊，转动不再一卡一卡 ([#5](https://github.com/ElpsyCN/electric-fan/issues/5))
- 自然风模式 ([#7](https://github.com/ElpsyCN/electric-fan/issues/7))，Yun Home 插件同步支持
- 摇头由电机齿轮带动，关机后停在原位；新增风力表与键盘快捷键
- 页脚改为可折叠的「使用说明书」：部件说明、常见问题、安全须知、售后服务与保修卡
- 风声改用 Web Audio 无缝循环，音量与音调随转速变化；风流粒子随摇头方向飘散

## 2019-02-19

- transfer to [ElpsyCN](https://github.com/elpsycn)

## 2019-01-05

- remove miniprogram
- add fan sound effect
