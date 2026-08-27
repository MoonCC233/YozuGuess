import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import routes from './routes.js';
import { registerSocket } from './socket.js';
import { ensureSchema } from './schema.js';
import { closeDb } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});
registerSocket(io);

const PORT = Number(process.env.PORT ?? 3000);

ensureSchema()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`[yozu-guess] server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[yozu-guess] failed to initialize database:', err);
    process.exitCode = 1;
  });

async function shutdown() {
  await closeDb().catch(() => undefined);
  httpServer.close();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
