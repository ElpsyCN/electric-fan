<script setup lang="ts">
// The footer as the fan's paper manual: folded shut by default, it unfolds
// to explain the controls, answer the issues people filed, and list where to
// get after-sales service.
import { version } from '../../packages/electric-fan/package.json'

const open = shallowRef(false)
const year = new Date().getFullYear()

const sponsors = 'https://sponsors.yunyoujun.cn'
const issues = 'https://github.com/ElpsyCN/electric-fan/issues'

const parts = [
  { name: '琴键', text: '关 / 1 / 2 / 3 调风速，「自然」键开关自然风。' },
  { name: '定时旋钮', text: '每拧一下：30 分钟 → 1 小时 → 2 小时 → 不定时，随时间慢慢转回零位。' },
  { name: '摇头钮', text: '在机头顶部，拔起摇头，按下定向。' },
  { name: '彩带', text: '系在防护罩上，风越大飘得越高。' },
  { name: '视角', text: '拖动风扇空白处旋转，双击复位。' },
]

const faqs = [
  { q: '感觉不到风？', a: '本产品为云风扇，风力主要依靠想象。请心静，自然凉。' },
  { q: '为什么一开机不是最大风？', a: '电机有惯性，约 2.5 秒才能达到额定转速。', issue: 8 },
  { q: '关机后扇叶还在转？', a: '牛顿第一定律。扇叶受摩擦与风阻，约 6 秒后停稳。', issue: 11 },
  { q: '直吹不舒服？', a: '按下「自然」键，风会忽大忽小，像窗外吹进来的一样。', issue: 7 },
  { q: '能对着风扇说话吗？', a: '开风扇后按住「按住说话」喊一声「啊——」，松开就能听到被扇叶切碎的声音。档位越高切得越快。录音只在本机处理，不会上传。' },
]

const services = [
  { label: 'GitHub: YunYouJun', href: 'https://github.com/YunYouJun', icon: 'github' },
  { label: 'Telegram Channel', href: 'https://t.me/elpsycn', icon: 'telegram' },
  { label: '微博：机智的云游君', href: 'http://weibo.com/jizhideyunyoujun', icon: 'weibo' },
  { label: 'X: YunYouJun', href: 'https://twitter.com/YunYouJun', icon: 'x' },
  { label: '微信公众号：云游君', href: 'https://cdn.jsdelivr.net/gh/YunYouJun/cdn/img/about/white-qrcode-and-search.jpg', icon: 'wechat' },
  { label: 'Bilibili：云游君Official', href: 'https://space.bilibili.com/1579790', icon: 'bilibili' },
  { label: '博客：yunyoujun.cn', href: 'https://www.yunyoujun.cn', icon: 'blog' },
] as const
</script>

<template>
  <footer class="manual-wrap">
    <section class="manual" :class="{ 'is-open': open }">
      <button
        class="manual__cover"
        type="button"
        :aria-expanded="open"
        aria-controls="fan-manual"
        @click="open = !open"
      >
        <i-ri-book-open-line aria-hidden="true" />
        <span class="manual__title">使用说明书</span>
        <span class="manual__en">MANUAL</span>
        <i-ri-arrow-down-s-line class="manual__chevron" aria-hidden="true" />
      </button>

      <div id="fan-manual" class="manual__fold" :inert="open ? undefined : true">
        <div class="manual__page">
          <header class="manual__head">
            <div>
              <strong>Elpsy Electric Fan</strong>
              <span>夏日清凉小风扇 · 使用说明书</span>
            </div>
            <div class="manual__model">
              <span>型号</span>
              <code>EF-{{ version }}</code>
            </div>
          </header>

          <section class="manual__section">
            <h4><span class="manual__no">1</span>各部件说明</h4>
            <dl class="manual__parts">
              <template v-for="part in parts" :key="part.name">
                <dt>{{ part.name }}</dt>
                <dd>{{ part.text }}</dd>
              </template>
            </dl>
            <p class="manual__keys">
              键盘：<kbd>0</kbd>–<kbd>3</kbd> 风速 · <kbd>N</kbd> 自然风 · <kbd>O</kbd> 摇头 · <kbd>T</kbd> 定时 · 按住 <kbd>V</kbd> 说话 · <kbd>M</kbd> 静音
            </p>
          </section>

          <section class="manual__section">
            <h4><span class="manual__no">2</span>常见问题</h4>
            <dl class="manual__faq">
              <template v-for="faq in faqs" :key="faq.q">
                <dt><span>Q</span>{{ faq.q }}</dt>
                <dd>
                  <span>A</span>{{ faq.a }}
                  <a v-if="faq.issue" class="manual__issue" :href="`${issues}/${faq.issue}`" target="_blank" rel="noopener">#{{ faq.issue }}</a>
                </dd>
              </template>
              <dt><span>Q</span>会产生电费吗？</dt>
              <dd>
                <span>A</span>不会。本机电费由<a :href="sponsors" target="_blank" rel="noopener">赞助者</a>承担 💰
              </dd>
              <dt><span>Q</span>出现故障？</dt>
              <dd>
                <span>A</span>请先关机再开机（万能方法），仍无效请<a :href="issues" target="_blank" rel="noopener">提交工单</a>。
              </dd>
            </dl>
          </section>

          <section class="manual__section">
            <h4><span class="manual__no">3</span>安全须知</h4>
            <ol class="manual__safety">
              <li>请勿将手指伸入防护罩。虽然伸进去也没事。</li>
              <li>本产品不含风，如感到凉爽，属正常心理现象。</li>
              <li>同系列产品<a href="https://ac.yunyoujun.cn" target="_blank" rel="noopener">便携小空调</a>与本机同时使用，凉爽效果不叠加。</li>
            </ol>
          </section>

          <section class="manual__section">
            <h4><span class="manual__no">4</span>售后服务</h4>
            <div class="manual__services">
              <a v-for="service in services" :key="service.icon" :href="service.href" target="_blank" rel="noopener" :aria-label="service.label" :title="service.label">
                <i-ri-github-line v-if="service.icon === 'github'" />
                <i-ri-telegram-line v-else-if="service.icon === 'telegram'" />
                <i-ri-weibo-line v-else-if="service.icon === 'weibo'" />
                <i-ri-twitter-x-line v-else-if="service.icon === 'x'" />
                <i-ri-wechat-line v-else-if="service.icon === 'wechat'" />
                <i-ri-bilibili-line v-else-if="service.icon === 'bilibili'" />
                <i-ri-global-line v-else />
              </a>
              <a class="manual__sponsor" :href="sponsors" target="_blank" rel="noopener">
                <i-ri-cup-line aria-hidden="true" /> 赞助电费
              </a>
            </div>
          </section>

          <div class="manual__warranty">
            <span>保修卡</span>
            <span>保修期：永久</span>
            <span>保修范围：不含风</span>
          </div>
          <p class="manual__keep">
            请妥善保管本说明书
          </p>
        </div>
      </div>
    </section>

    <p class="copyright">
      © 2019 – {{ year }}
      <a href="https://www.yunyoujun.cn" target="_blank" rel="noopener">云游君</a>
      ·
      <a href="https://elpsy.cn" target="_blank" rel="noopener">未来道具研究所</a>
    </p>
  </footer>
</template>

<style lang="scss">
.manual-wrap {
  margin: 2.5rem auto 0;
  padding-bottom: 1.5rem;
}

.manual {
  --paper: #fbfaf5;
  --ink: var(--text);
  --rule: rgb(42 47 53 / 0.14);

  width: min(26rem, 100%);
  margin: 0 auto;
  text-align: left;
  border: 1px solid var(--rule);
  border-left: 4px solid var(--fan-color);
  border-radius: 0.5rem;
  background: var(--paper);
  color: var(--ink);
  box-shadow: 0 1px 0 var(--rule), 0 12px 24px -20px rgb(0 0 0 / 0.5);
  perspective: 900px;
}

html.dark .manual {
  --paper: #1c2025;
  --rule: rgb(238 242 244 / 0.12);
}

.manual__cover {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    border-radius: 0.4rem;
  }
}

.manual__title {
  font-weight: 700;
  letter-spacing: 0.08em;
}

.manual__en {
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  color: var(--muted);
}

.manual__chevron {
  margin-left: auto;
  color: var(--muted);
  transition: transform 0.35s;

  .is-open & { transform: rotate(180deg); }
}

// Unfolds like paper: the height opens while the page swings down from its crease.
.manual__fold {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);

  .is-open & { grid-template-rows: 1fr; }
}

.manual__page {
  min-height: 0;
  overflow: hidden;
  padding: 0 0.9rem;
  font-size: 0.8rem;
  line-height: 1.65;
  opacity: 0;
  transform: rotateX(-20deg);
  transform-origin: top;
  transition: opacity 0.3s, transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), padding 0.45s;

  .is-open & {
    padding-bottom: 0.9rem;
    opacity: 1;
    transform: none;
  }

  a {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-underline-offset: 2px;

    &:hover { color: var(--accent); }
  }
}

.manual__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0 0.7rem;
  border-top: 1px dashed var(--rule);
  border-bottom: 2px solid var(--rule);

  strong,
  span { display: block; }

  span {
    font-size: 0.75rem;
    color: var(--muted);
  }
}

.manual__model {
  text-align: right;

  code {
    font-size: 0.75rem;
    letter-spacing: 0.05em;
  }
}

.manual__section {
  padding: 0.75rem 0;
  border-bottom: 1px dashed var(--rule);

  h4 {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0 0 0.4rem;
    font-size: 0.85rem;
  }

  dl,
  ol { margin: 0; }
}

.manual__no {
  display: inline-grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  font-size: 0.7rem;
  font-family: ui-monospace, monospace;
}

.manual__parts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.15rem 0.75rem;

  dt { font-weight: 700; }
  dd { margin: 0; color: var(--muted); }
}

.manual__keys {
  margin: 0.5rem 0 0;
  color: var(--muted);

  kbd {
    display: inline-block;
    min-width: 1.4em;
    padding: 0 0.3em;
    border: 1px solid var(--rule);
    border-bottom-width: 2px;
    border-radius: 0.3em;
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
    line-height: 1.4;
    text-align: center;
    color: var(--ink);
  }
}

@media (hover: none) {
  .manual__keys { display: none; }
}

.manual__faq {
  dt {
    margin-top: 0.35rem;
    font-weight: 700;
  }

  dd {
    margin: 0;
    color: var(--muted);
  }

  dt > span,
  dd > span:first-child {
    display: inline-block;
    width: 1.1em;
    font-family: ui-monospace, monospace;
    font-weight: 400;
    color: var(--muted);
  }

  .manual__issue { margin-left: 0.25rem; font-size: 0.75em; }
}

.manual__safety {
  padding-left: 1.2rem;
  color: var(--muted);
}

.manual__services {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;

  a {
    display: inline-grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    font-size: 1.05rem;
    text-decoration: none;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background: var(--rule);
      color: var(--accent);
    }
  }

  .manual__sponsor {
    display: inline-flex;
    gap: 0.3rem;
    width: auto;
    margin-left: auto;
    padding: 0 0.75rem;
    border: 1px solid var(--rule);
    border-radius: 999px;
    font-size: 0.75rem;
  }
}

.manual__warranty {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px dashed var(--rule);
  border-radius: 0.35rem;
  font-size: 0.75rem;
  color: var(--muted);

  span:first-child {
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.1em;
  }
}

.manual__keep {
  margin: 0.75rem 0 0;
  text-align: center;
  font-size: 0.7rem;
  letter-spacing: 0.4em;
  color: var(--muted);
}

.copyright {
  margin: 1rem 0 0;
  font-size: 0.75rem;
  color: var(--muted);

  a {
    color: inherit;
    text-decoration: none;

    &:hover { color: var(--accent); }
  }
}

@media (prefers-reduced-motion: reduce) {
  .manual__fold,
  .manual__page,
  .manual__chevron { transition: none; }
}
</style>
