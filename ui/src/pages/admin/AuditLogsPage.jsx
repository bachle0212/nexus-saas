import { motion } from 'framer-motion';
import { Key } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import api from '../../lib/api';

export default function AuditLogsPage() {
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/api/analytics/audit-logs').then(r => r.data?.items || []),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-slate-200 rounded-lg" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Key className="text-slate-600" /> Audit Logs
      </h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left">Time</th>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Action</th>
              <th className="px-6 py-3 text-left">Resource</th>
              <th className="px-6 py-3 text-left">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {auditLogs.map((log, i) => (
              <tr key={log.id || i} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-slate-400 font-mono text-xs">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                </td>
                <td className="px-6 py-3 text-slate-700">{log.user_email ?? '—'}</td>
                <td className="px-6 py-3">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold">{log.action ?? '—'}</span>
                </td>
                <td className="px-6 py-3 font-mono text-xs text-slate-500">{log.resource ?? '—'}</td>
                <td className="px-6 py-3 font-mono text-xs text-slate-400">{log.ip_address ?? '—'}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400">No audit logs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
