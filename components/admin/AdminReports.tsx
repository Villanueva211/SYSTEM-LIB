'use client';
import { Book, Borrow, Appointment } from '@/types/library';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';

interface Props { books: Book[]; borrows: Borrow[]; appointments: Appointment[]; }

export function AdminReports({ books, borrows, appointments }: Props) {
  const topBooks = books.map(b => ({
    name: b.title.length > 20 ? b.title.slice(0,20)+'…' : b.title,
    borrows: borrows.filter(br => br.book_id === b.id).length,
  })).sort((a,b) => b.borrows - a.borrows).slice(0,8);

  const monthlyData = (() => {
    const map: Record<string,number> = {};
    borrows.forEach(b => {
      if (!b.created_at) return;
      const key = new Date(b.created_at).toLocaleDateString('en',{month:'short',year:'2-digit'});
      map[key] = (map[key]||0) + 1;
    });
    return Object.entries(map).slice(-6).map(([month,count]) => ({ month, count }));
  })();

  const overdue = borrows.filter(b => b.status === 'approved' && b.due_date && new Date(b.due_date) < new Date());

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([headers+'\n'+rows], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename+'.csv'; a.click();
  };

  const CHART_TOOLTIP = { contentStyle:{ background:'#0d0d1f', border:'1px solid rgba(99,102,241,0.3)', borderRadius:'12px', color:'#e2e8f0' }, cursor:{ fill:'rgba(99,102,241,0.05)' } };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-black text-white mb-2">Reports & Analytics</h1>
      <p className="text-slate-400 text-sm mb-8">Library usage statistics and exportable reports</p>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label:'Total Borrows', value: borrows.length, color:'#6366f1' },
          { label:'Active Borrows', value: borrows.filter(b=>b.status==='approved').length, color:'#10b981' },
          { label:'Overdue', value: overdue.length, color:'#ef4444' },
          { label:'Return Rate', value: borrows.length ? Math.round((borrows.filter(b=>b.status==='returned').length/borrows.length)*100)+'%' : '0%', color:'#8b5cf6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card"><p className="text-2xl font-black mb-1" style={{ color }}>{value}</p><p className="text-xs text-slate-500">{label}</p></div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Books */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Most Borrowed Books</h3>
            <button onClick={() => exportCSV(topBooks,'top-books')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/05 transition-all"><Download size={12} /> CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topBooks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip {...CHART_TOOLTIP} />
              <Bar dataKey="borrows" radius={[0,6,6,0]} fill="url(#barG)">
                <defs><linearGradient id="barG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Monthly Borrow Trend</h3>
            <button onClick={() => exportCSV(monthlyData,'monthly-trend')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/05 transition-all"><Download size={12} /> CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ fill:'#6366f1', r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue report */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/06">
          <h3 className="font-bold text-white">Overdue Report</h3>
          <button onClick={() => exportCSV(overdue.map(b=>({ student:b.user?.name, book:b.book?.title, due:b.due_date, days_overdue: Math.floor((Date.now()-new Date(b.due_date).getTime())/86400000) })),'overdue-report')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/05 transition-all"><Download size={12} /> Export CSV</button>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-white/06">{['Student','Book','Due Date','Days Overdue'].map(h=><th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {overdue.length === 0
              ? <tr><td colSpan={4} className="text-center py-10 text-slate-500">No overdue books 🎉</td></tr>
              : overdue.map(b=>(
                <tr key={b.id} className="border-b border-white/04">
                  <td className="px-4 py-3 text-sm font-semibold text-white">{b.user?.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{b.book?.title}</td>
                  <td className="px-4 py-3 text-sm text-red-400">{b.due_date}</td>
                  <td className="px-4 py-3"><span className="badge-cancelled">{Math.floor((Date.now()-new Date(b.due_date).getTime())/86400000)} days</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
