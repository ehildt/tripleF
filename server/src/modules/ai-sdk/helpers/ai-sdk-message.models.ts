export type InputMessageRole = 'system' | 'user' | 'assistant';

export type InputMessage = {
  role: InputMessageRole;
  content: string;
  /**
   * Images to attach to the message. Strings are interpreted as base64-encoded
   * image data; Uint8Array values are used as raw binary.
   */
  images?: Array<Uint8Array | string>;
};

export type TextPart = {
  type: 'text';
  text: string;
};

export type FilePart = {
  type: 'file';
  data: string;
  mediaType: string;
};

export type AiSdkContentPart = TextPart | FilePart;

export type AiSdkMessageRole = Exclude<InputMessageRole, 'system'>;

export type AiSdkMessage = {
  role: AiSdkMessageRole;
  content: string | AiSdkContentPart[];
};

export type AiSdkMessages = {
  system: string | undefined;
  messages: AiSdkMessage[];
};
