import {inspect} from 'node:util';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	activeWindow,
	activeWindowSync,
	openWindows,
	openWindowsSync,
} from './index.js';

// `assertShape` holds the assertions, which `node-test/require-assertion` cannot see through. And
// `t.assert` only exists from Node.js 22.3, so using it would mean publishing an `engines` floor
// that the library itself does not need.
/* eslint-disable node-test/require-assertion, node-test/prefer-test-context-assert -- Shared assertion helper, and the package supports Node.js 22.0. */

// The macOS binary exits with an error unless the process is trusted for screen recording and
// accessibility, which a headless runner never is. Both checks are optional in the public API;
// skipping them only costs the window title and the active browser tab URL. Every other field is
// still read from the window server.
const options = {
	accessibilityPermission: false,
	screenRecordingPermission: false,
};

// Under `screenRecordingPermission: false` the binary hard-codes the title to `''`, so the
// `title` assertion below cannot fail and is not coverage of title handling. Everything else
// asserted here is still read from the window server on each call.
const assertShape = result => {
	assert.equal(typeof result, 'object');
	assert.equal(typeof result.title, 'string');
	assert.equal(typeof result.id, 'number');
	assert.equal(typeof result.memoryUsage, 'number');
	assert.equal(typeof result.bounds, 'object');
	assert.equal(typeof result.bounds.x, 'number');
	assert.equal(typeof result.bounds.y, 'number');
	assert.equal(typeof result.bounds.width, 'number');
	assert.equal(typeof result.bounds.height, 'number');
	assert.equal(typeof result.owner, 'object');
	assert.equal(typeof result.owner.name, 'string');
	assert.equal(typeof result.owner.processId, 'number');
};

test('activeWindow', async t => {
	const result = await activeWindow(options);
	t.diagnostic(inspect(result));

	// `activeWindow` resolves to nothing when no window is frontmost, which is a documented
	// outcome and is what a process without a window server session sees.
	if (result === null || result === undefined) {
		return;
	}

	assertShape(result);
});

test('activeWindowSync', t => {
	const result = activeWindowSync(options);
	t.diagnostic(inspect(result));

	if (result === null || result === undefined) {
		return;
	}

	assertShape(result);
});

test('openWindows', async t => {
	const results = await openWindows(options);
	t.diagnostic(inspect(results));

	assert.ok(Array.isArray(results));
	assert.ok(results.length > 0, 'expected at least one open window');

	for (const result of results) {
		assertShape(result);
	}
});

test('openWindowsSync', t => {
	const results = openWindowsSync(options);
	t.diagnostic(inspect(results));

	assert.ok(Array.isArray(results));
	assert.ok(results.length > 0, 'expected at least one open window');

	for (const result of results) {
		assertShape(result);
	}
});

// `activeWindow` reads the window belonging to the frontmost app, and `openWindows` lists every
// window on screen, so whenever there is a frontmost window it has to be one of the listed ones.
// This is the one assertion that ties the two macOS code paths together. It does not rescue the
// two `activeWindow` tests above: on a machine with no frontmost window all three return early, so
// on such a machine none of them asserts anything about the active window.
test('the active window is one of the open windows', async t => {
	const active = await activeWindow(options);

	if (active === null || active === undefined) {
		t.diagnostic('no frontmost window, nothing to compare');
		return;
	}

	const open = await openWindows(options);
	t.diagnostic(inspect({active, open}));

	assert.ok(
		open.some(result => result.id === active.id),
		`the active window ${active.id} is missing from the open windows`,
	);
});
/* eslint-enable node-test/require-assertion, node-test/prefer-test-context-assert -- See the disable at the top of this file. */
