'use strict';
const path = require('path');
const util = require('util');
const childProcess = require('child_process');

const execFile = util.promisify(childProcess.execFile);
const bin = path.join(__dirname, '../bin/active-win-win32.exe');

const parseJSON = stdout => {
	try {
		return JSON.parse(stdout);
	} catch (error) {
		console.error(error);
		throw new Error('Error parsing window data');
	}
};

module.exports = async () => {
	const {stdout} = await execFile(bin);
	return parseMac(stdout);
};

module.exports.sync = () => parseJSON(childProcess.execFileSync(bin, {encoding: 'utf8'}));
