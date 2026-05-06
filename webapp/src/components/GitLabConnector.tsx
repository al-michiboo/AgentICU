import { useState } from 'react';
import { GitBranch, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react';

interface Props {
  onDiagnose: (repoUrl: string, token: string, agentName: string, agentType: string) => void;
  loading: boolean;
  error?: string;
}

const AGENT_TYPES = [
  { value: 'autonomous', label: 'Autonomous Agent' },
  { value: 'code-agent', label: 'Code Agent' },
  { value: 'chatbot', label: 'Chatbot' },
  { value: 'research', label: 'Research Agent' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'multi-agent', label: 'Multi-Agent System' },
];

export default function GitLabConnector({ onDiagnose, loading, error }: Props) {
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [agentName, setAgentName] = useState('My AI Agent');
  const [agentType, setAgentType] = useState('autonomous');
  const [urlError, setUrlError] = useState('');

  const validateUrl = (url: string) => {
    if (!url) return '';
    if (!url.includes('gitlab.com')) return 'Please enter a valid GitLab.com URL';
    return '';
  };

  const handleSubmit = () => {
    const err = validateUrl(repoUrl);
    setUrlError(err);
    if (err) return;
    onDiagnose(repoUrl.trim(), token.trim(), agentName, agentType);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl card-shadow p-8 border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <GitBranch size={20} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Connect GitLab Repository</h2>
            <p className="text-sm text-slate-500">Enter your repo to run MCP-powered diagnosis</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">GitLab Repository URL</label>
            <input type="url" placeholder="https://gitlab.com/username/my-agent" value={repoUrl}
              onChange={(e) => { setRepoUrl(e.target.value); setUrlError(validateUrl(e.target.value)); }}
              className={`w-full px-4 py-3 rounded-xl border ${urlError ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm`} />
            {urlError && <p className="mt-1 text-xs text-red-500">{urlError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">GitLab Personal Access Token</label>
            <div className="relative">
              <input type={showToken ? 'text' : 'password'} placeholder="glpat-xxxxxxxxxxxxxxxxxxxxx" value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono" />
              <button type="button" onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">Needs read_repository + api scope. <a href="https://gitlab.com/-/profile/personal_access_tokens" target="_blank" rel="noopener" className="text-teal-600 hover:underline">Create one here</a></p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Agent Name</label>
              <input type="text" value={agentName} onChange={(e) => setAgentName(e.target.value)}
                placeholder="My AI Agent" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Agent Type</label>
              <select value={agentType} onChange={(e) => setAgentType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white">
                {AGENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !repoUrl || !token}
            className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
            {loading ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connecting to GitLab MCP...</>) : (<><Zap size={16} /> Connect &amp; Diagnose</>)}
          </button>
        </div>
      </div>
    </div>
  );
}