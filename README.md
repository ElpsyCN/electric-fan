# electric-fan

> [Electric Fan](https://fan.elpsy.cn)

[未来道具研究所](https://elpsy.cn)

一个智障小工具

电风扇！ 为你的夏日带去清凉！

- [Web Demo](https://fan.elpsy.cn)

## Feature

### 优势

- 随时随地打开风扇
- 2D 线稿 / 3D 立体两种视图，3D 可拖动旋转视角
- 有惯性的电机：开机逐渐加速，关机滑行减速（牛顿表示满意）
- 自然风模式：风速随阵风起伏
- 摇头、定时关闭，风声音调随转速变化
- 便携
- 低功耗（使用 SVG 而非 Canvas 绘制）
- 操作简单
- 安装便捷

### 劣势

- 没有风

## Packages

仓库是 pnpm monorepo：站点在根目录，风扇能力放在可复用的包里，网页版与原生 App 共用同一套状态逻辑。

| 包 | 说明 |
| --- | --- |
| [`@yunlefun-home/electric-fan`](packages/electric-fan) | 电风扇 Vue 组件，`view="2d"`（SVG）或 `view="3d"`（CSS 3D），可用 `--fan-color` / `--fan-bg-color` / `--fan-accent` 换肤 |
| `@yunlefun-home/electric-fan/core` | 同一个包的子路径：与框架无关的风扇状态机（开关、三档风速、摇头、自然风、定时关闭）与电机模拟（`stepFanMotor`），不引入 Vue，`vue` 为可选 peer 依赖 |
| [`packages/home-plugin`](packages/home-plugin) | Yun Home 设备插件 `electric-fan.yunplugin`，在原生 App 的沙箱中运行，控件由宿主原生渲染 |

```ts
import { ElectricFan } from '@yunlefun-home/electric-fan' // Vue 组件，同时导出 core
import { fanReducer } from '@yunlefun-home/electric-fan/core' // 不依赖 Vue
import '@yunlefun-home/electric-fan/style.css'
```

```vue
<ElectricFan :level="2" oscillating natural view="3d" title="电风扇" @motor="frame => console.log(frame.ratio)" />
```

`@motor` 在风扇转动时逐帧触发，`ratio` 为当前转速占最高转速的比例（0–1），可用来驱动声音或风效。

```bash
pnpm install
pnpm dev               # 站点
pnpm build:packages    # 构建各包与 .yunplugin
pnpm test
```

推送 `v*` Tag 后，[Release 工作流](.github/workflows/release.yml) 通过 npm 可信发布（OIDC）发布 npm 包，并把 `electric-fan.yunplugin` 及其 SHA-256 上传到 GitHub Release。首次发布需在本地手动 `npm publish` 一次，再在 npmjs.com 为该包配置可信发布者（`ElpsyCN/electric-fan` · `release.yml`）。

## Intend

……这是我在小空调之前写的，因为写的太丑甚至没好意思宣传，没想到小空调意外的火了。

- [x] [空调](https://github.com/YunYouJun/air-conditioner)
- [ ] 温度计 🌡️

## About

![云游君](https://cdn.jsdelivr.net/gh/YunYouJun/cdn/img/about/white-qrcode-and-search.jpg)

## [Change Log](CHANGELOG.md)

## Dev 开发

需要 Node.js `>=22.13.0` 与 pnpm 11。

```sh
# install dependencies
pnpm install
```

```sh
# 启动
# http://localhost:3000/
pnpm dev
```

```sh
# 构建
pnpm build
```
