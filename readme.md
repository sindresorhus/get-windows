# active-win [![Build Status](https://travis-ci.org/sindresorhus/active-win.svg?branch=master)](https://travis-ci.org/sindresorhus/active-win)

Get the title / window id / app name / process ID of the [active window](https://en.wikipedia.org/wiki/Active_window) *(macOS, Linux and Windows)*


## Install

```
$ npm install --save active-win
```


## Usage

```js
const activeWin = require('active-win');

activeWin().then(result => {
	console.log(result);
	/*
	{
		title: 'npm install',
		id: 54,
		app: 'Terminal',
		pid: 368
	}
	*/
});
```


## API

### activeWin()

Returns a `Promise` for the result `Object`.

### activeWin.sync()

Returns the result `Object`.


## Result

- `title` - Window title
- `id` - Window ID (in MacOS and Linux)
- `app` - App owning the window
- `pid` - Process ID of the app owning the window


## Operating system support

It works with MacOS, Linux and Windows (tested in Windows 7 and above).

**Note**: In Windows, there's no notion of a "Window ID". So, when used in Windows, it returns `-1` in the `id` property of the object.


## Related

- [active-win-cli](https://github.com/sindresorhus/active-win-cli) - CLI for this module


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
