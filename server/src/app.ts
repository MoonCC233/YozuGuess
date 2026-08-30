import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express, { type ErrorRequestHandler } from 'express';
import { config } from './config.js';
import { api } from './routes.js';
import { securityHeaders } from './security.js';

const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[yozu] unhandled error', err);
  res.status(500).json({ code: 'INTERNAL_ERROR' });
};

export function createApp(): express.Express {
  const app = express();
  app.set('trust proxy', true);
  app.use(securityHeaders);
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', api);

  // 生产模式：托管前端构建产物，未匹配的路径回退到 index.html 交给前端路由
  const here = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(here, '..', config.clientDist);
  const indexHtml = path.join(clientDist, 'index.html');
  if (existsSync(indexHtml)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(indexHtml);
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ code: 'NOT_FOUND' });
  });
  app.use(handleError);
  return app;
}
