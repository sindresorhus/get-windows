'use strict';

module.exports = () => {
	if (process.platform === 'darwin') {
		const macos = require('./lib/macos');
		return macos();
	} else if (process.platform === 'linux') {
		const linux = require('./lib/linux');
		return linux();
	} else if (process.platform === 'win32') {
		const windows = require('./lib/windows');
		return windows();
	}

	return Promise.reject(new Error('macOS, Linux, and Windows only'));
};

module.exports.sync = () => {
	if (process.platform === 'darwin') {
		const macos = require('./lib/macos');
		return macos.sync();
	} else if (process.platform === 'linux') {
		const linux = require('./lib/linux');
		return linux.sync();
	} else if (process.platform === 'win32') {
		const windows = require('./lib/windows');
		return windows.sync();
	}

	throw new Error('macOS, Linux, and Windows only');
};
