export type ToolEventHandler = (event: {
  name: string;
  input?: unknown;
  status: 'start' | 'done' | 'error' | 'compacting';
  result?: unknown;
}) => void;
