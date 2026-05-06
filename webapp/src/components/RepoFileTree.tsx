import { Folder, FileCode } from 'lucide-react';

interface Props {
  files: string[];
  filesRead: number;
  total: number;
}

export default function RepoFileTree({ files, filesRead, total }: Props) {
  const displayFiles = files.slice(0, 15);
  const pct = total > 0 ? Math.round((filesRead / Math.max(total, 1)) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl card-shadow border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Folder size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Files Discovered</h3>
        </div>
        <span className="text-xs font-mono text-slate-500">{filesRead}/{total}</span>
      </div>

      {total > 0 && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {displayFiles.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Waiting for files...</p>
        ) : (
          displayFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-50 animate-slide-in" style={{ animationDelay: `${i * 30}ms` }}>
              <FileCode size={13} className="text-slate-400 shrink-0" />
              <span className="text-xs font-mono text-slate-600 truncate">{f}</span>
            </div>
          ))
        )}
        {files.length > 15 && (
          <p className="text-xs text-slate-400 py-2 text-center">+ {files.length - 15} more files</p>
        )}
      </div>
    </div>
  );
}