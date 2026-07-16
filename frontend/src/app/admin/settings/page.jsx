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

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 shimmer-bg rounded-xl" />)}</div>;

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-display font-bold text-[var(--text)]">Settings</h2>
        <p className="text-sm text-[var(--text-secondary)]">Configure platform settings</p>
      </div>

      {sections.map((section, si) => (
        <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }}
          className="card p-5">
          <h3 className="font-semibold text-[var(--text)] mb-4 pb-3 border-b border-[var(--border)]">{section.title}</h3>
          <div className="space-y-4">
            {section.fields.map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">{f.label}</label>
                <input
                  type={f.type}
                  value={settings[f.key] || ''}
                  onChange={e => set(f.key, e.target.value)}
                  className="input"
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
        className="btn-primary flex items-center gap-2 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Settings'}
      </motion.button>
    </div>
  );
}
