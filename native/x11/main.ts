const util = require('util');
const child_process = require('child_process');

const execFile: (cmd: string, args: string[], opts?: any) => Promise<{ stdout: string, stderr: string }> = util.promisify(child_process.execFile);

const xpropBin = 'xprop';
const xpropActiveArgs = ['-root', '\t$0', '_NET_ACTIVE_WINDOW'];
const xpropArgs = ['-id'];

const xwininfoBin = 'xwininfo';
const xwininfoArgs = ['-id'];

const xrandrBin = 'xrandr';
const xrandrArgs: string[] = [];

const propertyLine = /^\s*([^=:]+)\s*[=:]\s*(.*?)\s*$/;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Screen extends Rect {
  index: number;
}

/**
 * Convert output into hah map
 */
function processOutput(output: string): { [key: string]: string } {
  return output.trim().split('\n') // To lines
    .filter(line => propertyLine.test(line)) // Only ones with separator
    .reduce((acc, line) => {
      line.replace(propertyLine, (all, k, v) => {
        acc[k.trim()] = v.trim(); // Store key/value
        return '';
      });
      return acc;
    }, {} as { [key: string]: string });
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
 * Get window id by pid
 */
async function getWindowByPid(pid: string) {
  const knownWindows = (await execFile(xwininfoBin, ['-root', '-children']))
    .stdout.split('\n')
    .filter(x => /^\s*0x/.test(x))
    .sort()
    .map(x => x.trim().split(' ')[0]);

  for (const id of knownWindows) {
    const winPid = (await execFile(xpropBin, ['-id', id, '_NET_WM_PID']))
      .stdout.split('\n')
      .filter(x => !!x)[0]
      .split(/\s*=\s*/)[1];

    if (winPid === pid) {
      return parseInt(id, 16);
    }
  }

  throw new Error(`Cannot find window ID for pid: ${pid}`);
}

/**
 * Determine if a intersects with b
 */
function intersects(parent: Rect, child: Rect) {
  return parent.x <= child.x + child.width - 1 && child.x <= parent.x + parent.width - 1 &&
    parent.y <= child.y + child.height - 1 && child.y <= parent.y + parent.height - 1;
}

/**
 * Turn xrandr screen line into object
 */
function lineToScreen(line: string, index: number): Screen {
  const [id, state, primaryOrRes, res, ...remaining] = line.split(' ');
  const finalRes = primaryOrRes === 'primary' ? res : primaryOrRes;
  const [width, height, x, y] = finalRes.split(/[+x]/).map(v => parseInt(v, 10));
  return { index, width, height, x, y };
}

/**
 * Find any screen that intersects with the bounds
 */
async function getScreens(bounds: Rect): Promise<Screen[]> {
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
 */
async function getBounds(windowId: number): Promise<Rect> {
  const { stdout } = await execFile(xwininfoBin, xwininfoArgs.concat([`${windowId}`]));
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
 */
async function getGeneralInfo(windowId: number) {
  const { stdout } = await execFile(xpropBin, xpropArgs.concat([`${windowId}`]));
  const info = processOutput(stdout);

  const windowIdProperty = 'WM_CLIENT_LEADER(WINDOW)';
  const id = (Object.keys(info).indexOf(windowIdProperty) > 0 &&
    parseInt(info[windowIdProperty].split('#').pop()!, 16)) || windowId;

  return {
    title: JSON.parse(info['_NET_WM_NAME(UTF8_STRING)']) || null,
    id,
    owner: {
      name: JSON.parse(info['WM_CLASS(STRING)'].split(',').pop()!),
      processId: parseInt(info['_NET_WM_PID(CARDINAL)'], 10)
    }
  };
}

async function main(pid: string) {
  const id = await (!pid ? getActiveWindowId() : getWindowByPid(pid));
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

main(process.argv[2]).then(out => console.log(out));
