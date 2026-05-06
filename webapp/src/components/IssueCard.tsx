import { useState } from 'react';
import type { Issue } from '../types';
import SeverityBadge from './SeverityBadge';
import { ChevronDown, ChevronUp, MapPin, Wrench } from 'lucide-react';

interface Props {
  issue: Issue;
  index: number;
}

export default function IssueCard({ issue, index }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl card-shadow border border-slate-100 overflow-hidden animate-slide-in" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">[{issue.id}]</span>
              <h4 className="text-sm font-semibold text-slate-900 truncate">{issue.name}</h4>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <SeverityBadge level={issue.status} score={issue.severity} />
              <span className="text-xs text-slate-500">{issue.category}</span>
              {issue.file && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin size={10} /> {issue.file}
                </span>
              )}
            </div>
          </div>
          {expanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
        </div>

        <p className="text-sm text-slate-600 mt-3 line-clamp-2">{issue.description}</p>

        <div className="mt-2 p-2 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 font-mono truncate">{issue.evidence}</p>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Wrench size={13} className="text-teal-600" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Treatment</span>
          </div>
          <ul className="space-y-1.5">
            {issue.treatment.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}