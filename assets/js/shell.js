//	Copyright (c) Kai Krause <kaikrause95@gmail.com>
//	You may deal with this file under the terms of license found in this program's install directory.

let shellInteractions = module.exports = {};

var {shell} = require("electron");
var {clipboard} = require('electron');

shellInteractions.onload = function () {
	//Disable evals for scripts
	window.eval = global.eval = null;

	//Clipboard
	document.addEventListener('click', manageClipboard)

	//Disable drag drop events
	document.addEventListener('dragover', function (e) {e.preventDefault()});
	document.addEventListener('drop', function (e) {e.preventDefault()});

	//Redirect URLs
	document.addEventListener('click', defaultClickback);
	document.addEventListener('auxclick', defaultClickback);
}

shellInteractions.onload();

// Manage clipboard
function manageClipboard(e) {
	e = window.e || e;

	if (e.target.className.includes("copyable")) {
		clipboard.writeText(e.target.innerText);
	}
}

// Open other URLs with default programs and not Electron
async function defaultClickback(e) {
	e = window.e || e;

	//return if right click
	if (e.which == 3) return;

	try {
		if (e.target.localName.toLowerCase() == "a" || e.target.parentNode.nodeName.toLowerCase() == "a") {
			let url;
			if (e.target.href) url = e.target.href;
			else if (e.target.parentNode.href) url = e.target.parentNode.href;

			e.preventDefault();

			if (!url || url.endsWith("#nullify")) return;

			// local file fix
			if (url.startsWith("file:")) {
				url = decodeURIComponent(url);
				url = url.replace(/^file:\/+/, "");
				await shell.openPath(url);
			}

			await shell.openExternal(url);
		}
	}
	catch(err) {
		console.error(err + ": " + e.target.href);
	}
}


/*
	SCROLL BEHAVIOR
*/

function getScrollingElement(el) {
	let scrollingElement = el;
	while(scrollingElement.parentNode) {
		if (scrollingElement.scrollTo) {
			scrollingElement.scrollTop++;
			if (scrollingElement.scrollTop > 0) {
				scrollingElement.scrollTop--;
				break;
			}
		}
		scrollingElement = scrollingElement.parentNode;
	}
	return scrollingElement;
}

// control scroll wheel distance
function scrollSpeed (event) {
	let delta = event.wheelDelta || event.detail;

	// walk up the DOM to find the parent scrollable element
	let scrollingElement = getScrollingElement(event.target);

	// change the scroll distance by element height
	let dist = (scrollingElement.offsetHeight || 0) / 4.2;
	if (delta > 0) dist = dist - (dist * 2);

	// override scrollTo position
	if (scrollingElement.scrollTo) {
		scrollingElement.scrollTo({
			"top": scrollingElement.scrollTop + dist
		});
	}
	event.preventDefault();
}

window.addEventListener("mousewheel", scrollSpeed, { passive: false });
