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

test('isAccessGranted', t => {
	const result = activeWin.isAccessGranted();
	switch (process.platform) {
		case 'darwin': {
			t.is(typeof result.all, 'boolean');
			t.is(typeof result.screen, 'boolean');
			t.is(typeof result.accessibility, 'boolean');
			break;
		}

		case 'linux':
		case 'win32': {
			t.is(result.all, true);
			t.is(result.screen, true);
			t.is(result.accessibility, true);
			break;
		}

		default: {
			throw new Error('Platform not recognized');
		}
	}

	t.is(typeof result.all, 'boolean');
});
