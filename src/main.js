import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'

Vue.config.productionTip = false

import VTooltip from 'v-tooltip'
Vue.use(VTooltip)

import 'element-ui/lib/theme-chalk/index.css'
import { RadioGroup, Radio, RadioButton } from 'element-ui'
Vue.use(RadioGroup)
Vue.use(Radio)
Vue.use(RadioButton)

new Vue({
  render: h => h(App),
}).$mount('#app')
