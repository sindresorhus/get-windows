'use strict';

let urlCaptureApi = null;
if (process.platform === 'win32') {
	urlCaptureApi = require('bindings')('url_capture_api');
}

const CHROME = 'Google Chrome';
const FIREFOX = 'Firefox';
const EDGE = 'Microsoft Edge';
const BRAVE = 'Brave Browser';
const OPERA_1 = 'Opera';
const OPERA_2 = 'Opera Internet Browser';

const browserList = new Set([CHROME, FIREFOX, EDGE, BRAVE, OPERA_1, OPERA_2]);

module.exports = options => {
	if (process.platform === 'darwin') {
		return require('./lib/macos.js')(options);
	}

	if (process.platform === 'linux') {
		return require('./lib/linux.js')(options);
	}

	if (process.platform === 'win32') {
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line promise/prefer-await-to-then
			require('./lib/windows.js')(options).then(response => {
				if (browserList.has(response.owner.name)) {
					const url = urlCaptureApi.get_last_url();
					resolve({
						...response,
						url
					});
				} else {
					resolve(response);
				}
			}).catch(reject);
		});
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
		const response = require('./lib/windows.js').sync(options);
		if (!browserList.has(response.owner.name)) {
			return response;
		}

		const url = urlCaptureApi.get_last_url();
		return {
			...response,
			url
		};
	}

	throw new Error('macOS, Linux, and Windows only');
};

module.exports.start = () => {
	if (process.platform === 'win32') {
		return urlCaptureApi.start();
	}

	throw new Error('Windows only');
};

module.exports.stop = () => {
	if (process.platform === 'win32') {
		return urlCaptureApi.stop();
	}

	throw new Error('Windows only');
};

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
