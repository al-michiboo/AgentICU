// src/index.ts — Express server for AgentICU v2

import express from 'express';
import cors from 'cors';
import diagnoseRouter from './routes/diagnose';
import diagnoseMCPRouter from './routes/diagnose-mcp';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AgentICU v2 — The AI Agent Doctor with GitLab MCP Superpowers',
    version: '2.0.0',
    mcp: true,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/diagnose', diagnoseRouter);
app.use('/api/diagnose-mcp', diagnoseMCPRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🏥 AgentICU v2 running on http://localhost:${PORT}`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   POST http://localhost:${PORT}/api/diagnose       (plain config)`);
  console.log(`   POST http://localhost:${PORT}/api/diagnose-mcp   (GitLab MCP powered)`);
  console.log(`   GET  http://localhost:${PORT}/api/diagnose-mcp/stream`);
});

export default app;