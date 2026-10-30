import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// ── Zone Dot (color + label, not color-only per §1 Keterbacaan) ──
export type Zona = 'HIJAU' | 'KUNING' | 'MERAH' | 'ORANYE';

const zonaConfig: Record<Zona, { color: string; bg: string; label: string }> = {
  HIJAU: { color: 'text-status-green', bg: 'bg-status-green', label: 'Normal' },
  KUNING: { color: 'text-status-yellow', bg: 'bg-status-yellow', label: 'Serapan Lambat' },
  MERAH: { color: 'text-status-red', bg: 'bg-status-red', label: 'Kritis' },
  ORANYE: { color: 'text-status-orange', bg: 'bg-status-orange', label: 'Lonjakan Tidak Wajar' },
};

export function ZoneDot({ zona, size = 'sm' }: { zona: Zona; size?: 'sm' | 'md' }) {
  const cfg = zonaConfig[zona];
  const dotSize = size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${cfg.bg} shrink-0`} />
      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
    </span>
  );
}

export function ZoneBadge({ zona }: { zona: Zona }) {
  const cfg = zonaConfig[zona];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border border-border bg-bg`}>
      <span className={`h-2 w-2 rounded-full ${cfg.bg} shrink-0`} />
      <span className={`text-2xs font-medium ${cfg.color}`}>{cfg.label}</span>
    </span>
  );
}

// ── Status Badge ──
export function StatusBadge({ status, type = 'default' }: { status: string; type?: 'default' | 'spj' | 'kuitansi' | 'ta' | 'seimbang' }) {
  const colors: Record<string, string> = {
    // default
    aktif: 'text-status-green border-status-green/40',
    selesai: 'text-status-green border-status-green/40',
    tuntas: 'text-status-green border-status-green/40',
    seimbang: 'text-status-green border-status-green/40',
    'aktif_penuh': 'text-status-green border-status-green/40',
    draft: 'text-ink-secondary border-border',
    'belum_input': 'text-ink-muted border-border',
    'belum_seimbang': 'text-status-yellow border-status-yellow/40',
    'draft_belum_seimbang': 'text-status-yellow border-status-yellow/40',
    'masa_transisi': 'text-status-yellow border-status-yellow/40',
    terkunci: 'text-status-yellow border-status-yellow/40',
    menunggu_bku: 'text-teal border-teal/40',
    dibukukan: 'text-status-green border-status-green/40',
    'arsip_readonly': 'text-ink-secondary border-border',
    perlu_perbaikan: 'text-status-red border-status-red/40',
  };
  const cls = colors[status] ?? 'text-ink-secondary border-border';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-medium border bg-bg/60 ${cls}`}>
      {label}
    </span>
  );
}

// ── Stat Card (Pro Mode ticker element) ──
export function StatCard({
  label,
  value,
  sublabel,
  accent = 'default',
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  accent?: 'default' | 'amber' | 'teal' | 'green' | 'red' | 'yellow' | 'orange';
  icon?: LucideIcon;
}) {
  const accentColor: Record<string, string> = {
    default: 'text-ink-primary',
    amber: 'text-amber',
    teal: 'text-teal',
    green: 'text-status-green',
    red: 'text-status-red',
    yellow: 'text-status-yellow',
    orange: 'text-status-orange',
  };
  return (
    <div className="surface-card px-4 py-3 flex items-center gap-3">
      {Icon && (
        <div className="h-8 w-8 bg-bg border border-border flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-ink-secondary" strokeWidth={1.5} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-2xs uppercase tracking-wider text-ink-muted">{label}</div>
        <div className={`font-mono tnum text-sm font-semibold ${accentColor[accent]} truncate`}>{value}</div>
        {sublabel && <div className="text-2xs text-ink-muted mt-0.5 truncate">{sublabel}</div>}
      </div>
    </div>
  );
}

// ── Ticker (Pro Mode horizontal summary strip) ──
export function Ticker({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {children}
    </div>
  );
}

// ── Page Header ──
export function PageHeader({
  title,
  subtitle,
  mode,
}: {
  title: string;
  subtitle?: string;
  mode?: 'PRO' | 'STANDAR';
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-ink-primary">{title}</h1>
          {mode === 'PRO' && (
            <span className="px-1.5 py-0.5 text-2xs font-mono font-semibold text-amber border border-amber/40 bg-amber/5">
              PRO MODE
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-ink-secondary mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Banner merah Gatekeeper (Dokumen 01 §3.2) ──
export function GatekeeperBanner({ seksiNames }: { seksiNames: string[] }) {
  if (seksiNames.length === 0) return null;
  return (
    <div className="border border-status-red/50 bg-status-red/10 px-4 py-3 mb-6 animate-slide-up">
      <div className="flex items-start gap-3">
        <span className="status-dot bg-status-red mt-1.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-status-red">
            Gatekeeper tertutup — pembuatan kuitansi & SPJ baru dikunci untuk seluruh seksi.
          </p>
          <p className="text-xs text-ink-secondary mt-1">
            Seksi belum menyelesaikan alokasi rekening belanja: <span className="text-ink-primary">{seksiNames.join(', ')}</span>
          </p>
          <p className="text-2xs text-ink-muted mt-1">
            Pemrosesan SPJ yang sudah ada, verifikasi, dan pencatatan BKU tetap berjalan.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Countdown Widget (Dokumen 01 §3.1) ──
export function CountdownWidget({ deadline, readOnly = false }: { deadline: string; readOnly?: boolean }) {
  const now = new Date('2026-10-30T00:00:00+08:00');
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(diffMs / 86_400_000));
  const hours = Math.max(0, Math.floor((diffMs % 86_400_000) / 3_600_000));

  return (
    <div className={`surface-card px-4 py-3 flex items-center gap-3 ${readOnly ? 'opacity-75' : ''}`}>
      <div className="h-9 w-9 bg-bg border border-border-strong flex items-center justify-center shrink-0">
        <span className="font-mono text-xs font-bold text-amber">{days}h</span>
      </div>
      <div>
        <div className="text-2xs uppercase tracking-wider text-ink-muted">
          {readOnly ? 'Countdown (Baca Saja)' : 'Sisa Waktu Input Alokasi'}
        </div>
        <div className="font-mono tnum text-sm text-ink-primary">
          {days} hari {hours} jam
        </div>
      </div>
      <div className="ml-auto text-2xs text-ink-muted hidden sm:block">WITA (UTC+8)</div>
    </div>
  );
}
