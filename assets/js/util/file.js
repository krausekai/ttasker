//	Copyright (c) Kai Krause <kaikrause95@gmail.com>
//	You may deal with this file under the terms of license found in this program's install directory.

/*
	This file checks whether a file exists and creates the file if it does not,
	checks whether a file has been modified by a supplied time and returns a boolean,
	and writes files to disk using an appropriate write stream setup.
*/

const _this = module.exports = {};

var fs = require("fs");
var fsp = require("fs").promises;
let { COPYFILE_EXCL } = fs.constants;

var dialog = require("./dialog");

//	-------
//	DIRECTORIES
//	-------

/*
function directoryExistsHelper(path) {
	try {
		return fs.statSync(path).isDirectory();
	}
	catch (e) {
		return false;
	}
}

_this.directoryExists = function(path) {
	// Create file if it does not exist
	if (!directoryExistsHelper(path)) {
		try{
			fs.mkdirSync(dir);
		}
		catch(e) {
			// return existence state of file
			return directoryExistsHelper(path);
		}
	}
	// return existence state of file
	return directoryExistsHelper(path);
}
*/

_this.makeDirectorySync = function(path) {
	if (!fs.existsSync(path)) fs.mkdirSync(path);
}

_this.readDirectorySync = function(path, type) {
	let fileNames = [];

	try {
		_this.makeDirectorySync(path);

		fs.readdirSync(path).forEach(fileName => {
			let filePath = path + "\\" + fileName;
			if (type === "dir" && fs.statSync(filePath).isDirectory()) {
				fileNames.push(fileName);
			}
			else if (type !== "dir" && fs.statSync(filePath).isFile()) {
				fileNames.push(fileName);
			}
		});
	}
	catch (e) {
		console.error(e + ": " + path);
	}

	return fileNames;
}

//	-------
//	FILES
//	-------

_this.readFileSync = function(path, cb) {
	let error;
	let data = "";
	try {
		data = fs.readFileSync(path, "utf-8");
	}
	catch (e) {
		dialog.error("Cannot read file or folder: " + path);
		console.error(e + ": " + path);
		error = e;
	}
	finally {
		if (cb && typeof cb === "function") cb(error, data);
		else return data;
	}
}

_this.writeFileSync = function(path, data, flags, cb) {
	let error;
	try {
		fs.writeFileSync(path, data, flags);
	}
	catch (e) {
		dialog.error("Cannot write to file or folder: " + path);
		console.error(e + ": " + path);
		error = e;
	}
	finally {
		if (cb && typeof cb === "function") cb(error);
	}
}

_this.copyFileSync = function(source, dest, flags, cb) {
	let error;
	try {
		let overwrite = null;
		if (flags.overwrite) overwrite = COPYFILE_EXCL;
		fs.copyFileSync(source, dest, overwrite);
	}
	catch (e) {
		dialog.error("Cannot copy file: " + dest);
		console.error(e);
		error = e;
	}
	finally {
		if (cb && typeof cb === "function") cb(error);
	}
}

_this.fileExistsHelper = function(path) {
	try {
		return fs.statSync(path).isFile();
	}
	catch (e) {
		return false;
	}
}

_this.fileExists = function(path) {
	// Create file if it does not exist
	if (!_this.fileExistsHelper(path)) {
		try{
			fs.writeFileSync(path, "", {flag: "wx"});
		}
		catch(e) {
			// return existence state of file
			return _this.fileExistsHelper(path);
		}
	}
	// return existence state of file
	return _this.fileExistsHelper(path);
}

_this.getModifiedTime = function(path) {
	return fs.statSync(path).mtimeMs;
}

_this.isModified = function(properties) {
	if (_this.fileExists(properties.path)) {
		let currentDate = _this.getModifiedTime(properties.path);
		if (!properties.lastPath || !properties.lastModifiedDate || properties.lastPath !== properties.path || currentDate > properties.lastModifiedDate) {
			properties.lastPath = properties.path;
			properties.lastModifiedDate = currentDate;
			properties.modified = true;
			return properties;
		}
		properties.modified = false;
	}
	return properties;
}

// async

// source: https://stackoverflow.com/a/10049704/1679669
_this.readFiles = async function(dirname) {
	return new Promise(async (resolve, reject) => {
		let filenames = [];
		let data = [];

		try {
			filenames = await fsp.readdir(dirname);
		} catch (e) {
			console.error(e + ": " + dirname);
		}

		for (let i = 0; i < filenames.length; i++) {
			try {
				let content = await fsp.readFile(dirname + filenames[i], 'utf-8');
				data.push(content)
			} catch (e) {
				console.error(e + ": " + dirname + filenames[i]);
			}
		}

		resolve(data);
	});
}

_this.unlink = async function(path, cb) {
	let error;
	try {
		data = fs.unlinkSync(path);
	}
	catch (e) {
		if (!cb) {
			dialog.error("Cannot remove file or folder: " + path);
			console.error(e + ": " + path);
		}
		error = e;
	}
	finally {
		if (cb && typeof cb === "function") cb(error);
	}
}

_this.copyFileAsync = async function(source, dest, flags) {
	return new Promise((resolve, reject) => {
		let overwrite = null;
		if (flags.overwrite) overwrite = COPYFILE_EXCL;
		fs.copyFile(source, dest, overwrite, ((err) => {
			if (err) reject(err);
			else resolve();
		}));
	});
}

_this.writeAsync = function(path, item, flags) {
	return new Promise((resolve, reject) => {
		if (!flags) flags = {flags:"w"}; // w to write; a to append
		flags.encoding = "utf8"; // automatically write in utf-8 mode
		if (_this.fileExists(path)) {
			let stream = fs.createWriteStream(path, flags);
			stream.write(item);
			stream.close();
			stream.on("finish", () => {
				resolve();
			});
		}
		else {
			dialog.error("Cannot write to file or folder: " + path);
			reject();
		}
	});
}
