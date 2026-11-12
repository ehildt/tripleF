export interface NodeDetailsMetaRow {
  /** Metadata field name shown above or beside the value. */
  label: string;
  /** Human-readable metadata field value. */
  value: string;
}

export interface NodeDetailsPopoverPosition {
  /** Horizontal offset within the constellation canvas. */
  left: string;
  /** Vertical offset within the constellation canvas. */
  top: string;
}

export interface NodeDetailsPopoverProps {
  /** Node name used as the popover's accessible title. */
  label: string;
  /** Basic metadata rows shown above the full content. */
  meta: NodeDetailsMetaRow[];
  /** Sanitized full-content HTML shown after the optional download action. */
  contentHtml: string;
  /** Optional stored-original document href. */
  downloadUrl?: string;
  /** Resolved source texts backing a synthesized memory. */
  evidenceTexts: string[];
  /** Reasons for the node's active contested-memory frictions. */
  frictionReasons: string[];
  /** Clamped popover offset within the constellation canvas. */
  position: NodeDetailsPopoverPosition;
}

export interface NodeDetailsPopoverEmits {
  /** Close was requested through the X button or Escape. */
  (e: 'close'): void;
  /** Pointer down on the header starts dragging this panel. */
  (e: 'drag', event: PointerEvent): void;
}
