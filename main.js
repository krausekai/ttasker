// Modules required from electron
const {app, BrowserWindow} = require("electron");
app.name = "TTasker";

const isAppUnlocked = app.requestSingleInstanceLock()

if (!isAppUnlocked) {
  app.quit();
}

const ipc = require("electron").ipcMain;
const path = require("path");
const url = require("url");

// Keep a global reference of the window object to prevent the window closing when JavaScript object is garbage collected.
let mainWindow;

// Right-click context menu - https://github.com/sindresorhus/electron-context-menu
require('electron-context-menu')({});

/*
	EVENTS
*/

app.commandLine.appendSwitch("force-color-profile", "srgb");
app.commandLine.appendSwitch("js-flags", "--expose-gc");

app.on("browser-window-created", function(e,window) {
	//Hide each newly created window's menu
	window.setMenu(null);
});

app.on('web-contents-created', (e, contents) => {
	// prevent window redirect / navigation
  contents.on('will-navigate', (e, navigationUrl) => {
		e.preventDefault();
  });
});

app.on("activate", function() {
	// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createMainWindow();
	}
});

// Quit when all windows are closed.
app.on("window-all-closed", function() {
	// Quit properly on OS X
	if (process.platform !== "darwin") {
		app.quit();
	}
});

/*
	WINDOW CREATION
*/

function createMainWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		alwaysOnTop: true,
		minWidth: 270,
		width: 270,
		minHeight: 350,
		height: 350,
		webPreferences: {
			backgroundThrottling: false,
			nodeIntegration: true,
			enableRemoteModule: true,
			defaultEncoding: "utf-8"
		}
	})

	// and load the index.html of the app.
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, "./assets/index.html"),
		protocol: "file:",
		slashes: true
	}))

	//mainWindow.webContents.openDevTools()

	//Hide the default menubar
	mainWindow.setMenu(null);

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		app.quit();
	})
}

// Create window after initialization. Some APIs can only be used after this event.
app.on("ready", () => {
	createMainWindow();
});

let statisticsWindow = null;
ipc.on('open-history-window', function () {
	if (statisticsWindow) {
		return;
	}

	statisticsWindow = new BrowserWindow({
		frame: true,
		height: 500,
		resizable: true,
		width: 650,
		webPreferences: {
			backgroundThrottling: false,
			nodeIntegration: true,
			enableRemoteModule: true,
			defaultEncoding: "utf-8"
		}
	});

	statisticsWindow.loadURL(url.format({
		pathname: path.join(__dirname, './assets/history.html'),
		protocol: 'file:',
		slashes: true
	}))

	statisticsWindow.on('closed', function () {
		statisticsWindow = null;
	});
});

// --------------
// Other Windows
// --------------

let openWindows = {
	history: {
		window: null,
		path: path.join(__dirname, "./assets/history.html")
	}
};

ipc.on("open-window", (e, name) => {
	if (!name) return;

	if (openWindows[name].window) {
		return openWindows[name].window.focus();
	}

	openWindows[name].window = new BrowserWindow({
		parent: mainWindow,
		modal: true,
		frame: true,
		height: openWindows[name].height || 500,
		resizable: true,
		width: openWindows[name].width || 650,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			defaultEncoding: "utf-8"
		}
	});

	openWindows[name].window.loadURL(url.format({
		pathname: openWindows[name].path,
		protocol: "file:",
		slashes: true
	}));

	//openWindows[name].window.webContents.openDevTools();

	openWindows[name].window.on("closed", function () {
		openWindows[name].window = null;
	});
});
