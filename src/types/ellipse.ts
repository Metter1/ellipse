export type DragMode = 'center' | 'apex' | null;

export interface Point {
  x: number;
  y: number;
}

export interface EllipseModel {
  cx: number;
  cy: number;
  a: number;
  b: number;
  theta: number;
}

export interface CoreLayout {
  width: number;
  height: number;
  coreTop: number;
  coreBottom: number;
  coreAxisY: number;
}
