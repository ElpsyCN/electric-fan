import type { FanAction } from '@yunlefun-home/electric-fan/core'
import { cycleTimer, dispatch } from '~/stores'
import { playClick, unlockAudio } from './audio'

/** Operate the fan from a user gesture: wake the audio, click, apply. */
export function operate(action: FanAction | 'cycle-timer') {
  void unlockAudio()
  playClick()
  if (action === 'cycle-timer')
    cycleTimer()
  else
    dispatch(action)
}
