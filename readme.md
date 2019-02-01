# @arcsine/win-info
Forked from [active-win](https://github.com/sindresorhus/active-win), by Sindre Sorhus

Get metadata about the window backing a process PID, or the [active window](https://en.wikipedia.org/wiki/Active_window). (title, id, bounds, owner, etc)

Works on macOS, Windows and X11-based Desktops (Linux, BSD). Wayland support is missing.

## Install

```
$ npm install @arcsine/win-info
```

## Usage

```js
const * as winInfo = require('@arcsine/win-info');

(async () => {
	console.log(await winInfo.getActive());
	/*
	{
		title: 'Unicorns - Google Search',
		id: 5762,
		bounds: {
			x: 0,
			y: 0,
			height: 900,
			width: 1440
		},
		screens: [{
			x: 0,
			y: 0, 
			height: 920,
			width: 1440,
			index: 0
		}],
		owner: {
			name: 'Google Chrome',
			processId: 310,
			bundleId: 'com.google.Chrome',
			path: '/Applications/Google Chrome.app'
		},
		memoryUsage: 11015432
	}
	*/
})();
```


```ts
import * as winInfo from '@arcsine/win-info';

...
console.log(await winInfo.getActive());
...

...
console.log(await winInfo.getByPid(1000));
...

...
console.log(winInfo.getActiveSync());
...

```

## API

### getByPid(pid: number, platform?: string)

Returns a `Promise<Object>` with the result for the window tied to PID.

### getActive(platform?: string)

Returns a `Promise<Object>` with the result for the active window.

### getByPidSync(pid: number, platform?: string)

Returns an `Object` with the result for the window tied to PID.

### getActiveSync(platform?: string)

Returns an `Object` with the result for the active window.

## Result

- `title` *(string)* - Window title
- `id` *(number)* - Window identifier
- `bounds` *(Object)* - Window position and size
	- `x` *(number)*
	- `y` *(number)*
	- `width` *(number)*
	- `height` *(number)*
- `screens` *(Array)* - Screens that overlap with the window
	- `x` *(number)*
	- `y` *(number)*
	- `width` *(number)*
	- `height` *(number)*
	- `index` *(number)* - Display index
- `owner` *(Object)* - App that owns the window
	- `name` *(string)* - Name of the app
	- `processId` *(number)* - Process identifier
	- `bundleId` *(string)* - Bundle identifier *(macOS only)*
	- `path` *(string)* - Path to the app *(macOS and Windows only)*
- `memoryUsage` *(number)* - Memory usage by the window *(macOS only)*


## OS support

It works on macOS, Windows 7+, and X11-based desktops (Linux, BSD).

**Note**: On Windows, there isn't a clear notion of a "Window ID". Instead it returns the memory address of the window "handle" in the `id` property. That "handle" is unique per window, so it can be used to identify them. [Read more…](https://msdn.microsoft.com/en-us/library/windows/desktop/ms632597(v=vs.85).aspx#window_handle).

## Maintainers
- [Sindre Sorhus](https://github.com/sindresorhus)
- [Sebastián Ramírez](https://github.com/tiangolo)
- [Timothy Soehnlin](https://github.com/arciisine)

## License

MIT
