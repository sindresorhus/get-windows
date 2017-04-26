# active-win [![Build Status](https://travis-ci.org/sindresorhus/active-win.svg?branch=master)](https://travis-ci.org/sindresorhus/active-win)

> Get the title/id/etc of the [active window](https://en.wikipedia.org/wiki/Active_window) *(macOS & Linux)*

*PR welcome for Windows support.*


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
- `id` - Window ID
- `app` - App owning the window
- `pid` - Process ID of the app owning the window


## Related

- [active-win-cli](https://github.com/sindresorhus/active-win-cli) - CLI for this module


## Maintainers

- [Sebastián Ramírez](https://github.com/tiangolo)


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
