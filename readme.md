# active-win

Get metadata about the [active window](https://en.wikipedia.org/wiki/Active_window) (title, id, bounds, owner, URL, etc)

Works on macOS, Linux, Windows.

Users on macOS 10.13 or earlier needs to download the [Swift runtime support libraries](https://support.apple.com/kb/DL1998).

## Install

```
$ npm install active-win
```

## Usage

```js
const activeWindow = require('active-win');

(async () => {
	console.log(await activeWindow(options));
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
		owner: {
			name: 'Google Chrome',
			processId: 310,
			bundleId: 'com.google.Chrome',
			path: '/Applications/Google Chrome.app'
		},
		url: 'https://sindresorhus.com/unicorn',
		memoryUsage: 11015432
	}
	*/
})();
```


## API

### activeWindow(options?)

#### options

Type: `object`

##### screenRecordingPermission **(macOS only)**

Type: `boolean`\
Default: `true`

Enable the screen recording permission check. Setting this to `false` will prevent the screen recording permission prompt on macOS versions 10.15 and newer. The `title` property in the result will always be set to an empty string.

### activeWindow.sync(options?)

## Result

Returns a `Promise<object>` with the result, or `Promise<undefined>` if there is no active window or if the information is not available.

- `platform` *(string)* - `'macos'` | `'linux'` | `'windows'`
- `title` *(string)* - Window title
- `id` *(number)* - Window identifier
- `bounds` *(Object)* - Window position and size
	- `x` *(number)*
	- `y` *(number)*
	- `width` *(number)*
	- `height` *(number)*
- `owner` *(Object)* - App that owns the window
	- `name` *(string)* - Name of the app
	- `processId` *(number)* - Process identifier
	- `bundleId` *(string)* - Bundle identifier *(macOS only)*
	- `path` *(string)* - Path to the app
- `url` *(string?)* - URL of the active browser tab if the active window is Safari (includes Technology Preview), Chrome (includes Beta, Dev, and Canary), Edge (includes Beta, Dev, and Canary), Brave (includes Beta and Nightly), Mighty, Ghost Browser, Wavebox, Sidekick, Opera (includes Beta and Developer), or Vivaldi *(macOS only)*
- `memoryUsage` *(number)* - Memory usage by the window owner process

## OS support

It works on macOS, Linux, and Windows 7+.

**Note**: On Windows, there isn't a clear notion of a "Window ID". Instead it returns the memory address of the window "handle" in the `id` property. That "handle" is unique per window, so it can be used to identify them. [Read more…](https://msdn.microsoft.com/en-us/library/windows/desktop/ms632597(v=vs.85).aspx#window_handle).

## Related

- [active-win-cli](https://github.com/sindresorhus/active-win-cli) - CLI for this module
- [active-win-log](https://github.com/uglow/active-win-log) - Window-usage logging CLI using this module

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [Sebastián Ramírez](https://github.com/tiangolo)
