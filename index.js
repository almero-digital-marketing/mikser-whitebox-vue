import Vue from 'vue'
import mixin from './mixin'
import router from './router'
import store from './store'

export default async (mikser) => {
	await router(mikser, mikser.router)
	await store(mikser, mikser.store)
	Vue.mixin(mixin(mikser))
	return mikser
}
