// Phantombuster configuration {
"phantombuster command: nodejs"
"phantombuster package: 4"
"phantombuster dependencies: lib-StoreUtilities.js, lib-LinkedIn.js"

const Buster = require("phantombuster")
const buster = new Buster()

const Nick = require("nickjs")
const nick = new Nick({
	loadImages: true,
	userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0",
	printPageErrors: false,
	printResourceErrors: false,
	printNavigation: false,
	printAborts: false,
	debug: false,
})

const StoreUtilities = require("./lib-StoreUtilities")
const utils = new StoreUtilities(nick, buster)
const LinkedIn = require("./lib-LinkedIn")
const linkedIn = new LinkedIn(nick, buster, utils)
// }

// Full scroll the LinkedIn Profile
/**
 * NOTE: Slowly but surely loading all sections of the profile
 */
const fullScroll = async tab => {
	await tab.scroll(0, 1000)
	await tab.wait(2000)
	await tab.scroll(0, 2000)
	await tab.wait(2000)
	await tab.scroll(0, 3000)
	await tab.wait(2000)
	await tab.scroll(0, 4000)
	await tab.wait(2000)
	await tab.scrollToBottom()
	await tab.wait(2000)
}

// Load all data hidden behind "load more" buttons
const loadAllData = async tab => {
	/**
	 * Selectors:
	 * - Description section
	 * - Jobs section
	 * - Skills section (CSS selector)
	 * - Skills section (alternative CSS selector)
	 * - Details section
	 */
	const buttons = [
		{ selector: ".pv-profile-section button.pv-top-card-section__summary-toggle-button", data: "Description" },
		{ selector: ".pv-profile-section__actions-inline button.pv-profile-section__see-more-inline", data: "Jobs" },
		{ selector: ".pv-profile-section.pv-featured-skills-section button.pv-skills-section__additional-skills", data: "Skills" },
		{ selector: "button.contact-see-more-less", data: "Details" },
	]
	for (const button of buttons) {
		const visible = await tab.isVisible(button.selector)
		if (visible) {
			try {
				await tab.click(button.selector)
				await tab.wait(2500)
			} catch (error) {}
		}
	}
	await tab.scroll(0, 0)
}

// Function executed in the browser to get all data from the profile
const scrapeInfos = (arg, callback) => {
	// Generic function to get infos from a selector and check if this selector exists
	const getInfos = (infos, selector) => {
		if (!selector) {
			selector = document
		}
		const result = {}
		for (const info of infos) {
			if (selector.querySelector(info.selector) && selector.querySelector(info.selector)[info.attribute]) {
				result[info.key] = selector.querySelector(info.selector)[info.attribute].trim()
			} else if (selector.querySelector(info.selector) && selector.querySelector(info.selector).getAttribute(info.attribute)) {
				result[info.key] = selector.querySelector(info.selector).getAttribute(info.attribute).trim()
			} else if (selector.querySelector(info.selector) && selector.querySelector(info.selector).style[info.style]) {
				/**
				 * NOTE: this workflow is used to get CSS styles values
				 * For now it's used when we need to scrape background-image
				 * we remove those parts of the result string: url(" & ")
				 */
				result[info.key] = selector.querySelector(info.selector)
										   .style[info.style]
										   .trim()
										   .replace('url(\"', '')
										   .replace('\")', '')
			}
		}
		return result
	}
	// Generic function to get a list of selectors and check if they exist
	const getListInfos = (list, tab) => {
		const result = []
		for (const item of list) {
			result.push(getInfos(tab, item))
		}
		return result
	}
	const infos = {}
	if (document.querySelector(".pv-profile-section.pv-top-card-section")) {
		const topCard = document.querySelector(".pv-profile-section.pv-top-card-section")
		// Get primary infos
		infos.general = getInfos([
			/**
			 * NOTE: we need to pass an array for the imgUrl, because
			 * CSS selectors changes depending of 2 followed situations:
			 * 1 - if you look YOUR linkedIn profile with YOUR li_at cookie: it will be .pv-top-card-section__profile-photo-container img
			 * 2 - if you look SOMEONE ELSE linkedIn profile with YOUR li_at cookie: it will be .presence-entity__image
			 */
			 /**
			  * NOTE: various field is an object depending what you need to get
			  */
			{ key: "imgUrl", style: "backgroundImage", selector: ".presence-entity__image" },
			{ key: "imgUrl", attribute: "src", selector: ".profile-photo-edit__preview" },
			{ key: "fullName", attribute: "textContent", selector: ".pv-top-card-section__name" },
			{ key: "fullName", attribute: "aria-label", selector: "div.presence-entity__image" },
			{ key: "hasAccount", attribute: "textContent", selector: ".pv-member-badge .visually-hidden" },
			{ key: "headline", attribute: "textContent", selector: ".pv-top-card-section__headline" },
			{ key: "company", attribute: "textContent", selector: ".pv-top-card-section__company"},
			{ key: "school", attribute: "textContent", selector: ".pv-top-card-section__school"},
			{ key: "location", attribute: "textContent", selector: ".pv-top-card-section__location"},
			{ key: "connections", attribute: "textContent", selector: ".pv-top-card-section__connections > span"},
			{ key: "description", attribute: "textContent", selector: ".pv-top-card-section__summary-text"},
		])
		// Get subscribers count
		if (document.querySelector("div.pv-profile-section.pv-recent-activity-section")) {
			/**
			 * BUG: issue #12 Cannot read property 'textContent' of null
			 * NOTE: This selector is not always available, the script should test before accessing data from the selector
			 */
			if (document.querySelector("div.pv-profile-section.pv-recent-activity-section h3.pv-recent-activity-section__follower-count > span")) {
				const subscribersText = document.querySelector("div.pv-profile-section.pv-recent-activity-section h3.pv-recent-activity-section__follower-count > span").textContent.trim().replace(/\,/g, "").replace(/\./g, "").replace(/\s/g, "")
				if (subscribersText.match(/[0-9]*/g)) {
					infos.general.subscribers = subscribersText.match(/[0-9]*/g)[0]
				}
			}
		}
		if (document.querySelector("span.background-details")) {
			// Get all profile jobs listed
			const jobs = document.querySelectorAll("section.pv-profile-section.experience-section ul > li")
			if (jobs) {
				infos.jobs = getListInfos(jobs, [
					{ key: "companyName", attribute: "textContent", selector: ".pv-entity__secondary-title" },
					{ key: "companyUrl", attribute: "href", selector: `a[data-control-name="background_details_company"]` },
					{ key: "jobTitle", attribute: "textContent", selector: `a[data-control-name="background_details_company"] div.pv-entity__summary-info > h3` },
					{ key: "dateRange", attribute: "textContent", selector: ".pv-entity__date-range > span:nth-child(2)" },
					{ key: "location", attribute: "textContent", selector: ".pv-entity__location > span:nth-child(2)" },
					{ key: "description", attribute: "textContent", selector: ".pv-entity__description" },
				])
			}
			// Get all profile schools listed
			const schools = document.querySelectorAll(".pv-profile-section.education-section ul > li")
			if (schools) {
				infos.schools = getListInfos(schools, [
					{ key: "schoolUrl", attribute: "href", selector: "a.background_details_school" },
					{ key: "schoolName", attribute: "textContent", selector: ".pv-entity__school-name" },
					{ key: "degree", attribute: "textContent", selector: ".pv-entity__secondary-title.pv-entity__degree-name span.pv-entity__comma-item" },
					{ key: "degreeSpec", attribute: "textContent", selector: ".pv-entity__secondary-title.pv-entity__fos span.pv-entity__comma-item" },
					{ key: "dateRange", attribute: "textContent", selector: ".pv-entity__dates > span:nth-child(2)" },
					{ key: "description", attribute: "textContent", selector: ".pv-entity__description" },
				])
			}
			// Get all profile infos listed
			const contactInfos = document.querySelectorAll(".pv-profile-section.pv-contact-info div.pv-profile-section__section-info")
			if (contactInfos) {
				infos.details = getInfos([
					{ key: "linkedinProfile", attribute: "href", selector: ".pv-contact-info__contact-type.ci-vanity-url .pv-contact-info__contact-link" },
					{ key: "websites", attribute: "textContent", selector: "section.pv-contact-info__contact-type.ci-websites.pv-contact-info__list" },
					{ key: "twitter", attribute: "textContent", selector: "section.pv-contact-info__contact-type.ci-twitter .pv-contact-info__contact-link" },
					{ key: "phone", attribute: "href", selector: "section.pv-contact-info__contact-type.ci-phone .pv-contact-info__contact-link" },
					{ key: "mail", attribute: "textContent", selector: "section.pv-contact-info__contact-type.ci-email .pv-contact-info__contact-link" },
				])
			}
			// Get all profile skills listed
			const skills = document.querySelectorAll("ul.pv-featured-skills-list > li")
			const _skills = document.querySelectorAll("ol.pv-skill-categories-section__top-skills > li, ol.pv-skill-category-list__skills_list > li")
			// Alternative selector for skill sections
			if (skills.length > 0) {
				infos.skills = getListInfos(skills, [
					{ key: "name", attribute: "textContent", selector: "span.pv-skill-entity__skill-name" },
					{ key: "endorsements", attribute: "textContent", selector: "span.pv-skill-entity__endorsement-count" },
				])
			// If the first selector failed, the script will try this selector
			} else if (_skills.length > 0) {
				infos.skills = getListInfos(_skills, [
					{ key: "name", attribute: "textContent", selector: ".pv-skill-category-entity__name span" },
					{ key: "endorsements", attribute: "textContent", selector: "span.pv-skill-category-entity__endorsement-count" }
				])
			}

			// Get the first name from the page (and the last name)
			if (infos.general.fullName && infos.general.hasAccount) {
				const nameTab = infos.general.fullName.split(" ")
				const length = nameTab.length
				let firstName = ""
				// In case of composed name
				for (let i = 0; i < length; i++) {
					firstName += nameTab.splice(0, 1) + " "
					if (infos.general.hasAccount.toLowerCase().indexOf(firstName.trim().toLowerCase()) >= 0) {
						// Stop when we have the right first name
						infos.general.firstName = firstName.trim()
						infos.general.lastName = nameTab.join(" ")
						break
					}
				}
			}
			// Delete this (only needed to determine the first name)
			if (infos.general.hasAccount) {
				delete infos.general.hasAccount
			}
			// Delete tel: for the phone
			if (infos.details.phone) {
				infos.details.phone = infos.details.phone.replace("tel:", "")
			}
		}
	}
	callback(null, infos)
}

// Function to handle errors and execute all steps of the scraping of ONE profile
const getProfileInfos = async (tab, url) => {
	try {
		await tab.open(url)
	} catch (error) {
		throw("Error loading the page.")
	}
	try {
		/**
		 * NOTE: Using 7500ms timeout to make sure that the page is loaded
		 */
		await tab.waitUntilVisible("#profile-wrapper", 7500)
		utils.log("Profile loaded.", "done")
	} catch (error) {
		throw("Could not load the profile.")
	}
	try {
		utils.log("Scrolling to load all data of the profile...", "loading")
		await fullScroll(tab)
	} catch (error) {
		utils.log("Error during the scroll of the page.", "warning")
	}
	try {
		await loadAllData(tab)
		utils.log("All data loaded", "done")
	} catch (error) {
		utils.log("Error during the loading of data.", "warning")
	}
	try {
		utils.log("Scrapping the data on the page...", "loading")
		const infos = await tab.evaluate(scrapeInfos)
		return infos
	} catch (error) {
		throw(error)
	}
}

// Function to format the infos for the csv file (less infos)
const fullToCsv = infos => {
	let job = {}
	if (infos.jobs[0]) {
		job = infos.jobs[0]
	}
	let skills = [
		{},
		{},
		{}
	]
	if (infos.skills[0]) {
		skills[0] = infos.skills[0]
	}
	if (infos.skills[1]) {
		skills[1] = infos.skills[1]
	}
	if (infos.skills[2]) {
		skills[2] = infos.skills[2]
	}
	return {
		linkedinProfile: infos.details.linkedinProfile || null,
		description: infos.general.description || null,
		imgUrl: infos.general.imgUrl || null,
		firstName: infos.general.firstName || null,
		lastName: infos.general.lastName || null,
		fullName: infos.general.fullName || null,
		subscribers: infos.general.subscribers || null,
		company: job.companyName || null,
		companyUrl: job.companyUrl || null,
		jobTitle: job.jobTitle || null,
		jobDescription: job.description || null,
		location: job.location || null,
		mail: infos.details.mail || null,
		phoneNumber: infos.details.phone || null,
		twitter: infos.details.twitter || null,
		skill1: skills[0].name || null,
		skill2: skills[1].name || null,
		skill3: skills[2].name || null,
	}
}

// Main function that execute all the steps to launch the scrape and handle errors
;(async () => {
	utils.log("Getting the arguments...", "loading")
	let {sessionCookie, profileUrls, spreadsheetUrl, columnName} = utils.validateArguments()
	let urls = profileUrls
	if (spreadsheetUrl) {
		urls = await utils.getDataFromCsv(spreadsheetUrl, columnName)
	}
	const tab = await nick.newTab()
	await linkedIn.login(tab, sessionCookie)
	// Two variables to save csv and json
	const result = []
	const csvResult = []
	for (const url of urls) {
		utils.log(`Scraping profile ${url}`, "loading")
		try {
			const infos = await getProfileInfos(tab, url)
			result.push(infos)
			csvResult.push(fullToCsv(infos))
			utils.log(`${url} successfully scraped.`, "done")
		} catch (err) {
			utils.log(`Could not scrape ${url} because: ${err}`, "error")
		}
		const timeLeft = await utils.checkTimeLeft()
		if (!timeLeft.timeLeft) {
			utils.log(`Stopping the scraping: ${timeLeft.message}`, "warning")
			break
		}
	}
	await linkedIn.saveCookie()
	await utils.saveResults(result, csvResult)
	nick.exit()
})()
.catch(err => {
	utils.log(err, "error")
	nick.exit(1)
})
