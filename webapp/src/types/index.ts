// types/index.ts — Shared TypeScript types for AgentICU v2

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'HEALTHY';

export interface Issue {
  id: string;
  category: string;
  name: string;
  severity: number;
  status: SeverityLevel;
  description: string;
  evidence: string;
  treatment: string[];
  references: string[];
  file?: string;
}

export interface RecommendedAction {
  priority: number;
  action: string;
  effort: 'low' | 'medium' | 'high';
}

export interface FixPatch {
  file: string;
  before: string;
  after: string;
  reason: string;
  severity: number;
  issueId: string;
}

export interface DiagnosisResult {
  patientId: string;
  timestamp: string;
  healthScore: number;
  status: SeverityLevel;
  issues: Issue[];
  summary: string;
  criticalPath: string;
  recommendedActions: RecommendedAction[];
  repoUrl?: string;
  filesAnalyzed?: number;
  fixPatches?: FixPatch[];
  mcpToolsUsed?: string[];
  mrUrl?: string;
  mrIid?: number;
  branchName?: string;
}

// SSE Event types
export type SSEEventType =
  | 'connected'
  | 'status'
  | 'file_discovered'
  | 'file_read'
  | 'issue_found'
  | 'fix_generated'
  | 'branch_created'
  | 'mr_created'
  | 'error'
  | 'complete';

export interface SSEEvent {
  type: SSEEventType;
  message?: string;
  tool?: string;
  file?: string;
  total?: number;
  files?: string[];
  filesRead?: number;
  path?: string;
  size?: number;
  id?: string;
  name?: string;
  severity?: number;
  category?: string;
  count?: number;
  branch?: string;
  url?: string;
  iid?: number;
  patientId?: string;
  healthScore?: number;
  issuesCount?: number;
  mrUrl?: string;
}