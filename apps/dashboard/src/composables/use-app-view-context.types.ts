import type { SocketProvider } from '../types/socket-provider.model';

/**
 * The single app-level service provided by the app root. Route views inject
 * it (rather than reaching into stores) so they stay presentational. The
 * socket provider is the one legitimate provide/inject singleton: it wraps
 * the socket/messages/debug stores into an imperative controller — a service,
 * not shared reactive state.
 */
export interface AppViewContext {
  socketProvider: SocketProvider;
}
