// diagnosisEngine.ts — Core AI analysis logic for AgentICU

import { ISSUE_RULES, IssueRule } from './issueRules';
import { getHealthScore, getOverallStatus, getSeverityLevel, SeverityStatus } from './severityMatrix';

export interface AgentConfig {
  agentName: string;
  agentType: string;
  modelProvider?: string;
  modelApiKey?: string;
  systemPrompt?: string;
  toolsDefinition?: string;
  agentCode?: string;
  instructions?: string;
}

export interface Issue {
  id: string;
  category: string;
  name: string;
  severity: number;
  status: SeverityStatus;
  description: string;
  evidence: string;
  treatment: string[];
  references: string[];
}

export interface RecommendedAction {
  priority: number;
  action: string;
  effort: 'low' | 'medium' | 'high';
}

export interface DiagnosisResult {
  patientId: string;
  timestamp: string;
  healthScore: number;
  status: SeverityStatus;
  issues: Issue[];
  summary: string;
  criticalPath: string;
  recommendedActions: RecommendedAction[];
}

function generatePatientId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `AGE-2026-${suffix}`;
}

function extractEvidence(rule: IssueRule, config: AgentConfig): string {
  const fields: Record<string, string | undefined> = {
    systemPrompt: config.systemPrompt,
    toolsDefinition: config.toolsDefinition,
    agentCode: config.agentCode,
    instructions: config.instructions,
    agentType: config.agentType,
  };

  for (const matcher of rule.matchers) {
    const fieldValue = fields[matcher.field];
    if (fieldValue === undefined) continue;

    for (const pattern of matcher.patterns) {
      const match = fieldValue.match(pattern);
      if (match) {
        const matchedText = match[0];
        return `Pattern matched in ${matcher.field}: "${matchedText.substring(0, 100)}${matchedText.length > 100 ? '...' : ''}"`;
      }
    }
  }
  return `Detected based on ${rule.matchers.map((m) => m.field).join(', ')} configuration patterns`;
}

function matchRule(rule: IssueRule, config: AgentConfig): boolean {
  for (const matcher of rule.matchers) {
    const fieldValue = (config as unknown as Record<string, string | undefined>)[matcher.field];

    if (matcher.condition === 'required') {
      if (fieldValue === undefined || fieldValue.trim() === '') return false;
    }

    if (matcher.condition === 'optional' || matcher.condition === undefined) {
      if (fieldValue === undefined || fieldValue.trim() === '') continue;
      for (const pattern of matcher.patterns) {
        if (pattern.test(fieldValue)) return true;
      }
    }
  }
  return false;
}

function computeEffectiveSeverity(rule: IssueRule, config: AgentConfig): number {
  let score = rule.baseSeverity;

  if (config.agentType === 'autonomous' || config.agentType === 'multi-agent') {
    if (['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B4'].includes(rule.id)) {
      score = Math.min(10, score + 1);
    }
  }

  if (config.agentType === 'code-agent') {
    if (rule.id.startsWith('G')) {
      score = Math.min(10, score + 1);
    }
  }

  if (config.toolsDefinition && config.toolsDefinition.trim() !== '') {
    if (rule.id.startsWith('T')) {
      score = Math.min(10, score + 1);
    }
  }

  return score;
}

function determineEffort(severity: number): 'low' | 'medium' | 'high' {
  if (severity >= 8) return 'medium';
  if (severity >= 5) return 'medium';
  return 'low';
}

function findCriticalPath(issues: Issue[]): string {
  if (issues.length === 0) return 'No critical path — agent is healthy!';

  const dependencyMap: Record<string, string[]> = {
    S5: ['A4'], A4: ['A1', 'A2'], A1: ['B2'], B2: ['B4'],
    I1: ['I2'], G1: ['G4'], G4: ['G2'], C2: ['C3', 'C4'], T3: ['A1'],
  };

  const criticalIds = new Set<string>();
  const sorted = [...issues].sort((a, b) => b.severity - a.severity);

  for (const issue of sorted) {
    if (issue.severity < 7) break;
    criticalIds.add(issue.id);
    const deps = dependencyMap[issue.id] ?? [];
    for (const dep of deps) {
      if (issues.some((i) => i.id === dep)) criticalIds.add(dep);
    }
  }

  const order = ['S5','A4','A1','A2','B2','B4','C2','C3','C4','G1','G4','G2','I1','I2','T3'];
  const criticalList = [...criticalIds].sort((a, b) => order.indexOf(a) - order.indexOf(b));

  if (criticalList.length === 0) return 'No critical dependency chain detected';

  const labels: Record<string, string> = {
    S5:'Prompt injection', A4:'No jailbreak defense', A1:'No user confirmation',
    A2:'No output filtering', B2:'No HITL', B4:'No rollback',
    C2:'Memory overflow', C3:'No summarization', C4:'No context mgmt',
    G1:'No sandbox', G4:'Unrestricted files', G2:'No code review',
    I1:'No error handling', I2:'No retry logic', T3:'No permission tools',
  };

  return criticalList.map((id) => `${id} (${labels[id] ?? id})`).join(' → ');
}

function generateSummary(config: AgentConfig, issues: Issue[], healthScore: number): string {
  const typeName = config.agentType || 'agent';
  const agentName = config.agentName || 'the agent';
  const total = issues.length;

  if (total === 0) {
    return `${agentName} is in excellent health. No issues detected across all 7 categories. This ${typeName} is production-ready.`;
  }

  const criticalCount = issues.filter((i) => i.severity >= 9).length;
  const highCount = issues.filter((i) => i.severity >= 7 && i.severity < 9).length;
  const mediumCount = issues.filter((i) => i.severity >= 4 && i.severity < 7).length;
  const topCategories = [...new Set(issues.map((i) => i.category))];
  const categoryStr = topCategories.slice(0, 3).join(', ') + (topCategories.length > 3 ? ` and ${topCategories.length - 3} more` : '');

  let summary = `${agentName} (${typeName}) has a health score of ${healthScore}/100 with ${total} issue${total === 1 ? '' : 's'} across ${categoryStr}. `;

  if (criticalCount > 0) summary += `${criticalCount} critical risk${criticalCount > 1 ? 's' : ''} detected — immediate attention required. `;
  if (highCount > 0) summary += `${highCount} high-severity issue${highCount > 1 ? 's' : ''} — address urgently. `;
  if (mediumCount > 0) summary += `${mediumCount} medium-severity improvement${mediumCount > 1 ? 's' : ''} recommended. `;
  if (config.agentType === 'autonomous' || config.agentType === 'multi-agent') summary += `Autonomous agents require safety rails (confirmation hooks, output filtering, HITL). `;
  if (config.agentType === 'code-agent') summary += `Code agents need sandboxing and mandatory review steps. `;

  return summary.trim();
}

export function diagnoseAgent(config: AgentConfig): DiagnosisResult {
  const detectedIssues: Issue[] = [];

  for (const rule of ISSUE_RULES) {
    const matched = matchRule(rule, config);
    if (!matched) continue;

    const severity = computeEffectiveSeverity(rule, config);
    const evidence = extractEvidence(rule, config);

    detectedIssues.push({
      id: rule.id,
      category: rule.category,
      name: rule.name,
      severity,
      status: getSeverityLevel(severity),
      description: rule.description,
      evidence,
      treatment: rule.treatment,
      references: rule.references,
    });
  }

  detectedIssues.sort((a, b) => b.severity - a.severity);

  const healthScore = getHealthScore(detectedIssues);
  const overallStatus = getOverallStatus(healthScore);
  const criticalPath = findCriticalPath(detectedIssues);
  const summary = generateSummary(config, detectedIssues, healthScore);

  const recommendedActions: RecommendedAction[] = detectedIssues
    .filter((i) => i.severity >= 4)
    .slice(0, 8)
    .map((issue, idx) => ({
      priority: idx + 1,
      action: issue.treatment[0] ?? `Fix ${issue.name} (${issue.category})`,
      effort: determineEffort(issue.severity),
    }));

  return {
    patientId: generatePatientId(),
    timestamp: new Date().toISOString(),
    healthScore,
    status: overallStatus,
    issues: detectedIssues,
    summary,
    criticalPath,
    recommendedActions,
  };
}
