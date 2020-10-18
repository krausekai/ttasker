const settings = require("./js/settings");

const tableEntries = [];

const tableEntryTemplate = {
	name: "",
	date: "",
	time: {
		"secondTenths": 0,
		"seconds": 0,
		"minutes": 0,
		"hours": 0,
		"days": 0
	}
}

function formatHistory() {
	for (entry in settings.data.timers) {
		let history = settings.data.timers[entry].history;

		let tableEntry;
		for (let record of history) {
			if (!tableEntry || tableEntry.date != record.date) {
				tableEntry = JSON.parse(JSON.stringify(tableEntryTemplate));
				tableEntry.name = settings.data.timers[entry].name;
				tableEntry.date = record.date;
				tableEntries.push(tableEntry);
			}

			for (let time of record.times) {
				tableEntries[tableEntries.length-1].time.secondTenths += time.secondTenths;
				tableEntries[tableEntries.length-1].time.seconds += time.seconds;
				tableEntries[tableEntries.length-1].time.minutes += time.minutes;
				tableEntries[tableEntries.length-1].time.hours += time.hours;
				tableEntries[tableEntries.length-1].time.days += time.days;
			}
		}

		// sort entries by date

		function dateToInt(date) {
			return parseInt(date.toString().replace(/\//g, ""));
		}

		tableEntries.sort(function (a, b) {
			return dateToInt(b.date) - dateToInt(a.date);
		});

		// rollover seconds and minutes

		function secondsToTime(secs) {
			let hours = Math.floor(secs / 60 / 60);
			let minutes = Math.floor(secs / 60) % 60;
			let seconds = Math.floor(secs - minutes * 60);
			return { hours: hours, minutes: minutes, seconds: seconds };
		}

		function minutesToTime(mins) {
			let hours = (mins / 60);
			let rhours = Math.floor(hours);
			let minutes = (hours - rhours) * 60;
			let rminutes = Math.round(minutes);
			return { hours: rhours, minutes: rminutes };
		}

		for (let entry of tableEntries) {
			let timeFromSeconds = secondsToTime(entry.time.seconds);

			entry.time.seconds = timeFromSeconds.seconds;
			entry.time.minutes += timeFromSeconds.minutes;
			entry.time.hours += timeFromSeconds.hours;

			let timeFromMinutes = minutesToTime(entry.time.minutes)

			entry.time.minutes = timeFromMinutes.minutes;
			entry.time.hours += timeFromMinutes.hours;
		}
	}

	// Rewrite optimized history data for entries older than today?
	// settings.writeSettings();
}

// TODO: visualize by graphing
function drawCell() {
	let body = document.getElementsByClassName("padded")[0];

	let lastDate = "";
	for (let entry of tableEntries) {
		if (entry.date !== lastDate) {
			lastDate = entry.date;
			body.innerHTML += "<span style='display: inline-block; margin: 4px 0'><b>" + entry.date +"</b></span><br />";
		}

		body.innerHTML +=
		"<span style='margin-left: 20px'>"
			+ entry.name + " - "
			+ entry.time.hours.toString().padStart(2, "0") + ":"
			+ entry.time.minutes.toString().padStart(2, "0") + ":"
			+ entry.time.seconds.toString().padStart(2, "0") +
		"</span><br />";
	}
}

window.onload = function () {
	// Load timer states
	settings.readSettings().then((settingsData) => {
		formatHistory();
		drawCell();
	});
}
