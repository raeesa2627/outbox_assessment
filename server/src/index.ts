import express from 'express';
import cors from 'cors';
import path from 'path';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { config } from './config';
import { connectDB } from './config/db';
import { emailQueue } from './queues/emailQueue';
import { setupEmailWorker } from './workers/emailWorker';
import apiRoutes from './routes';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


import fs from 'fs';

// Serve local uploads statically
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// BullMQ Live Monitoring Dashboard (Mounted at /admin/queues as requested in PRD)
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Mount API Routes
app.use('/api', apiRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'reachinbox-email-scheduler',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Serve built React client in production
const potentialDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];

let clientDistPath: string | null = null;
for (const p of potentialDistPaths) {
  if (fs.existsSync(p)) {
    clientDistPath = p;
    break;
  }
}

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/admin') ||
      req.path.startsWith('/health') ||
      req.path.startsWith('/uploads')
    ) {
      return next();
    }
    res.sendFile(path.join(clientDistPath!, 'index.html'));
  });
  console.log(`[Static] Serving frontend production bundle from: ${clientDistPath}`);
}


// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize BullMQ Worker
    setupEmailWorker();

    // 3. Start Express HTTP Server
    app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 Email Job Scheduler Backend running on port ${config.port}`);
      console.log(`📊 BullMQ Live Queue Monitor: http://localhost:${config.port}/admin/queues`);
      console.log(`📡 API Endpoints: http://localhost:${config.port}/api`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
};

startServer();
