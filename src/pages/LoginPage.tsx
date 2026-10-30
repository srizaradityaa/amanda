import { useState, type FormEvent } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  AlertCircle,
  Landmark,
  ArrowRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { mockUsers } from '@/auth/mockAuth';
import type { Role } from '@/auth/types';

interface LoginPageProps {
  onLogin: (identifier: string, password: string) => boolean;
  onOpenPublicPortal: () => void;
}

const roleAccent: Record<Role, string> = {
  admin: 'text-amber',
  bendahara: 'text-teal',
  pptk: 'text-status-green',
  verifikator: 'text-status-yellow',
  pa_kpa: 'text-amber',
  auditor: 'text-ink-secondary',
};

export function LoginPage({ onLogin, onOpenPublicPortal }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuditorInput = identifier.trim().includes('@');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!identifier.trim() || !password) {
      setError('NIP/NIK/Email dan kata sandi wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    setSubmitting(true);
    // Simulate "Memeriksa akun..."
    window.setTimeout(() => {
      const ok = onLogin(identifier.trim(), password);
      if (!ok) {
        setError('Kredensial tidak dikenali. Periksa kembali NIP/NIK/Email dan kata sandi Anda.');
        setSubmitting(false);
      }
      // success handled by parent state swap
    }, 650);
  }

  function quickLogin(id: string, pw: string) {
    setIdentifier(id);
    setPassword(pw);
    setError(null);
    setSubmitting(true);
    window.setTimeout(() => {
      const ok = onLogin(id, pw);
      if (!ok) {
        setError('Kredensial tidak dikenali.');
        setSubmitting(false);
      }
    }, 450);
  }

  return (
    <div className="min-h-screen bg-bg text-ink-primary flex flex-col lg:flex-row">
      {/* LEFT PANEL — Identitas & Wibawa Instansi */}
      <aside className="lg:w-[44%] lg:min-h-screen border-b lg:border-b-0 lg:border-r border-border bg-surface relative overflow-hidden">
        {/* Grid ornament statis tipis */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between min-h-full p-8 lg:p-12 lg:py-20">
          <div>
            <div className="flex items-center gap-3 text-ink-secondary text-xs tracking-[0.2em] uppercase">
              <Landmark className="h-4 w-4 text-amber" />
              <span>Pemerintah Kabupaten Balangan</span>
              <span className="text-border-strong">•</span>
              <span>Kecamatan Batumandi</span>
            </div>
          </div>

          <div className="py-12 lg:py-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 bg-bg border border-border-strong flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-amber" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-ink-primary">
                  AMANDA
                </h1>
                <p className="text-sm text-ink-secondary mt-1">
                  Aplikasi Manajemen Data Anggaran
                </p>
              </div>
            </div>
            <p className="text-lg lg:text-xl text-ink-primary font-medium leading-relaxed max-w-md">
              &ldquo;Tertib Administrasi, Akuntabel, dan Transparan dalam Setiap Rupiah.&rdquo;
            </p>
            <p className="mt-6 text-sm text-ink-secondary max-w-sm leading-relaxed">
              Sistem terpadu pengelolaan anggaran, kuitansi, SPJ, pembukuan kas, dan jejak audit
              untuk seluruh peran operasional instansi — TA 2026.
            </p>
          </div>

          <div className="flex items-center gap-6 text-2xs text-ink-muted uppercase tracking-wider">
            <span>Versi 1.58</span>
            <span className="text-border-strong">|</span>
            <span>WITA (UTC+8)</span>
            <span className="text-border-strong">|</span>
            <span>Mode Terminal Treasury</span>
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL — Kartu Login Datar */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-bg">
        <div className="w-full max-w-md animate-fade-in">
          <div className="surface-card p-7 sm:p-9">
            <div className="mb-7">
              <h2 className="text-xl font-semibold text-ink-primary">Masuk ke Sistem</h2>
              <p className="text-sm text-ink-secondary mt-1.5">
                Gunakan NIP, NIK, atau Email Auditor yang terdaftar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Single-Field Identifier */}
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-2xs font-medium uppercase tracking-wider text-ink-secondary mb-2"
                >
                  NIP / NIK / Email Auditor
                </label>
                <div className="relative">
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError(null);
                    }}
                    placeholder="Contoh: 199411172025031001"
                    className={`input-base ${
                      isAuditorInput ? 'font-mono' : 'font-mono tracking-wide'
                    } ${identifier ? 'pr-10' : ''}`}
                    disabled={submitting}
                  />
                  {isAuditorInput && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-2xs text-teal">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span className="whitespace-nowrap">Auditor</span>
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-2xs text-ink-muted">
                  {isAuditorInput
                    ? 'Tanda @ terdeteksi — akun Pengawas/Auditor.'
                    : 'Input angka dikenali sebagai personel internal (NIP/NIK).'}
                </p>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-2xs font-medium uppercase tracking-wider text-ink-secondary mb-2"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Minimal 6 karakter"
                    className="input-base pl-9 pr-11"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary transition-colors"
                    aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error message — di atas tombol */}
              {error && (
                <div className="flex items-start gap-2 text-sm text-status-red animate-slide-up">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tombol Aksi Utama */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-amber w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memeriksa akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Catatan bantuan admin */}
              <div className="border border-border bg-surface/60 px-3.5 py-3 text-xs text-ink-secondary leading-relaxed">
                Lupa password atau akun terkendala? Hubungi{' '}
                <span className="text-ink-primary font-medium">Administrator Sistem</span>.
                Reset password bersifat terpusat dan tidak dapat dilakukan mandiri.
              </div>
            </form>

            {/* Tautan Portal Publik */}
            <button
              onClick={onOpenPublicPortal}
              className="btn-teal-outline w-full mt-5 flex items-center justify-center gap-2"
              type="button"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Lihat Ringkasan Publik</span>
            </button>
          </div>

          {/* Quick Login Buttons */}
          <div className="mt-6">
            <p className="text-2xs uppercase tracking-wider text-ink-muted text-center mb-3">
              Pintasan Pengujian Cepat — Peran
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mockUsers.map((m) => (
                <button
                  key={m.identifier}
                  onClick={() => quickLogin(m.identifier, m.password)}
                  disabled={submitting}
                  className="text-left p-2.5 border border-border bg-surface hover:bg-surface-hover hover:border-border-strong transition-colors disabled:opacity-40 group"
                  title={m.description}
                  type="button"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full bg-current ${roleAccent[m.user.role]}`} />
                    <span className="text-xs font-medium text-ink-primary">{m.label}</span>
                  </div>
                  <div className="font-mono text-2xs text-ink-muted mt-1 truncate">
                    {m.identifier.length > 18 ? `${m.identifier.slice(0, 16)}…` : m.identifier}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-2xs text-ink-muted text-center mt-3">
              Akun tiruan untuk pengembangan frontend. Klik untuk mengisi & masuk otomatis.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
