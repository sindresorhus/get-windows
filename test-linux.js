import childProcess from 'node:child_process';
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

// The first two tests assert through the shared `asserter` helper, which the static
// `node-test/require-assertion` check cannot see through.
/* eslint-disable node-test/require-assertion -- Assertions are in the shared `asserter` helper. */

// A window id goes straight into the `xprop`/`xwininfo` argv, so a value that is not a plain
// positive integer would be read as a flag or as something the binary cannot parse. Ids are
// parsed out of `xprop` output with `Number.parseInt`, and X does not type-check root properties
// against the EWMH spec, so any local X client can put arbitrary bytes in `_NET_CLIENT_LIST_STACKING`.
// The entries below become 0, 54525960, -255, and NaN. Only 54525960 is a real window id, so the
// other three must never reach a child process. Note that `abc` would not have worked here, since
// `Number.parseInt('abc', 16)` is a well formed 2748.
const validWindowId = 54_525_960; // 0x3400008

const invalidWindowIds = new Set([0, -255, NaN]);

const xpropOpenWindowsOutput = '_NET_CLIENT_LIST_STACKING(ARRAY) = # 0x0\n0x3400007, 0x3400008, -ff, zzz\n';

// The root query is the one the failure tests below replace, so it can't be the fixed fixture above.
let rootQueryOutput = xpropOpenWindowsOutput;

// `xprop` writes every byte of a non-ASCII title as an octal escape, so the title below is
// `«Café» \slash "end"` and reaches `parseLinux` as ASCII. Decoding it is the whole reason the
// fixture title is not plain text.
const windowTitle = String.raw`«Café» \slash "end"`;

const xpropDetailsOutput = [
	String.raw`_NET_WM_NAME(UTF8_STRING) = "\302\253Caf\303\251\302\273 \\slash \"end\""`,
	'WM_CLIENT_LEADER(WINDOW) = window id # 0x3400008',
	'_NET_WM_PID(CARDINAL) = 4242',
	'WM_CLASS(STRING) = "test", "Test"',
	'',
].join('\n');

const xwininfoDetailsOutput = [
	'  Absolute upper-left X:  10',
	'  Absolute upper-left Y:  20',
	'  Width: 100',
	'  Height: 200',
	'',
].join('\n');

// `/proc/<pid>/statm` is `size resident shared text lib data dt`, of which only `resident` is
// wanted. The second field is the resident page count, and 567 pages of 4096 bytes is what the
// expected `memoryUsage` below works out to.
const processId = 4242;
const residentPages = 567;
const statmOutput = `1234 ${residentPages} 89 0 0 0 0`;
const expectedMemoryUsage = residentPages * 4096;
const executablePath = '/usr/bin/example';

// Tests are serial because they share the single `record` hook. `node:test` runs a file's tests
// in order by default, so nothing here opts into concurrency.
// `lib/linux.js` resolves `promisify(childProcess.execFile)` once, when the module is first
// imported, so the stub has to be installed before that import. Its identity has to stay
// stable across tests, otherwise the second test would exercise a promisified copy of a
// discarded stub. `record` is the only part that changes per test.
let record = () => {};

// Only an `-id` query asks about a single window, the root query asks for the stacking list.
const stdoutFor = (file, arguments_) => {
	if (arguments_.includes('-id')) {
		return file === 'xwininfo' ? xwininfoDetailsOutput : xpropDetailsOutput;
	}

	return rootQueryOutput;
};

const originalExecFile = childProcess.execFile;
const originalExecFileSync = childProcess.execFileSync;

// `promisify` would ignore the callback below if this stub carried `util.promisify.custom`,
// which the real `childProcess.execFile` has and this arrow function does not.
childProcess.execFile = (file, arguments_, ...parameters) => {
	if (file === 'xprop' || file === 'xwininfo') {
		record(file, [...arguments_]);
		parameters.at(-1)(null, {stdout: stdoutFor(file, arguments_)});
		return;
	}

	return originalExecFile(file, arguments_, ...parameters);
};

childProcess.execFileSync = (file, arguments_, ...parameters) => {
	if (file === 'xprop' || file === 'xwininfo') {
		record(file, [...arguments_]);
		return stdoutFor(file, arguments_);
	}

	return originalExecFileSync(file, arguments_, ...parameters);
};

// There is no `/proc` on macOS, so the two reads that `parseLinux`'s caller makes have to be
// stubbed too, or every window ends up in `failedWindows` and nothing is left to assert on. Same
// ordering constraint as the child process stubs: install before the import below. These have to
// be the callback `fs` functions, because that is the pair `lib/linux.js` hands to `promisify`;
// `fs.promises` is a different object and intercepting it would change nothing.
//
// The stubs match the whole path, pid included, rather than just the `/proc/` prefix. A prefix
// match would answer for any pid, so a bug that read the wrong process, or a hard-coded one, would
// still produce the expected `memoryUsage` and `owner.path`. An unmatched path falls through to
// the real `fs`, which throws `ENOENT` and drops the window into `failedWindows`, so the exact
// path is asserted by these tests after all. Keep the match that narrow: a wider one would start
// answering Node's own module loader, which reads source through these same functions.
/* eslint-disable n/prefer-promises/fs -- The stubs must match the API `lib/linux.js` promisifies. */
const originalReadFile = fs.readFile;
const originalReadFileSync = fs.readFileSync;
const originalReadlink = fs.readlink;
const originalReadlinkSync = fs.readlinkSync;

const statmPath = `/proc/${processId}/statm`;
const executableLinkPath = `/proc/${processId}/exe`;

fs.readFile = (path, ...parameters) => {
	if (path === statmPath) {
		parameters.at(-1)(null, statmOutput);
		return;
	}

	return originalReadFile(path, ...parameters);
};

fs.readFileSync = (path, ...parameters) => (path === statmPath ? statmOutput : originalReadFileSync(path, ...parameters));

fs.readlink = (path, ...parameters) => {
	if (path === executableLinkPath) {
		parameters.at(-1)(null, executablePath);
		return;
	}

	return originalReadlink(path, ...parameters);
};

fs.readlinkSync = (path, ...parameters) => (path === executableLinkPath ? executablePath : originalReadlinkSync(path, ...parameters));
/* eslint-enable n/prefer-promises/fs */

const {openWindows, openWindowsSync} = await import('./lib/linux.js');

const recordDetailsArguments = async run => {
	const calls = [];
	record = (file, arguments_) => {
		calls.push({arguments_, file});
	};

	try {
		await run();
	} finally {
		record = () => {};
	}

	return calls.filter(({arguments_}) => arguments_.includes('-id'));
};

const asserter = calls => {
	// Only the one well formed entry is queried, and each window is asked about twice, once per binary.
	assert.deepEqual(calls, [
		{arguments_: ['-id', validWindowId], file: 'xprop'},
		{arguments_: ['-id', validWindowId], file: 'xwininfo'},
	]);

	// Guards against the assertion above passing while a bad id still reached a child process.
	for (const {arguments_} of calls) {
		assert.ok(
			!invalidWindowIds.has(arguments_.at(-1)),
			`an invalid window id reached a child process: ${JSON.stringify(arguments_)}`,
		);
	}
};

test('openWindows only passes valid window ids to xprop and xwininfo', async () => {
	asserter(await recordDetailsArguments(() => openWindows()));
});

test('openWindowsSync only passes valid window ids to xprop and xwininfo', async () => {
	asserter(await recordDetailsArguments(() => openWindowsSync()));
});

// Everything below is `parseLinux` and the decoding around it, reached through the stubs above
// rather than through an X server, so it runs on any platform.
const expectedWindow = {
	platform: 'linux',
	title: windowTitle,
	id: validWindowId,
	owner: {
		name: 'Test',
		processId,
		path: executablePath,
	},
	bounds: {
		x: 10,
		y: 20,
		width: 100,
		height: 200,
	},
	memoryUsage: expectedMemoryUsage,
};

test('openWindows parses the window that xprop and xwininfo describe', async () => {
	assert.deepEqual(await openWindows(), [expectedWindow]);
});

test('openWindowsSync parses the window that xprop and xwininfo describe', () => {
	assert.deepEqual(openWindowsSync(), [expectedWindow]);
});

// A window list that cannot be read has to come back as an empty array, which the documented
// `Result[]` return type allows, and not as `undefined`, which makes every caller handle it.
const unreadableRootOutput = 'xprop: unable to open display ""\n';

test('openWindows returns an empty array when the window list cannot be read', async () => {
	rootQueryOutput = unreadableRootOutput;

	try {
		assert.deepEqual(await openWindows(), []);
	} finally {
		rootQueryOutput = xpropOpenWindowsOutput;
	}
});

test('openWindowsSync returns an empty array when the window list cannot be read', () => {
	rootQueryOutput = unreadableRootOutput;

	try {
		assert.deepEqual(openWindowsSync(), []);
	} finally {
		rootQueryOutput = xpropOpenWindowsOutput;
	}
});
/* eslint-enable node-test/require-assertion -- See the disable at the top of this file. */
