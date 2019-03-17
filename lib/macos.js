'use strict';
const path = require('path');
const util = require('util');
const childProcess = require('child_process');

const execFile = util.promisify(childProcess.execFile);
const bin = path.join(__dirname, '../main');

const parseMac = stdout => {
	try {
		return {platform: 'darwin', ...JSON.parse(stdout)};
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
