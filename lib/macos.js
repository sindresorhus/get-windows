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

module.exports = async () => {
	const {stdout} = await execFile(bin);
	return parseMac(stdout);
};

module.exports.sync = () => parseMac(childProcess.execFileSync(bin, {encoding: 'utf8'}));
