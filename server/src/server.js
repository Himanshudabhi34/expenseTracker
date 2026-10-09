import 'dotenv/config';
import config from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  try {
    await connectDB();
    console.log('[db] connected to MongoDB');

    const app = createApp();
    app.listen(config.port, () => {
      console.log(`[server] listening on http://localhost:${config.port} (${config.env})`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

start();
