import axios from 'axios';
import { EmailJob, DashboardStats, User } from '../types';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/google', { credential });
    return res.data;
  },
  demoLogin: async (email?: string, name?: string) => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/demo-login', { email, name });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
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
    }>('/emails/schedule', payload);
    return res.data;
  },
  getScheduled: async (params?: { search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      emails: EmailJob[];
    }>('/emails/scheduled', { params });
    return res.data;
  },
  getSent: async (params?: { search?: string; page?: number; limit?: number; status?: string }) => {
    const res = await apiClient.get<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      emails: EmailJob[];
    }>('/emails/sent', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await apiClient.get<{ success: boolean; stats: DashboardStats }>('/emails/stats');
    return res.data.stats;
  },
  cancel: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string; email: EmailJob }>(`/emails/${id}`);
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
    }>('/upload/attachment', formData, {
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
    }>('/upload/leads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const settingsApi = {
  updateSettings: async (payload: { slackWebhookUrl: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string; settings: any }>('/settings', payload);
    return res.data;
  },
  testSlackAlert: async (slackWebhookUrl?: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>('/settings/test-slack', {
      slackWebhookUrl,
    });
    return res.data;
  },
};
