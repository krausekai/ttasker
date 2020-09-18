const self = module.exports = {};

/*
	SESSION & DATE
*/

const getSession = function() {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const getDate = function() {
	// Get today's date
	let date = new Date();
	let dd = date.getDate();
	let mm = date.getMonth()+1; //January is 0!
	let yyyy = date.getFullYear();
	let dateToday = yyyy + "/" + mm.toString().padStart(2, "0") + "/" + dd.toString().padStart(2, "0");
	return dateToday;
}

let session = getSession();
let date = getDate();
setInterval(() => {
	if (!timers || date === getDate()) return;

	// new session & date
	session = getSession();
	date = getSession();

	// reset timers
	timers.reset();
}, 5000);

// GUI STATE / SETTINGS
// Onload, call loadSettings(), which calls readSettings() and returns the settings object
// Then, loadSettings() passes the settings object values to drawCell(), to recreate the GUI
// Periodically and on user interaction, call saveSettings() to query GUI values to an object
// Then call writeSettings(), to save the object as a JSON file (to be read later by Onload)

const electron = require('electron').remote;
const app = electron.app;
const shell = electron.shell;

var file = require("./util/file");
var path = require("path");

/*
	Setup
*/

const defaultDir = app.getPath("userData") + "\\user";
file.makeDirectorySync(defaultDir);

const settingsPath  = (() => { if (!app.isPackaged) { return "./settings.json" } else { return defaultDir + "\\settings.json" } })();

// open the default directory
window.addEventListener("click", ((e) => {
	if (!e.target.id || e.target.id.toLowerCase() !== "browseDefaultDirectory".toLowerCase()) return
	shell.openPath(path.dirname(path.resolve(settingsPath)));
}));

self.readSettings = async function() {
	return new Promise((res, rej) => {
		if (file.fileExists(settingsPath)) {
			self.data = file.readFileSync(settingsPath) || {};
			if (self.data && typeof self.data === "string") self.data = JSON.parse(self.data);

			// Setup settings
			if (!self.data.theme) self.data.theme = "darkTheme";
			if (!self.data.timers) self.data.timers = {};

			// Apply Settings
			document.body.className = self.data.theme;

			// Return settings data
			res(self.data);
		}
	});
}

self.writeSettings = async function() {
	file.writeFileSync(settingsPath, JSON.stringify(self.data));
}

self.saveSettings = function() {
	// Save Theme State
	self.data.theme = document.body.className;

	// Save Timer States
	if (timers) {
		for (let i = 0; i < timers.timers.length; i++) {
			let timer = timers.timers[i].timer;
			let name = timers.timers[i].name;

			// Create the timer entry
			let timerEntry = {
				name: name,
				active: true,
				history: []
			}

			// use existing history array
			if (self.data.timers[name] && self.data.timers[name].history) {
				timerEntry.history = self.data.timers[name].history;
			}

			/*
			// Get today's date
			let date = new Date();
			let dd = date.getDate();
			let mm = date.getMonth()+1; //January is 0!
			let yyyy = date.getFullYear();
			let dateToday = yyyy + "/" + mm.toString().padStart(2, "0") + "/" + dd.toString().padStart(2, "0");
			*/

			// Create the timer time entry
			let histLen = timerEntry.history.length - 1;
			let newTimeValues = timer.getTimeValues();
			let newHistory = {
				session: session,
				date: date,
				times: [newTimeValues]
			}
			let zeroCheck = newTimeValues.seconds || newTimeValues.minutes || newTimeValues.hours || newTimeValues.days;

			// Do not push empty times to the history list
			if (zeroCheck > 0) {
				// Create a new history item if this is a new timer session
				if (!timerEntry.history[histLen] || timerEntry.history[histLen].date !== newHistory.date) {
					timerEntry.history.push(newHistory);
				}
				// Otherwise, update the current date's stored time
				else if (timerEntry.history[histLen] && timerEntry.history[histLen].date == newHistory.date) {
					// if session is same then overwrite time
					if (timerEntry.history[histLen].session === session) {
						timerEntry.history[histLen].times[timerEntry.history[histLen].times.length-1] = newTimeValues;
					}
					// if session is diff then add time
					else if (timerEntry.history[histLen].session !== session) {
						timerEntry.history[histLen].times.push(newTimeValues);
						timerEntry.history[histLen].session = session;
					}
				}
			}

			self.data.timers[name] = timerEntry;
		}
	}

	if (tasks) {
		self.data.tasks = tasks.tasks;
	}

	self.writeSettings();
}
