'use strict';

const UNSUPPORTED_PLATFORM_ERROR_MESSAGE = 'macOS, Linux, and Windows only';

module.exports = () => {
	if (process.platform === 'darwin') {
		return require('./lib/macos')();
	}

	if (process.platform === 'linux') {
		return require('./lib/linux')();
	}

	if (process.platform === 'win32') {
		return require('./lib/windows')();
	}

	return Promise.reject(new Error(PLATFORM_NOT_RECOGNIZED_ERROR));
};

module.exports.sync = () => {
	if (process.platform === 'darwin') {
		return require('./lib/macos').sync();
	}

	if (process.platform === 'linux') {
		return require('./lib/linux').sync();
	}

	if (process.platform === 'win32') {
		return require('./lib/windows').sync();
	}

	throw new Error(PLATFORM_NOT_RECOGNIZED_ERROR);
};

module.exports.isAccessGranted = () => {
	switch (process.platform) {
		case 'darwin': {
			// MAC OS needs specific accesses to get the active window. These accesses are
			// resolved by the isAccessGranted method of the macos lib
			return require('./lib/macos').isAccessGranted();
		}

		case 'linux':
		case 'win32': {
			// Linux and Windows do not need specific access to get the active window, set all to true
			return {
				all: true,
				screen: true,
				accessibility: true
			};
		}

		default: {
			throw new Error(PLATFORM_NOT_RECOGNIZED_ERROR);
		}
	}
};
