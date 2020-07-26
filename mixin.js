import { mapState, mapActions } from 'vuex'

let storageMap = {}

export default (mikser) => {
	return {
		data() {
			return {
				documents: []
			}
		},
		computed: {
			...mapState('mikser', ['loaded', 'sitemap']),
			document() {
				let route = mikser.routes[this.$route.path]
				if (!route) return
				let document = this.href(route.href, route.lang)
				return document
			},
		},
		methods: {
			...mapActions({
				$init: 'mikser/init',
				$load: 'mikser/load',
			}),
			href(href, lang) {
				lang =
					lang ||
					(mikser.routes[this.$route.path] &&
						mikser.routes[this.$route.path].lang) ||
						document.documentElement.lang ||
						''
						let hreflang = this.sitemap[lang]
						if (hreflang) {
							let document = hreflang[href]
							if (document) {
								return {
									meta: document.data.meta,
									link: document.refId,
								} 
							} else {
								let reverse = mikser.reverse[href]
								if (reverse) {
									let route = reverse.find(record => record.lang == lang)
									if (route) {
										return {
											link: route.refId,
											meta: {}
										}
									}
								}
							}
				}
				return {
					meta: {},
					link: '/' + lang + href,
				}
			},
			alternates(href) {
				let documents = []
				for (let lang of this.sitemap) {
					let document = this.sitemap[lang][href]
					if (document) documents.push(document)
				}
				return documents
			},
			storage(file) {
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
		},
		created() {
			this.$load(this.documents)
		},
		metaInfo() {
			if (this.document) {
				return {
					title: this.document.meta.title,
					description: this.document.meta.description,
					meta: this.document.meta.meta
				}
			}
		}
	}
}
