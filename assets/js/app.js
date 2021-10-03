const settings = require("./js/settings");
const ipcRenderer = require("electron").ipcRenderer;

const tabs = require("./js/tabs");
tabs.onload();

/*
	BUTTONS
*/

// Button click sound effect
document.body.innerHTML += "<audio id='audio' src='./audio/tap.mp3'></audio>";
window.addEventListener("click", (e) => {
	e = window.e || e;
	if (e.target.localName == "button") {
		document.getElementById("audio").pause();
		document.getElementById("audio").currentTime = 0;
		document.getElementById("audio").play();
	}
});

function showHide(e) {
	let el = document.getElementById(e);
	if (!el) el = document.getElementsByClassName(e)[0];

	if (el.style.display == "none") el.style.display = "block";
	else if (el.style.display == "block") el.style.display = "none";
}
function changeTheme() {
	let theme = document.querySelector("html").className;
	if (theme == "lightTheme") document.querySelector("html").className = "darkTheme";
	else if (theme == "darkTheme") document.querySelector("html").className = "lightTheme";
}

window.addEventListener("keypress", (e) => {
	if (e.key.toLowerCase() === "enter") {
		e.preventDefault();

		let parent = e.target.parentElement;
		if (parent.id === "timersMenuBar") {
			drawTimerCell();
			clearTimerForm();
		}
		if (parent.id === "tasksMenuBar") {
			if (drawTaskCell()) clearTaskForm();
		}
	}
})

function openHistory() {
	ipcRenderer.send("open-window", "history");
}

/*
	TIMERS
*/

const timers = {
	get: function(name) {
		for (let timer of this.timers) {
			if (timer.name.toString().toLowerCase() === name.toString().toLowerCase()) {
				return timer;
			}
		}
	},
	remove: function (name) {
		this.timers = this.timers.filter(timer => timer.name.toString().toLowerCase() !== name.toString().toLowerCase());
	},
	add: function (name, timer) {
		this.timers.push({name: name, timer: timer});
	},
	pause: function () {
		for (let timer of this.timers) {
			timer.timer.pause();
		}
	},
	areRunning: function () {
		for (let timer of this.timers) {
			if (timer.timer.isRunning()) return true;
		}
		return false;
	},
	reset: function () {
		for (let timer of this.timers) {
			let wasRunning = timer.timer.isRunning();
			timer.timer.stop(); // reset values (including configured startValues)
			timer.timer.start(); // update the display as zero'd out
			timer.timer.pause();
			if (!wasRunning) timer.timer.pause();
		}
	},
	timers: []
};

function drawTimerDisplay(id, time) {
	let timer = new easytimer.Timer();
	let instance = document.getElementById(id);
	let name = instance.getElementsByClassName("timerName")[0].innerText;
	let display = instance.getElementsByClassName("timerDisplay")[0];

	timer.addEventListener("started", function (e) {
		instance.classList.add("highlighted");
    display.innerText = timer.getTimeValues().toString();
	});
	timer.addEventListener("secondsUpdated", function (e) {
		display.innerText = timer.getTimeValues().toString();
	});
	timer.addEventListener("reset", function (e) {
		display.innerText = timer.getTimeValues().toString();
	});
	timer.addEventListener("paused", function (e) {
		instance.classList.remove("highlighted");
	});
	timer.addEventListener("stopped", function (e) {
		instance.classList.remove("highlighted");
	});

	let startButton = instance.getElementsByClassName("start")[0];
	startButton.addEventListener("click", function (e) {
		let wasPaused = timer.isPaused();
		timers.pause();
		if (wasPaused) timer.start();
	}, true);

	let resetButton = instance.getElementsByClassName("reset")[0];
	resetButton.addEventListener("click", function (e) {
		timer.stop(); // reset values (including configured startValues)
		timer.start(); // update the display as zero'd out
		timer.pause();
	}, true);

	let removeButton = instance.getElementsByClassName("remove")[0];
	removeButton.addEventListener("click", function (e) {
		timer.stop();

		// remove this timer from the array
		timers.remove(name);

		// deactivate in settings
		if (settings.data.timers[name]) {
			settings.data.timers[name].active = false;
		}

		// remove from DOM
		instance.parentElement.removeChild(instance);
	}, true);

	// If pause() is called before start() at creation, Timer() may be dereferenced
	// So, create a reference with start() and display the timer at 00:00:00 (or stored time)
	timers.add(name, timer);
	timer.start({startValues: time});
	timer.pause();
}

function drawTimerCell(name, time) {
	name = name || document.getElementById("timersMenuBar").getElementsByTagName("input")[0].value;
	if (!name || name && timers.get(name)) return;

	let timersBody = document.getElementById("timers");
	let id = timersBody.getElementsByClassName("timer").length;

	let cell = document.createElement("div");
	cell.setAttribute("id", id);
	timersBody.appendChild(cell);

	let data = "<div id='" + id + "' class='timer'>";
		data += "<span class='timerName'>" + name + "</span>";
		data += "<div class='timerDisplay'></div>";
		data += "<button class='icon-button start'></button>";
		data += "<button class='icon-button reset'></button>";
		data += "<button class='icon-button remove'></button>";
	data += "</div>";

	cell.innerHTML += data;

	drawTimerDisplay(id, time);
}

function clearTimerForm() {
	document.getElementById("timersMenuBar").getElementsByTagName("input")[0].value = "";
}

/*
	TASKS
*/

const tasks = {
	get: function(timerName, taskName) {
		for (let task of this.tasks) {
			if (task.timerName.toString().toLowerCase() === timerName.toString().toLowerCase() &&
					task.taskName.toString().toLowerCase() === taskName.toString().toLowerCase()) {
				return task;
			}
		}
	},
	replace: function(timerName, taskName, detail) {
		for (let task of this.tasks) {
			if (task.timerName.toString().toLowerCase() === timerName.toString().toLowerCase() &&
					task.taskName.toString().toLowerCase() === taskName.toString().toLowerCase()) {
				task.detail = detail;
				return true;
			}
		}
		return false;
	},
	remove: function (name) {
		this.tasks = this.tasks.filter(task => task.taskName.toString().toLowerCase() !== name.toString().toLowerCase());
	},
	add: function (timerName, taskName, detail) {
		this.tasks.push({timerName: timerName, taskName: taskName, detail: detail});
	},
	tasks: [],
	getRandom: function() {
		if (!this.tasks.length) return;

		// reset this.prevTasks if all options in this.tasks are exhausted
		if (this.tasks.length === this.prevTasks.length && this.tasks.length > 1) {
			this.prevTasks = this.prevTasks.splice(this.prevTasks.length-1, 1);
		}

		// randomizer
		function getOpt(arr) {
			return arr[Math.floor(Math.random()*arr.length)];
		}

		// shuffle bag: pick a rand task that is not the previous, or of previous tasks
		let sel = getOpt(this.tasks);
		while (this.prevTasks.indexOf(sel) > -1) {
			sel = getOpt(this.tasks);
		}

		// record selection
		if (this.tasks.length > 1) this.prevTasks.push(sel);

		sel = JSON.parse(JSON.stringify(sel));

		let detailOpts = sel.detail.match(/\[.+\]/);
		if (detailOpts) {
			let selOpt = getOpt( detailOpts[0].split(";") ).replace(/\[|\]/gmi, "").trim();
			sel.detail = sel.detail.replace(detailOpts[0], "[" + selOpt + "]");
		}

		return sel;
	},
	prevTasks: []
}

window.addEventListener("click", (e) => {
	if (e.target.className && e.target.parentElement.className.includes("task")) {
		createTimerFromTask(e);
		editTask(e);
		removeTask(e);
	}

	if (e.target.id && e.target.id.toLowerCase() === "selectRandomTask".toLowerCase()) {
		selectRandomTask(e);
	}
})

function drawTaskCell(timerName, taskName, detail) {
	timerName = timerName || document.getElementById("tasksMenuBar").getElementsByTagName("input")[0].value.trim();
	taskName = taskName || document.getElementById("tasksMenuBar").getElementsByTagName("input")[1].value.trim();
	detail = detail || document.getElementById("tasksMenuBar").getElementsByTagName("textarea")[0].value.trim();
	if (!timerName || !taskName) return;

	let success = false;

	// edit existing task
	if (tasks.replace(timerName, taskName, detail)) {
		let htmlTasks = document.getElementsByClassName("task");
		for (let htmlTask of htmlTasks) {
			let htmlTimerName = htmlTask.getElementsByClassName("timerName")[0];
			let htmlTaskName = htmlTask.getElementsByClassName("taskName")[0];
			let htmlTaskDetail = htmlTask.getElementsByClassName("detail")[0];
			if (htmlTimerName.innerText === timerName && htmlTaskName.innerText === taskName) {
				htmlTaskDetail.innerHTML = detail;
			}
		}
		success = true;
	}

	// add new task
	else {
		let cell = "<div class='task'>";
			cell += "<span class='timerName'>" + timerName + "</span> - ";
			cell += "<span class='taskName'>" + taskName + "</span><br />";
			cell += "<span class='detail'>" + detail + "</span><br />";
			cell += "<button class='icon-button start'></button>";
			cell += "<button class='icon-button edit'></button>";
			cell += "<button class='icon-button remove'></button>";
		cell += "</div>";

		document.getElementById("tasks").innerHTML += cell;

		tasks.add(timerName, taskName, detail);

		success = true;
	}

	return success;
}

function clearTaskForm() {
	document.getElementById("tasksMenuBar").getElementsByTagName("input")[0].value = "";
	document.getElementById("tasksMenuBar").getElementsByTagName("input")[1].value = "";
	document.getElementById("tasksMenuBar").getElementsByTagName("textarea")[0].value = "";
}

function createTimerFromTask(e) {
	if (!e.target.className.includes("start")) return;
	drawTimerCell(e.target.parentElement.getElementsByClassName("timerName")[0].innerText);
}

function editTask(e) {
	if (!e.target.className.includes("edit")) return;

	// current html
	let htmlTimerName = e.target.parentElement.getElementsByClassName("timerName")[0].innerText;
	let htmlTaskName = e.target.parentElement.getElementsByClassName("taskName")[0].innerText;

	// stored task detail
	let taskDetail = tasks.get(htmlTimerName, htmlTaskName).detail;

	// fill form
	document.getElementById("tasksMenuBar").getElementsByTagName("input")[0].value = htmlTimerName;
	document.getElementById("tasksMenuBar").getElementsByTagName("input")[1].value = htmlTaskName;
	document.getElementById("tasksMenuBar").getElementsByTagName("textarea")[0].value = taskDetail;
}

function removeTask(e) {
	if (!e.target.className.includes("remove")) return;
	let taskName = e.target.parentElement.getElementsByClassName("taskName")[0].innerText;
	tasks.remove(taskName);
	e.target.parentElement.remove(taskName);
}

function selectRandomTask(e) {
	let rnd = tasks.getRandom();

	let tasksTab = document.getElementById("tasksTab");
	let highlighted = tasksTab.getElementsByClassName("highlighted");
	if (highlighted.length) highlighted[0].classList.remove("highlighted");

	let htmlTasks = tasksTab.getElementsByClassName("task");
	for (let htmlTask of htmlTasks) {
		let timerName = htmlTask.getElementsByClassName("timerName")[0].innerText;
		let taskName = htmlTask.getElementsByClassName("taskName")[0].innerText;
		let detail = htmlTask.getElementsByClassName("detail")[0];

		if (timerName === rnd.timerName && taskName === rnd.taskName) {
			detail.innerHTML = rnd.detail;
			htmlTask.classList.add("highlighted");
			htmlTask.scrollIntoView();
			break;
		}
	}
}

window.onload = function () {
	settings.readSettings().then((settingsData) => {
		// load timers
		if (settingsData.timers) {
			for (i in settingsData.timers) {
				let entry = settingsData.timers[i];

				let time;
				let history = entry.history[entry.history.length-1];
				if (history?.date === window._date) {
					time = history?.time;
				}

				if (entry.active) drawTimerCell(entry.name, time);
			}
		}

		// load tasks
		if (settingsData.tasks) {
			for (let task of settingsData.tasks) {
				drawTaskCell(task.timerName, task.taskName, task.detail);
			}
		}
	});
}
