import { useState, useCallback } from 'react';
import Header from './components/Header';
import GitLabConnector from './components/GitLabConnector';
import RepoFileTree from './components/RepoFileTree';
import DiagnosisProgress from './components/DiagnosisProgress';
import DiagnosisReport from './components/DiagnosisReport';
import { diagnoseMCP } from './lib/api';
import type { DiagnosisResult } from './types';

type AppState = 'idle' | 'diagnosing' | 'done' | 'error';

interface EventEntry {
  type: string;
  [key: string]: unknown;
}

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [discoveredFiles, setDiscoveredFiles] = useState<string[]>([]);
  const [filesRead, setFilesRead] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const handleDiagnose = useCallback(async (repoUrl: string, token: string, agentName: string, agentType: string) => {
    setState('diagnosing');
    setError(undefined);
    setResult(null);
    setEvents([]);
    setDiscoveredFiles([]);
    setFilesRead(0);
    setTotalFiles(0);

    const sessionId = `session-${Date.now()}`;
    const url = `${(window as unknown as {ENV?:{VITE_API_URL?:string}}).ENV?.VITE_API_URL || 'http://localhost:3001'}/api/diagnose-mcp/stream?sessionId=${encodeURIComponent(sessionId)}`;

    // Open SSE connection
    const es = new EventSource(url);

    es.addEventListener('connected', () => {
      addEvent({ type: 'connected', message: 'SSE connected' });
    });

    es.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      addEvent({ type: 'status', ...data });
    });

    es.addEventListener('file_discovered', (e) => {
      const data = JSON.parse(e.data);
      addEvent({ type: 'file_discovered', ...data });
      if (data.files) setDiscoveredFiles((prev) => [...new Set([...prev, ...data.files])]);
      if (data.total) setTotalFiles(data.total);
    });

    es.addEventListener('file_read', (e) => {
      const data = JSON.parse(e.data);
      addEvent({ type: 'file_read', ...data });
      if (data.filesRead) setFilesRead(data.filesRead);
    });

    es.addEventListener('issue_found', (e) => {
      const data = JSON.parse(e.data);
      addEvent({ type: 'issue_found', ...data });
    });

    es.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      addEvent({ type: 'complete', ...data });
    });

    es.addEventListener('error', () => {
      addEvent({ type: 'error', message: 'SSE error' });
    });

    // Now POST to start diagnosis
    try {
      const res = await diagnoseMCP({ repoUrl, gitlabToken: token, agentName, agentType });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || err.details || 'Diagnosis failed');
      }
      const data: DiagnosisResult = await res.json();
      setResult(data);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnosis failed');
      setState('error');
    } finally {
      setTimeout(() => es.close(), 1000);
    }
  }, []);

  function addEvent(evt: EventEntry) {
    setEvents((prev) => [...prev.slice(-200), evt]);
  }

  const handleReset = () => {
    setState('idle');
    setResult(null);
    setEvents([]);
    setDiscoveredFiles([]);
    setFilesRead(0);
    setTotalFiles(0);
    setError(undefined);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pb-16">
        {state === 'idle' && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                Diagnose Any AI Agent
                <span className="block text-lg font-normal text-slate-500 mt-1">
                  Paste a GitLab repo URL — AgentICU connects via MCP, scans code, and auto-creates a fix MR
                </span>
              </h2>
            </div>
            <GitLabConnector onDiagnose={handleDiagnose} loading={false} />
          </>
        )}

        {state === 'diagnosing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <RepoFileTree files={discoveredFiles} filesRead={filesRead} total={totalFiles} />
              <DiagnosisProgress events={events} />
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center gap-1.5 justify-center mb-3">
                  {[4, 14, 2, 22, 6, 18, 8].map((h, i) => (
                    <div key={i} className="w-1 bg-teal-500 rounded-sm animate-ekg-bar" style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
                <p className="text-sm text-slate-500">Running MCP-powered diagnosis...</p>
                <p className="text-xs text-slate-400 mt-1">Connecting to GitLab, scanning files, generating report</p>
              </div>
            </div>
          </div>
        )}

        {state === 'done' && result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Diagnosis Report</h2>
              <button onClick={handleReset}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                New Diagnosis
              </button>
            </div>
            <DiagnosisReport result={result} />
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-6">
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <p className="text-red-700 font-semibold mb-1">Diagnosis Failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={handleReset} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 text-sm">
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}