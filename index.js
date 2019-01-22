//@ts-check
const util = require('util');
const childProcess = require('child_process');
const path = require('path');

const execFile = util.promisify(childProcess.execFile);

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(error);
    throw new Error('Error parsing data');
  }
};

const EXEC_MAP = {
  win32: 'active-win-win32.exe',
  linux: 'active-win-x11.js',
  freebsd: 'active-win-x11.js',
  openbsd: 'active-win-x11.js',
  darwin: 'active-win-darwin'
};

function getCmdWithArgs(platform) {
  let cmd = EXEC_MAP[platform || process.platform];
  if (!cmd) {
    throw new Error('macOS, Linux, and Windows only');
  }

  cmd = path.resolve(__dirname, 'bin', cmd);

  let args = [];

  if (cmd.endsWith('.js')) { // Node script
    [cmd, args] = [process.argv[0], [cmd]];
  }

  return [cmd, args];
}

module.exports = async (platform) => {
  const [cmd, args] = getCmdWithArgs(platform);
  return parseJSON((await execFile(cmd, args, { encoding: 'utf8' })).stdout);
};

module.exports.sync = (platform) => {
  const [cmd, args] = getCmdWithArgs(platform);
  return parseJSON(childProcess.execFileSync(cmd, args, { encoding: 'utf8' }));
};
