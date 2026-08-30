import { createServer, type Server as HttpServer } from 'node:http';
import { Server as IoServer } from 'socket.io';
import { createApp } from './app.js';
import { registerSocket } from './socket.js';

export interface YozuServer {
  http: HttpServer;
  io: IoServer;
  close: () => Promise<void>;
}

/** 组装 HTTP + Socket.IO 服务，供入口与测试共用 */
export function createServerBundle(): YozuServer {
  const app = createApp();
  const http = createServer(app);
  const io = new IoServer(http, {
    // 同源部署，无需跨域；开发时由 vite 代理转发
    cors: { origin: false },
    maxHttpBufferSize: 1e5,
  });
  const stopTicker = registerSocket(io);
  return {
    http,
    io,
    close: async () => {
      stopTicker();
      await io.close();
      await new Promise<void>((resolve) => http.close(() => resolve()));
    },
  };
}
