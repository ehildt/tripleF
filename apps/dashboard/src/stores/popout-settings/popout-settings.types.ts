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
  /** Popup left offset from the viewport edge, px. */
  x: number;
  /** Popup top offset from the viewport edge, px. */
  y: number;
  /** Popup window width, px. */
  width: number;
  /** Popup window height, px. */
  height: number;
}
