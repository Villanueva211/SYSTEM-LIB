'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings } from '@/types/library';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>>; }

export function AdminSettings({ settings, setSettings }: Props) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('settings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) { toast.error('Failed to save settings'); setSaving(false); return; }
    setSettings(form);
    toast.success('Settings saved!');
    setSaving(false);
  };

  const Field = ({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between py-4 border-b border-white/05">
      <div className="flex-1"><p className="text-sm font-semibold text-white">{label}</p>{note && <p className="text-xs text-slate-500 mt-0.5">{note}</p>}</div>
      <div className="ml-8 flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-black text-white">Settings</h1><p className="text-slate-400 text-sm mt-1">Configure library rules and system preferences</p></div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <Save size={15} />{saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="glass rounded-2xl px-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-5 pb-2">Library Info</h2>
        <Field label="Library Name" note="Displayed in the app header and emails">
          <input value={form.library_name} onChange={e => setForm(p=>({...p,library_name:e.target.value}))} className="input-field text-sm w-56" />
        </Field>

        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-5 pb-2">Borrowing Rules</h2>
        <Field label="Max Borrow Days" note="How many days before a book is due">
          <input type="number" min={1} max={30} value={form.max_borrow_days} onChange={e => setForm(p=>({...p,max_borrow_days:parseInt(e.target.value)||7}))} className="input-field text-sm w-24 text-center" />
        </Field>
        <Field label="Max Books Per Member" note="Maximum simultaneous borrows per student">
          <input type="number" min={1} max={20} value={form.max_books_per_member} onChange={e => setForm(p=>({...p,max_books_per_member:parseInt(e.target.value)||3}))} className="input-field text-sm w-24 text-center" />
        </Field>
        <Field label="Allow Renewals" note="Let students extend their borrow period">
          <button onClick={() => setForm(p=>({...p,allow_renewals:!p.allow_renewals}))}
            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form.allow_renewals ? '' : 'bg-slate-700'}`}
            style={form.allow_renewals ? { background:'linear-gradient(135deg,#6366f1,#8b5cf6)' } : {}}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${form.allow_renewals ? 'left-7' : 'left-1'}`} />
          </button>
        </Field>
        {form.allow_renewals && (
          <Field label="Max Renewals Per Borrow" note="How many times a book can be renewed">
            <input type="number" min={1} max={5} value={form.max_renewals} onChange={e => setForm(p=>({...p,max_renewals:parseInt(e.target.value)||1}))} className="input-field text-sm w-24 text-center" />
          </Field>
        )}

        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-5 pb-2">Fines</h2>
        <Field label="Fine Per Day (₱)" note="Amount charged per day for overdue books">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">₱</span>
            <input type="number" min={0} step={0.5} value={form.fine_per_day} onChange={e => setForm(p=>({...p,fine_per_day:parseFloat(e.target.value)||0}))} className="input-field text-sm w-24 text-center" />
          </div>
        </Field>
        <div className="py-4" />
      </div>
    </div>
  );
}
