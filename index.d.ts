declare module 'active-win' {
  export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface Results {
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

  function exec(): Promise<Results>;
  export = exec;
  export function sync(): Results;
}