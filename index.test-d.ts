import {expectType, expectError} from 'tsd-check';
import activeWin, {Result, MacOSResult, LinuxResult, WindowsResult} from '.';

expectType<Promise<Result>>(activeWin());

const result = activeWin.sync();

expectType<Result>(result);

if (result.platform === 'macos') {
	expectType<MacOSResult>(result);

	expectType<string>(result.title);
	expectType<number>(result.id);
	expectType<number>(result.bounds.x);
	expectType<number>(result.bounds.y);
	expectType<number>(result.bounds.width);
	expectType<number>(result.bounds.height);
	expectType<string>(result.owner.name);
	expectType<number>(result.owner.processId);
	expectType<number>(result.owner.bundleId);
	expectType<string>(result.owner.path);
	expectType<number>(result.memoryUsage);
} else if (result.platform === 'linux') {
	expectType<LinuxResult>(result);
	expectError(result.owner.path);
	expectError(result.owner.bundleId);
	expectError(result.memoryUsage);
} else {
	expectType<WindowsResult>(result);
	expectType<string>(result.owner.path);
	expectError(result.owner.bundleId);
	expectError(result.memoryUsage);
}
