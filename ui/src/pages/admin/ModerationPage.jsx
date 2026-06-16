import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import api, { API_BASE } from '../../lib/api';

export default function ModerationPage() {
  const queryClient = useQueryClient();

  const { data: allResources = [], refetch } = useQuery({
    queryKey: ['admin-resources'],
    queryFn: () => api.get(`${API_BASE}/api/admin/resources`).then(r => r.data),
    // Don't auto-fetch — user clicks Refresh button to load
    enabled: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`${API_BASE}/api/admin/resources/${id}`),
    onSuccess: () => {
      toast.success('Deleted!');
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
    },
    onError: () => toast.error('Error deleting resource'),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage All Resources</h2>
        <button
          onClick={() => { refetch(); toast.info('Refreshed'); }}
          className="bg-white border border-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
            <tr>
              <th className="px-6 py-4 font-semibold">Preview</th>
              <th className="px-6 py-4 font-semibold">Prompt / Data</th>
              <th className="px-6 py-4 font-semibold">Cost</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allResources.map(res => (
              <tr key={res.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <a href={res.result_url} target="_blank" rel="noreferrer">
                    <img
                      src={res.result_url}
                      alt="cover"
                      className="w-16 h-16 object-cover rounded-md border border-slate-200 hover:opacity-80 transition"
                    />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-800 line-clamp-2 max-w-sm">{res.prompt}</div>
                  <div className="text-xs text-slate-400 mt-1">User ID: {res.user_id}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded border border-amber-100">
                    {res.cost} cr
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">{new Date(res.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this resource permanently?')) {
                        deleteMutation.mutate(res.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-600 p-2 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {allResources.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  No resources found or click Refresh to load.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
