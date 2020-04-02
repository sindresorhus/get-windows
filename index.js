'use strict';

module.exports = options => {
	if (process.platform === 'darwin') {
		return require('./lib/macos')(options);
	}

	if (process.platform === 'linux') {
		return require('./lib/linux')(options);
	}

	if (process.platform === 'win32') {
		return require('./lib/windows')(options);
	}

	return Promise.reject(new Error('macOS, Linux, and Windows only'));
};

module.exports.sync = options => {
	if (process.platform === 'darwin') {
		return require('./lib/macos').sync(options);
	}

	if (process.platform === 'linux') {
		return require('./lib/linux').sync(options);
	}

	if (process.platform === 'win32') {
		return require('./lib/windows').sync(options);
	}

	throw new Error('macOS, Linux, and Windows only');
};
