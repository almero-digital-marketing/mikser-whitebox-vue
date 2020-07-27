export default async (mikser) => {
	let components = {}
	for (let route of mikser.router.options.routes) {
		components[route.name] = route.component
	}
	
	mikser.router.beforeEach((to, from, next) => {
		document.documentElement.lang =
			to.params.lang || document.documentElement.lang
		next()
	})
	
	mikser.router.afterEach((to) => {
		window.whitebox.init('analytics', analytics => {
			if (analytics) {
				setTimeout(() => {
					console.log('Track route:', to.path)
					analytics.service.info()
				}, 100)
			}
		})
	})

	mikser.routes = {}
	mikser.reverse = {}
	return new Promise((resolve, reject) => {
		window.whitebox.init('feed', (feed) => {
			feed.service.vaults.mikser
				.find({
					vault: 'feed',
					query: { context: 'mikser' },
					projection: {
						'data.meta.layout': 1,
						refId: 1,
						'data.meta.href': 1,
						'data.meta.lang': 1,
						'data.meta.type': 1,
					},
					cache: '1h',
				})
				.then((documents) => {
					mikser.stamp = Date.now()
					let routes = documents.map((document) => {
						mikser.routes[document.refId] = {
							lang: document.data.meta.lang,
							href: document.data.meta.href,
						}
						mikser.reverse[document.data.meta.href] = mikser.reverse[document.data.meta.href] || []
						mikser.reverse[document.data.meta.href].push({ 
							refId: document.refId,
							lang: document.data.meta.lang
						})
						
						return {
							path: document.refId,
							component: components[document.data.meta.layout],
							alias: '/' + document.data.meta.lang + document.data.meta.href,
							props: mikser.routes[document.refId],
						}
					})
					console.log('Routes:', routes.length, Date.now() - window.startTime + 'ms')
					mikser.router.addRoutes(routes)
					resolve()
				})
				.catch(reject)
		})
	})
}
