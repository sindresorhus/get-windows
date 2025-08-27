import process from 'node:process';
import {promisify} from 'node:util';
import fs from 'node:fs';
import childProcess from 'node:child_process';

const execFile = promisify(childProcess.execFile);
const readFile = promisify(fs.readFile);
const readlink = promisify(fs.readlink);

const xpropBinary = 'xprop';
const xwininfoBinary = 'xwininfo';
const xpropActiveArguments = ['-root', '\t$0', '_NET_ACTIVE_WINDOW'];
const xpropOpenArguments = ['-root', '_NET_CLIENT_LIST_STACKING'];
const xpropDetailsArguments = ['-id'];

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

const decodeEscapedUtf8 = input => input.replaceAll(/(?:\\[0-7]{3})+/g, match => {
	const octets = match.match(/[0-7]{3}/g) ?? [];
	const bytes = new Uint8Array(octets.map(o => Number.parseInt(o, 8)));
	try {
		return new TextDecoder('utf8').decode(bytes);
	} catch {
		return match;
	}
});

// Xprop emits quoted strings where non-ASCII bytes are often represented as octal escapes
// like \342\200\224 for an en dash. JSON.parse cannot handle octal escapes, so we
// manually decode them into bytes and then into a UTF-8 string.
const extractQuotedStrings = value => {
	if (!value || typeof value !== 'string') {
		return [];
	}

	const matches = [];
	const regex = /"((?:[^"\\]|\\.)*)"/g;
	let match;
	while ((match = regex.exec(value)) !== null) {
		matches.push(match[1]);
	}

	return matches;
};

const decodeXPropertyComponent = component => {
	if (typeof component !== 'string') {
		return component;
	}

	return decodeEscapedUtf8(component)
		.replaceAll('\\"', '"')
		.replaceAll('\\\\', '\\')
		.replaceAll('\\n', '\n')
		.replaceAll('\\r', '\r')
		.replaceAll('\\t', '\t');
};

const decodeFirstQuoted = value => {
	const parts = extractQuotedStrings(value);
	if (parts.length === 0) {
		return undefined;
	}

	return decodeXPropertyComponent(parts[0]);
};

const decodeLastQuoted = value => {
	const parts = extractQuotedStrings(value);
	if (parts.length === 0) {
		return undefined;
	}

	return decodeXPropertyComponent(parts.at(-1));
};

const parseLinux = ({stdout, boundsStdout, activeWindowId}) => {
	const result = processOutput(stdout);
	const bounds = processOutput(boundsStdout);

	const windowIdProperty = 'WM_CLIENT_LEADER(WINDOW)';
	const resultKeys = Object.keys(result);
	const windowId = (resultKeys.indexOf(windowIdProperty) > 0
		&& Number.parseInt(result[windowIdProperty].split('#').pop(), 16)) || activeWindowId;

	const processId = Number.parseInt(result['_NET_WM_PID(CARDINAL)'], 10);

	if (Number.isNaN(processId)) {
		throw new Error('Failed to parse process ID'); // eslint-disable-line unicorn/prefer-type-error
	}

	return {
		platform: 'linux',
		title: decodeFirstQuoted(result['_NET_WM_NAME(UTF8_STRING)'] || result['WM_NAME(STRING)']) ?? null,
		id: windowId,
		owner: {
			name: decodeLastQuoted(result['WM_CLASS(STRING)']) ?? '',
			processId,
		},
		bounds: {
			x: Number.parseInt(bounds['Absolute upper-left X'], 10),
			y: Number.parseInt(bounds['Absolute upper-left Y'], 10),
			width: Number.parseInt(bounds.Width, 10),
			height: Number.parseInt(bounds.Height, 10),
		},
	};
};

const getActiveWindowId = activeWindowIdStdout => Number.parseInt(activeWindowIdStdout.split('\t')[1], 16);

const getMemoryUsageByPid = async pid => {
	const statm = await readFile(`/proc/${pid}/statm`, 'utf8');
	return Number.parseInt(statm.split(' ')[1], 10) * 4096;
};

const getMemoryUsageByPidSync = pid => {
	const statm = fs.readFileSync(`/proc/${pid}/statm`, 'utf8');
	return Number.parseInt(statm.split(' ')[1], 10) * 4096;
};

const getPathByPid = pid => readlink(`/proc/${pid}/exe`);

const getPathByPidSync = pid => {
	try {
		return fs.readlinkSync(`/proc/${pid}/exe`);
	} catch {}
};

async function getWindowInformation(windowId) {
	const [{stdout}, {stdout: boundsStdout}] = await Promise.all([
		execFile(xpropBinary, [...xpropDetailsArguments, windowId], {env: {...process.env, LC_ALL: 'C.utf8'}}),
		execFile(xwininfoBinary, [...xpropDetailsArguments, windowId]),
	]);

	const data = parseLinux({
		activeWindowId: windowId,
		boundsStdout,
		stdout,
	});
	const [memoryUsage, path] = await Promise.all([
		getMemoryUsageByPid(data.owner.processId),
		getPathByPid(data.owner.processId).catch(() => {}),
	]);
	data.memoryUsage = memoryUsage;
	data.owner.path = path;
	return data;
}

function getWindowInformationSync(windowId) {
	const stdout = childProcess.execFileSync(xpropBinary, [...xpropDetailsArguments, windowId], {encoding: 'utf8', env: {...process.env, LC_ALL: 'C.utf8'}});
	const boundsStdout = childProcess.execFileSync(xwininfoBinary, [...xpropDetailsArguments, windowId], {encoding: 'utf8'});

	const data = parseLinux({
		activeWindowId: windowId,
		boundsStdout,
		stdout,
	});
	data.memoryUsage = getMemoryUsageByPidSync(data.owner.processId);
	data.owner.path = getPathByPidSync(data.owner.processId);
	return data;
}

export async function activeWindow() {
	try {
		const {stdout: activeWindowIdStdout} = await execFile(xpropBinary, xpropActiveArguments);
		const activeWindowId = getActiveWindowId(activeWindowIdStdout);

		if (!activeWindowId) {
			return;
		}

		return getWindowInformation(activeWindowId);
	} catch {
		return undefined;
	}
}

export function activeWindowSync() {
	try {
		const activeWindowIdStdout = childProcess.execFileSync(xpropBinary, xpropActiveArguments, {encoding: 'utf8'});
		const activeWindowId = getActiveWindowId(activeWindowIdStdout);

		if (!activeWindowId) {
			return;
		}

		return getWindowInformationSync(activeWindowId);
	} catch {
		return undefined;
	}
}

export async function openWindows() {
	try {
		const {stdout: openWindowIdStdout} = await execFile(xpropBinary, xpropOpenArguments);

		// Get open windows Ids
		const windowsIds = openWindowIdStdout
			.split('#')[1]
			.trim()
			.replaceAll('\n', '')
			.split(',');

		if (!windowsIds || windowsIds.length === 0) {
			return [];
		}

		const openWindows = [];
		const failedWindows = [];

		for await (const windowId of windowsIds) {
			const id = windowId.trim();
			try {
				openWindows.push(await getWindowInformation(Number.parseInt(id, 16)));
			} catch (error) {
				failedWindows.push(id);
				if (process.env.DEBUG_GET_WINDOWS) {
					console.debug(`[get-windows] Failed to get information for window ${id}:`, error?.message ?? error);
				}
			}
		}

		if (failedWindows.length > 0 && process.env.DEBUG_GET_WINDOWS) {
			console.debug(`[get-windows] Successfully retrieved ${openWindows.length} windows, failed for ${failedWindows.length} windows`);
		}

		return openWindows;
	} catch (error) {
		if (process.env.DEBUG_GET_WINDOWS) {
			console.debug('[get-windows] Failed to execute xprop:', error?.message ?? error);
		}

		return undefined;
	}
}

export function openWindowsSync() {
	try {
		const openWindowIdStdout = childProcess.execFileSync(xpropBinary, xpropOpenArguments, {encoding: 'utf8'});
		const windowsIds = openWindowIdStdout
			.split('#')[1]
			.trim()
			.replaceAll('\n', '')
			.split(',');

		if (!windowsIds || windowsIds.length === 0) {
			return [];
		}

		const openWindows = [];
		const failedWindows = [];

		for (const windowId of windowsIds) {
			const id = windowId.trim();
			try {
				const windowInformation = getWindowInformationSync(Number.parseInt(id, 16));
				openWindows.push(windowInformation);
			} catch (error) {
				failedWindows.push(id);
				if (process.env.DEBUG_GET_WINDOWS) {
					console.debug(`[get-windows] Failed to get information for window ${id}:`, error?.message ?? error);
				}
			}
		}

		if (failedWindows.length > 0 && process.env.DEBUG_GET_WINDOWS) {
			console.debug(`[get-windows] Successfully retrieved ${openWindows.length} windows, failed for ${failedWindows.length} windows`);
		}

		return openWindows;
	} catch (error) {
		if (process.env.DEBUG_GET_WINDOWS) {
			console.debug('[get-windows] Failed to execute xprop:', error?.message ?? error);
		}

		return undefined;
	}
}
