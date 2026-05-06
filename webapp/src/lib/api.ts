// lib/api.ts — API client for AgentICU v2

const API_BASE = import.meta.env.VITE_API_URL || 'https://agenticu-server.kcccryptoball.workers.dev';

export interface DiagnoseMCPRequest {
  repoUrl: string;
  gitlabToken: string;
  agentName: string;
  agentType: string;
}

export async function diagnoseMCP(req: DiagnoseMCPRequest) {
  return fetch(`${API_BASE}/api/diagnose-mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
}

export async function healthCheck() {
  return fetch(`${API_BASE}/api/health`);
}

export function createSSEConnection(
  sessionId: string,
  onMessage: (e: MessageEvent) => void
): EventSource {
  const url = `${API_BASE}/api/diagnose-mcp/stream?sessionId=${encodeURIComponent(sessionId)}`;
  const es = new EventSource(url);
  es.onmessage = onMessage;
  es.onerror = () => { es.close(); };
  return es;
}
