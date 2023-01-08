'use strict';

const url_capture_api = require('bindings')('url_capture_api');

module.exports = options => {
	if (process.platform === 'darwin') {
		return require('./lib/macos.js')(options);
	}

	if (process.platform === 'linux') {
		return require('./lib/linux.js')(options);
	}

	if (process.platform === 'win32') {
		const res = require('./lib/macos.js')(options);
		const url = url_capture_api.get_last_url();
		return {
			...res,
			url
		};
	}

	return Promise.reject(new Error('macOS, Linux, and Windows only'));
};

module.exports.sync = options => {
	if (process.platform === 'darwin') {
		return require('./lib/macos.js').sync(options);
	}

	if (process.platform === 'linux') {
		return require('./lib/linux.js').sync(options);
	}

	if (process.platform === 'win32') {
		const res = require('./lib/windows.js').sync(options);
		const url = url_capture_api.get_last_url();
		return {
			...res,
			url
		};
	}

	throw new Error('macOS, Linux, and Windows only');
};

module.exports.start = () => {
	if (process.platform === 'windows') {
		return url_capture_api.start;
	}

	throw new Error('Windows only');
}

module.exports.stop = () => {
	if (process.platform === 'windows') {
		return url_capture_api.stop;
	}

	throw new Error('Windows only');
}

module.exports.getOpenWindows = options => {
	if (process.platform === 'darwin') {
		return require('./lib/macos.js').getOpenWindows(options);
	}

	if (process.platform === 'linux') {
		return require('./lib/linux.js').getOpenWindows(options);
	}

	if (process.platform === 'win32') {
		return require('./lib/windows.js').getOpenWindows(options);
	}

	return Promise.reject(new Error('macOS, Linux, and Windows only'));
};

module.exports.getOpenWindowsSync = options => {
	if (process.platform === 'darwin') {
		return require('./lib/macos.js').getOpenWindowsSync(options);
	}

	if (process.platform === 'linux') {
		return require('./lib/linux.js').getOpenWindowsSync(options);
	}

	if (process.platform === 'win32') {
		return require('./lib/windows.js').getOpenWindowsSync(options);
	}

	throw new Error('macOS, Linux, and Windows only');
};
