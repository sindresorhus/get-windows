'use strict';
const path = require('path');
const childProcess = require('child_process');
const pify = require('pify');
const bin = path.join(__dirname, 'main');

function parse(stdout) {
	const parts = stdout.trim().split('\n');

	return {
		title: parts[0] || null,
		id: Number(parts[1]),
		app: parts[2],
		pid: Number(parts[3])
	};
}

module.exports = () => {
	if (process.platform !== 'darwin') {
		return Promise.reject(new Error('OS X only'));
	}

	return pify(childProcess.execFile)(bin).then(parse);
};

module.exports.sync = () => {
	if (process.platform !== 'darwin') {
		throw new Error('OS X only');
	}

	return parse(childProcess.execFileSync(bin, {encoding: 'utf8'}));
};
