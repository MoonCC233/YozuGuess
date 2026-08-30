import { config } from './config.js';
import { createServerBundle } from './server.js';

const { http } = createServerBundle();
http.listen(config.port, () => {
  console.log(`[yozu] server listening on http://localhost:${config.port}`);
});
