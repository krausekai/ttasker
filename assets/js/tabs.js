//	Copyright (c) Kai Krause <kaikrause95@gmail.com>
//	You may deal with this file under the terms of license found in this program's install directory.

let tabs = module.exports = {};
let doc = document;

let pageTabs = [];

tabs.onload = function () {
	// set tab button widths
	(() => {
		let tablinks = document.getElementsByClassName("tablinks");
		for (let i = 0; i < tablinks.length; i++) {
			tablinks[i].style.width = (100 / tablinks.length) + "%";
		}
	})();

	// monitor clicks of each tab
	window.addEventListener("click", function (e) {
		if (e.target.classList.contains("tablinks")) tabs.changeTab(e);
	});

	pageTabs = document.getElementsByClassName("tablinks");
	if (pageTabs[0]) pageTabs[0].click();

	// monitor key events to change tab
	window.addEventListener("keydown", function (e) {
		let evtobj = window.event? event : e;

		let tabKey = 9;

		// re-cache currently active tab
		pageTabs = document.getElementsByClassName("tablinks");

		// get current tab
		let currentTabIndex;
		for (let i = 0; i < pageTabs.length; i++) {
			if (pageTabs[i].classList.contains("active")) {
				currentTabIndex = i;
				break;
			}
		}

		// tab back
		if (evtobj.ctrlKey && evtobj.shiftKey && evtobj.keyCode === tabKey) {
			if (currentTabIndex-1 > -1) return pageTabs[currentTabIndex-1].click();
		}

		// tab forward
		if (evtobj.ctrlKey && !evtobj.shiftKey && evtobj.keyCode === tabKey) {
			if (currentTabIndex+1 < pageTabs.length) return pageTabs[currentTabIndex+1].click();
		}

		// tab by number
		if (evtobj.ctrlKey && !isNaN(parseInt(evtobj.keyCode))) {
			let number = parseInt(String.fromCharCode(evtobj.keyCode));
			if (number === 1) number = 0;
			else number = number - 1;
			if (pageTabs[number]) return pageTabs[number].click();
		}
	}, true);
}

tabs.changeTab = function (evt, tabName) {
	let i, tabcontent, tablinks;
	if (!tabName) tabName = evt.target.innerText.toLowerCase() + "Tab";

	// Get all elements with class="tabcontent" and hide them
	tabcontent = doc.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
		// remove active tabs // className.indexOf(" active") >= 0
		if (evt.target !== tablinks[i] && tablinks[i].classList.contains("active")) {
			tablinks[i].classList.remove("active");
		}

		// set the active tab to the clicked element
		else if (evt.target === tablinks[i] && !tablinks[i].classList.contains("active")) {
			evt.target.classList.add("active");
		}
	}

	// Show the current tab
	doc.getElementById(tabName).style.display = "block";
}

// FORM GUI CLICK HANDLING

// settings form click handler
let splitForms = document.getElementsByClassName("split-form");
for (let i = 0; i < splitForms.length; i++) {
	splitForms[i].addEventListener("click", splitFormClicker);
}

function splitFormClicker(e) {
	if (["input", "select", "button"].indexOf(e.target.tagName.toLowerCase()) > -1) return;

	let foundPath;
	for (let i = 0; i < e.path.length; i++) {
		if (e.path[i].tagName && e.path[i].tagName.toLowerCase() === "p") {
			foundPath = e.path[i];
			break;
		}
	}

	if (!foundPath) return;

	let inputs = [];
	if (!inputs.length) inputs = foundPath.getElementsByTagName("select");
	if (!inputs.length) inputs = foundPath.getElementsByTagName("button");
	if (!inputs.length) inputs = foundPath.getElementsByTagName("input");

	// click on file buttons, rather than file text fields
	if (inputs.length > 1) {
		inputs[1].focus();
		inputs[1].click();
	}
	// or just click the only input
	else {
		inputs[0].focus();
		inputs[0].click();
	}
}
