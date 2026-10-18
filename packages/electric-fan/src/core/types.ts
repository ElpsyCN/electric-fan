export type FanSpeed = 1 | 2 | 3

/** Speed with 0 meaning off, as on the fan's front switch. */
export type FanLevel = 0 | FanSpeed

export interface FanState {
  power: boolean
  speed: FanSpeed
  oscillating: boolean
  /** Natural wind: speed drifts in gusts instead of blowing steadily */
  natural: boolean
  /** ISO timestamp when the fan turns itself off, or `null` */
  autoOffAt: string | null
  /** ISO timestamp of the last change */
  stateChangedAt: string
}

export type FanAction
  = | { type: 'toggle' }
    | { type: 'set-speed', speed: FanSpeed }
    | { type: 'toggle-oscillation' }
    | { type: 'set-timer', minutes: number | null }
  /** Front-switch level: 0 turns the fan off, 1–3 turn it on at that speed */
    | { type: 'set-level', level: FanLevel }
    | { type: 'set-oscillation', oscillating: boolean }
    | { type: 'toggle-natural' }
    | { type: 'set-natural', natural: boolean }

/** Visual tone used by hosts: `active` while running. */
export type FanTone = 'idle' | 'active'
