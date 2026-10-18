# CHANGELOG

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
