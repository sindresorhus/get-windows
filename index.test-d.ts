import {expectType, expectError} from 'tsd';
import activeWindow = require('./index.js');
import {Result, LinuxResult, MacOSResult, WindowsResult, BaseOwner} from './index.js';

expectType<Promise<Result | undefined>>(activeWindow());

const result = activeWindow.sync({screenRecordingPermission: false});

expectType<Result | undefined>(result);

if (result) {
	expectType<'macos' | 'linux' | 'windows'>(result.platform);
	expectType<string>(result.title);
	expectType<number>(result.id);
	expectType<number>(result.bounds.x);
	expectType<number>(result.bounds.y);
	expectType<number>(result.bounds.width);
	expectType<number>(result.bounds.height);
	expectType<string>(result.owner.name);
	expectType<number>(result.owner.processId);
	expectType<string>(result.owner.path);
	expectType<number>(result.memoryUsage);

	if (result.platform === 'macos') {
		expectType<MacOSResult>(result);
		expectType<string>(result.owner.bundleId);
		expectType<string | undefined>(result.url);
	} else if (result.platform === 'linux') {
		expectType<LinuxResult>(result);
		expectError(result.owner.bundleId);
	} else {
		expectType<WindowsResult>(result);
		expectError(result.owner.bundleId);
	}
}
