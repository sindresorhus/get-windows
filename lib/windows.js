import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import preGyp from '@mapbox/node-pre-gyp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getAddon = () => {
	const require = createRequire(import.meta.url);

	const bindingPath = preGyp.find(path.resolve(path.join(__dirname, '../package.json')));

	return (fs.existsSync(bindingPath))
		? require(bindingPath)
		: {
			getActiveWindow() {},
			getOpenWindows() {},
		};
};

// The native addon reports "no result" as `null`, and the fallback for a missing binding reports it as `undefined`. Neither is what the public API promises, so normalize both here.
export async function activeWindow() {
	return getAddon().getActiveWindow() ?? undefined;
}

export function activeWindowSync() {
	return getAddon().getActiveWindow() ?? undefined;
}

export function openWindows() {
	return getAddon().getOpenWindows() ?? [];
}

export function openWindowsSync() {
	return getAddon().getOpenWindows() ?? [];
}
