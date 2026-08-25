import { Inject, Injectable } from '@nestjs/common';
import type { DefaultEventsMap, Namespace, RemoteSocket, Server, Socket } from 'socket.io';

import { SOCKET_IO_CONFIG } from './socketio.constants.ts';
import { SocketEventHandler, SocketEventMap, SocketEventPayload, SocketIOServerConfig } from './socketio.model.ts';

@Injectable()
export class SocketIOService {
  private _io: Server | null = null;
  constructor(@Inject(SOCKET_IO_CONFIG) private readonly _config: SocketIOServerConfig) {}

  set io(io: Server) {
    this._io = io;
  }

  get io() {
    return this._io as Server;
  }

  get config() {
    return this._config;
  }

  /**
   * Emits an event to all connected clients in the main namespace.
   * @see https://socket.io/docs/v4/server-api/#serveremiteventname-args
   */
  public emit<T = unknown>(event: string, message: T) {
    this._io?.emit(event, message);
    return this;
  }

  /**
   * Emits an event to all connected clients in the specified room.
   * @see https://socket.io/docs/v4/server-api/#serveremit-eventname-args
   */
  public emitTo<T = unknown>(event: string, room: string, message: T) {
    this._io?.to(room).emit(event, message);
    return this;
  }

  /**
   * Makes the socket join a room.
   * @see https://socket.io/docs/v4/server-socket-instance/#socketjoinroom
   */
  public async joinRoom({ socket, data, ack }: SocketEventPayload) {
    try {
      await socket.join(data);
      ack(true);
    } catch (error: unknown) {
      const err = error as Error;
      ack(false, err.message);
    }
  }

  /**
   * Makes the socket leave a room.
   * @see https://socket.io/docs/v4/server-socket-instance/#socketleaveroom
   */
  public async leaveRoom({ socket, data, ack }: SocketEventPayload) {
    try {
      await socket.leave(data);
      ack(true);
    } catch (error: unknown) {
      const err = error as Error;
      ack(false, err.message);
    }
  }

  /**
   * Registers an event handler for incoming connections or subscribes to events.
   * @see https://socket.io/docs/v4/server-api/#serveroneventname-listener
   */
  public on<T = any>(event: string | SocketEventMap, cb?: SocketEventHandler<Socket, T>) {
    if (typeof event === 'string' && cb) {
      this._io?.on('connection', (socket) => {
        socket.on(event, async (data, ack) => {
          await cb({ socket, data, ack });
        });
      });
    }

    if (typeof event === 'object' && !cb) {
      this._io?.on('connection', (socket) =>
        Object.entries(event).forEach(([key, cb]) =>
          socket.on(key, async (data, ack) => await cb({ socket, data, ack })),
        ),
      );
    }

    return this;
  }

  /**
   * Sets a modifier for a subsequent event emission that the event will only be
   * broadcast to clients that have joined the given room.
   * @see https://socket.io/docs/v4/server-api/#servertoroom
   */
  public to(room: string | string[]): this {
    this._io?.to(room);
    return this;
  }

  /**
   * Alias for to(). Sets a modifier for a subsequent event emission.
   * @see https://socket.io/docs/v4/server-api/#serverinroom
   */
  public in(room: string | string[]): this {
    this._io?.in(room);
    return this;
  }

  /**
   * Sets a modifier for a subsequent event emission that the event will only be
   * broadcast to clients that have not joined the given rooms.
   * @see https://socket.io/docs/v4/server-api/#serverexceptrooms
   */
  public except(room: string | string[]): this {
    this._io?.except(room);
    return this;
  }

  /**
   * Sets a modifier for a subsequent event emission that the callback will be called
   * with an error when the given number of milliseconds have elapsed without an
   * acknowledgement from all targeted clients.
   * @see https://socket.io/docs/v4/server-api/#servertimeoutvalue
   */
  public timeout(ms: number): this {
    this._io?.timeout(ms);
    return this;
  }

  /**
   * Returns the matching Socket instances.
   * @see https://socket.io/docs/v4/server-api/#serverfetchsockets
   */
  public fetchSockets(cb: (sockets: RemoteSocket<DefaultEventsMap, unknown>[]) => void): this {
    void this._io?.fetchSockets().then(cb);
    return this;
  }

  /**
   * Makes all Socket instances join the specified rooms.
   * @see https://socket.io/docs/v4/server-api/#serversocketsjoinrooms
   */
  public socketsJoin(rooms: string | string[], cb?: () => void): this {
    this._io?.socketsJoin(rooms);
    cb?.();
    return this;
  }

  /**
   * Makes all Socket instances leave the specified rooms.
   * @see https://socket.io/docs/v4/server-api/#serversocketsleaverooms
   */
  public socketsLeave(rooms: string | string[], cb?: () => void): this {
    this._io?.socketsLeave(rooms);
    cb?.();
    return this;
  }

  /**
   * Makes the matching Socket instances disconnect.
   * @see https://socket.io/docs/v4/server-api/#serverdisconnectsocketsclose
   */
  public disconnectSockets(close?: boolean, cb?: () => void): this {
    void this._io?.disconnectSockets(close);
    cb?.();
    return this;
  }

  /**
   * Closes the Socket.IO server and disconnects all clients.
   * @see https://socket.io/docs/v4/server-api/#serverclosecallback
   */
  public close(cb?: () => void): this {
    if (cb) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this._io?.close(cb);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this._io?.close();
    }
    return this;
  }

  /**
   * Initializes and retrieves the given Namespace by its pathname identifier.
   * @see https://socket.io/docs/v4/server-api/#serverofnsp
   */
  public of(nsp: string, cb: (ns: Namespace) => void): this {
    cb(this._io?.of(nsp) as Namespace);
    return this;
  }

  /**
   * Registers a middleware for the main namespace.
   * @see https://socket.io/docs/v4/server-api/#serverusefn
   */
  public use(fn: (socket: Socket, next: (err?: Error) => void) => void, cb?: (server: Server) => void): this {
    this._io?.use(fn);
    cb?.(this._io as Server);
    return this;
  }
}
