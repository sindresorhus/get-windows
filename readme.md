# active-win [![Build Status](https://travis-ci.org/sindresorhus/active-win.svg?branch=master)](https://travis-ci.org/sindresorhus/active-win)

Get the title / window id / app name / process ID of the [active window](https://en.wikipedia.org/wiki/Active_window) *(macOS, Linux, Windows)*


## Install

```
$ npm install active-win
```


## Usage

```js
const activeWin = require('active-win');

(async () => {
	console.log(await activeWin());
	/*
	{
		title: 'npm install',
		id: 54,
		app: 'Terminal',
		pid: 368
	}
	*/
})();
```


## API

### activeWin()

Returns a `Promise` for the result `Object`.

### activeWin.sync()

Returns the result `Object`.


## Result

- `title` *(string)* - Window title
- `id` *(number)* - Window ID
- `app` *(string)* - App owning the window
- `appPath` *(string)* - Path to the app executable *(Windows only)*
- `pid` *(number)* - Process ID of the app owning the window
- `bounds` *(Object)* - Window position and size *(macOS only)*
	- `x` *(number)*
	- `y` *(number)*
	- `width` *(number)*
	- `height` *(number)*


## OS support

It works on macOS, Linux, and Windows 7+.

**Note**: On Windows, there isn't a clear notion of a "Window ID". Instead it returns the memory address of the window "handle" in the `id` property. That "handle" is unique per window, so it can be used to identify them. [Read more…](https://msdn.microsoft.com/en-us/library/windows/desktop/ms632597(v=vs.85).aspx#window_handle).


## Related

- [active-win-cli](https://github.com/sindresorhus/active-win-cli) - CLI for this module


## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [Sebastián Ramírez](https://github.com/tiangolo)


## License

MIT
