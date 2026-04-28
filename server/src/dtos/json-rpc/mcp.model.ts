export type SupportedToolMethod =
  | 'tools/list'
  | 'tools/call'
  | 'initialize'
  | 'notifications/initialized';

export type SupportedToolFunction = 'visions.analyze';

export type McpGenericType<
  T extends {
    arguments?: any;
    requestedTools?: any;
    name?: SupportedToolFunction;
  } = {
    arguments?: any;
    requestedTools?: any;
    name?: SupportedToolFunction;
  },
> = {
  id?: number; // Notifications have no id
  jsonrpc: '2.0';
  method: SupportedToolMethod;
  params?: T; // Notifications have no params
};
