declare namespace activeWin {
	interface Options {
		/**
		Disable the screen recording permission check (macOS)

		Setting this to true will prevent the Screen Recording permission prompt on macOS versions 10.15 and newer. The `title` property will always be set to an empty string.
		 */
		disableScreenRecordingPermission: boolean;
	}

	interface BaseOwner {
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
	}

	interface BaseResult {
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
	}

	interface MacOSOwner extends BaseOwner {
		/**
		Bundle identifier.
		*/
		bundleId: number;
	}

	interface MacOSResult extends BaseResult {
		platform: 'macos';

		owner: MacOSOwner;

		/**
		URL of the active browser tab if the active window is Safari, Chrome, Edge, or Brave.
		*/
		url?: string;
	}

	interface LinuxResult extends BaseResult {
		platform: 'linux';
	}

	interface WindowsResult extends BaseResult {
		platform: 'windows';
	}

	type Result = MacOSResult | LinuxResult | WindowsResult;
}

declare const activeWin: {
	/**
	Get metadata about the [active window](https://en.wikipedia.org/wiki/Active_window) (title, id, bounds, owner, etc).

	@returns The active window metadata.

	@example
	```
	import activeWin = require('active-win');

	(async () => {
		const result = await activeWin();

		if (!result) {
			return;
		}

		if (result.platform === 'macos') {
			// Among other fields, result.owner.bundleId is available on macOS.
			console.log(`Process title is ${result.title} with bundle id ${result.owner.bundleId}.`);
		} else if (result.platform === 'windows') {
			console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
		} else {
			console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
		}
	})();
	```
	*/
	(options?: activeWin.Options): Promise<activeWin.Result | undefined>;

	/**
	Synchronously get metadata about the [active window](https://en.wikipedia.org/wiki/Active_window) (title, id, bounds, owner, etc).

	@returns The active window metadata.

	@example
	```
	import activeWin = require('active-win');

	const result = activeWin.sync();

	if (result) {
		if (result.platform === 'macos') {
			// Among other fields, result.owner.bundleId is available on macOS.
			console.log(`Process title is ${result.title} with bundle id ${result.owner.bundleId}.`);
		} else if (result.platform === 'windows') {
			console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
		} else {
			console.log(`Process title is ${result.title} with path ${result.owner.path}.`);
		}
	}
	```
	*/
	sync(options?: activeWin.Options): activeWin.Result | undefined;
};

export = activeWin;
