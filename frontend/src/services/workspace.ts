import api from './api';
import axios from 'axios';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  ownerUsername: string;
  currentUserRole: 'ADMIN' | 'EDITOR' | 'VIEWER';
  memberCount: number;
  createdAt: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  status: 'SUCCESS' | 'TIMED_OUT' | 'ERROR';
}

export const workspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    const res = await api.get<Workspace[]>('/workspaces');
    return res.data;
  },

  async createWorkspace(name: string): Promise<Workspace> {
    const res = await api.post<Workspace>('/workspaces', { name });
    return res.data;
  },

  async getWorkspaceById(id: string): Promise<Workspace> {
    const res = await api.get<Workspace>(`/workspaces/${id}`);
    return res.data;
  },

  async deleteWorkspace(id: string): Promise<void> {
    await api.delete(`/workspaces/${id}`);
  },

  async executeCode(language: string, code: string, stdin?: string): Promise<ExecutionResult> {
    const res = await axios.post<ExecutionResult>('/api/execute', { language, code, stdin });
    return res.data;
  }
};
