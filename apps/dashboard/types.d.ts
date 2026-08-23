interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
}

declare module 'markdown-it';

declare const __APP_VERSION__: string;

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
