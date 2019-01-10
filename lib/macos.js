'use strict';
const path = require('path');
const util = require('util');
const childProcess = require('child_process');

const execFile = util.promisify(childProcess.execFile);
const bin = path.join(__dirname, '../active-win-osx');

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
	return parseJSON(stdout);
};

module.exports.sync = () => parseMac(childProcess.execFileSync(bin, {encoding: 'utf8'}));
