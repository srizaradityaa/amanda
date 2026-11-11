// AUT-01/02/03/04/06/08 — Autentikasi & sesi tunggal terisolasi (D03 §1; D04 §3).
// Tahap A: data contoh, validasi di klien. Tahap B: penegakan server menggantikan ini.

import { repo } from '@/data/repo';
import type { SessionPayload, Role, ActorType } from '@/data/types';
import { nowWita, todayWita } from '@/lib/wita';
import { supabase, modeServer, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { resetData } from '@/data/store';
import { verifikasiMasuk, bukaSesi, type Konteks } from '@/lib/masuk';

const SESSION_KEY = 'amanda.session.v1';
const ACTIVITY_KEY = 'amanda.lastActivity.v1';
const AUTO_LOGOUT_MS = 60 * 60 * 1000; // 1 jam tanpa aktivitas (N-13)

let listeners: (() => void)[] = [];

export function subscribeSession(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function notify() {
  for (const l of listeners) l();
}

function readSession(): SessionPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SessionPayload;
    // AUT-08 — auto logout 1 jam tanpa aktivitas.
    const last = Number(sessionStorage.getItem(ACTIVITY_KEY) ?? 0);
    if (last && Date.now() - last > AUTO_LOGOUT_MS) {
      destroySession();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function writeSession(s: SessionPayload | null) {
  if (s) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ACTIVITY_KEY);
  }
  notify();
}

export function getSession(): SessionPayload | null {
  return readSession();
}

let pingTerakhir = 0;
export function touchActivity() {
  const sesi = readSession();
  if (!sesi) return;
  sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  // Mode server: jaga agar batas idle 1 jam di server ikut bergeser (paling sering tiap 3 menit).
  if (modeServer && supabase && !isPending(sesi) && Date.now() - pingTerakhir > 3 * 60 * 1000) {
    pingTerakhir = Date.now();
    void supabase.rpc('ping_sesi').then(({ data }) => { if (data === false) destroySession(); });
  }
}

export function destroySession() {
  // AUT-04 — logout menghancurkan sesi menyeluruh.
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(ACTIVITY_KEY);
  notify();
}

export function logout() {
  if (modeServer && supabase) {
    // Akhiri sesi di server lalu keluarkan dari Supabase Auth; tampilan langsung kembali ke login.
    void (async () => {
      try { await supabase.rpc('akhiri_sesi'); } catch { /* abaikan */ }
      try { await supabase.auth.signOut(); } catch { /* abaikan */ }
    })();
    pendingServer = null;
    resetData();
  }
  destroySession();
}

export type LoginResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; error: string };

const GENERIC_ERROR = 'Kredensial tidak dikenali atau akun tidak aktif.';

// AUT-01 — single-field identifier. Angka -> personel internal; '@' -> Pengawas/Auditor.
export function isAuditorIdentifier(id: string): boolean {
  return id.includes('@');
}

export function login(identifier: string, password: string): LoginResult {
  // AUT-06 — pesan galat generik, tidak menyebut NIP atau sandi yang salah.
  touchActivity();

  if (!identifier.trim() || !password) {
    return { ok: false, error: 'Lengkapi identitas dan kata sandi.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Kata sandi minimal 6 karakter.' };
  }

  if (isAuditorIdentifier(identifier)) {
    return loginAuditor(identifier.trim(), password);
  }
  return loginInternal(identifier.trim(), password);
}

function loginInternal(identifier: string, password: string): LoginResult {
  // personel: cari akun dengan username = NIP/NIK
  const acc = repo.akunByUsername(identifier);
  if (!acc) return { ok: false, error: GENERIC_ERROR };

  // AUT-07 — 10 kali gagal -> kunci (kecuali Admin). Admin tidak dikunci (P-123b).
  if (acc.locked && acc.username !== 'admin') {
    return { ok: false, error: 'Akun terkunci setelah 10 kali percobaan gagal. Hubungi Administrator Sistem.' };
  }
  if (acc.status === 'NON-ACTIVE') {
    return { ok: false, error: GENERIC_ERROR };
  }
  if (acc.password !== password) {
    // Catat percobaan gagal (data contoh; Tahap B persisten di server)
    if (acc.username !== 'admin') {
      acc.failed_attempts += 1;
      if (acc.failed_attempts >= 10) acc.locked = true;
    }
    return { ok: false, error: GENERIC_ERROR };
  }
  // reset percobaan
  acc.failed_attempts = 0;

  // Admin — akses langsung ke dasbor Admin (P-118)
  if (acc.username === 'admin' && acc.personel_id === null) {
    const session: SessionPayload = {
      user_id: acc.id,
      actor_type: 'internal',
      active_ta_id: null,
      active_role: 'admin' as Role,
      active_seksi_id: null,
      nama_snapshot: 'Administrator Sistem',
      nip_snapshot: '—',
    };
    writeSession(session);
    return { ok: true, session };
  }

  // personel internal — alur masuk berjenjang (AUT-02)
  const personel = acc.personel_id ? repo.personelById(acc.personel_id) : undefined;
  if (!personel) return { ok: false, error: GENERIC_ERROR };

  const taIds = repo.taIdsForPersonel(personel.id);
  if (taIds.length === 0) {
    return { ok: false, error: 'Akun belum memiliki penugasan aktif. Hubungi Administrator Sistem.' };
  }

  // Auto-skip bila hanya 1 TA dan 1 jabatan (P-120)
  if (taIds.length === 1) {
    const ta_id = taIds[0];
    const jabatan = repo.jabatanForPersonelOnTA(personel.id, ta_id);
    if (jabatan.length === 1) {
      const j = jabatan[0];
      const session: SessionPayload = buildInternalSession(acc.id, personel, ta_id, j.peran, j.seksi_ta_id);
      writeSession(session);
      return { ok: true, session };
    }
  }

  // Multi-penugasan: sesi sementara pending seleksi — disimpan dengan active_ta_id null.
  const session: SessionPayload = {
    user_id: acc.id,
    actor_type: 'internal',
    active_ta_id: null,
    active_role: 'pending' as Role,
    active_seksi_id: null,
    nama_snapshot: personel.nama,
    nip_snapshot: personel.nip || personel.nik,
  };
  writeSession(session);
  return { ok: true, session };
}

function loginAuditor(email: string, password: string): LoginResult {
  const aud = repo.pengawasByEmail(email);
  if (!aud) return { ok: false, error: GENERIC_ERROR };
  if (aud.locked) {
    return { ok: false, error: 'Akun terkunci. Hubungi Administrator Sistem.' };
  }
  if (aud.status === 'NON-ACTIVE') {
    return { ok: false, error: GENERIC_ERROR };
  }
  // P-48 — login ditolak setelah tanggal akhir akses
  if (todayWita() > aud.tanggal_akhir_akses) {
    return { ok: false, error: 'Masa akses akun Pengawas/Auditor telah berakhir. Hubungi Administrator Sistem.' };
  }
  if (aud.password !== password) {
    aud.failed_attempts += 1;
    if (aud.failed_attempts >= 10) aud.locked = true;
    return { ok: false, error: GENERIC_ERROR };
  }
  aud.failed_attempts = 0;

  const taIds = repo.taIdsForPengawas(aud.id);
  if (taIds.length === 0) {
    return { ok: false, error: 'Akun Pengawas belum ditugaskan pada TA. Hubungi Administrator Sistem.' };
  }

  // P-119 — bila 1 TA langsung masuk
  if (taIds.length === 1) {
    const session: SessionPayload = {
      user_id: aud.id,
      actor_type: 'auditor',
      active_ta_id: taIds[0],
      active_role: 'pengawas' as Role,
      active_seksi_id: null,
      nama_snapshot: aud.nama_lengkap,
      nip_snapshot: '—',
      instansi_asal_snapshot: aud.instansi_asal,
      nomor_surat_tugas_snapshot: aud.nomor_surat_tugas,
    };
    writeSession(session);
    return { ok: true, session };
  }

  // multi-TA: pending seleksi TA
  const session: SessionPayload = {
    user_id: aud.id,
    actor_type: 'auditor',
    active_ta_id: null,
    active_role: 'pending' as Role,
    active_seksi_id: null,
    nama_snapshot: aud.nama_lengkap,
    nip_snapshot: '—',
    instansi_asal_snapshot: aud.instansi_asal,
    nomor_surat_tugas_snapshot: aud.nomor_surat_tugas,
  };
  writeSession(session);
  return { ok: true, session };
}

// AUT-02 — seleksi TA & jabatan untuk personel multi-penugasan / multi-jabatan.
export function selectContextForInternal(ta_id: string, peran: Role, seksi_ta_id: string | null): boolean {
  const s = readSession();
  if (!s || s.actor_type !== 'internal') return false;
  const acc = repo.akunLogin().find((a) => a.id === s.user_id);
  if (!acc || !acc.personel_id) return false;
  const personel = repo.personelById(acc.personel_id);
  if (!personel) return false;
  const session = buildInternalSession(acc.id, personel, ta_id, peran as never, seksi_ta_id);
  writeSession(session);
  return true;
}

export function selectContextForAuditor(ta_id: string): boolean {
  const s = readSession();
  if (!s || s.actor_type !== 'auditor') return false;
  const aud = repo.pengawasById(s.user_id);
  if (!aud) return false;
  const session: SessionPayload = {
    user_id: aud.id,
    actor_type: 'auditor',
    active_ta_id: ta_id,
    active_role: 'pengawas' as Role,
    active_seksi_id: null,
    nama_snapshot: aud.nama_lengkap,
    nip_snapshot: '—',
    instansi_asal_snapshot: aud.instansi_asal,
    nomor_surat_tugas_snapshot: aud.nomor_surat_tugas,
  };
  writeSession(session);
  return true;
}

function buildInternalSession(
  acc_id: string,
  personel: { id: string; nama: string; nip: string; nik: string; gelar_depan: string; gelar_belakang: string },
  ta_id: string,
  peran: Role,
  seksi_ta_id: string | null,
): SessionPayload {
  const nama = [personel.gelar_depan, personel.nama, personel.gelar_belakang].filter(Boolean).join(' ');
  return {
    user_id: acc_id,
    actor_type: 'internal' as ActorType,
    active_ta_id: ta_id,
    active_role: peran,
    active_seksi_id: peran === 'pptk' ? seksi_ta_id : null,
    nama_snapshot: nama,
    nip_snapshot: personel.nip || personel.nik,
  };
}

export function isPending(s: SessionPayload | null): boolean {
  return !!s && s.active_role === 'pending';
}

export { nowWita };


// ===================== MODE SERVER (Supabase) =====================
// Tiket dan daftar konteks hanya disimpan di memori (tidak pernah di storage).
interface PendingServer { tiket: string; tipe: 'internal' | 'auditor'; nama: string; konteks: Konteks[] }
let pendingServer: PendingServer | null = null;

export function konteksPending(): PendingServer | null {
  return pendingServer;
}

function payloadKeSesi(p: Record<string, unknown>): SessionPayload {
  return {
    user_id: String(p.user_id ?? ''),
    actor_type: (p.actor_type as ActorType) ?? 'internal',
    active_ta_id: (p.active_ta_id as string | null) ?? null,
    active_role: p.active_role as Role,
    active_seksi_id: (p.active_seksi_id as string | null) ?? null,
    nama_snapshot: String(p.nama_snapshot ?? ''),
    nip_snapshot: String(p.nip_snapshot ?? '—'),
    instansi_asal_snapshot: p.instansi_asal_snapshot as string | undefined,
    nomor_surat_tugas_snapshot: p.nomor_surat_tugas_snapshot as string | undefined,
  };
}

// Membuka sesi pada satu konteks. Tiket sekali pakai: bila gagal, pengguna harus masuk ulang.
export async function pilihKonteksServer(k: Konteks): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase || !pendingServer) return { ok: false, error: 'Sesi masuk berakhir. Silakan masuk kembali.' };
  const hasil = await bukaSesi(SUPABASE_URL, SUPABASE_ANON_KEY, supabase, pendingServer.tiket, {
    ta_id: k.ta_id, peran: k.peran, seksi_ta_id: k.seksi_ta_id,
  });
  if (!hasil.ok || !hasil.payload) {
    pendingServer = null;
    destroySession();
    return { ok: false, error: hasil.error ?? 'Gagal membuka sesi. Silakan masuk kembali.' };
  }
  pendingServer = null;
  writeSession(payloadKeSesi(hasil.payload));
  return { ok: true };
}

export async function loginServer(identifier: string, password: string): Promise<LoginResult> {
  if (!identifier.trim() || !password) return { ok: false, error: 'Lengkapi identitas dan kata sandi.' };
  if (password.length < 6) return { ok: false, error: 'Kata sandi minimal 6 karakter.' };
  const v = await verifikasiMasuk(SUPABASE_URL, SUPABASE_ANON_KEY, identifier.trim(), password);
  if (!v.ok || !v.tiket) return { ok: false, error: v.error ?? GENERIC_ERROR };
  const konteks = v.konteks ?? [];
  if (konteks.length === 0) return { ok: false, error: 'Akun belum memiliki penugasan aktif. Hubungi Administrator Sistem.' };
  const tipe: 'internal' | 'auditor' = isAuditorIdentifier(identifier) ? 'auditor' : 'internal';
  pendingServer = { tiket: v.tiket, tipe, nama: v.nama ?? '', konteks };

  // Satu konteks saja -> langsung masuk (P-119/P-120).
  if (konteks.length === 1) {
    const r = await pilihKonteksServer(konteks[0]);
    if (!r.ok) return r;
    return { ok: true, session: getSession()! };
  }
  // Banyak konteks -> sesi sementara "pending" untuk layar pilih.
  const sementara: SessionPayload = {
    user_id: '', actor_type: tipe, active_ta_id: null, active_role: 'pending' as Role,
    active_seksi_id: null, nama_snapshot: v.nama ?? '', nip_snapshot: '—',
  };
  writeSession(sementara);
  return { ok: true, session: sementara };
}

// Satu pintu untuk layar login: mode server memakai Supabase, mode demo memakai data contoh.
export async function loginAsync(identifier: string, password: string): Promise<LoginResult> {
  return modeServer ? loginServer(identifier, password) : login(identifier, password);
}

// Saat aplikasi dibuka ulang: pastikan sesi di browser masih sah di server.
export async function validasiSesiServer(): Promise<void> {
  if (!modeServer || !supabase) return;
  const lokal = readSession();
  if (!lokal) return;
  if (isPending(lokal)) { if (!pendingServer) destroySession(); return; }
  const { data, error } = await supabase.rpc('sesi_saya');
  if (error || !data) { try { await supabase.auth.signOut(); } catch { /* abaikan */ } destroySession(); return; }
  writeSession(payloadKeSesi(data as Record<string, unknown>));
}

export { modeServer };
