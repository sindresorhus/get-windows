const binary = require('@mapbox/node-pre-gyp');
const path = require('path');
const fs = require('fs');

const bindingPath = binary.find(path.resolve(path.join(__dirname, '../package.json')));

const binding = (fs.existsSync(bindingPath)) ? require(bindingPath) : {
	getActiveWindow: () => {},
	getOpenWindows: () => {}
};

module.exports = binding;
