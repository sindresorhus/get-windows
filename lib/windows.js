const addon = require('./windows-binding.js');

module.exports = async () => addon.getActiveWindow();

module.exports.getOpenWindows = async () => addon.getOpenWindows();

module.exports.sync = addon.getActiveWindow;

module.exports.getOpenWindowsSync = addon.getOpenWindows;
