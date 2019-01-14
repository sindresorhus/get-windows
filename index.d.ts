
import win = require('active-win');

declare namespace activeWin {
  interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface Results {
    id: string;
    title: string;
    owner: {
      name: string;
      processId: number;
      path: string;
    };
    screen: Rect & {
      index: number;
    };
    bounds: Rect;
  }

  export function sync(): Results;
}

declare function activeWin(): Promise<activeWin.Results>;

export = activeWin;
