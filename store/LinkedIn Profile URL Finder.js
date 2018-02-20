// Phantombuster configuration {
"phantombuster command: nodejs"
"phantombuster package: 4"
"phantombuster dependencies: lib-StoreUtilities.js, lib-WebSearch.js"

const Buster = require("phantombuster")
const buster = new Buster()

const Nick = require("nickjs")
const nick = new Nick({
	loadImages: false,
	userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0",
	printPageErrors: false,
	printResourceErrors: false,
	printNavigation: false,
	printAborts: false,
	debug: false,
})

const StoreUtilities = require("./lib-StoreUtilities")
const WebSearch = require("./lib-WebSearch")
const utils = new StoreUtilities(nick, buster)
// }

const engines = [
	{name: "Google", baseUrl: "https://www.google.com/search?q=", selectors: {result: ".r > a"}, errorCode: 503},
	{name: "Duckduckgo", baseUrl: "https://duckduckgo.com/html/?q=", selectors: {result: "div.web-result:not(.result--no-result) h2 > a"}, errorCode: 403},
	{name: "Bing", baseUrl: "https://www.bing.com/search?q=", selectors: {result: "li.b_algo h2 > a"}, errorCode: 403},
	{name: "Ecosia", baseUrl: "https://www.ecosia.org/search?q=", selectors: {result: "div.result > a:nth-child(1)"}, errorCode: 403},
]

const scrapeLinkedinProfile = (arg, callback) => {
	const links = document.querySelectorAll(arg.selector)
	const result = []
	for (const link of links) {
		if (link.href.indexOf("linkedin.com/in/") > -1) {
			callback(null, link.href)
		}
	}
	callback(null, "no url")
}

const getSearch = async (tab, query, engine) => {
	const [httpCode] = await tab.open(engine.baseUrl + encodeURIComponent(query + " site:linkedin.com").replace(/[!'()*]/g, escape))
	if (httpCode !== 200) {
		if (httpCode === engine.errorCode) {
			throw "Limit reached for google"
		} else {
			throw `Got http code ${httpCode}`
		}
	}
	try {
		await tab.waitUntilVisible(engine.selectors.result)
		return (await tab.evaluate(scrapeLinkedinProfile, {selector: engine.selectors.result}))
	} catch (error) {
		utils.log(`Could not get results for ${query} because: ${error}`, "warning")
		return "none"
	}
}

const setNewMode = (down, engines) => {
	let choices = []
	for (var i = 0; i < engines.length; i++) {
		if (down.find(j => j === i) === undefined) {
			choices.push(i)
		}
	}
	return choices[Math.floor(Math.random() * choices.length)]
}

const getSearches = async (tab, queries) => {
	let mode = 0
	const result = []
	for (const query of queries) {
		const timeLeft = await utils.checkTimeLeft()
		if (!timeLeft.timeLeft) {
			utils.log(timeLeft.message, "warning")
			return result
		}
		if (query.length > 0) {
			let loop = true
			let enginesDown = []
			while (loop) {
				try {
					utils.log(`Searching for ${query}...`, "loading")
					const linkedinUrl = await getSearch(tab, query, engines[mode])
					result.push({linkedinUrl, query})
					utils.log(`Got ${linkedinUrl} for ${query}.`, "done")
					loop = false
				} catch (error) {
					enginesDown.push(mode)
					if (enginesDown.length === engines.length) {
						utils.log("All search engines down.", "warning")
						return result
					} else {
						// utils.log(`${engines[mode].name} failed because "${error}", changing search engine...`, "info")
						await tab.close()
						tab = await nick.newTab()
						mode = setNewMode(enginesDown, engines)
					}
				}
			}
		}
	}
	return result
}

;(async () => {
	const tab = await nick.newTab()
	const webSearch = new WebSearch(tab, buster)
	let {spreadsheetUrl, queries, columnName, csvName} = utils.validateArguments()
	if (spreadsheetUrl) {
		queries = await utils.getDataFromCsv(spreadsheetUrl, columnName)
	} else if (typeof(queries) === 'string') {
		queries = [queries]
	}

	const _queries = queries.slice(0)
	const toReturn = []
	let i = 0

	queries.forEach((el, index, arr) => arr[index] += " site:linkedin.com")

	for (const one of queries) {
		utils.log(`Searching ${_queries[i]} ...`, "loading")
		let needToContinue = true
		let j = 0
		let tmp = await webSearch.search(one)
		while (needToContinue && j < tmp.results.length) {
			if (tmp.results[j].link.indexOf("linkedin.com/in") > -1) {
				utils.log(`Got ${tmp.results[j].link} for ${_queries[i]}`, "done")
				toReturn.push({ linkedinUrl: tmp.results[j].link, query: _queries[i] })
				needToContinue = false
			}
			j++
		}
		i++
	}

	await tab.close()
	//const result = await getSearches(tab, queries)
	await utils.saveResult(toReturn, csvName)
	nick.exit()
})()
.catch(err => {
	utils.log(err, "error")
	nick.exit(1)
})
