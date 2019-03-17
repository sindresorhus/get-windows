export interface BaseOwner {
	/**
	Name of the app.
	*/
	name: string;

	/**
	Process identifier
	*/
	processId: number;
}

export interface BaseResult {
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
}

export interface DarwinOwner extends BaseOwner {
	/**
	Bundle identifier.
	*/
	bundleId: number;

	/**
	Path to the app.
	*/
	path: string;
}

export interface DarwinResult extends BaseResult {
	platform: 'darwin';

	owner: DarwinOwner;

	/**
	Memory usage by the window.
	*/
	memoryUsage: number;
}

export interface LinuxResult extends BaseResult {
	platform: 'linux';
}

export interface WindowsOwner extends BaseOwner {
	/**
	Path to the app.
	*/
	path: string;
}

export interface WindowsResult extends BaseResult {
	platform: 'win32';
	owner: WindowsOwner;
}

export type Result = DarwinResult | LinuxResult | WindowsResult;

declare const activeWin: {
	/**
	Get metadata about the [active window](https://en.wikipedia.org/wiki/Active_window) (title, id, bounds, owner, etc).

	@returns The active window metadata.
	*/
	(): Promise<Result>;

	/**
	Synchronously get metadata about the [active window](https://en.wikipedia.org/wiki/Active_window) (title, id, bounds, owner, etc).

	@returns The active window metadata.
	*/
	sync(): Result;
};

export default activeWin;
