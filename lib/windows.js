import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import preGyp from '@mapbox/node-pre-gyp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getAddon = () => {
	const require = createRequire(import.meta.url);

	const bindingPath = preGyp.find(path.resolve(path.join(__dirname, '../package.json')));

	return (fs.existsSync(bindingPath)) ? require(bindingPath) : {
		getActiveWindow() {},
		getOpenWindows() {},
	};
};

export async function activeWindow() {
	return getAddon().getActiveWindow();
}

export function activeWindowSync() {
	return getAddon().getActiveWindow();
}

export function openWindows() {
	return getAddon().getOpenWindows();
}

export function openWindowsSync() {
	return getAddon().getOpenWindows();
}
