import { reactive } from 'vue'
export const store = {
  debug: true,

  state: reactive({
    /**
     * 风力级别
     */
    level: 0,
  }),

  setLevel(value: number) {
    this.state.level = value
  },
}
