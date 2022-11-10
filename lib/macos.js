'use strict';
const path = require('path');
const {promisify} = require('util');
const childProcess = require('child_process');

const execFile = promisify(childProcess.execFile);
const bin = path.join(__dirname, '../main');

const parseMac = stdout => {
	try {
		const result = JSON.parse(stdout);
		if (result !== null) {
			result.platform = 'macos';
			return result;
		}
	} catch (error) {
		console.error(error);
		throw new Error('Error parsing window data');
	}
};

const parseArrayMac = stdout => {
	try {
		const openWindows = new Map();
		const result = JSON.parse(stdout);
		if (result && result.length > 0) {
			for (const openWindow of result) {
				openWindows.set(openWindow.title, {processes: [{...openWindow, platform: 'macos'}]});
			}
		}

		return openWindows;
	} catch (error) {
		console.error(error);
		throw new Error('Error parsing window data');
	}
};

const getArguments = options => {
	if (!options) {
		return [];
	}

	const args = [];
	if (options.screenRecordingPermission === false) {
		args.push('--no-screen-recording-permission');
	}

	return args;
};

module.exports = async options => {
	const {stdout} = await execFile(bin, getArguments(options));
	return parseMac(stdout);
};

module.exports.sync = options => {
	const stdout = childProcess.execFileSync(bin, getArguments(options), {encoding: 'utf8'});
	return parseMac(stdout);
};

module.exports.getOpenWindows = async options => {
	const {stdout} = await execFile(bin, [...getArguments(options), '--open-windows-list']);
	return parseArrayMac(stdout);
};

module.exports.getOpenWindowsSync = options => {
	const stdout = childProcess.execFileSync(bin, [...getArguments(options), '--open-windows-list'], {encoding: 'utf8'});
	return parseArrayMac(stdout);
};
