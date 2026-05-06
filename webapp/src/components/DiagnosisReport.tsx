import type { DiagnosisResult } from '../types';
import SeverityBadge from './SeverityBadge';
import IssueCard from './IssueCard';
import { Activity, GitBranch, FileCode, GitPullRequest, CheckCircle } from 'lucide-react';

interface Props {
  result: DiagnosisResult;
}

export default function DiagnosisReport({ result }: Props) {
  const healthColor = result.healthScore >= 70 ? 'text-green-600' : result.healthScore >= 40 ? 'text-yellow-600' : 'text-red-600';
  const healthBg = result.healthScore >= 70 ? 'bg-green-50' : result.healthScore >= 40 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className="space-y-6">
      {/* Score Header */}
      <div className={`rounded-2xl p-6 ${healthBg} border ${result.healthScore >= 70 ? 'border-green-100' : result.healthScore >= 40 ? 'border-yellow-100' : 'border-red-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">Health Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${healthColor}`}>{result.healthScore}</span>
              <span className="text-2xl text-slate-400 font-light">/100</span>
            </div>
          </div>
          <div className="text-right">
            <SeverityBadge level={result.status} />
            <p className="text-xs text-slate-500 mt-2">Patient ID: {result.patientId}</p>
          </div>
        </div>

        <div className="mt-4 h-2 bg-white/60 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${result.healthScore >= 70 ? 'bg-green-500' : result.healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${result.healthScore}%` }} />
        </div>
      </div>

      {/* Meta Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl card-shadow border border-slate-100 p-4 flex items-center gap-3">
          <FileCode size={20} className="text-teal-600" />
          <div>
            <p className="text-xs text-slate-500">Files Analyzed</p>
            <p className="text-lg font-bold text-slate-800">{result.filesAnalyzed ?? result.issues.length * 2}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl card-shadow border border-slate-100 p-4 flex items-center gap-3">
          <Activity size={20} className="text-teal-600" />
          <div>
            <p className="text-xs text-slate-500">Issues Found</p>
            <p className="text-lg font-bold text-slate-800">{result.issues.length}</p>
          </div>
        </div>
        {result.mcpToolsUsed && result.mcpToolsUsed.length > 0 && (
          <div className="bg-white rounded-xl card-shadow border border-slate-100 p-4 col-span-2">
            <p className="text-xs text-slate-500 mb-2">MCP Tools Used</p>
            <div className="flex flex-wrap gap-2">
              {result.mcpToolsUsed.map((tool) => (
                <span key={tool} className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-mono">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl card-shadow border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Clinical Summary</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
        {result.criticalPath && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 mb-1">Critical Path</p>
            <p className="text-xs font-mono text-slate-700">{result.criticalPath}</p>
          </div>
        )}
      </div>

      {/* MR Link */}
      {result.mrUrl && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitPullRequest size={24} className="text-teal-600" />
            <div>
              <p className="text-sm font-semibold text-teal-800">GitLab MR Created!</p>
              <p className="text-xs text-teal-600">Branch: {result.branchName}</p>
            </div>
          </div>
          <a href={result.mrUrl} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 flex items-center gap-2 shrink-0">
            View MR <GitBranch size={14} />
          </a>
        </div>
      )}

      {/* Issue Cards */}
      {result.issues.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Detected Issues</h3>
          <div className="space-y-3">
            {result.issues.map((issue, i) => (
              <IssueCard key={issue.id + i} issue={issue} index={i} />
            ))}
          </div>
        </div>
      )}

      {result.issues.length === 0 && (
        <div className="bg-green-50 rounded-2xl p-8 border border-green-100 text-center">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-green-700">Agent is Healthy!</p>
          <p className="text-sm text-green-600 mt-1">No issues detected across all 7 safety dimensions.</p>
        </div>
      )}
    </div>
  );
}