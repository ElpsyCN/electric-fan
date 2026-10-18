import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { electricFanPlugin as plugin } from '../src/plugin'

const controls = JSON.parse(readFileSync(new URL('../plugin/controls.json', import.meta.url), 'utf8'))

describe('electric fan home plugin', () => {
  it('drives the shared state machine', () => {
    let state = plugin.create()
    state = plugin.reduce(state, { type: 'set-speed', speed: 2 })
    state = plugin.reduce(state, { type: 'set-oscillation', oscillating: true })
    expect(state).toMatchObject({ power: true, speed: 2, oscillating: true })
    expect(plugin.present(state)).toEqual({ active: true, tone: 'active', summary: '2 档 · 摇头' })
    state = plugin.reduce(state, { type: 'set-natural', natural: true })
    expect(plugin.present(state).summary).toBe('2 档 · 摇头 · 自然风')
  })

  it('reads states saved before natural wind existed', () => {
    const { natural: _, ...legacy } = plugin.create()
    expect(plugin.normalize(legacy).natural).toBe(false)
  })

  it('applies expired timers when read', () => {
    const expired = { ...plugin.reduce(plugin.create(), { type: 'toggle' }), autoOffAt: '2000-01-01T00:00:00.000Z' }
    expect(plugin.normalize(expired)).toMatchObject({ power: false, autoOffAt: null })
  })

  it('only declares actions the plugin accepts', () => {
    const actions = controls.controls.flatMap((control: Record<string, any>) => [control.action, ...(control.options ?? []).map((option: Record<string, unknown>) => option.action)]).filter(Boolean)
    expect(actions.length).toBe(8)
    for (const action of actions)
      expect(plugin.isAction(action)).toBe(true)
  })

  it('evaluates as a self-contained script without host APIs', () => {
    let source: string
    try {
      source = readFileSync(new URL('../dist/state.iife.js', import.meta.url), 'utf8')
    }
    catch {
      return
    }
    const sandbox: Record<string, any> = {}
    sandbox.globalThis = sandbox
    runInNewContext(source, sandbox)
    expect(sandbox.plugin.present(sandbox.plugin.create())).toEqual({ active: false, tone: 'idle', summary: '已关闭' })
  })
})
