'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getProfile, updateProfile } from '@/lib/api';
import { User, Loader2, Save, Mail, Phone, Building2, Globe, Check, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/stores/languageStore';
import type { Language } from '@/lib/i18n';

export default function ProfilePage() {
  const { t, language, setLanguage } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    business_type: '',
    preferred_language: language || 'en',
  });
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const p = await getProfile(profileId);
      setData(p);
      setForm({
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        business_name: p.business_name || '',
        business_type: p.business_type || '',
        preferred_language: language || p.preferred_language || 'en',
      });
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, [profileId, language]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setForm(prev => ({ ...prev, preferred_language: language }));
  }, [language]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
                <User className="h-3.5 w-3.5 text-mint" /> {t('nav.profile')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{t('profile.title')}</h1>
              <p className="text-white/80 text-sm sm:text-base mt-2 font-normal">
                {t('profile.desc')}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-12 flex flex-col items-center justify-center shadow-subtle">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-foreground-muted">Loading profile details...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            {/* Profile Avatar Card */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-subtle transition-colors">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary/10 border border-primary-100 dark:border-primary/20 text-primary dark:text-emerald-400 shrink-0 shadow-sm">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground dark:text-foreground-dark">{form.name || 'Enterprise Owner'}</h3>
                  <p className="text-sm text-foreground-muted">{form.email || 'No email configured'}</p>
                  {data?.created_at && (
                    <p className="text-xs text-foreground-muted mt-1">
                      UdyamAI Member Since {new Date(data.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-subtle space-y-6 transition-colors">
              <div className="flex items-center gap-3 pb-4 border-b border-border dark:border-border-dark">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/10 text-primary dark:text-emerald-400 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground dark:text-foreground-dark text-base">{t('profile.personal')}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Full Legal Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                    placeholder="Your full legal name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Mobile Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">{t('settings.defaultLang')}</label>
                  <select
                    value={form.preferred_language}
                    onChange={e => {
                      const newLang = e.target.value as Language;
                      setForm({ ...form, preferred_language: newLang });
                      setLanguage(newLang);
                    }}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                  >
                    <option value="en">English (English)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-subtle space-y-6 transition-colors">
              <div className="flex items-center gap-3 pb-4 border-b border-border dark:border-border-dark">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/10 text-primary dark:text-emerald-400 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground dark:text-foreground-dark text-base">Business & Enterprise Profile</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Business / Trade Name</label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={e => setForm({ ...form, business_name: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                    placeholder="e.g. Kisan Samriddhi Agro"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Business Sector</label>
                  <select
                    value={form.business_type}
                    onChange={e => setForm({ ...form, business_type: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                  >
                    <option value="">Select Category</option>
                    <option value="agriculture">Agriculture & Crops</option>
                    <option value="dairy">Dairy & Cattle Farming</option>
                    <option value="poultry">Poultry & Livestock</option>
                    <option value="fisheries">Fisheries & Aquaculture</option>
                    <option value="food_processing">Agro / Food Processing</option>
                    <option value="retail">Rural Retail & Kirana</option>
                    <option value="handloom">Handloom & Handicrafts</option>
                    <option value="manufacturing">Small Scale Manufacturing</option>
                    <option value="services">Rural Services & Transport</option>
                    <option value="other">Other Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
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
                {saved ? t('profile.saved') : t('profile.save')}
              </button>
            </div>
          </form>
        )}
      </main>
    </AppShell>
  );
}

