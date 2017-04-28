'use strict';
const path = require('path');
const childProcess = require('child_process');
const pify = require('pify');

const bin = path.join(__dirname, 'main');
const xpropBin = 'xprop';
const xpropActiveArgs = ['-root', '\t$0', '_NET_ACTIVE_WINDOW'];
const xpropDetailsArgs = ['-id'];

const parseMac = stdout => {
	const parts = stdout.trimRight().split('\n');

	return {
		title: parts[0],
		id: Number(parts[1]),
		app: parts[2],
		pid: Number(parts[3])
	};
};

const parseLinux = linuxData => {
	const stdout = linuxData.stdout;
	const activeWindowId = linuxData.activeWindowId;

	const result = {};
	for (const row of stdout.trim().split('\n')) {
		if (row.includes('=')) {
			const parts = row.split('=');
			result[parts[0].trim()] = parts[1].trim();
		} else if (row.includes(':')) {
			const parts = row.split(':');
			result[parts[0].trim()] = parts[1].trim();
		}
	}

	const windowIdProperty = 'WM_CLIENT_LEADER(WINDOW)';
	const resultKeys = Object.keys(result);
	const windowId = (resultKeys.indexOf(windowIdProperty) > 0 &&
		parseInt(result[windowIdProperty].split('#').pop(), 16)) || activeWindowId;

	return {
		title: JSON.parse(result['_NET_WM_NAME(UTF8_STRING)']) || null,
		id: windowId,
		app: JSON.parse(result['WM_CLASS(STRING)'].split(',').pop()),
		pid: parseInt(result['_NET_WM_PID(CARDINAL)'], 10)
	};
};

const getActiveWindowId = activeWindowIdStdout => parseInt(activeWindowIdStdout.split('\t')[1], 16);

module.exports = () => {
	if (process.platform === 'darwin') {
		return pify(childProcess.execFile)(bin).then(parseMac);
	} else if (process.platform === 'linux') {
		return pify(childProcess.execFile)(xpropBin, xpropActiveArgs).then(
			activeWindowIdStdout => {
				const activeWindowId = getActiveWindowId(activeWindowIdStdout);
				return pify(childProcess.execFile)(xpropBin, xpropDetailsArgs.concat(activeWindowId)).then(stdout => {
					return {
						activeWindowId,
						stdout
					};
				});
			}
		).then(parseLinux);
	} else if (process.platform === 'win32') {
		const windows = require('./windows');
		return Promise.resolve(windows());
	}
	return Promise.reject(new Error('macOS, Linux, and Windows only'));
};

module.exports.sync = () => {
	if (process.platform === 'darwin') {
		return parseMac(childProcess.execFileSync(bin, {encoding: 'utf8'}));
	} else if (process.platform === 'linux') {
		const activeWindowIdStdout = childProcess.execFileSync(xpropBin, xpropActiveArgs, {encoding: 'utf8'});
		const activeWindowId = getActiveWindowId(activeWindowIdStdout);
		const stdout = childProcess.execFileSync(xpropBin, xpropDetailsArgs.concat(activeWindowId), {encoding: 'utf8'});
		return parseLinux({
			activeWindowId,
			stdout
		});
	} else if (process.platform === 'win32') {
		const windows = require('./windows');
		return windows();
	}

	throw new Error('macOS, Linux, and Windows only');
};
