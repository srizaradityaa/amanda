import { useState } from 'react';
import { Check, Lock, Undo2 } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { mockSpjAntrean, formatRupiah, type SpjAntrean } from '@/data/mockData';
import { PageHeader, StatusBadge } from '@/components/ui/Primitives';

type SpjStatus = SpjAntrean['status'];

export function AntreanSpjModule({ session }: { session: SessionUser }) {
  if (session.role !== 'verifikator') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Antrean SPJ" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <p className="text-sm text-ink-secondary max-w-md">Hanya Verifikator yang dapat memeriksa antrean SPJ. (D02 §5, D03 §5)</p>
        </div>
      </div>
    );
  }

  return <AntreanList />;
}

function AntreanList() {
  const [items, setItems] = useState<SpjAntrean[]>(mockSpjAntrean);
  const [returning, setReturning] = useState<{ id: string; catatan: string } | null>(null);

  const terkunci = items.filter((i) => i.status === 'terkunci');
  const selesai = items.filter((i) => i.status !== 'terkunci');

  const setStatus = (id: string, status: SpjStatus) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const handleApprove = (id: string) => setStatus(id, 'menunggu_bku');

  const handleReturn = () => {
    if (!returning || returning.catatan.trim() === '') return;
    setStatus(returning.id, 'draft');
    setReturning(null);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Antrean SPJ" subtitle="Verifikasi SPJ yang diajukan seluruh seksi" mode="PRO" />

      <div className="surface-card mb-5 px-4 py-3 text-xs text-ink-secondary">
        <span className="text-ink-primary font-medium">{terkunci.length}</span> menunggu verifikasi •{' '}
        <span className="text-status-green">{selesai.length}</span> sudah diproses
      </div>

      <div className="surface-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-ink-primary">Daftar SPJ Terkunci</h2>
        </div>
        {terkunci.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-ink-muted">Tidak ada SPJ yang menunggu verifikasi.</p>
        ) : (
          <ul className="divide-y divide-border">
            {terkunci.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-ink-primary">{item.uraian}</div>
                    <div className="text-2xs text-ink-muted">
                      {item.seksiName} • {item.diajukanOleh} • {item.jenisBelanja}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tnum text-xs text-ink-primary">{formatRupiah(item.bruto)}</span>
                    <StatusBadge status={item.status} type="spj" />
                  </div>
                </div>

                {returning?.id === item.id ? (
                  <div className="mt-3 space-y-2">
                    <label htmlFor={`catatan-${item.id}`} className="text-xs text-ink-secondary">
                      Catatan revisi (wajib)
                    </label>
                    <textarea
                      id={`catatan-${item.id}`}
                      className="input-base w-full min-h-[72px] text-xs"
                      value={returning.catatan}
                      onChange={(e) => setReturning({ id: item.id, catatan: e.target.value })}
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setReturning(null)}>
                        Batal
                      </button>
                      <button
                        type="button"
                        className={`btn-amber px-3 py-1.5 text-xs ${returning.catatan.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={returning.catatan.trim() === ''}
                        onClick={handleReturn}
                      >
                        Kembalikan ke Seksi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5"
                      onClick={() => setReturning({ id: item.id, catatan: '' })}
                    >
                      <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Kembalikan
                    </button>
                    <button
                      type="button"
                      className="btn-amber px-3 py-1.5 text-xs flex items-center gap-1.5"
                      onClick={() => handleApprove(item.id)}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Setujui
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selesai.length > 0 && (
        <div className="surface-card mt-5">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-ink-primary">Sudah Diproses</h2>
          </div>
          <ul className="divide-y divide-border">
            {selesai.map((item) => (
              <li key={item.id} className="px-4 py-2 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-ink-primary">{item.uraian}</div>
                <StatusBadge status={item.status} type="spj" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
