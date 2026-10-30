import { useEffect, useState } from 'react';
import type { MockUser, SessionUser } from './types';

export const mockUsers: MockUser[] = [
  {
    identifier: 'admin01',
    password: 'admin01',
    label: 'Admin',
    description: 'Dasbor Administrasi Global — master & status TA, tanpa sidebar keuangan.',
    user: {
      id: 'u-admin-01',
      displayName: 'Administrator Sistem',
      nipNikOrEmail: 'admin01',
      role: 'admin',
      actorType: 'internal',
      assignments: [
        { taId: 'ta-2026', taYear: 2026, role: 'admin' },
        { taId: 'ta-2025', taYear: 2025, role: 'admin' },
      ],
    },
  },
  {
    identifier: '199411172025031001',
    password: 'bendahara2026',
    label: 'Bendahara Pengeluaran',
    description: 'Dasbor Bendahara Pro Mode — alokasi pagu, SPD, BKU, efisiensi & pergeseran.',
    user: {
      id: 'u-bend-01',
      displayName: 'Rahmat Hidayat, S.E.',
      nipNikOrEmail: '199411172025031001',
      role: 'bendahara',
      actorType: 'internal',
      assignments: [
        { taId: 'ta-2026', taYear: 2026, role: 'bendahara' },
      ],
    },
  },
  {
    identifier: '200001012026011002',
    password: 'pptk2026',
    label: 'PPTK / Seksi',
    description: 'Dasbor Seksi — dibatasi hanya untuk seksinya sendiri; kuitansi, SPJ, Form Dinamis.',
    user: {
      id: 'u-pptk-01',
      displayName: 'Dwi Putri Lestari, S.T.',
      nipNikOrEmail: '200001012026011002',
      role: 'pptk',
      actorType: 'internal',
      assignments: [
        {
          taId: 'ta-2026',
          taYear: 2026,
          role: 'pptk',
          seksiId: 'seksi-pem',
          seksiName: 'Seksi Perencanaan & Evaluasi',
        },
      ],
    },
  },
  {
    identifier: '198812122020121003',
    password: 'verifikator2026',
    label: 'Verifikator',
    description: 'Dasbor Verifikator Pro Mode — antrean SPJ seluruh seksi, verifikasi & BKU.',
    user: {
      id: 'u-verif-01',
      displayName: 'Agus Setiawan, M.Si.',
      nipNikOrEmail: '198812122020121003',
      role: 'verifikator',
      actorType: 'internal',
      assignments: [
        { taId: 'ta-2026', taYear: 2026, role: 'verifikator' },
      ],
    },
  },
  {
    identifier: '197505052005011004',
    password: 'pakpa2026',
    label: 'PA / KPA',
    description: 'Dasbor Eksekutif — Early Warning Ticker & analitik Burn-Rate lintas seksi.',
    user: {
      id: 'u-pakpa-01',
      displayName: 'Dr. H. Mulyadi, M.Si.',
      nipNikOrEmail: '197505052005011004',
      role: 'pa_kpa',
      actorType: 'internal',
      assignments: [
        { taId: 'ta-2026', taYear: 2026, role: 'pa_kpa' },
      ],
    },
  },
  {
    identifier: 'auditor@balangan.go.id',
    password: 'auditor2026',
    label: 'Auditor / Pengawas',
    description: 'Mode baca-saja — laporan & jejak audit seluruh TA, tanpa sidebar.',
    user: {
      id: 'u-aud-01',
      displayName: 'BPKP Kalimantan Selatan',
      nipNikOrEmail: 'auditor@balangan.go.id',
      role: 'auditor',
      actorType: 'auditor',
      instansiAsal: 'Inspektorat Daerah Provinsi Kalimantan Selatan',
      nomorSuratTugas: '045/SK/ID-PROV/2026',
      assignments: [
        { taId: 'ta-2026', taYear: 2026, role: 'auditor' },
      ],
    },
  },
];

const STORAGE_KEY = 'amanda-session-v1';

function resolveLogin(identifier: string, password: string): SessionUser | null {
  const cleanId = identifier.trim();
  const found = mockUsers.find(
    (m) => m.identifier.toLowerCase() === cleanId.toLowerCase() && m.password === password,
  );
  if (!found) return null;
  return { ...found.user, activeTa: undefined };
}

function pickDefaultAssignment(user: SessionUser): SessionUser {
  if (user.role === 'admin') {
    // Admin langsung masuk dasbor administrasi global — no TA selection needed,
    // but we still attach first assignment as context placeholder.
    return { ...user, activeTa: user.assignments[0] };
  }
  if (user.assignments.length === 1) {
    return { ...user, activeTa: user.assignments[0] };
  }
  return user; // multi-assignment: needs selection screen
}

export function useAuthSession() {
  const [session, setSession] = useState<SessionUser | null>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const login = (identifier: string, password: string): SessionUser | null => {
    const user = resolveLogin(identifier, password);
    if (!user) return null;
    const withDefault = pickDefaultAssignment(user);
    setSession(withDefault);
    return withDefault;
  };

  const logout = () => setSession(null);

  return { session, login, logout };
}

export function formatNipNik(value: string): string {
  return value.replace(/(\d{4})(?=\d)/g, '$1 ');
}
