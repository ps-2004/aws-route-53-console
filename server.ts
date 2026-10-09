import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './server/db.js';
import { apiRouter } from './server/routes.js';
import { renderSwaggerHtml, openApiSpec } from './server/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize SQLite database
  initDatabase();
  console.log('SQLite database initialized at route53.db');

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API documentation endpoints
  app.get('/docs', renderSwaggerHtml);
  app.get('/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Vite integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AWS Route 53 Console full-stack server running on http://0.0.0.0:${PORT}`);
    console.log(`Interactive API documentation available at http://0.0.0.0:${PORT}/docs`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
