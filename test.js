import util from 'util';
import test from 'ava';
import activeWin from '.';

function asserter(t, result) {
	t.log(util.inspect(result));
	t.is(typeof result, 'object');
	t.is(typeof result.title, 'string');
	t.is(typeof result.id, 'number');
	t.is(typeof result.owner, 'object');
	t.is(typeof result.owner.name, 'string');
}

test('async', async t => {
	asserter(t, await activeWin());
});

test('sync', t => {
	asserter(t, activeWin.sync());
});
