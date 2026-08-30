import { config } from './config.js';
import { createServerBundle } from './server.js';
import { sweepSessions } from './accounts.js';

const { http } = createServerBundle();

// 每小时清一次过期登录会话，避免 auth_sessions 表无限增长
const sessionSweeper = setInterval(() => {
  try {
    sweepSessions();
  } catch (err) {
    console.error('[yozu] session sweep failed', err);
  }
}, 60 * 60 * 1000);
sessionSweeper.unref();

http.listen(config.port, () => {
  console.log(`[yozu] server listening on http://localhost:${config.port}`);
});
