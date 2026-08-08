export interface ParsedUrl {
  path: string;
  params: Array<{ key: string; value: string }>;
}
