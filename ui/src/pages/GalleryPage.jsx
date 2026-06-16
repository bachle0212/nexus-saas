import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Grid, Download, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import api from '../lib/api';

const LIMIT = 20;

export default function GalleryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gallerySearch, setGallerySearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input so we don't fire on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(gallerySearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [gallerySearch]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['gallery', page, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (debouncedSearch) params.set('q', debouncedSearch);
      return api.get(`/api/resources/generations?${params}`).then(r => r.data);
    },
    // Keep previous page data visible while next page loads (no flash)
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/resources/generations/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-slate-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Gallery</h2>
          {total > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{total} assets total</p>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Grid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={gallerySearch}
              onChange={e => setGallerySearch(e.target.value)}
              placeholder="Search by prompt..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {isFetching && !isLoading && (
            <span className="text-xs text-slate-400 animate-pulse">Loading...</span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && !isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">
            {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No resources yet'}
          </h3>
          {!debouncedSearch && (
            <>
              <p className="text-slate-500 mb-6">Head over to the Studio to generate your first AI masterpiece.</p>
              <button
                onClick={() => navigate('/dashboard/studio')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Go to Studio
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 group flex flex-col">
                <div className="aspect-square bg-slate-100 relative">
                  <img src={item.result_url} className="w-full h-full object-cover" alt="generation" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => window.open(item.result_url, '_blank')}
                      className="bg-white text-slate-900 p-2 rounded-full hover:scale-110 transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this asset?')) deleteMutation.mutate(item.id);
                      }}
                      className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">Image</span>
                    <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-3 flex-1" title={item.prompt}>{item.prompt}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(item.prompt); toast.success('Prompt copied!'); }}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600 py-1.5 rounded hover:bg-slate-100 transition flex justify-center items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Prompt
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  // Show first, last, and pages around current
                  let p;
                  if (pages <= 7) p = i + 1;
                  else if (i === 0) p = 1;
                  else if (i === 6) p = pages;
                  else p = Math.max(2, Math.min(pages - 1, page - 2 + i));
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                        page === p
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages || isFetching}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
