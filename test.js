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
	t.is(typeof result.bounds, 'object');
	t.is(typeof result.bounds.x, 'number');
	t.is(typeof result.bounds.y, 'number');
	t.is(typeof result.bounds.width, 'number');
	t.is(typeof result.bounds.height, 'number');
	t.is(typeof result.screen, 'object');
	t.is(typeof result.screen.index, 'number');
	t.is(typeof result.screen.x, 'number');
	t.is(typeof result.screen.y, 'number');
	t.is(typeof result.screen.width, 'number');
	t.is(typeof result.screen.height, 'number');

}

test('async', async t => {
	asserter(t, await activeWin());
});

test('sync', t => {
	asserter(t, activeWin.sync());
});
