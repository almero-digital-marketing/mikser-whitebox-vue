import { mapState, mapActions, mapGetters } from 'vuex'

export default (mikser) => {
	return {
		data() {
			return {
				loaded: false,
				documents: [],
			}
		},
		computed: {
			...mapState('mikser', ['sitemap']),
			...mapGetters('mikser', ['storage', 'alternates']),
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
			hrefs(regex, lang) {
				if (typeof regex == 'string') {
					regex = new RegExp(regex)
				}
				lang =
					lang ||
					(mikser.routes[this.$route.path] && mikser.routes[this.$route.path].lang) ||
					document.documentElement.lang ||
					''
				let hreflang = this.sitemap[lang]
				if (hreflang) {
					return Object.keys(mikser.reverse)
						.filter((href) => regex.test(href))
						.map((href) => {
							let document = hreflang[href]
							if (document) {
								return {
									loaded: true,
									meta: document.data.meta,
									link: document.refId,
								}
							} else {
								let reverse = mikser.reverse[href]
								let route = reverse.find((record) => record.lang == lang)
								if (route) {
									return {
										link: route.refId,
										meta: {},
									}
								}
							}
						})
						.filter((document) => document)
				}
				return []
			},
			href(href, lang) {
				lang =
					lang ||
					(mikser.routes[this.$route.path] && mikser.routes[this.$route.path].lang) ||
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
							let route = reverse.find((record) => record.lang == lang)
							if (route) {
								return {
									link: route.refId,
									meta: {},
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
		},
		created() {
			if (!this.loaded) {
				this.$load(this.documents).then(() => {
					this.loaded = true
				})
			}
		},
		metaInfo() {
			if (this.document) {
				return {
					title: this.document.meta.title,
					description: this.document.meta.description,
					meta: this.document.meta.meta,
				}
			}
		},
	}
}
