import type { SeverityLevel } from '../types';

interface Props {
  level: SeverityLevel;
  score?: number;
}

const CONFIG: Record<SeverityLevel, { label: string; bg: string; text: string }> = {
  CRITICAL: { label: 'CRITICAL', bg: 'bg-red-50', text: 'text-red-600 border-red-200' },
  HIGH: { label: 'HIGH', bg: 'bg-orange-50', text: 'text-orange-600 border-orange-200' },
  MEDIUM: { label: 'MEDIUM', bg: 'bg-yellow-50', text: 'text-yellow-600 border-yellow-200' },
  LOW: { label: 'LOW', bg: 'bg-blue-50', text: 'text-blue-600 border-blue-200' },
  HEALTHY: { label: 'HEALTHY', bg: 'bg-green-50', text: 'text-green-600 border-green-200' },
};

export default function SeverityBadge({ level, score }: Props) {
  const cfg = CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text}`}>
      {score !== undefined && <span className="font-mono">{score}</span>}
      {cfg.label}
    </span>
  );
}