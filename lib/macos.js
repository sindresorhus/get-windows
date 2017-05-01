'use strict';
const path = require('path');
const childProcess = require('child_process');
const pify = require('pify');

const bin = path.join(__dirname, '../main');

const parseMac = stdout => {
	const parts = stdout.trimRight().split('\n');

	return {
		title: parts[0],
		id: Number(parts[1]),
		app: parts[2],
		pid: Number(parts[3])
	};
};

module.exports = () => pify(childProcess.execFile)(bin).then(parseMac);
module.exports.sync = () => parseMac(childProcess.execFileSync(bin, {encoding: 'utf8'}));
