// severityMatrix.ts — Severity scoring for all issue categories

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'HEALTHY';
export type SeverityStatus = SeverityLevel;

export interface SeverityConfig {
  level: SeverityLevel;
  color: string;
  cssVar: string;
  description: string;
}

export const SEVERITY_MATRIX: Record<number, SeverityConfig> = {
  10: {
    level: 'CRITICAL',
    color: '#DC2626',
    cssVar: '--sev-critical',
    description: 'Critical risk — immediate action required',
  },
  9: {
    level: 'CRITICAL',
    color: '#DC2626',
    cssVar: '--sev-critical',
    description: 'Critical risk — immediate action required',
  },
  8: {
    level: 'HIGH',
    color: '#EA580C',
    cssVar: '--sev-high',
    description: 'High risk — address urgently',
  },
  7: {
    level: 'HIGH',
    color: '#EA580C',
    cssVar: '--sev-high',
    description: 'High risk — address urgently',
  },
  6: {
    level: 'MEDIUM',
    color: '#CA8A04',
    cssVar: '--sev-medium',
    description: 'Medium risk — address in near term',
  },
  5: {
    level: 'MEDIUM',
    color: '#CA8A04',
    cssVar: '--sev-medium',
    description: 'Medium risk — address in near term',
  },
  4: {
    level: 'MEDIUM',
    color: '#CA8A04',
    cssVar: '--sev-medium',
    description: 'Medium risk — address in near term',
  },
  3: {
    level: 'LOW',
    color: '#2563EB',
    cssVar: '--sev-low',
    description: 'Low risk — minor improvement',
  },
  2: {
    level: 'LOW',
    color: '#2563EB',
    cssVar: '--sev-low',
    description: 'Low risk — minor improvement',
  },
  1: {
    level: 'LOW',
    color: '#2563EB',
    cssVar: '--sev-low',
    description: 'Low risk — minor improvement',
  },
  0: {
    level: 'HEALTHY',
    color: '#16A34A',
    cssVar: '--sev-healthy',
    description: 'Healthy — no issues detected',
  },
};

export function getSeverityLevel(score: number): SeverityLevel {
  if (score >= 9) return 'CRITICAL';
  if (score >= 7) return 'HIGH';
  if (score >= 4) return 'MEDIUM';
  if (score >= 1) return 'LOW';
  return 'HEALTHY';
}

export function getHealthScore(issues: Array<{ severity: number }>): number {
  if (issues.length === 0) return 100;
  const maxSeverity = Math.max(...issues.map((i) => i.severity));
  const avgSeverity = issues.reduce((sum, i) => sum + i.severity, 0) / issues.length;
  // Penalize heavily for critical issues and high average
  const criticalPenalty = issues.filter((i) => i.severity >= 9).length * 15;
  const highPenalty = issues.filter((i) => i.severity >= 7 && i.severity < 9).length * 8;
  const mediumPenalty = issues.filter((i) => i.severity >= 4 && i.severity < 7).length * 4;
  const lowPenalty = issues.filter((i) => i.severity < 4).length * 1;

  const rawScore = 100 - criticalPenalty - highPenalty - mediumPenalty - lowPenalty;
  // Cap at 100 but also factor in issue count
  const issueCountPenalty = Math.min(issues.length * 1.5, 20);
  return Math.max(0, Math.min(100, Math.round(rawScore - issueCountPenalty)));
}

export function getOverallStatus(healthScore: number): SeverityLevel {
  if (healthScore >= 90) return 'HEALTHY';
  if (healthScore >= 70) return 'LOW';
  if (healthScore >= 50) return 'MEDIUM';
  if (healthScore >= 25) return 'HIGH';
  return 'CRITICAL';
}