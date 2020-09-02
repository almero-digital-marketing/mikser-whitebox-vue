import Vue from 'vue'

let storageMap = {}

export default async (mikser) => {
	mikser.store.registerModule('mikser', {
		namespaced: true,
		state: {
			sitemap: {},
			initialized: false,
		},
		getters: {
			storage: () => (file) => {
				if (window.whitebox.services && window.whitebox.services.storage) {
					let link = storageMap[file]
					if (!link) {
						let data = {
							file
						}
						if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
							data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
						}
						link = window.whitebox.services.storage.link(data)
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
		},
		actions: {
			init({ commit }) {
				window.whitebox.init('feed', (feed) => {
					console.log('Feed loaded')
					window.whitebox.emmiter.on('feed.change', (change) => {
						commit('updateDocuments', change)
					})
					let data = {
						vault: 'feed',
						cache: '1h',
						query: {
							context: 'mikser',
							refId: decodeURI(window.location.pathname),
						},
					}
					if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
						data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
						data.query.context = data.query.context + '_' + data.context
					}
					feed.service.catalogs.mikser.find(data)
						.then((documents) => {
							for (let document of documents) {
								commit('assignDocument', document)
							}
							feed.service.catalogs.mikser.changes({ 
								vault: 'feed', 
								context: data.context,
								query: { 
									context: data.query.context 
								} 
							})
						})
				})
			},
			load({ commit, state }, items) {
				let loading = []
				let route = mikser.routes[decodeURI(window.location.pathname)]
				if (!state.initialized && items.length) {
					window.whitebox.init('feed', (feed) => {
						let refIds = []
						for (let item of items) {
							if (typeof item == 'string') {
								if (route) {
									refIds.push(
										...mikser.reverse[item]
										.filter((reverse) => reverse.lang == route.lang && (!state.sitemap[route.lang] || !state.sitemap[route.lang][item]))
										.map((reverse) => reverse.refId)
									)
								}
							} else {
								let data = {
									vault: 'feed',
									query: Object.assign(item, {
										context: 'mikser',
									}),
								}
								if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
									data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
									data.query.context = data.query.context + '_' + data.context
								}
								loading.push(
									feed.service.catalogs.mikser
									.find(data)
									.then((documents) => {
										for (let document of documents) {
											commit('assignDocument', document)
										}
									})
								)
							}
						}
						let data = {
							vault: 'feed',
							cache: '1h',
							query: {
								context: 'mikser',
								refId: {
									$in: refIds,
								},
							},
						}
						if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
							data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
							data.query.context = data.query.context + '_' + data.context
						}
						loading.push(
							feed.service.catalogs.mikser
								.find(data)
								.then((documents) => {
									for (let document of documents) {
										commit('assignDocument', document)
									}
								})
						)
					})
				}
				return Promise.all(loading)
			},
		},
	})
}
