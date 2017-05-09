'use strict';

module.exports = () => {
	if (process.platform === 'darwin') {
		return require('./lib/macos')();
	} else if (process.platform === 'linux') {
		return require('./lib/linux')();
	} else if (process.platform === 'win32') {
		return require('./lib/windows')();
	}

	return Promise.reject(new Error('macOS, Linux, and Windows only'));
};

module.exports.sync = () => {
	if (process.platform === 'darwin') {
		return require('./lib/macos').sync();
	} else if (process.platform === 'linux') {
		return require('./lib/linux').sync();
	} else if (process.platform === 'win32') {
		return require('./lib/windows').sync();
	}

	throw new Error('macOS, Linux, and Windows only');
};
