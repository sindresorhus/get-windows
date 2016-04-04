import test from 'ava';
import m from '.';

function asserter(t, result) {
	t.is(typeof result, 'object');
	t.is(typeof result.title, 'string');
	t.is(typeof result.id, 'number');
	t.is(typeof result.app, 'string');
	t.is(typeof result.pid, 'number');
}

test('async', async t => {
	asserter(t, await m());
});

test('sync', t => {
	asserter(t, m.sync());
});
