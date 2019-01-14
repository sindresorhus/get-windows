
import win = require('active-win');

declare namespace activeWin {
  type Platform = 'win32' | 'darwin' | 'linux';

  interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface Screen extends Rect {
    index: number;
  }

  interface Owner {
    name: string;
    processId: number;
    path: string;
  }

  interface Results {
    id: string;
    title: string;
    owner: Owner;
    screens: Screen[];
    bounds: Rect;
  }

  export function sync(platform?: activeWin.Platform): Results;
}

declare function activeWin(platform?: activeWin.Platform): Promise<activeWin.Results>;

export = activeWin;
