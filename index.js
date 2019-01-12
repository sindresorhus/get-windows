'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const childProcess = require('child_process');
const execFile = util.promisify(childProcess.execFile);
const exists = util.promisify(fs.exists);

const bin = path.join(__dirname, `../bin/active-win-${process.platform}`);

let found = undefined;

const parseJSON = text => {
	try {
		return JSON.parse(text);
	} catch (error) {
		console.error(error);
		throw new Error('Error parsing data');
	}
};

function getCmdWithArgs() {
	found = found || (found === undefined ? found = exists(bin) : found);

	if (!found) {
		throw new Error('macOS, Linux, and Windows only');
	}

	let cmd = bin;
	let args = [];

	if (process.platform === 'linux') {
		[cmd, args] = [process.argv[0], [bin]];
	}

	return [cmd, args];
}

module.exports = () => {
	let [cmd, args] = getCmdWithArgs();
	return execFile(cmd, args).then(parseJSON);
};

module.exports.sync = () => {
	let [cmd, args] = getCmdWithArgs();
	return parseJSON(childProcess.execFileSync(cmd, args, { encoding: 'utf8' }));
};
