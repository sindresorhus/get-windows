import {expectTypeOf} from 'nz';
import {
	activeWindow,
	activeWindowSync,
	openWindows,
	openWindowsSync,
	type Result,
	type LinuxResult,
	type MacOSResult,
	type WindowsResult,
	BaseOwner,
} from './index.js';

expectTypeOf(activeWindow()).toBe<Promise<Result | undefined>>();

const result = activeWindowSync({
	screenRecordingPermission: false,
	accessibilityPermission: false,
});

expectTypeOf(result).toBe<Result | undefined>();

if (result) {
	expectTypeOf(result.platform).toBe<'macos' | 'linux' | 'windows'>();
	expectTypeOf(result.title).toBe<string>();
	expectTypeOf(result.id).toBe<number>();
	expectTypeOf(result.bounds.x).toBe<number>();
	expectTypeOf(result.bounds.y).toBe<number>();
	expectTypeOf(result.bounds.width).toBe<number>();
	expectTypeOf(result.bounds.height).toBe<number>();
	expectTypeOf(result.owner.name).toBe<string>();
	expectTypeOf(result.owner.processId).toBe<number>();
	expectTypeOf(result.owner.path).toBe<string>();
	expectTypeOf(result.memoryUsage).toBe<number>();

	if (result.platform === 'macos') {
		expectTypeOf(result).toBe<MacOSResult>();
		expectTypeOf(result.owner.bundleId).toBe<string>();
		expectTypeOf(result.url).toBe<string | undefined>();
	} else if (result.platform === 'linux') {
		expectTypeOf(result).toBe<LinuxResult>();
	} else {
		expectTypeOf(result).toBe<WindowsResult>();
		expectTypeOf(result.contentBounds.x).toBe<number>();
		expectTypeOf(result.contentBounds.y).toBe<number>();
		expectTypeOf(result.contentBounds.width).toBe<number>();
		expectTypeOf(result.contentBounds.height).toBe<number>();
	}
}
