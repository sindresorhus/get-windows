'use strict';
const {promisify} = require('util');
const fs = require('fs');
const childProcess = require('child_process');

const execFile = promisify(childProcess.execFile);
const readFile = promisify(fs.readFile);
const readlink = promisify(fs.readlink);

const xpropBin = 'xprop';
const xwininfoBin = 'xwininfo';
const xpropActiveArgs = ['-root', '\t$0', '_NET_ACTIVE_WINDOW'];
const xpropDetailsArgs = ['-id'];

const processOutput = output => {
	const result = {};

	for (const row of output.trim().split('\n')) {
		if (row.includes('=')) {
			const [key, value] = row.split('=');
			result[key.trim()] = value.trim();
		} else if (row.includes(':')) {
			const [key, value] = row.split(':');
			result[key.trim()] = value.trim();
		}
	}

	return result;
};

const parseLinux = ({stdout, boundsStdout, activeWindowId}) => {
	const result = processOutput(stdout);
	const bounds = processOutput(boundsStdout);

	const windowIdProperty = 'WM_CLIENT_LEADER(WINDOW)';
	const resultKeys = Object.keys(result);
	const windowId = (resultKeys.indexOf(windowIdProperty) > 0 &&
		parseInt(result[windowIdProperty].split('#').pop(), 16)) || activeWindowId;

	const processId = parseInt(result['_NET_WM_PID(CARDINAL)'], 10);

	if (Number.isNaN(processId)) {
		throw new Error('Failed to parse process ID'); // eslint-disable-line unicorn/prefer-type-error
	}

	return {
		platform: 'linux',
		title: JSON.parse(result['_NET_WM_NAME(UTF8_STRING)'] || result['WM_NAME(STRING)']) || null,
		id: windowId,
		owner: {
			name: JSON.parse(result['WM_CLASS(STRING)'].split(',').pop()),
			processId
		},
		bounds: {
			x: parseInt(bounds['Absolute upper-left X'], 10),
			y: parseInt(bounds['Absolute upper-left Y'], 10),
			width: parseInt(bounds.Width, 10),
			height: parseInt(bounds.Height, 10)
		}
	};
};

const getActiveWindowId = activeWindowIdStdout => parseInt(activeWindowIdStdout.split('\t')[1], 16);

const getMemoryUsageByPid = async pid => {
	const statm = await readFile(`/proc/${pid}/statm`, 'utf8');
	return parseInt(statm.split(' ')[1], 10) * 4096;
};

const getMemoryUsageByPidSync = pid => {
	const statm = require('fs').readFileSync(`/proc/${pid}/statm`, 'utf8');
	return parseInt(statm.split(' ')[1], 10) * 4096;
};

const getPathByPid = pid => {
	return readlink(`/proc/${pid}/exe`);
};

const getPathByPidSync = pid => {
	return fs.readlinkSync(`/proc/${pid}/exe`);
};

module.exports = async () => {
	try {
		const {stdout: activeWindowIdStdout} = await execFile(xpropBin, xpropActiveArgs);
		const activeWindowId = getActiveWindowId(activeWindowIdStdout);

		if (!activeWindowId) {
			return;
		}

		const [{stdout}, {stdout: boundsStdout}] = await Promise.all([
			execFile(xpropBin, xpropDetailsArgs.concat([activeWindowId])),
			execFile(xwininfoBin, xpropDetailsArgs.concat([activeWindowId]))
		]);

		const data = parseLinux({
			activeWindowId,
			boundsStdout,
			stdout
		});
		const [memoryUsage, path] = await Promise.all([
			getMemoryUsageByPid(data.owner.processId),
			getPathByPid(data.owner.processId)
		]);
		data.memoryUsage = memoryUsage;
		data.owner.path = path;
		return data;
	} catch (_) {
		return undefined;
	}
};

module.exports.sync = () => {
	try {
		const activeWindowIdStdout = childProcess.execFileSync(xpropBin, xpropActiveArgs, {encoding: 'utf8'});
		const activeWindowId = getActiveWindowId(activeWindowIdStdout);

		if (!activeWindowId) {
			return;
		}

		const stdout = childProcess.execFileSync(xpropBin, xpropDetailsArgs.concat(activeWindowId), {encoding: 'utf8'});
		const boundsStdout = childProcess.execFileSync(xwininfoBin, xpropDetailsArgs.concat([activeWindowId]), {encoding: 'utf8'});

		const data = parseLinux({
			activeWindowId,
			boundsStdout,
			stdout
		});
		data.memoryUsage = getMemoryUsageByPidSync(data.owner.processId);
		data.owner.path = getPathByPidSync(data.owner.processId);
		return data;
	} catch (_) {
		return undefined;
	}
};
