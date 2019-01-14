const util = require('util');
const childProcess = require('child_process');

const execFile = util.promisify(childProcess.execFile);

const parseJSON = text => {
	try {
		return JSON.parse(text);
	} catch (error) {
		console.error(error);
		throw new Error('Error parsing data');
	}
};

function getCmdWithArgs(platform) {
	let cmd;
	switch (platform) {
		case 'win32': cmd = 'active-win-win32.exe'; break;
		case 'linux': cmd = 'active-win-linux.js'; break;
		case 'darwin': cmd = 'active-win-darwin'; break;
		default:
			throw new Error('macOS, Linux, and Windows only');
	}

	let args = [];

	if (cmd.endsWith('.js')) { // Node script
		[cmd, args] = [process.argv[0], [cmd]];
	}

	return [cmd, args];
}

module.exports = async (platform = process.platform) => {
	const [cmd, args] = getCmdWithArgs(platform);
	return parseJSON(await execFile(cmd, args, { encoding: 'utf8' }));
};

module.exports.sync = (platform = process.platform) => {
	const [cmd, args] = getCmdWithArgs(platform);
	return parseJSON(childProcess.execFileSync(cmd, args, { encoding: 'utf8' }));
};
