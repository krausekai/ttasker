const _this = module.exports = {};

var remote = require("electron").remote;

let electronDialog;
if (remote) electronDialog = remote.dialog;
else electronDialog = {
	showMessageBox: function(opts, cb) {
		console.log(opts.title, opts.message);
		if (cb && typeof(cb) === 'function') cb();
	},
	showMessageBoxSync: this.showMessageBox
}

/*
	wrappers
*/

_this.showMessageBoxSync = function(opts, cb) {
	let window = remote.BrowserWindow.getFocusedWindow();
	if (electronDialog.showMessageBoxSync) {
		let resp = electronDialog.showMessageBoxSync(window, opts);
		if (cb && typeof(cb) === 'function') cb(resp);
	}
	else electronDialog.showMessageBox(window, opts).then(cb);
}

_this.showMessageBox = async function(opts) {
	let window = remote.BrowserWindow.getFocusedWindow();
	return await electronDialog.showMessageBox(window, opts);
}

/*
	templates
*/

function logTemplate(type, message) {
	return {
		type: type,
		buttons: ["OK"],
		defaultId: 0,
		cancelId: 0,
		detail: message || "See the console for more details"
	}
}

_this.log = function(message) {
	_this.showMessageBox( logTemplate("info", message) );
}

_this.error = function(message) {
	_this.showMessageBox( logTemplate("error", message) );
}

// todo: _this.confirm

/*
	DOM Browse Dialog

	Usage:
	<input type="text" readonly> <button type="file">Select File</button><br />
*/

async function browseFileOrDir(type, defaultPath) {
	let opts = {
		defaultPath: defaultPath,
		properties: [],
		filters: []
	}

	if (!type || type === "file") {
		opts.properties.push("openFile");
		opts.filters.push( { name: "Text Files", extensions: ["txt", "csv"] } );
	}
	else {
		opts.properties.push("openDirectory");
	}

	let res = await electronDialog.showOpenDialog(opts);
	if (res.filePaths.length) return res.filePaths[0];
}

async function outputFileOrDir(evt) {
	if (evt.target.tagName !== "BUTTON") return;
	if (["file", "directory"].indexOf(evt.target.getAttribute("type")) === -1) return;
	if (!evt.target.previousElementSibling) return;
	if (evt.target.previousElementSibling.tagName !== "INPUT") return;

	// open dialog and output path to previous input el's value
	let res = await browseFileOrDir(evt.target.getAttribute("type"), evt.target.previousElementSibling.value);
	if (res) evt.target.previousElementSibling.value = res;

	// fire the change event
	evt.target.dispatchEvent(new Event("change", { "bubbles": true }));
}

try {
	window.addEventListener("click", outputFileOrDir);
} catch(e) {}
