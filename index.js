'use strict';

const PLATFORM_NOT_RECOGNIZED_ERROR = 'macOS, Linux, and Windows only';

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
			const result = require('./lib/macos').isAccessGranted();
			result.platform = 'macos';
			return result;
		}

		case 'linux': {
			// Linux does not need specific access to get the active window
			return {
				platform: 'linux',
				all: true
			};
		}

		// Windows does not need specific access to get the active window
		case 'win32': {
			return {
				patform: 'windows',
				all: true
			};
		}

		default: {
			throw new Error(PLATFORM_NOT_RECOGNIZED_ERROR);
		}
	}
};
