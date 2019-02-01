import * as util from 'util';
import * as child_process from 'child_process';
import * as path from 'path';

export type Platform =
  'win32' |
  'darwin' |
  'linux' | 'freebsd' | 'openbsd' | 'sunos';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Screen extends Rect {
  index: number;
}

export interface Response {
  title: string;
  id: number;
  bounds: Rect;
  screens: Screen[];
  owner: {
    name: string;
    processId: number;
    bundleId?: string;
    path: string;
  };
  memoryUsage?: number;
}

const execFile = util.promisify(child_process.execFile);

function parseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(error);
    throw new Error('Error parsing data');
  }
}

const EXEC_MAP: { [key: string]: string } = {
  win32: 'win-info-win32.exe',
  linux: 'win-info-x11.js',
  freebsd: 'win-info-x11.js',
  sunos: 'win-info-x11.js',
  openbsd: 'win-info-x11.js',
  darwin: 'win-info-darwin'
};

function getCmdWithArgs(arg?: string | number, platform?: string) {
  let cmd: string = EXEC_MAP[platform || process.platform];

  if (!cmd) {
    throw new Error('macOS, Windows and X11 platforms only');
  }

  cmd = path.resolve(__dirname, 'bin', cmd);

  let args: string[] = [];

  if (cmd.endsWith('.js')) { // Node script
    [cmd, args] = [process.argv[0], [cmd]];
  }

  if (arg) {
    args.push(`${arg}`);
  }

  return { cmd, args };
}

class WinInfo {
  static async getByPid(pid: number, platform?: Platform) {
    const { cmd, args } = getCmdWithArgs(pid, platform);
    return parseJSON((await execFile(cmd, args, { encoding: 'utf8' })).stdout) as Response;
  }
  static async getActive(platform?: Platform) {
    const { cmd, args } = getCmdWithArgs('active', platform);
    return parseJSON((await execFile(cmd, args, { encoding: 'utf8' })).stdout) as Response;
  }
  static getByPidSync(pid: number, platform?: Platform) {
    const { cmd, args } = getCmdWithArgs(pid, platform);
    return parseJSON((child_process.execFileSync(cmd, args, { encoding: 'utf8' }))) as Response;
  }
  static getActiveSync(platform?: Platform) {
    const { cmd, args } = getCmdWithArgs('active', platform);
    return parseJSON((child_process.execFileSync(cmd, args, { encoding: 'utf8' }))) as Response;
  }
}

export const getByPid = WinInfo.getByPid;
export const getByPidSync = WinInfo.getByPidSync;
export const getActive = WinInfo.getActive;
export const getActiveSync = WinInfo.getActiveSync;