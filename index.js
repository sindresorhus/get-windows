import process from 'node:process';
import {
	activeWindowSync as activeWindowSyncMacOS,
	openWindowsSync as openWindowsSyncMacOS,
} from './lib/macos.js';
import {
	activeWindowSync as activeWindowSyncLinux,
	openWindowsSync as openWindowsSyncLinux,
} from './lib/linux.js';
import {
	activeWindowSync as activeWindowSyncWindows,
	openWindowsSync as openWindowsSyncWindows,
} from './lib/windows.js';

export async function activeWindow(options) {
	if (process.platform === 'darwin') {
		const {activeWindow} = await import('./lib/macos.js');
		return activeWindow(options);
	}

	if (process.platform === 'linux') {
		const {activeWindow} = await import('./lib/linux.js');
		return activeWindow(options);
	}

	if (process.platform === 'win32') {
		const {activeWindow} = await import('./lib/windows.js');
		return activeWindow(options);
	}

	throw new Error('macOS, Linux, and Windows only');
}

export function activeWindowSync(options) {
	if (process.platform === 'darwin') {
		return activeWindowSyncMacOS(options);
	}

	if (process.platform === 'linux') {
		return activeWindowSyncLinux(options);
	}

	if (process.platform === 'win32') {
		return activeWindowSyncWindows(options);
	}

	throw new Error('macOS, Linux, and Windows only');
}

export async function openWindows(options) {
	if (process.platform === 'darwin') {
		const {openWindows} = await import('./lib/macos.js');
		return openWindows(options);
	}

	if (process.platform === 'linux') {
		const {openWindows} = await import('./lib/linux.js');
		return openWindows(options);
	}

	if (process.platform === 'win32') {
		const {openWindows} = await import('./lib/windows.js');
		return openWindows(options);
	}

	throw new Error('macOS, Linux, and Windows only');
}

export function openWindowsSync(options) {
	if (process.platform === 'darwin') {
		return openWindowsSyncMacOS(options);
	}

	if (process.platform === 'linux') {
		return openWindowsSyncLinux(options);
	}

	if (process.platform === 'win32') {
		return openWindowsSyncWindows(options);
	}

	throw new Error('macOS, Linux, and Windows only');
}

// Note to self: The `main` field in package.json is requried for pre-gyp.
