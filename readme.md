# active-win
[![Build Status](https://travis-ci.org/sindresorhus/active-win.svg?branch=master)](https://travis-ci.org/sindresorhus/active-win)
[![Dependency Status](https://david-dm.org/sindresorhus/active-win.svg?style=flat)](https://david-dm.org/sindresorhus/active-win)
[![devDependency Status](https://david-dm.org/sindresorhus/active-win/dev-status.svg?style=flat)](https://david-dm.org/sindresorhus/active-win#info=devDependencies)

> Get the title/id/etc of the [active window](https://en.wikipedia.org/wiki/Active_window) *(OS X and Linux)*

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

Returns a promise for the result object.

### activeWin.sync()

Returns the result object.


## Result

- `title` - Window title
- `id` - Window ID
- `app` - App owning the window
- `pid` - Process ID of the app owning the window


## Related

- [active-win-cli](https://github.com/sindresorhus/active-win-cli) - CLI for this module


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
