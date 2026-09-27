import axios from 'axios';
import { EmailJob, DashboardStats, User } from '../types';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token into requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  loginWithGoogle: async (credential: string) => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/api/auth/google', { credential });
    return res.data;
  },
  demoLogin: async (email?: string, name?: string) => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/api/auth/demo-login', { email, name });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get<{ success: boolean; user: User }>('/api/auth/me');
    return res.data.user;
  },
};

export const emailsApi = {
  schedule: async (payload: {
    recipients: string[];
    subject: string;
    bodyHtml: string;
    attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
    scheduledAt: string;
    delayBetweenEmailsMs: number;
    hourlyLimit: number;
    senderEmail?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      batchId: string;
      scheduledCount: number;
      jobs: EmailJob[];
    }>('/api/emails/schedule', payload);
    return res.data;
  },
  getScheduled: async (params?: { search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      emails: EmailJob[];
    }>('/api/emails/scheduled', { params });
    return res.data;
  },
  getSent: async (params?: { search?: string; page?: number; limit?: number; status?: string }) => {
    const res = await apiClient.get<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      emails: EmailJob[];
    }>('/api/emails/sent', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await apiClient.get<{ success: boolean; stats: DashboardStats }>('/api/emails/stats');
    return res.data.stats;
  },
  cancel: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string; email: EmailJob }>(`/api/emails/${id}`);
    return res.data;
  },
};

export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{
      success: boolean;
      url: string;
      name: string;
      size: number;
      type: string;
    }>('/api/upload/attachment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  parseLeads: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{
      success: boolean;
      totalLeads: number;
      emails: string[];
    }>('/api/upload/leads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const settingsApi = {
  updateSettings: async (payload: { slackWebhookUrl: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string; settings: any }>('/api/settings', payload);
    return res.data;
  },
  testSlackAlert: async (slackWebhookUrl?: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>('/api/settings/test-slack', {
      slackWebhookUrl,
    });
    return res.data;
  },
};
