'use strict';

const url_capture_api = require('bindings')('url_capture_api');


const CHROME = 'Google Chrome';
const FIREFOX = 'Firefox';
const EDGE = 'Microsoft Edge';
const BRAVE = 'Brave Browser';
const OPERA_1 = 'Opera';
const OPERA_2 = 'Opera Internet Browser';
const browserList = [CHROME, FIREFOX, EDGE, BRAVE, OPERA_1, OPERA_2];

module.exports = options => {
	if (process.platform === 'darwin') {
		return require('./lib/macos.js')(options);
	}

	if (process.platform === 'linux') {
		return require('./lib/linux.js')(options);
	}

	if (process.platform === 'win32') {
		return new Promise((resolve, reject) => {
			require('./lib/windows.js')(options).then(res => {
				if (browserList.includes(res.owner.name)) {
					const url = url_capture_api.get_last_url();
					resolve({
						...res,
						url
					});
				} else {
					resolve(res);
				}
			}).catch(err => reject(err));
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
		const res = require('./lib/windows.js').sync(options);
		if (browserList.includes(res.owner.name)) {
			const url = url_capture_api.get_last_url();
			return {
				...res,
				url
			};
		}
		return res;
	}

	throw new Error('macOS, Linux, and Windows only');
};

module.exports.start = () => {
	if (process.platform === 'win32') {
		return url_capture_api.start();
	}

	throw new Error('Windows only');
}

module.exports.stop = () => {
	if (process.platform === 'win32') {
		return url_capture_api.stop();
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
