import childProcess from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

// The macOS binary prints `null` when it has no result, both for the active window and for an empty
// open window list, and `JSON.parse` hands that back as `null`. Neither return type allows `null`,
// so the wrapper has to normalize it. Stubbing the binary is the only way to reach that output
// deterministically, since it needs a frontmost window to produce anything else.

// `lib/macos.js` resolves `promisify(childProcess.execFile)` once, when the module is first
// imported, so the stub has to be installed before the import below.
childProcess.execFile = (...parameters) => {
	parameters.at(-1)(null, {stdout: 'null\n'});
};

childProcess.execFileSync = () => 'null\n';

const {activeWindow, activeWindowSync, openWindows, openWindowsSync} = await import('./lib/macos.js');

test('activeWindow returns undefined when the binary has no result', async () => {
	assert.equal(await activeWindow(), undefined);
});

test('activeWindowSync returns undefined when the binary has no result', () => {
	assert.equal(activeWindowSync(), undefined);
});

test('openWindows returns an empty array when the binary has no result', async () => {
	assert.deepEqual(await openWindows(), []);
});

test('openWindowsSync returns an empty array when the binary has no result', () => {
	assert.deepEqual(openWindowsSync(), []);
});
