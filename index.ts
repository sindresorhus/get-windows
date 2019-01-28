import * as util from 'util';
import * as child_process from 'child_process';
import * as path from 'path';

export type Platform = 'win32' | 'darwin' | 'linux';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: Number;
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
  win32: 'active-win-win32.exe',
  linux: 'active-win-x11.js',
  freebsd: 'active-win-x11.js',
  openbsd: 'active-win-x11.js',
  darwin: 'active-win-darwin'
};

function getCmdWithArgs(pid?: string, platform?: string) {
  let cmd: string = EXEC_MAP[platform || process.platform];

  if (!cmd) {
    throw new Error('macOS, Linux, and Windows only');
  }

  cmd = path.resolve(__dirname, 'bin', cmd);

  let args: string[] = [];

  if (cmd.endsWith('.js')) { // Node script
    [cmd, args] = [process.argv[0], [cmd]];
  }

  if (pid) {
    args.push(pid);
  }

  return { cmd, args };
}

export default class ProcessWin {
  static async get(pid: string, platform?: Platform) {
    const { cmd, args } = getCmdWithArgs(pid, platform);
    return parseJSON((await execFile(cmd, args, { encoding: 'utf8' })).stdout) as Response;
  }
  static async getActive(platform?: Platform) {
    return this.get(null!, platform);
  }
  static getSync(pid: string, platform?: Platform) {
    const { cmd, args } = getCmdWithArgs(pid, platform);
    return parseJSON((child_process.execFileSync(cmd, args, { encoding: 'utf8' }))) as Response;
  }
  static getActiveSync(platform?: Platform) {
    return this.getSync(null!, platform);
  }
}