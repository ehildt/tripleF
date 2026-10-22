export interface ToolResult {
  toolName: string;
  result?: {
    results?: Array<Record<string, unknown>>;
  };
}
