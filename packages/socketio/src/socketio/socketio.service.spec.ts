import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';

import { SOCKET_IO_CONFIG } from './socketio.constants.ts';
import { SocketIOService } from './socketio.service.ts';

describe('SocketIOService', () => {
  let service: SocketIOService;
  let mockServer: {
    emit: ReturnType<typeof vi.fn>;
    to: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    except: ReturnType<typeof vi.fn>;
    timeout: ReturnType<typeof vi.fn>;
    fetchSockets: ReturnType<typeof vi.fn>;
    socketsJoin: ReturnType<typeof vi.fn>;
    socketsLeave: ReturnType<typeof vi.fn>;
    disconnectSockets: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    of: ReturnType<typeof vi.fn>;
    use: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
  };
  let app: TestingModule;

  beforeEach(async () => {
    mockServer = {
      emit: vi.fn(),
      to: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      except: vi.fn().mockReturnThis(),
      timeout: vi.fn().mockReturnThis(),
      fetchSockets: vi.fn().mockResolvedValue([{ id: 'socket-1' }, { id: 'socket-2' }]),
      socketsJoin: vi.fn(),
      socketsLeave: vi.fn(),
      disconnectSockets: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      of: vi.fn().mockReturnValue({ name: '/admin' }),
      use: vi.fn().mockReturnThis(),
      on: vi.fn(),
    };

    app = await Test.createTestingModule({
      providers: [
        SocketIOService,
        {
          provide: SOCKET_IO_CONFIG,
          useValue: { port: 3000, opts: { cors: { origin: '*' }, transports: ['websocket', 'polling'] } },
        },
      ],
    }).compile();

    service = app.get<SocketIOService>(SocketIOService);
    service.io = mockServer as unknown as Server;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('io', () => {
    it('should get and set the server instance', () => {
      expect(service.io).toBe(mockServer);

      const newServer = { emit: vi.fn(), to: vi.fn(), on: vi.fn() } as unknown as Server;
      service.io = newServer;
      expect(service.io).toBe(newServer);
    });
  });

  describe('emit', () => {
    it('should emit event to all clients', () => {
      const message = { text: 'Hello' };
      service.emit('test-event', message);

      expect(mockServer.emit).toHaveBeenCalledWith('test-event', message);
    });

    it('should return this for chaining', () => {
      const result = service.emit('event', {});
      expect(result).toBe(service);
    });
  });

  describe('emitTo', () => {
    it('should emit event to specific room', () => {
      const message = { text: 'Room message' };
      service.emitTo('chat', 'room-123', message);

      expect(mockServer.to).toHaveBeenCalledWith('room-123');
      expect(mockServer.emit).toHaveBeenCalledWith('chat', message);
    });

    it('should return this for chaining', () => {
      const result = service.emitTo('event', 'room', {});
      expect(result).toBe(service);
    });
  });

  describe('on', () => {
    it('should subscribe to single event', () => {
      const callback = vi.fn();
      service.on('test-event', callback);

      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should subscribe to multiple events', () => {
      const handlers = { event1: vi.fn(), event2: vi.fn() };
      service.on(handlers);

      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should return this for chaining', () => {
      const result = service.on('event', vi.fn());
      expect(result).toBe(service);
    });

    it('should invoke callback when connection event fires', () => {
      const callback = vi.fn();
      service.on('my-event', callback);

      const connectionHandler = (mockServer.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const mockSocket = { on: vi.fn() };
      connectionHandler(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('my-event', expect.any(Function));
    });
  });

  describe('joinRoom', () => {
    it('should join room successfully', async () => {
      const mockSocket = { id: 'socket-123', join: vi.fn().mockResolvedValue(undefined) };
      const ack = vi.fn();

      await service.joinRoom({ socket: mockSocket as any, data: 'test-room', ack });

      expect(mockSocket.join).toHaveBeenCalledWith('test-room');
      expect(ack).toHaveBeenCalledWith(true);
    });

    it('should call ack with false on error', async () => {
      const mockSocket = { id: 'socket-123', join: vi.fn().mockRejectedValue(new Error('Join failed')) };
      const ack = vi.fn();

      await service.joinRoom({ socket: mockSocket as any, data: 'test-room', ack });

      expect(ack).toHaveBeenCalledWith(false, 'Join failed');
    });
  });

  describe('leaveRoom', () => {
    it('should leave room successfully', async () => {
      const mockSocket = { id: 'socket-123', leave: vi.fn().mockResolvedValue(undefined) };
      const ack = vi.fn();

      await service.leaveRoom({ socket: mockSocket as any, data: 'test-room', ack });

      expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
      expect(ack).toHaveBeenCalledWith(true);
    });

    it('should call ack with false on error', async () => {
      const mockSocket = { id: 'socket-123', leave: vi.fn().mockRejectedValue(new Error('Leave failed')) };
      const ack = vi.fn();

      await service.leaveRoom({ socket: mockSocket as any, data: 'test-room', ack });

      expect(ack).toHaveBeenCalledWith(false, 'Leave failed');
    });
  });

  describe('to', () => {
    it('should call server.to with room', () => {
      service.to('room-123');

      expect(mockServer.to).toHaveBeenCalledWith('room-123');
    });

    it('should call server.to with array of rooms', () => {
      service.to(['room-1', 'room-2']);

      expect(mockServer.to).toHaveBeenCalledWith(['room-1', 'room-2']);
    });

    it('should return this for chaining', () => {
      const result = service.to('room');
      expect(result).toBe(service);
    });
  });

  describe('in', () => {
    it('should call server.in with room', () => {
      service.in('room-123');

      expect(mockServer.in).toHaveBeenCalledWith('room-123');
    });

    it('should return this for chaining', () => {
      const result = service.in('room');
      expect(result).toBe(service);
    });
  });

  describe('except', () => {
    it('should call server.except with room', () => {
      service.except('admin-room');

      expect(mockServer.except).toHaveBeenCalledWith('admin-room');
    });

    it('should call server.except with array of rooms', () => {
      service.except(['room-1', 'room-2']);

      expect(mockServer.except).toHaveBeenCalledWith(['room-1', 'room-2']);
    });

    it('should return this for chaining', () => {
      const result = service.except('room');
      expect(result).toBe(service);
    });
  });

  describe('timeout', () => {
    it('should call server.timeout with ms', () => {
      service.timeout(5000);

      expect(mockServer.timeout).toHaveBeenCalledWith(5000);
    });

    it('should return this for chaining', () => {
      const result = service.timeout(1000);
      expect(result).toBe(service);
    });
  });

  describe('fetchSockets', () => {
    it('should call server.fetchSockets and invoke callback', async () => {
      const cb = vi.fn();
      service.fetchSockets(cb);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockServer.fetchSockets).toHaveBeenCalled();
      expect(cb).toHaveBeenCalledWith([{ id: 'socket-1' }, { id: 'socket-2' }]);
    });

    it('should return this for chaining', () => {
      const result = service.fetchSockets(vi.fn());
      expect(result).toBe(service);
    });
  });

  describe('socketsJoin', () => {
    it('should call server.socketsJoin with room', () => {
      service.socketsJoin('room-123');

      expect(mockServer.socketsJoin).toHaveBeenCalledWith('room-123');
    });

    it('should call server.socketsJoin with array of rooms', () => {
      service.socketsJoin(['room-1', 'room-2']);

      expect(mockServer.socketsJoin).toHaveBeenCalledWith(['room-1', 'room-2']);
    });

    it('should invoke callback if provided', () => {
      const cb = vi.fn();
      service.socketsJoin('room', cb);

      expect(cb).toHaveBeenCalled();
    });

    it('should not invoke callback if not provided', () => {
      const cb = vi.fn();
      service.socketsJoin('room', undefined);

      expect(cb).not.toHaveBeenCalled();
    });

    it('should return this for chaining', () => {
      const result = service.socketsJoin('room');
      expect(result).toBe(service);
    });
  });

  describe('socketsLeave', () => {
    it('should call server.socketsLeave with room', () => {
      service.socketsLeave('room-123');

      expect(mockServer.socketsLeave).toHaveBeenCalledWith('room-123');
    });

    it('should call server.socketsLeave with array of rooms', () => {
      service.socketsLeave(['room-1', 'room-2']);

      expect(mockServer.socketsLeave).toHaveBeenCalledWith(['room-1', 'room-2']);
    });

    it('should invoke callback if provided', () => {
      const cb = vi.fn();
      service.socketsLeave('room', cb);

      expect(cb).toHaveBeenCalled();
    });

    it('should return this for chaining', () => {
      const result = service.socketsLeave('room');
      expect(result).toBe(service);
    });
  });

  describe('disconnectSockets', () => {
    it('should call server.disconnectSockets without close', () => {
      service.disconnectSockets();

      expect(mockServer.disconnectSockets).toHaveBeenCalledWith(undefined);
    });

    it('should call server.disconnectSockets with close=true', () => {
      service.disconnectSockets(true);

      expect(mockServer.disconnectSockets).toHaveBeenCalledWith(true);
    });

    it('should invoke callback if provided', () => {
      const cb = vi.fn();
      service.disconnectSockets(false, cb);

      expect(cb).toHaveBeenCalled();
    });

    it('should return this for chaining', () => {
      const result = service.disconnectSockets();
      expect(result).toBe(service);
    });
  });

  describe('close', () => {
    it('should call server.close with callback', () => {
      const cb = vi.fn();
      service.close(cb);

      expect(mockServer.close).toHaveBeenCalledWith(cb);
    });

    it('should call server.close without callback', () => {
      service.close();

      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should return this for chaining', () => {
      const result = service.close();
      expect(result).toBe(service);
    });
  });

  describe('of', () => {
    it('should call server.of with namespace and invoke callback', () => {
      const cb = vi.fn();
      service.of('/admin', cb);

      expect(mockServer.of).toHaveBeenCalledWith('/admin');
      expect(cb).toHaveBeenCalledWith({ name: '/admin' });
    });

    it('should return this for chaining', () => {
      const result = service.of('/admin', vi.fn());
      expect(result).toBe(service);
    });
  });

  describe('use', () => {
    it('should call server.use with middleware function', () => {
      const middleware = vi.fn();
      service.use(middleware);

      expect(mockServer.use).toHaveBeenCalledWith(middleware);
    });

    it('should invoke callback if provided', () => {
      const middleware = vi.fn();
      const cb = vi.fn();
      service.use(middleware, cb);

      expect(cb).toHaveBeenCalled();
    });

    it('should return this for chaining', () => {
      const result = service.use(vi.fn());
      expect(result).toBe(service);
    });
  });

  describe('chaining', () => {
    it('should allow method chaining', () => {
      const result = service.to('room-1').in('room-2').except('room-3').timeout(5000).emit('event', {});

      expect(mockServer.to).toHaveBeenCalledWith('room-1');
      expect(mockServer.in).toHaveBeenCalledWith('room-2');
      expect(mockServer.except).toHaveBeenCalledWith('room-3');
      expect(mockServer.timeout).toHaveBeenCalledWith(5000);
      expect(mockServer.emit).toHaveBeenCalledWith('event', {});
      expect(result).toBe(service);
    });
  });
});
