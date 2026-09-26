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
		const macos = await import('./lib/macos.js');
		return macos.activeWindow(options);
	}

	if (process.platform === 'linux') {
		const linux = await import('./lib/linux.js');
		return linux.activeWindow(options);
	}

	if (process.platform === 'win32') {
		const windows = await import('./lib/windows.js');
		return windows.activeWindow(options);
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
		const macos = await import('./lib/macos.js');
		return macos.openWindows(options);
	}

	if (process.platform === 'linux') {
		const linux = await import('./lib/linux.js');
		return linux.openWindows(options);
	}

	if (process.platform === 'win32') {
		const windows = await import('./lib/windows.js');
		return windows.openWindows(options);
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

// Note to self: The `main` field in package.json is required for pre-gyp.
