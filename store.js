import Vue from 'vue'

let storageMap = {}

export default async (mikser) => {
	mikser.store.registerModule('mikser', {
		namespaced: true,
		state: {
			sitemap: {},
			loaded: false,
			initialized: false,
		},
		getters: {
			storage: () => (file) => {
				if (window.whitebox.services && window.whitebox.services.storage) {
					let link = storageMap[file]
					if (!link) {
						link = window.whitebox.services.storage.link({
							file,
						})
						storageMap[file] = link
					}
					return link
				}
				return file
			},
			alternates: (state) => (href) => {
				let documents = []
				for (let lang of state.sitemap) {
					let document = state.sitemap[lang][href]
					if (document) documents.push(document)
				}
				return documents
			},
		},
		mutations: {
			updateDocuments(state, change) {
				if (change.type == 'initializing') {
					Vue.set(state.sitemap, {})
				} else if (change.type == 'ready') {
					state.initialized = true
					console.log('Initialization time:', Date.now() - window.startTime + 'ms')
				} else if (change.type == 'initial' || change.type == 'change') {
					let document = change.new
					if (!document) return
					let href = document.data.meta.href || document.data.refId
					let lang = document.data.meta.lang || ''

					if (!state.sitemap[lang]) Vue.set(state.sitemap, lang, {})
					Vue.set(state.sitemap[lang], href, Object.freeze(document))
				}
			},
			assignDocument(state, document) {
				let href = document.data.meta.href || document.data.refId
				let lang = document.data.meta.lang || ''

				if (!state.sitemap[lang]) Vue.set(state.sitemap, lang, {})
				Vue.set(state.sitemap[lang], href, Object.freeze(document))
				console.log('Load time:', Date.now() - window.startTime + 'ms', document.refId)
			},
			finishLoading(state) {
				state.loaded = true
			}
		},
		actions: {
			init({ commit }) {
				window.whitebox.init('feed', (feed) => {
					console.log('Feed loaded')
					window.whitebox.emmiter.on('feed.change', (change) => {
						commit('updateDocuments', change)
					})
					feed.service.vaults.mikser
						.find({
							vault: 'feed',
							cache: '1h',
							query: {
								context: 'mikser',
								refId: decodeURI(window.location.pathname),
							},
						})
						.then((documents) => {
							for (let document of documents) {
								commit('assignDocument', document)
							}
							feed.service.vaults.mikser.changes({ vault: 'feed', query: { context: 'mikser' } })
						})
				})
			},
			load({ commit, state }, items) {
				if (state.initialized) return
				let { lang } = mikser.routes[decodeURI(window.location.pathname)]
				let loading = []
				if (items.length) {
					window.whitebox.init('feed', (feed) => {
						let refIds = []
						for (let item of items) {
							if (typeof item == 'string') {
								refIds.push(
									...mikser.reverse[item]
										.filter((reverse) => reverse.lang == lang && (!state.sitemap[lang] || !state.sitemap[lang][item]))
										.map((reverse) => reverse.refId)
								)
							} else {
								loading.push(
									feed.service.vaults.mikser
										.find({
											vault: 'feed',
											query: Object.assign(item, {
												context: 'mikser',
											}),
										})
										.then((documents) => {
											for (let document of documents) {
												commit('assignDocument', document)
											}
										})
								)
							}
						}
						loading.push(
							feed.service.vaults.mikser
								.find({
									vault: 'feed',
									cache: '1h',
									query: {
										context: 'mikser',
										refId: {
											$in: refIds,
										},
									},
								})
								.then((documents) => {
									for (let document of documents) {
										commit('assignDocument', document)
									}
								})
						)
					})
					Promise.all[loading].then(() => commit('finishLoading'))
				}
			},
		},
	})
}
