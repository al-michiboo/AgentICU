interface MCPEvent {
  type: string;
  message?: string;
  tool?: string;
  file?: string;
  id?: string;
  name?: string;
  severity?: number;
  category?: string;
  healthScore?: number;
  issuesCount?: number;
}

interface Props {
  events: MCPEvent[];
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-500',
  HIGH: 'text-orange-500',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-blue-500',
};

const EKG_BARS = [4, 14, 2, 22, 6, 18, 8];

export default function DiagnosisProgress({ events }: Props) {
  const latestStatus = events.filter(e => e.type === 'status').pop();
  const issueEvents = events.filter(e => e.type === 'issue_found');
  const completeEvent = events.find(e => e.type === 'complete');

  return (
    <div className="bg-white rounded-2xl card-shadow border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-700">Live Diagnosis Feed</h3>
        <div className="flex items-center gap-1.5">
          {EKG_BARS.map((h, i) => (
            <div
              key={i}
              className="w-1 bg-teal-500 rounded-sm animate-ekg-bar"
              style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
            />
          ))}
          <span className="text-xs text-slate-400 ml-1">MCP Active</span>
        </div>
      </div>

      {/* MCP Tool Log */}
      <div className="bg-slate-800 rounded-xl p-4 font-mono text-xs max-h-56 overflow-y-auto mb-4">
        {events.filter(e => e.tool === 'gitlab/read_file' || e.tool === 'gitlab/list_files').map((e, i) => (
          <div key={i} className="text-teal-300 mb-1 animate-slide-in">
            <span className="text-slate-400">→</span> {e.tool}: {e.file || e.message}
          </div>
        ))}
        {events.filter(e => e.tool).length === 0 && (
          <div className="text-slate-400">Initializing MCP connection...</div>
        )}
      </div>

      {/* Status Message */}
      {latestStatus && (
        <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl mb-4 animate-slide-in">
          <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shrink-0" />
          <span className="text-sm text-teal-800 font-medium">{latestStatus.message}</span>
        </div>
      )}

      {/* Issues Found */}
      {issueEvents.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{issueEvents.length} Issue{issueEvents.length !== 1 ? 's' : ''} Found</p>
          <div className="space-y-1">
            {issueEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                <span className={`text-xs font-bold ${SEVERITY_COLORS[e.category || ''] ?? 'text-slate-500'}`}>[SEV {e.severity}]</span>
                <span className="text-sm text-slate-700 font-medium">{e.name}</span>
                <span className="text-xs text-slate-400 ml-auto">{e.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete */}
      {completeEvent && (
        <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
          <p className="text-sm font-semibold text-green-700">Diagnosis Complete!</p>
          <p className="text-xs text-green-600 mt-1">Health Score: {completeEvent.healthScore ?? '?'}/100 — {completeEvent.issuesCount ?? 0} issues found</p>
        </div>
      )}
    </div>
  );
}