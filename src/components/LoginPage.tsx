// UIX-02 — Halaman login: kartu kaca di tengah, latar kisi yang menjauhi kursor, teks berjalan di atas.
// Logika masuk tidak berubah; hanya tampilan.
// Satu kolom identitas: NIP/NIK personel.

import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react';
import { loginAsync, modeServer } from '@/lib/auth';
import { Button, Field, Input } from '@/components/ui';
import type { LoginResult } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { LatarKisi } from '@/components/LatarKisi';
import { TikerLogin } from '@/components/TikerLogin';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    idRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Mode demo: jeda singkat agar tombol menampilkan "Memeriksa akun...".
      if (!modeServer) await new Promise((r) => setTimeout(r, 350));
      const res: LoginResult = await loginAsync(identifier, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onLogin();
    } catch {
      setError('Layanan tidak tersedia. Periksa koneksi lalu coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-ink text-mist">
      <LatarKisi />
      <TikerLogin />
      <main className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-amber/30 bg-ink-surface/65 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <h1 className="sr-only">AMANDA — Aplikasi Manajemen Data Anggaran</h1>
            <div className="mb-6 flex justify-center"><Logo varian="animasi" tinggi={150} /></div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="NIP / NIK" required>
                <Input
                  ref={idRef}
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: 198501012010011001"
                  className="mono"
                  autoComplete="username"
                  spellCheck={false}
                />
              </Field>

              <Field label="Kata Sandi" required>
                <div className="relative">
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    autoComplete="current-password"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-mist-dim hover:text-mist focus-visible:outline-amber focus-visible:outline-2"
                    aria-label={showPwd ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-crit/30 bg-crit/5 px-3 py-2.5 text-2xs text-crit"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Memeriksa akun...' : 'Masuk'}
              </Button>
            </form>

            <p className="mt-5 border-t border-ink-edge pt-4 text-center text-2xs text-mist-dim">
              Belum punya akun atau lupa kata sandi? Hubungi Admin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              window.dispatchEvent(new CustomEvent('amanda:go-public'));
            }}
            className="mt-5 flex w-full items-center justify-center gap-1 text-2xs text-mist-dim hover:text-mist focus-visible:outline-amber focus-visible:outline-2"
          >
            <span>Portal Keterbukaan Informasi Anggaran</span>
            <ChevronRight size={14} />
          </button>
          <p className="mt-3 text-center text-2xs text-mist-dim">
            AMANDA &copy; 2026 Pemerintah Kabupaten Balangan • Kecamatan Batumandi
          </p>
        </div>
      </main>
    </div>
  );
}
