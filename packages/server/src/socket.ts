import { Server as IOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: IOServer;
const userSockets = new Map<string, string>(); // userId → socketId

export function initSocket(httpServer: HttpServer, clientUrl: string): IOServer {
  io = new IOServer(httpServer, {
    cors: { origin: clientUrl, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('auth', (userId: string) => {
      userSockets.set(userId, socket.id);
    });
    socket.on('disconnect', () => {
      for (const [uid, sid] of userSockets) {
        if (sid === socket.id) { userSockets.delete(uid); break; }
      }
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  const socketId = userSockets.get(userId);
  if (socketId) io.to(socketId).emit(event, data);
}
