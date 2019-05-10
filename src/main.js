import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'

import VTooltip from 'v-tooltip'

import 'element-ui/lib/theme-chalk/index.css'
import { RadioGroup, Radio, RadioButton } from 'element-ui'

Vue.config.productionTip = false
Vue.use(VTooltip)
Vue.use(RadioGroup)
Vue.use(Radio)
Vue.use(RadioButton)

new Vue({
  render: h => h(App)
}).$mount('#app')
