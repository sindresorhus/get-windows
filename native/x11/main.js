//@ts-check
const util = require('util');
const childProcess = require('child_process');

const execFile = util.promisify(childProcess.execFile);
const xpropBin = 'xprop';
const xpropActiveArgs = ['-root', '\t$0', '_NET_ACTIVE_WINDOW'];
const xpropArgs = ['-id'];

const xwininfoBin = 'xwininfo';
const xwininfoArgs = ['-id'];

const xrandrBin = 'xrandr';
const xrandrArgs = [];

const propertySep = /\s*[=:]\s*/;

/**
 * Convert output into hah map
 * @param {string} output 
 * @returns {Object.<string, string>}
 */
function processOutput(output) {
	return output.trim().split('\n') // To lines
		.filter(line => propertySep.test(line)) // Only ones with separator
		.reduce((acc, line) => {
			const [k, v] = line.split(propertySep); // Split into parts
			acc[k.trim()] = v.trim(); // Store key/value
			return acc;
		}, {});
}

/**
 * Get active window id
 */
async function getActiveWindowId() {
	const { stdout } = await execFile(xpropBin, xpropActiveArgs);
	const windowId = parseInt(stdout.split('\t')[1], 16);
	return windowId;
}

/**
 * Determine if a intersects with b
 * 
 * @param {{x:number, y: number, width:number, height:number}} parent
 * @param {{x:number, y: number, width:number, height:number}} child
 */
function intersects(parent, child) {
	return parent.x <= child.x + child.width - 1 && child.x <= parent.x + parent.width - 1 &&
		parent.y <= child.y + child.height - 1 && child.y <= parent.y + parent.height - 1;
}

/**
 * Turn xrandr screen line into object
 * 
 * @param {string} line 
 * @param {number} index 
 */
function lineToScreen(line, index) {
	const [id, state, primaryOrRes, res, ...remaining] = line.split(' ');
	const finalRes = primaryOrRes === 'primary' ? res : primaryOrRes;
	const [width, height, x, y] = finalRes.split(/[+x]/).map(v => parseInt(v, 10));
	return { index, width, height, x, y };
}

/**
 * Find any screen that intersects with the bounds
 * 
 * @param {{x:number, y: number, width:number, height:number}} bounds 
 */
async function getScreens(bounds) {
	const { stdout } = await execFile(xrandrBin, xrandrArgs);

	const out = stdout.split('\n') // Lines
		.filter(x => x.includes('connected')) // Only screens
		.map(lineToScreen) // Convert
		.filter(x => intersects(x, bounds)); // Only overlapping

	if (out.length === 0) {
		throw new Error('No matching screens');
	}

	return out;
}

/**
 * Get bounds of a window 
 * 
 * @param {number} windowId 
 */
async function getBounds(windowId) {
	const { stdout } = await execFile(xwininfoBin, xwininfoArgs.concat([`${windowId}`]))
	const bounds = processOutput(stdout);
	return {
		x: parseInt(bounds['Absolute upper-left X'], 10),
		y: parseInt(bounds['Absolute upper-left Y'], 10),
		width: parseInt(bounds.Width, 10),
		height: parseInt(bounds.Height, 10)
	};
}

/**
 * Get general information for a window 
 * 
 * @param {number} windowId 
 */
async function getGeneralInfo(windowId) {
	const { stdout } = await execFile(xpropBin, xpropArgs.concat([`${windowId}`]));
	const info = processOutput(stdout);

	const windowIdProperty = 'WM_CLIENT_LEADER(WINDOW)';
	const id = (Object.keys(info).indexOf(windowIdProperty) > 0 &&
		parseInt(info[windowIdProperty].split('#').pop(), 16)) || windowId;

	return {
		title: JSON.parse(info['_NET_WM_NAME(UTF8_STRING)']) || null,
		id,
		owner: {
			name: JSON.parse(info['WM_CLASS(STRING)'].split(',').pop()),
			processId: parseInt(info['_NET_WM_PID(CARDINAL)'], 10)
		}
	};
}

async function main() {
	const id = await getActiveWindowId();
	const [general, bounds] = await Promise.all([
		getGeneralInfo(id),
		getBounds(id)
	]);

	const screens = await getScreens(bounds);

	if (!screens.length) {
		throw new Error('No screens detected');
	}

	return JSON.stringify({
		...general,
		screens,
		bounds
	}, undefined, 2);
}

main().then(out => console.log(out));
