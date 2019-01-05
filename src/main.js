import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'

Vue.config.productionTip = false

import { RadioGroup, Radio, RadioButton } from 'element-ui'
import 'element-theme-ink'
Vue.use(RadioGroup)
Vue.use(Radio)
Vue.use(RadioButton)

import VTooltip from 'v-tooltip'
Vue.use(VTooltip)

new Vue({
  render: h => h(App),
}).$mount('#app')
