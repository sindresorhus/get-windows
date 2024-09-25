import path from 'node:path';
import {promisify} from 'node:util';
import childProcess from 'node:child_process';
import {fileURLToPath} from 'node:url';
import process from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const execFile = promisify(childProcess.execFile);

let binary = path.join(__dirname, '../main');

// Detect if running in packaged mode using process.resourcesPath
const isPackaged = process.resourcesPath !== process.cwd();

if (isPackaged) {
	binary = path.join(process.resourcesPath, 'app.asar.unpacked','node_modules', 'get-windows', 'main');
}

const parseMac = stdout => {
	try {
		return JSON.parse(stdout);
	} catch (error) {
		console.error(error);
		throw new Error('Error parsing window data');
	}
};

const getArguments = options => {
	if (!options) {
		return [];
	}

	const arguments_ = [];
	if (options.accessibilityPermission === false) {
		arguments_.push('--no-accessibility-permission');
	}

	if (options.screenRecordingPermission === false) {
		arguments_.push('--no-screen-recording-permission');
	}

	return arguments_;
};

export async function activeWindow(options) {
	const {stdout} = await execFile(binary, getArguments(options));
	return parseMac(stdout);
}

export function activeWindowSync(options) {
	const stdout = childProcess.execFileSync(binary, getArguments(options), {encoding: 'utf8'});
	return parseMac(stdout);
}

export async function openWindows(options) {
	const {stdout} = await execFile(binary, [...getArguments(options), '--open-windows-list']);
	return parseMac(stdout);
}

export function openWindowsSync(options) {
	const stdout = childProcess.execFileSync(binary, [...getArguments(options), '--open-windows-list'], {encoding: 'utf8'});
	return parseMac(stdout);
}
