// routes/diagnose-mcp.ts — POST /api/diagnose-mcp (GitLab MCP powered)

import { Router, Request, Response } from 'express';
import { GitLabMCPService } from './gitlab-mcp';
import { runMCPDiagnosis, buildMRDescription } from '../engine/mcpDiagnosis';

const router = Router();

interface DiagnoseMCPBody {
  repoUrl: string;
  gitlabToken: string;
  agentName?: string;
  agentType: string;
}

interface SSEClient {
  id: string;
  res: Response;
}

const sseClients = new Map<string, SSEClient>();

function sendSSE(sessionId: string, event: string, data: unknown) {
  const client = sseClients.get(sessionId);
  if (!client) return;
  try {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    sseClients.delete(sessionId);
  }
}

// GET /api/diagnose-mcp/stream — SSE endpoint
router.get('/stream', (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).json({ error: 'sessionId required' });
    return;
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  sseClients.set(sessionId, { id: sessionId, res });
  sendSSE(sessionId, 'connected', { message: 'SSE connected', sessionId });
  req.on('close', () => sseClients.delete(sessionId));
});

// POST /api/diagnose-mcp — Full MCP diagnosis + MR creation
router.post('/', async (req: Request, res: Response) => {
  const sessionId = req.body.sessionId || `session-${Date.now()}`;
  const { repoUrl, gitlabToken, agentName = 'AI Agent', agentType } = req.body as DiagnoseMCPBody;

  if (!repoUrl || !gitlabToken || !agentType) {
    res.status(400).json({ error: 'repoUrl, gitlabToken, and agentType are required' });
    return;
  }

  try {
    sendSSE(sessionId, 'status', { message: 'Connecting to GitLab MCP...' });
    const gitlab = new GitLabMCPService(gitlabToken, repoUrl);

    sendSSE(sessionId, 'status', { message: 'Listing repository files via MCP tool: gitlab/list_files' });
    const allFiles = await gitlab.listFiles();
    const sourceFiles = allFiles.filter((f) => {
      const ext = f.path.split('.').pop()?.toLowerCase();
      return ['ts', 'tsx', 'js', 'jsx', 'json', 'md', 'py', 'txt'].includes(ext ?? '');
    });

    sendSSE(sessionId, 'file_discovered', { total: sourceFiles.length, files: sourceFiles.slice(0, 20).map((f) => f.path) });

    const filesContent: { path: string; content: string }[] = [];
    let filesRead = 0;
    const maxFiles = Math.min(sourceFiles.length, 50);

    const priorityPatterns = [
      /package\.json$/,
      /src\/[^\/]+\.(ts|tsx|js|jsx)$/,
      /src\/agent\.(ts|tsx|js|jsx)$/,
      /src\/index\.(ts|tsx|js|jsx)$/,
      /agent\.(ts|tsx|js|jsx)$/,
      /README\.md$/,
      /\.md$/,
    ];

    for (const pattern of priorityPatterns) {
      if (filesRead >= maxFiles) break;
      const matches = sourceFiles.filter((f) => pattern.test(f.path));
      for (const file of matches.slice(0, 10)) {
        if (filesContent.find((f) => f.path === file.path)) continue;
        if (filesRead >= maxFiles) break;
        try {
          sendSSE(sessionId, 'status', { message: `Reading via MCP tool: gitlab/read_file — ${file.path}`, tool: 'gitlab/read_file', file: file.path });
          const content = await gitlab.readFile(file.path);
          filesContent.push({ path: file.path, content });
          filesRead++;
          sendSSE(sessionId, 'file_read', { path: file.path, size: content.length, filesRead, total: maxFiles });
        } catch { /* skip unreadable files */ }
      }
    }

    sendSSE(sessionId, 'status', { message: `Running diagnosis engine on ${filesContent.length} files...` });
    const mcpToolsUsed = gitlab.getToolsUsed();
    const result = runMCPDiagnosis(filesContent, repoUrl, agentType, agentName, mcpToolsUsed);

    for (const issue of result.issues) {
      sendSSE(sessionId, 'issue_found', { id: issue.id, name: issue.name, severity: issue.severity, category: issue.category });
    }

    if (result.issues.length > 0) {
      sendSSE(sessionId, 'status', { message: `Generating ${result.fixPatches.length} fix patches...` });
      sendSSE(sessionId, 'fix_generated', { count: result.fixPatches.length });
    }

    // Create branch and apply fixes
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const branchName = `agenticu/fix-${dateStr}`;

    try {
      await gitlab.createBranch(branchName);
      sendSSE(sessionId, 'branch_created', { branch: branchName });

      for (const patch of result.fixPatches) {
        const filePath = patch.file.startsWith('src/') ? patch.file : `src/${patch.file}`;
        try {
          let content = '';
          try { content = await gitlab.readFile(filePath, branchName); } catch { /* empty */ }
          const patched = content + '\n\n// [AgentICU auto-fix]\n' + patch.after;
          await gitlab.updateFile(filePath, patched, `[AgentICU] Fix: ${patch.reason}`, branchName);
        } catch {
          await gitlab.updateFile(`src/agenticu-fix-${patch.issueId}.ts`, `// AgentICU fix for: ${patch.issueId} - ${patch.reason}\n${patch.after}`, `[AgentICU] Add fix for ${patch.issueId}`, branchName);
        }
      }

      const mrDescription = buildMRDescription(result);
      const mrTitle = `[AgentICU] Diagnosis Report: ${agentName} — Health Score ${result.healthScore}/100`;
      sendSSE(sessionId, 'status', { message: 'Creating GitLab Merge Request...' });
      const mr = await gitlab.createMR(mrTitle, mrDescription, branchName);
      result.mrUrl = mr.url;
      result.mrIid = mr.iid;
      result.branchName = branchName;
      sendSSE(sessionId, 'mr_created', { url: mr.url, iid: mr.iid, branch: branchName });
    } catch (mrErr) {
      console.warn('MR creation failed:', mrErr);
      sendSSE(sessionId, 'error', { message: 'Could not create MR (may need write access). Diagnosis complete.' });
    }

    sendSSE(sessionId, 'complete', { patientId: result.patientId, healthScore: result.healthScore, issuesCount: result.issues.length, mrUrl: result.mrUrl });
    setTimeout(() => sseClients.delete(sessionId), 5000);
    res.status(200).json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    sendSSE(sessionId, 'error', { message: errorMsg });
    sseClients.delete(sessionId);
    res.status(500).json({ error: 'MCP diagnosis failed', details: errorMsg });
  }
});

export default router;