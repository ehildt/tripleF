export type PopoutAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface FloatingPopupRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
