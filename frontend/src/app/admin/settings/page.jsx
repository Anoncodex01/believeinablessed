'use client';
import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    site_name: 'BelieveinaBlessed',
    default_commission: '10',
    whatsapp_number: '+255747110777',
    contact_email: 'believeinablessed@gmail.com',
    currency: 'TZS',
    shipping_fee: '3000',
    free_shipping_threshold: '50000',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(({ data }) => {
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
    }).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 shimmer-bg" />)}</div>;

  const sections = [
    {
      title: 'General',
      fields: [
        { key: 'site_name', label: 'Site Name', type: 'text' },
        { key: 'currency', label: 'Currency', type: 'text' },
      ],
    },
    {
      title: 'Contact',
      fields: [
        { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
        { key: 'contact_email', label: 'Contact Email', type: 'email' },
      ],
    },
    {
      title: 'Affiliate & Commerce',
      fields: [
        { key: 'default_commission', label: 'Default Commission Rate (%)', type: 'number' },
        { key: 'shipping_fee', label: 'Shipping Fee (TZS)', type: 'number' },
        { key: 'free_shipping_threshold', label: 'Free Shipping Above (TZS)', type: 'number' },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <p className="section-kicker">Configuration</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
          Settings
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          Configure platform-wide storefront and commission settings.
        </p>
      </div>

      {sections.map((section, si) => (
        <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }}
          className="border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h3 className="mb-4 border-b border-[var(--border)] pb-3 font-semibold text-[var(--text)]">{section.title}</h3>
          <div className="space-y-4">
            {section.fields.map(f => (
              <div key={f.key}>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">{f.label}</label>
                <input
                  type={f.type}
                  value={settings[f.key] || ''}
                  onChange={e => set(f.key, e.target.value)}
                  className="input h-12"
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving}
        className="inline-flex h-12 items-center justify-center gap-2 bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Settings'}
      </motion.button>
    </div>
  );
}
