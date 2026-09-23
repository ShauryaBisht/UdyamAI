'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getSettings, updateSettings } from '@/lib/api';
import { Settings as SettingsIcon, Globe, Bell, Database, Save, Loader2, Check } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useTranslation, useLanguageStore } from '@/stores/languageStore';
import type { Language } from '@/lib/i18n';

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    language: language || 'en',
    theme: 'light',
    notification_email: true,
    notification_sms: true,
    notification_push: false,
    auto_backup: true,
    date_format: 'DD/MM/YYYY',
    default_view: 'dashboard',
  });
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSettings(profileId);
      if (data) {
        setForm(prev => ({ ...prev, ...data, language: language || data.language || 'en' }));
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, [profileId, language]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setForm(prev => ({ ...prev, language }));
  }, [language]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(profileId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
    return (
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-neutral-200 dark:bg-surface-dark-elevated'} ${disabled ? 'opacity-50' : ''}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] p-8 sm:p-10 text-white shadow-fintech-card">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-semibold mb-4">
                <SettingsIcon className="h-3.5 w-3.5 text-mint" /> {t('nav.settings')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{t('settings.title')}</h1>
              <p className="text-white/80 text-sm sm:text-base mt-2 font-normal">
                {t('settings.desc')}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-12 flex flex-col items-center justify-center shadow-subtle">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-foreground-muted">Loading preferences...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Language & Display */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-subtle space-y-6 transition-colors">
              <div className="flex items-center gap-3 pb-4 border-b border-border dark:border-border-dark">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/10 text-primary dark:text-emerald-400 flex items-center justify-center">
                  <Globe className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground dark:text-foreground-dark text-base">{t('settings.langDisplay')}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">{t('settings.defaultLang')}</label>
                  <select
                    value={form.language}
                    onChange={e => {
                      const newLang = e.target.value as Language;
                      setForm({ ...form, language: newLang });
                      setLanguage(newLang);
                    }}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                  >
                    <option value="en">English (English)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">{t('settings.interfaceTheme')}</label>
                  <select
                    value={form.theme}
                    onChange={e => {
                      const newTheme = e.target.value as 'light' | 'dark';
                      setForm({ ...form, theme: newTheme });
                      useThemeStore.getState().setTheme(newTheme);
                    }}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                  >
                    <option value="light">Light Theme (Default Clean Slate)</option>
                    <option value="dark">Dark Theme (Muted Charcoal & Slate)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Date Format</label>
                  <select
                    value={form.date_format}
                    onChange={e => setForm({ ...form, date_format: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Default Landing View</label>
                  <select
                    value={form.default_view}
                    onChange={e => setForm({ ...form, default_view: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                  >
                    <option value="dashboard">Executive Dashboard</option>
                    <option value="expenses">Expense Tracker</option>
                    <option value="cashflow">Cash Flow Ledger</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-subtle space-y-6 transition-colors">
              <div className="flex items-center gap-3 pb-4 border-b border-border dark:border-border-dark">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/10 text-primary dark:text-emerald-400 flex items-center justify-center">
                  <Bell className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground dark:text-foreground-dark text-base">Alerts & Notifications</h3>
              </div>
              <div className="flex flex-col gap-5 divide-y divide-border dark:divide-border-dark">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-sm font-bold text-foreground dark:text-foreground-dark">Email Notifications</p>
                    <p className="text-xs text-foreground-muted mt-0.5">Receive scheme alerts and weekly cash summaries</p>
                  </div>
                  <Toggle checked={form.notification_email} onChange={() => setForm({ ...form, notification_email: !form.notification_email })} />
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-foreground dark:text-foreground-dark">SMS Alerts</p>
                    <p className="text-xs text-foreground-muted mt-0.5">Receive critical loan repayment reminders via SMS</p>
                  </div>
                  <Toggle checked={form.notification_sms} onChange={() => setForm({ ...form, notification_sms: !form.notification_sms })} />
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-foreground dark:text-foreground-dark">Push Notifications</p>
                    <p className="text-xs text-foreground-muted mt-0.5">Receive browser and mobile app push alerts</p>
                  </div>
                  <Toggle checked={form.notification_push} onChange={() => setForm({ ...form, notification_push: !form.notification_push })} />
                </div>
              </div>
            </div>

            {/* Data & Backup */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-subtle space-y-6 transition-colors">
              <div className="flex items-center gap-3 pb-4 border-b border-border dark:border-border-dark">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/10 text-primary dark:text-emerald-400 flex items-center justify-center">
                  <Database className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground dark:text-foreground-dark text-base">Data Ledger & Cloud Backup</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground dark:text-foreground-dark">Automated Cloud Ledger Backup</p>
                  <p className="text-xs text-foreground-muted mt-0.5">Securely snapshots your farm/business financial records weekly</p>
                </div>
                <Toggle checked={form.auto_backup} onChange={() => setForm({ ...form, auto_backup: !form.auto_backup })} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-full text-sm font-semibold shadow-fintech-btn hover:bg-primary-600 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saved ? t('settings.saved') : t('settings.save')}
              </button>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

