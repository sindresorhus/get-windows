'use strict';
const path = require('path');
const {promisify} = require('util');
const childProcess = require('child_process');

const execFile = promisify(childProcess.execFile);
const bin = path.join(__dirname, '../main');

const checkForUrlInTitle = result => {
	const windowTitle = result.title;
	let windowTitleUrlIndex = -1;

	// Check to see if the URL is in the window title.
	const SEPARATOR = ' - ';
	const windowTitleAsArray = windowTitle.split(SEPARATOR);
	const regexURL = new RegExp(/^(https?|http):\/\/[^\s$.?#].[^\s]*$/g);

	windowTitleAsArray.forEach((subtitle, index) => {
		if (regexURL.test(subtitle)) {
			result.url = subtitle;
			windowTitleUrlIndex = index;
		}
	});

	if (windowTitleUrlIndex > -1) {
		const arrayBeforeUrl = windowTitleAsArray.slice(0, windowTitleUrlIndex);
		const arrayAfterUrl = windowTitleAsArray.slice(windowTitleUrlIndex + 1);
		result.title = [...arrayBeforeUrl, ...arrayAfterUrl].join(SEPARATOR);
	}

	return result;
}

const parseMac = stdout => {
	try {
		const result = JSON.parse(stdout);
		if (result !== null) {
			result.platform = 'macos';
			return checkForUrlInTitle(result);
		}
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
