'use strict';
const path = require('path');
const {promisify} = require('util');
const childProcess = require('child_process');

const execFile = promisify(childProcess.execFile);
const activeWinBin = path.join(__dirname, '../main');
const isAccessGrantedBin = path.join(__dirname, '../is-access-granted');
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

const isAccessGranted = () => {
	let result = childProcess.execFileSync(isAccessGrantedBin);
	try {
		result = JSON.parse(result);
	} catch (error) {
		console.error(error);
		throw new Error('Error parsing access granted data');
	}

	return result.isAccessibilityGranted && result.isScreenRecordingGranted;
};

module.exports = async () => {
	const {stdout} = await execFile(activeWinBin);
	return parseMac(stdout);
};

module.exports.sync = () => parseMac(childProcess.execFileSync(activeWinBin, {encoding: 'utf8'}));
module.exports.isAccessGranted = isAccessGranted;
