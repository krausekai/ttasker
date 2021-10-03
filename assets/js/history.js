const settings = require("./js/settings");

const tableEntries = [];

function formatHistory() {
	for (let entry in settings.data.timers) {
		let name = settings.data.timers[entry].name;
		let history = settings.data.timers[entry].history;

		for (let record of history) {
			tableEntries.push({
				name: name,
				date: record.date,
				time: record.time
			});
		}
	}

	// sort entries by date

	function dateToInt(date) {
		return parseInt(date.toString().replace(/\//g, ""));
	}

	tableEntries.sort(function (a, b) {
		return dateToInt(b.date) - dateToInt(a.date);
	});
}

// TODO: visualize by graphing
function drawCell() {
	let body = document.getElementsByClassName("padded")[0];
	let html = "";

	let lastDate = "";
	for (let entry of tableEntries) {
		try {
			if (entry.date !== lastDate) {
				lastDate = entry.date;
				html += "<span style='display: inline-block; margin: 4px 0'><b>" + entry.date +"</b></span><br />";
			}

			html +=
			"<span style='margin-left: 20px'>"
				+ entry.name + " - "
				+ entry.time.hours.toString().padStart(2, "0") + ":"
				+ entry.time.minutes.toString().padStart(2, "0") + ":"
				+ entry.time.seconds.toString().padStart(2, "0") +
			"</span><br />";
		} catch (e) {}
	}

	body.innerHTML += html;
}

window.onload = function () {
	// Load timer states
	settings.readSettings().then((settingsData) => {
		formatHistory();
		drawCell();
	});
}
