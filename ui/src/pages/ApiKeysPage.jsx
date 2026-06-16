import { Zap, Copy } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import api, { API_BASE } from '../lib/api';

export default function ApiKeysPage() {
  const { data, refetch } = useQuery({
    queryKey: ['api-key'],
    queryFn: () => api.get(`${API_BASE}/api/auth/me/api-key`).then(r => r.data),
  });

  const userApiKey = data?.api_key || '';

  const regenerateMutation = useMutation({
    mutationFn: () => api.post(`${API_BASE}/api/auth/me/api-key/regenerate`),
    onSuccess: () => {
      toast.success('Key regenerated!');
      refetch();
    },
    onError: () => toast.error('Error regenerating key'),
  });

  const handleRegenerate = () => {
    if (window.confirm('Are you sure? Old keys will instantly stop working.')) {
      regenerateMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">API Keys</h2>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-4">Your Secret API Key</h3>
        <p className="text-slate-500 mb-6">
          Use this key to authenticate external API requests to Nexus GenAI. Do not share it with anyone.
        </p>

        <div className="flex gap-4">
          <input
            type="text"
            readOnly
            value={userApiKey || '************************'}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 font-mono text-slate-600 focus:outline-none py-2"
          />
          <button
            disabled={!userApiKey}
            onClick={() => {
              navigator.clipboard.writeText(userApiKey);
              toast.success('Copied to clipboard!');
            }}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> Regenerate
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="font-bold mb-2">Rate Limits</h4>
          <p className="text-sm text-slate-500 mb-4">
            Free tier is limited to 5 API requests per minute. Upgrade to Pro for unmetered access.
          </p>
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto whitespace-pre">
            {`$ curl -X POST https://api-nexus.bachdev.bond/api/public/generate \\
  -H "X-Nexus-API-Key: ${userApiKey || 'nx_your_secret_key'}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A cyberpunk city at night", "width": 1024, "height": 1024}'`}
          </div>
        </div>
      </div>
    </div>
  );
}
