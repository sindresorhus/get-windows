import {inspect} from 'node:util';
import test from 'ava';
import activeWindow from './index.js';

function asserter(t, result) {
	t.log(inspect(result));
	t.is(typeof result, 'object');
	t.is(typeof result.title, 'string');
	t.is(typeof result.id, 'number');
	t.is(typeof result.owner, 'object');
	t.is(typeof result.owner.name, 'string');
}

function asserterGetOpenWindows(t, result) {
	t.log(inspect(result));
	t.is(typeof result, 'object');
	t.is(typeof result.length, 'number');
	asserter(t, result[0]);
}

test('activeWindow', async t => {
	asserter(t, await activeWindow());
});

test('activeWindow.sync', t => {
	asserter(t, activeWindow.sync());
});

test('activeWindow.getOpenWindows', async t => {
	asserterGetOpenWindows(t, await activeWindow.getOpenWindows());
});

test('activeWindow.getOpenWindowsSync', t => {
	asserterGetOpenWindows(t, activeWindow.getOpenWindowsSync());
});
