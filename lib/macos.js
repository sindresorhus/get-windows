'use strict';
const path = require('path');
const {promisify} = require('util');
const childProcess = require('child_process');

const execFile = promisify(childProcess.execFile);
const bin = path.join(__dirname, '../main');

const parseMac = stdout => {
	try {
		return JSON.parse(stdout);
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
	if (options.accessibilityPermission === false) {
		args.push('--no-accessibility-permission');
	}

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
	return parseMac(stdout);
};

module.exports.getOpenWindowsSync = options => {
	const stdout = childProcess.execFileSync(bin, [...getArguments(options), '--open-windows-list'], {encoding: 'utf8'});
	return parseMac(stdout);
};
