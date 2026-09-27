import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ScheduledList } from './components/ScheduledList';
import { SentList } from './components/SentList';
import { QueueMonitorView } from './components/QueueMonitorView';
import { SettingsView } from './components/SettingsView';
import { ComposeModal } from './components/ComposeModal';
import { EmailDetailModal } from './components/EmailDetailModal';
import { emailsApi } from './services/api';
import { EmailJob, DashboardStats } from './types';
import toast from 'react-hot-toast';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<'scheduled' | 'sent' | 'queue' | 'settings'>('scheduled');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Email data lists
  const [scheduledEmails, setScheduledEmails] = useState<EmailJob[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailJob[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await emailsApi.getStats();
      setStats(data);
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch email lists
  const fetchEmails = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingEmails(true);
      const [scheduledRes, sentRes] = await Promise.all([
        emailsApi.getScheduled({ search: searchQuery }),
        emailsApi.getSent({ search: searchQuery }),
      ]);
      setScheduledEmails(scheduledRes.emails);
      setSentEmails(sentRes.emails);
    } catch (err) {
      console.error('Failed to fetch email records:', err);
    } finally {
      setIsLoadingEmails(false);
      setIsRefreshing(false);
    }
  }, [user, searchQuery]);

  // Initial load and tab change
  useEffect(() => {
    if (user) {
      fetchStats();
      fetchEmails();
    }
  }, [user, fetchStats, fetchEmails]);

  // Periodic polling for BullMQ queue updates (every 5 seconds)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchStats();
      // Silently refresh current view
      if (currentTab === 'scheduled') {
        emailsApi.getScheduled({ search: searchQuery }).then((res) => setScheduledEmails(res.emails)).catch(() => {});
      } else if (currentTab === 'sent') {
        emailsApi.getSent({ search: searchQuery }).then((res) => setSentEmails(res.emails)).catch(() => {});
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, currentTab, searchQuery, fetchStats]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchEmails()]);
  };

  const handleCancelEmail = async (id: string) => {
    try {
      await emailsApi.cancel(id);
      toast.success('Scheduled job cancelled');
      fetchStats();
      fetchEmails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel job');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Get active tab title & subtitle
  const getTabHeader = () => {
    switch (currentTab) {
      case 'scheduled':
        return {
          title: 'Scheduled Emails',
          subtitle: 'Active delayed jobs waiting for dispatch in BullMQ queue',
        };
      case 'sent':
        return {
          title: 'Sent Mail History',
          subtitle: 'Delivered emails with Ethereal SMTP live preview inspections',
        };
      case 'queue':
        return {
          title: 'Queue Analytics & Telemetry',
          subtitle: 'Live BullMQ and Redis monitoring powered by @bull-board',
        };
      case 'settings':
        return {
          title: 'Slack Webhooks & Settings',
          subtitle: 'Configure automated Slack alerts and review system resilience',
        };
    }
  };

  const { title, subtitle } = getTabHeader();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCompose={() => setIsComposeOpen(true)}
        stats={stats}
      />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          stats={stats}
        />

        {/* Tab Views */}
        {currentTab === 'scheduled' && (
          <ScheduledList
            emails={scheduledEmails}
            loading={isLoadingEmails}
            onCancel={handleCancelEmail}
            onOpenCompose={() => setIsComposeOpen(true)}
          />
        )}

        {currentTab === 'sent' && (
          <SentList
            emails={sentEmails}
            loading={isLoadingEmails}
            onSelectEmail={(email) => setSelectedEmail(email)}
          />
        )}

        {currentTab === 'queue' && (
          <QueueMonitorView
            stats={stats}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        )}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={() => {
          fetchStats();
          fetchEmails();
        }}
      />

      {/* Detail / Sent Inspector Modal */}
      <EmailDetailModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />
    </div>
  );
};
