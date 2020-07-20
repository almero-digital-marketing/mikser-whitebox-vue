import { mapState, mapActions } from 'vuex'

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
					return window.whitebox.services.storage.link({
						file,
					})
				}
				return file
			},
		},
		created() {
			this.$load(this.documents)
		}
	}
}
