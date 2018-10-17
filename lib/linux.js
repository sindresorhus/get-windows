'use strict';
const util = require('util');
const childProcess = require('child_process');

const execFile = util.promisify(childProcess.execFile);
const xpropBin = 'xprop';
const xpropActiveArgs = ['-root', '\t$0', '_NET_ACTIVE_WINDOW'];
const xpropDetailsArgs = ['-id'];

const parseLinux = linuxData => {
	const {stdout, activeWindowId} = linuxData;

	const result = {};
	for (const row of stdout.trim().split('\n')) {
		if (row.includes('=')) {
			const [key, value] = row.split('=');
			result[key.trim()] = value.trim();
		} else if (row.includes(':')) {
			const [key, value] = row.split(':');
			result[key.trim()] = value.trim();
		}
	}

	const windowIdProperty = 'WM_CLIENT_LEADER(WINDOW)';
	const resultKeys = Object.keys(result);
	const windowId = (resultKeys.indexOf(windowIdProperty) > 0 &&
		parseInt(result[windowIdProperty].split('#').pop(), 16)) || activeWindowId;

	return {
		title: JSON.parse(result['_NET_WM_NAME(UTF8_STRING)']) || null,
		id: windowId,
		owner: {
			name: JSON.parse(result['WM_CLASS(STRING)'].split(',').pop()),
			processId: parseInt(result['_NET_WM_PID(CARDINAL)'], 10)
		}
	};
};

const getActiveWindowId = activeWindowIdStdout => parseInt(activeWindowIdStdout.split('\t')[1], 16);

module.exports = async () => {
	const {stdout: activeWindowIdStdout} = await execFile(xpropBin, xpropActiveArgs);
	const activeWindowId = getActiveWindowId(activeWindowIdStdout);
	const {stdout} = await execFile(xpropBin, xpropDetailsArgs.concat(activeWindowId));

	return parseLinux({
		activeWindowId,
		stdout
	});
};

module.exports.sync = () => {
	const activeWindowIdStdout = childProcess.execFileSync(xpropBin, xpropActiveArgs, {encoding: 'utf8'});
	const activeWindowId = getActiveWindowId(activeWindowIdStdout);
	const stdout = childProcess.execFileSync(xpropBin, xpropDetailsArgs.concat(activeWindowId), {encoding: 'utf8'});

	return parseLinux({
		activeWindowId,
		stdout
	});
};
