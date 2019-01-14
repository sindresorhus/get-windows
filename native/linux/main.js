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

/**
 * Convert output into hah map
 * @param {string} output 
 */
function processOutput(output) {
	const result = {};
	for (const row of output.trim().split('\n')) {
		if (row.includes('=')) {
			const [key, value] = row.split('=');
			result[key.trim()] = value.trim();
		} else if (row.includes(':')) {
			const [key, value] = row.split(':');
			result[key.trim()] = value.trim();
		}
	}
	return result;
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
 * Get all screens
 */
async function getScreens() {
	const { stdout } = await execFile(xrandrBin, xrandrArgs);
	const lines = stdout.split('\n').filter(x => x.includes('connected'));
	return lines.map((line, idx) => {
		const [id, state, primaryOrRes, res, ...remaining] = line.split(' ');
		const finalRes = primaryOrRes === 'primary' ? res : primaryOrRes;
		const [width, height, x, y] = finalRes.split(/[+x]/).map(v => parseInt(v, 10));
		return {
			index: idx,
			width,
			height,
			x,
			y
		}
	});
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
 * Find any screen that intersects with the bounds
 * 
 * @param {{x:number, y: number, width:number, height:number}} bounds 
 */
async function getScreen(bounds) {
	const screens = await getScreens();
	for (const screen of screens) {
		if (intersects(screen, bounds)) {
			return screen;
		}
	}
	throw new Error('No matching screen');
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

	const screen = await getScreen(bounds);

	bounds.x = bounds.x - screen.x;
	bounds.y = bounds.y - screen.y;

	return JSON.stringify({
		...general,
		screen,
		bounds
	}, undefined, 2);
}

main().then(out => console.log(out));
