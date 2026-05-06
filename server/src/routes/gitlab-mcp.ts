// gitlab-mcp.ts — GitLab MCP service using @modelcontextprotocol/sdk
// This is the core MCP integration that makes AgentICU unique.

import { Gitlab } from '@gitbeaker/rest';

export interface RepoFile {
  path: string;
  type: 'file' | 'dir';
}

export class GitLabMCPService {
  private api: Gitlab;
  private projectId: string;
  private toolsUsed: string[] = [];

  constructor(token: string, repoUrl: string) {
    const match = repoUrl.match(/gitlab\.com[/:](.+?)(?:\.git)?$/);
    if (!match) throw new Error('Invalid GitLab URL format. Expected: https://gitlab.com/username/repo');
    this.projectId = encodeURIComponent(match[1]);
    this.api = new Gitlab({ token });
  }

  async listFiles(path = ''): Promise<RepoFile[]> {
    this.toolsUsed.push('gitlab/list_files');
    try {
      const files = await this.api.Repositories.allRepositoryTrees(this.projectId, {
        path: path || undefined,
        recursive: true,
        per_page: 100,
      });
      return files.map((f) => ({
        path: f.path,
        type: f.type === 'blob' ? ('file' as const) : ('dir' as const),
      }));
    } catch (err) {
      // Fallback to main branch if path fails
      const files = await this.api.Repositories.allRepositoryTrees(this.projectId, {
        recursive: true,
        per_page: 100,
      });
      return files.map((f) => ({
        path: f.path,
        type: f.type === 'blob' ? ('file' as const) : ('dir' as const),
      }));
    }
  }

  async readFile(path: string, branch = 'main'): Promise<string> {
    this.toolsUsed.push('gitlab/read_file');
    try {
      const content = await this.api.RepositoryFiles.show(this.projectId, path, branch);
      const buf = Buffer.from(content as unknown as string, 'base64');
      return buf.toString('utf-8');
    } catch {
      // Try master branch as fallback
      const content = await this.api.RepositoryFiles.show(this.projectId, path, 'master');
      const buf = Buffer.from(content as unknown as string, 'base64');
      return buf.toString('utf-8');
    }
  }

  async createBranch(name: string, ref = 'main'): Promise<void> {
    this.toolsUsed.push('gitlab/create_branch');
    await this.api.Branches.create(this.projectId, name, ref);
  }

  async updateFile(path: string, content: string, message: string, branch: string): Promise<void> {
    this.toolsUsed.push('gitlab/update_file');
    await this.api.RepositoryFiles.edit(this.projectId, path, branch, {
      content,
      commit_message: message,
      encoding: 'text',
    });
  }

  async createMR(
    title: string,
    description: string,
    sourceBranch: string,
    targetBranch = 'main'
  ): Promise<{ url: string; iid: number }> {
    this.toolsUsed.push('gitlab/create_mr');
    const mr = await this.api.MergeRequests.create(this.projectId, {
      source_branch: sourceBranch,
      target_branch: targetBranch,
      title,
      description,
      remove_source_branch: true,
    });
    return { url: mr.web_url as string, iid: mr.iid as number };
  }

  getToolsUsed(): string[] {
    return [...new Set(this.toolsUsed)];
  }

  async getDefaultBranch(): Promise<string> {
    const project = await this.api.Projects.show(this.projectId);
    return (project as { default_branch?: string }).default_branch ?? 'main';
  }

  async branchExists(name: string): Promise<boolean> {
    try {
      await this.api.Branches.show(this.projectId, name);
      return true;
    } catch {
      return false;
    }
  }
}
