# AgentICU v2 — The AI Agent Doctor with GitLab MCP Superpowers

## Product Concept

AgentICU is a clinical-grade AI agent diagnosis and self-healing platform built for the Google Cloud Rapid Agent Hackathon. It takes a GitLab repository URL, connects via **GitLab MCP (Model Context Protocol)** to access the agent's source code, diagnoses issues across 7 safety dimensions, and automatically creates a GitLab Merge Request with fixes applied.

**Core differentiator**: AgentICU is itself an AI agent that uses MCP to inspect other agents — a meta-agent for debugging.

## Hackathon Alignment

- **Partner**: GitLab (MCP server integration)
- **Challenge**: "meaningful integration with at least one partner's solution using MCP"
- **AgentICU's MCP integration**: Uses `@modelcontextprotocol/sdk` as an MCP client, connects to GitLab's MCP server to access repo tools (list_files, read_file, create_branch, create_mr). The MCP connection is the **primary data source** for diagnosis — not a fallback.
- **Prize alignment**: $60k prize pool, judged on innovation, technical depth, and real-world utility.

## User Flow

```
User pastes GitLab repo URL
        ↓
AgentICU connects via GitLab MCP (stdio + @modelcontextprotocol/sdk)
        ↓
MCP tool: gitlab/list_files → discovers all source files
        ↓
MCP tool: gitlab/read_file → reads package.json, src/**, README, system prompt docs
        ↓
Diagnosis engine runs on each file (900+ rules across 7 categories)
        ↓
SSE streams real-time progress: MCP tools called, files scanned, issues found
        ↓
Clinical report generated: health score, severity badges, issue cards
        ↓
Fix patches auto-generated (try/catch, tool schemas, sanitization, HITL hooks)
        ↓
MCP tool: gitlab/create_branch → agenticu/fix-YYYYMMDD
        ↓
MCP tool: gitlab/update_file → applies fix patches
        ↓
MCP tool: gitlab/create_mr → opens MR with diagnosis report in description
        ↓
User reviews and merges the MR
```

## Severity System

| Level | Score | Color | Label | Description |
|-------|-------|-------|-------|-------------|
| Critical | 9-10 | #DC2626 | CRITICAL | Immediate safety risk, autonomous agent without guards |
| High | 7-8 | #EA580C | HIGH | Significant vulnerability, requires urgent fix |
| Medium | 4-6 | #CA8A04 | MEDIUM | Improvement recommended, not immediately dangerous |
| Low | 1-3 | #2563EB | LOW | Minor hardening opportunity |
| Healthy | 0 | #16A34A | HEALTHY | No issues detected |

**Health Score**: 100 - Σ(severity × weight) across all issues. 100 = perfect health.

## Technical Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend: React + TypeScript + Tailwind CSS     │
│  - EKG animation during diagnosis               │
│  - Real-time MCP tool call log (SSE)            │
│  - Clinical report with severity badges          │
└────────────────────┬────────────────────────────┘
                    │ POST /api/diagnose-mcp
                    ▼
┌─────────────────────────────────────────────────┐
│  Backend: Express + TypeScript (port 3001)       │
│  - SSE endpoint for real-time progress          │
│  - GitLab MCP service (MCP client)               │
│  - Diagnosis engine (900+ rules)                 │
│  - Fix generator (code patch templates)          │
└──────────┬─────────────────────────┬────────────┘
            │                         │
   ┌────────▼────────┐      ┌────────▼─────────┐
   │ @modelcontext   │      │ @gitbeaker/rest  │
   │ protocol/sdk    │      │ (REST fallback) │
   └────────┬────────┘      └──────────────────┘
            │
   ┌────────▼──────────────────────────────────┐
   │  GitLab MCP Server (@modelcontextprotocol/ │
   │  server-gitlab) — spawned as subprocess    │
   └────────┬──────────────────────────────────┘
            │
   ┌────────▼──────────────────────────────────┐
   │  GitLab.com API — repo files, branches, MR │
   └───────────────────────────────────────────┘
```

## MCP Integration (Core Differentiator)

### GitLab MCP Server
- Package: `@modelcontextprotocol/server-gitlab`
- Transport: stdio (subprocess spawned by backend)
- Protocol: MCP 1.x

### MCP Tools Used
| Tool | Purpose | Used In |
|------|---------|---------|
| `gitlab/list_files` | Discover all source files in repo | File discovery phase |
| `gitlab/read_file` | Read individual file contents | Diagnosis phase |
| `gitlab/create_branch` | Create fix branch | Fix application phase |
| `gitlab/update_file` | Apply code patches | Fix application phase |
| `gitlab/create_mr` | Open Merge Request with report | MR creation phase |

### MCP Connection Flow
1. Backend spawns `@modelcontextprotocol/server-gitlab` subprocess with `GITLAB_TOKEN` env var
2. MCP client (`@modelcontextprotocol/sdk`) connects via stdio
3. Client sends JSON-RPC requests, server responds via stdout
4. All MCP tool calls are logged and returned to frontend via SSE

## Diagnosis Categories (7 Dimensions)

| Category | Code | Issues Detected |
|----------|------|-----------------|
| Autonomous Safety | A | No user confirmation, no output filtering, no HITL, no jailbreak defense, no rollback |
| System Prompt Security | S | Missing/incomplete system prompt, prompt injection risk |
| Memory & Context | C | Memory overflow, no summarization, no context management |
| Code Execution Safety | G | No sandbox, unrestricted file ops, no code review |
| Error Handling | I | No error handling, no retry logic |
| Tool Definitions | T | Missing tool schemas, no permission tools |
| Instructions | B | Missing instructions, no escalation path |

## API Endpoints

### POST /api/diagnose-mcp
GitLab MCP-powered diagnosis. Takes repo URL and token, uses MCP to scan files, generates MR.

**Request:**
```json
{
  "repoUrl": "https://gitlab.com/username/my-agent",
  "gitlabToken": "glpat-xxxx",
  "agentName": "My Agent",
  "agentType": "autonomous"
}
```

**Response:**
```json
{
  "patientId": "AGE-2026-XXXXX",
  "healthScore": 45,
  "status": "critical",
  "issues": [...],
  "summary": "...",
  "criticalPath": "A1 → B2 → B4",
  "mrUrl": "https://gitlab.com/.../merge_requests/42",
  "mrIid": 42,
  "filesAnalyzed": 12,
  "fixPatches": [...],
  "mcpToolsUsed": ["gitlab/list_files", "gitlab/read_file", ...]
}
```

### GET /api/diagnose-mcp/stream?sessionId=xxx
SSE endpoint for real-time progress updates during diagnosis.

### POST /api/diagnose
Plain JSON config diagnosis (no GitLab required). Kept from v1 for backwards compatibility.

## Frontend Components

| Component | Purpose |
|-----------|---------|
| `Header` | Brand + tagline |
| `GitLabConnector` | Repo URL + PAT input, "Connect & Diagnose" button |
| `RepoFileTree` | Shows MCP-discovered files with scan progress |
| `DiagnosisProgress` | EKG animation + MCP tool call log via SSE |
| `DiagnosisReport` | Health score + severity badges + issue cards |
| `IssueCard` | Individual issue with description, evidence, treatment |
| `SeverityBadge` | Color-coded severity indicator |

## Demo Video Script

```
0:00-0:20  — Show AgentICU homepage, explain: "AI Agent Clinic — diagnose and heal agents with one click"
0:20-0:40  — User pastes GitLab repo URL → enters PAT → clicks "Connect & Diagnose"
0:40-1:20  — EKG animation plays, MCP tool call log streams in real-time:
             → gitlab/list_files: 847 files found
             → gitlab/read_file: src/agent.ts
             → gitlab/read_file: src/tools.ts
             → gitlab/read_file: package.json
1:20-2:00  — Diagnosis results appear: health score 45/100, CRITICAL badge, 8 issues listed
2:00-2:30  — "Creating GitLab MR..." spinner → MR created → shows MR URL
2:30-3:00  — MR page opens in GitLab: diagnosis report in description, fix patches in branch
```

## Tech Stack Summary

- **Frontend**: React 18 + TypeScript + TailwindCSS + Vite
- **Backend**: Express 4 + TypeScript + ts-node-dev
- **MCP**: `@modelcontextprotocol/sdk` (client) + `@modelcontextprotocol/server-gitlab` (server subprocess)
- **GitLab API**: `@gitbeaker/rest` (REST fallback)
- **Streaming**: Server-Sent Events (SSE)
- **Deployment**: Cloudflare Workers (backend) + MaxClaw deploy (frontend)