export type Options = {
	/**
	Enable the accessibility permission check. _(macOS)_

	Setting this to `false` will prevent the accessibility permission prompt on macOS versions 10.15 and newer. The `url` property won't be retrieved.

	@default true
	*/
	readonly accessibilityPermission: boolean;

	/**
	Enable the screen recording permission check. _(macOS)_

	Setting this to `false` will prevent the screen recording permission prompt on macOS versions 10.15 and newer. The `title` property in the result will always be set to an empty string.

	@default true
	*/
	readonly screenRecordingPermission: boolean;
};

export type BaseOwner = {
	/**
	Name of the app.
	*/
	name: string;

	/**
	Process identifier
	*/
	processId: number;

	/**
	Path to the app.
	*/
	path: string;
};

export type BaseResult = {
	/**
	Window title.
	*/
	title: string;

	/**
	Window identifier.

	On Windows, there isn't a clear notion of a "Window ID". Instead it returns the memory address of the window "handle" in the `id` property. That "handle" is unique per window, so it can be used to identify them. [Read more…](https://msdn.microsoft.com/en-us/library/windows/desktop/ms632597(v=vs.85).aspx#window_handle).
	*/
	id: number;

	/**
	Window position and size.
	*/
	bounds: {
		x: number;
		y: number;
		width: number;
		height: number;
	};

	/**
	App that owns the window.
	*/
	owner: BaseOwner;

	/**
	Memory usage by the window.
	*/
	memoryUsage: number;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export type MacOSOwner = {
	/**
	Bundle identifier.
	*/
	bundleId: string;
} & BaseOwner;

// eslint-disable-next-line @typescript-eslint/naming-convention
export type MacOSResult = {
	platform: 'macos';

	owner: MacOSOwner;

	/**
	URL of the active browser tab if the active window is Safari (includes Technology Preview), Chrome (includes Beta, Dev, and Canary), Edge (includes Beta, Dev, and Canary), Brave (includes Beta and Nightly), Mighty, Ghost Browser, WaveBox, Sidekick, Opera (includes Beta and Developer), or Vivaldi.
	*/
	url?: string;
} & BaseResult;

export type LinuxResult = {
	platform: 'linux';
} & BaseResult;

export type WindowsResult = {
	platform: 'windows';
} & BaseResult;

export type Result = MacOSResult | LinuxResult | WindowsResult;

/**
Get metadata about the [active window](https://en.wikipedia.org/wiki/Active_window) (title, id, bounds, owner, etc).

@example
```
import {activeWindow} from 'get-windows';

const result = await activeWindow();

if (!result) {
	return;
}

if (result.platform === 'macos') {
	// Among other fields, `result.owner.bundleId` is available on macOS.
	console.log(`Process title is ${result.title} with bundle id ${result.owner.bundleId}.`);
} else if (result.platform === 'windows') {
	console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
} else {
	console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
}
```
*/
export function activeWindow(options?: Options): Promise<Result | undefined>;

/**
Get metadata about the [active window](https://en.wikipedia.org/wiki/Active_window) synchronously (title, id, bounds, owner, etc).

@example
```
import {activeWindowSync} from 'get-windows';

const result = activeWindowSync();

if (result) {
	if (result.platform === 'macos') {
		// Among other fields, `result.owner.bundleId` is available on macOS.
		console.log(`Process title is ${result.title} with bundle id ${result.owner.bundleId}.`);
	} else if (result.platform === 'windows') {
		console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
	} else {
		console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
	}
}
```
*/
export function activeWindowSync(options?: Options): Result | undefined;

/**
Get metadata about all open windows.

Windows are returned in order from front to back.
*/
export function openWindows(options?: Options): Promise<Result[]>;

/**
Get metadata about all open windows synchronously.

Windows are returned in order from front to back.
*/
export function openWindowsSync(options?: Options): Result[];
