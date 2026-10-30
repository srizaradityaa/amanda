import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { PageHeader, StatCard, StatusBadge } from '@/components/ui/Primitives';
import { formatRupiah, type KuitansiRow } from '@/data/mockData';
import { toKuitansiActor, useKuitansiSpj } from '@/state/KuitansiSpjContext';
import {
  antreanItems,
  ringkasAntrean,
  type AntreanItem,
  type AntreanStatus,
} from '@/pages/modules/verifikasi/verifikasiRules';

interface AntreanVerifikasiProps {
  session: SessionUser;
}

const FILTERS: { id: 'semua' | AntreanStatus; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'terkunci', label: 'Menunggu Verifikasi' },
  { id: 'dikembalikan', label: 'Dikembalikan' },
  { id: 'menunggu_bku', label: 'Menunggu BKU' },
  { id: 'dibukukan', label: 'Dibukukan' },
];

export function AntreanVerifikasi({ session }: AntreanVerifikasiProps) {
  const { rows, verifySpj, returnSpj } = useKuitansiSpj();
  const actor = toKuitansiActor(session);
  const items = useMemo(() => antreanItems(rows), [rows]);
  const ringkas = ringkasAntrean(items);
  const [filter, setFilter] = useState<'semua' | AntreanStatus>('semua');
  const [openId, setOpenId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState<string | null>(null);

  const visible = filter === 'semua' ? items : items.filter((i) => i.status === filter);

  function handleVerify(row: KuitansiRow) {
    setError(verifySpj(row.id, actor));
  }

  function handleReturn(row: KuitansiRow) {
    const message = returnSpj(row.id, catatan, actor);
    setError(message);
    if (!message) {
      setCatatan('');
      setOpenId(null);
    }
  }

  function toggleOpen(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
    setCatatan('');
    setError(null);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Antrean SPJ"
        subtitle="Periksa SPJ yang diajukan PPTK, lalu setujui atau kembalikan untuk revisi."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Menunggu Verifikasi" value={ringkas.menunggu} accent="yellow" />
        <StatCard label="Dikembalikan" value={ringkas.revisi} accent="red" />
        <StatCard label="Disetujui" value={ringkas.disetujui} accent="green" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-sm border transition-colors ${
              filter === f.id
                ? 'border-amber text-amber bg-amber/5'
                : 'border-border text-ink-secondary hover:text-ink-primary hover:border-border-strong'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm text-ink-secondary">
          Tidak ada SPJ pada filter ini.
        </div>
      ) : (
        <div className="surface-card divide-y divide-border">
          {visible.map((item) => (
            <AntreanRow
              key={item.row.id}
              item={item}
              expanded={openId === item.row.id}
              onToggle={() => toggleOpen(item.row.id)}
              catatan={catatan}
              onCatatanChange={setCatatan}
              error={openId === item.row.id ? error : null}
              onVerify={() => handleVerify(item.row)}
              onReturn={() => handleReturn(item.row)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AntreanRowProps {
  item: AntreanItem;
  expanded: boolean;
  onToggle: () => void;
  catatan: string;
  onCatatanChange: (value: string) => void;
  error: string | null;
  onVerify: () => void;
  onReturn: () => void;
}

function AntreanRow({
  item,
  expanded,
  onToggle,
  catatan,
  onCatatanChange,
  error,
  onVerify,
  onReturn,
}: AntreanRowProps) {
  const { row, status } = item;
  const canReview = status === 'terkunci';

  return (
    <div className="px-5 py-4">
      <button onClick={onToggle} className="w-full text-left flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink-primary truncate">{row.uraian}</div>
          <div className="text-2xs text-ink-muted mt-1 truncate">
            {row.seksiName} • {row.kodeRekening}
            {row.pengajuName && ` • Diajukan oleh ${row.pengajuName}`}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono tnum text-sm text-ink-primary">{formatRupiah(row.bruto)}</span>
          <StatusBadge status={status} type="spj" />
        </div>
      </button>

      {expanded && canReview && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <textarea
            value={catatan}
            onChange={(e) => onCatatanChange(e.target.value)}
            placeholder="Catatan revisi (wajib diisi jika dikembalikan)"
            rows={2}
            className="w-full px-3 py-2 text-sm bg-bg border border-border text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-amber"
          />
          {error && <p className="text-sm text-status-red">{error}</p>}
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={onReturn}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border text-ink-secondary hover:text-status-red hover:border-status-red/40 transition-colors"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
              Kembalikan untuk Revisi
            </button>
            <button
              onClick={onVerify}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-amber text-ink-inverse hover:brightness-110 transition"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
              Verifikasi SPJ
            </button>
          </div>
        </div>
      )}

      {expanded && !canReview && (
        <p className="mt-3 text-sm text-ink-secondary">
          SPJ ini sudah diproses dan tidak memerlukan tindakan verifikasi.
        </p>
      )}
    </div>
  );
}
