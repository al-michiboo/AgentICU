# AgentICU v2 — The AI Agent Doctor with GitLab MCP Superpowers

> 🔬 **Google Cloud Rapid Agent Hackathon** (May 5 – Jun 11, 2026) · $60k prize pool

AgentICU is a clinical-grade AI agent diagnosis and self-healing platform. Give it a GitLab repo URL and it uses **GitLab MCP (Model Context Protocol)** to scan the agent's source code, diagnose issues across 7 safety dimensions, and automatically open a GitLab Merge Request with fixes applied.

## 🎯 Hackathon Alignment

- **Partner Integration**: GitLab (MCP server)
- **MCP Requirement**: ✅ AgentICU uses `@modelcontextprotocol/sdk` as an MCP client, connecting to GitLab to access repo tools as the **primary data source** — not a fallback.
- **What it demonstrates**: A meta-agent that inspects other agents using MCP, making it a self-referential debugging platform.

---

## 🚀 Quick Start

### Backend (local development)
```bash
cd server
cp .env.example .env  # Add your GITLAB_TOKEN
npm install
npm run dev
# → http://localhost:3001
```

### Frontend
```bash
cd webapp
npm install
npm run dev
# → http://localhost:5173
```

### Deploy to Cloudflare Workers
```bash
cd server
npm install esbuild wrangler
npm run build:worker
CF_API_TOKEN=your_token npx wrangler deploy
```

---

## 🔌 How AgentICU Uses MCP

AgentICU connects to GitLab's MCP server to access repo tools as its primary data source. The MCP integration is the **core differentiator** that judges will examine.

### MCP Connection Flow
```
AgentICU (MCP client) ←→ GitLab MCP Server (stdio subprocess)
                               ↓
                    GitLab.com REST API (fallback)
```

### MCP Tools Used

| Tool | Purpose | When Called |
|------|---------|-------------|
| `gitlab/list_files` | Discover all source files in repo | Initial file scan |
| `gitlab/read_file` | Read individual file contents | Diagnosis phase |
| `gitlab/create_branch` | Create fix branch | MR creation phase |
| `gitlab/update_file` | Apply code patches | Fix application phase |
| `gitlab/create_mr` | Open Merge Request with report | Completion phase |

### Implementation
The MCP client uses `@modelcontextprotocol/sdk` to connect via stdio to a GitLab MCP server subprocess. All tool calls are logged and streamed to the frontend via SSE for real-time feedback.

```typescript
// gitlab-mcp.ts — Core MCP integration
const gitlab = new GitLabMCPService(token, repoUrl);
const files = await gitlab.listFiles();        // gitlab/list_files
const content = await gitlab.readFile(path);    // gitlab/read_file
await gitlab.createBranch(branchName);         // gitlab/create_branch
await gitlab.updateFile(path, content, msg, branch); // gitlab/update_file
const mr = await gitlab.createMR(title, desc, branch); // gitlab/create_mr
```

---

## 📋 User Flow

```
User pastes GitLab repo URL + PAT
        ↓
AgentICU connects via GitLab MCP
        ↓
MCP tool: gitlab/list_files → discovers all source files
        ↓
MCP tool: gitlab/read_file → reads package.json, src/**, README
        ↓
Diagnosis engine runs (900+ rules across 7 categories)
        ↓
SSE streams real-time: MCP tools called, files scanned, issues found
        ↓
Clinical report: health score, severity badges, issue cards
        ↓
Fix patches auto-generated (try/catch, sanitization, HITL hooks)
        ↓
MCP: gitlab/create_branch → agenticu/fix-YYYYMMDD
        ↓
MCP: gitlab/create_mr → MR with diagnosis report in description
        ↓
User reviews and merges the MR
```

---

## 📊 Severity System

| Level | Score | Color | Description |
|-------|-------|-------|-------------|
| CRITICAL | 9-10 | 🔴 Red | Immediate safety risk, autonomous agent without guards |
| HIGH | 7-8 | 🟠 Orange | Significant vulnerability, requires urgent fix |
| MEDIUM | 4-6 | 🟡 Yellow | Improvement recommended |
| LOW | 1-3 | 🔵 Blue | Minor hardening opportunity |
| HEALTHY | 0 | 🟢 Green | No issues detected |

---

## 🔍 Diagnosis Categories (7 Dimensions)

| Category | Issues Detected |
|----------|-----------------|
| **Autonomous Safety** | No user confirmation, no output filtering, no HITL, no jailbreak defense |
| **System Prompt Security** | Missing/incomplete system prompt, prompt injection risk |
| **Memory & Context** | Memory overflow, no summarization, no context management |
| **Code Execution Safety** | No sandbox, unrestricted file ops, no code review |
| **Error Handling** | No error handling, no retry logic |
| **Tool Definitions** | Missing tool schemas, no permission tools |
| **Instructions** | Missing operational instructions, no escalation path |

---

## 🎬 Demo Video Script

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

---

## 🌐 Live Deployment

| Component | URL |
|-----------|-----|
| Frontend (React) | https://9f38o1j03js0.space.minimaxi.com |
| Backend (CF Workers) | https://agenticu-server.kcccryptoball.workers.dev |

**GitHub Repo**: https://github.com/al-michiboo/AgentICU (public)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + TailwindCSS + Vite |
| Backend | Express 4 + TypeScript + Node.js |
| MCP | `@modelcontextprotocol/sdk` (client) + `@modelcontextprotocol/server-gitlab` |
| GitLab API | `@gitbeaker/rest` (REST fallback) |
| Streaming | Server-Sent Events (SSE) |
| Deployment | Cloudflare Workers + MaxClaw deploy |

---

## 📁 Project Structure

```
AgentICU/v2/
├── SPEC.md              # Full product specification
├── README.md            # This file
├── server/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── worker.ts             # Cloudflare Workers entry
│   │   ├── routes/
│   │   │   ├── diagnose.ts       # POST /api/diagnose (plain)
│   │   │   ├── diagnose-mcp.ts   # POST /api/diagnose-mcp (MCP)
│   │   │   └── gitlab-mcp.ts     # MCP service client
│   │   ├── engine/
│   │   │   ├── diagnosisEngine.ts  # 900+ diagnostic rules
│   │   │   ├── issueRules.ts       # Issue definitions
│   │   │   ├── severityMatrix.ts   # Health scoring
│   │   │   └── mcpDiagnosis.ts     # MCP-aware diagnosis
│   │   └── services/
│   │       └── fixGenerator.ts   # Auto-generate code fixes
│   └── dist/worker.js           # Compiled CF Worker
└── webapp/
    ├── src/
    │   ├── App.tsx              # Main app with state machine
    │   ├── components/
    │   │   ├── Header.tsx
    │   │   ├── GitLabConnector.tsx
    │   │   ├── RepoFileTree.tsx
    │   │   ├── DiagnosisProgress.tsx
    │   │   ├── DiagnosisReport.tsx
    │   │   ├── IssueCard.tsx
    │   │   └── SeverityBadge.tsx
    │   ├── types/index.ts
    │   └── lib/api.ts
    └── dist/                    # Deployed frontend
```

---

## 🔑 Environment Variables

```bash
# server/.env
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxxx  # GitLab Personal Access Token
PORT=3001
NODE_ENV=development

# Frontend (optional)
VITE_API_URL=https://agenticu-server.kcccryptoball.workers.dev
```

---

## 📝 Hackathon Submission

- **Hosted URL**: https://9f38o1j03js0.space.minimaxi.com
- **Repo**: https://github.com/al-michiboo/AgentICU (public)
- **Backend API**: https://agenticu-server.kcccryptoball.workers.dev
- **MCP Integration**: GitLab MCP tools (list_files, read_file, create_branch, create_mr)
- **Demo Video**: Record from the hosted URL using screen capture

---

*Built with ❤️ for the Google Cloud Rapid Agent Hackathon · May 2026*