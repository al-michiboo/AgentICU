import { Activity, Stethoscope } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full py-6 px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
          <Stethoscope size={22} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AgentICU</h1>
          <p className="text-xs text-slate-500">AI Agent Clinic</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Activity size={14} className="text-teal-600" />
        <span>GitLab MCP Powered</span>
      </div>
    </header>
  );
}