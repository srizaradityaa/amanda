export interface KeaslianRecord {
  berlaku: boolean;
  taName: string;
  seksiName: string;
  tanggalVerifikasi: string;
}

const records = new Map<string, KeaslianRecord>([
  [
    'k7Qp2mXv9RtL4aNw',
    {
      berlaku: true,
      taName: 'Tahun Anggaran 2026',
      seksiName: 'Seksi Perencanaan & Evaluasi',
      tanggalVerifikasi: '2026-10-12',
    },
  ],
  [
    'b3Hs8LzF1cYe6UoT',
    {
      berlaku: false,
      taName: 'Tahun Anggaran 2026',
      seksiName: 'Seksi Pembangunan',
      tanggalVerifikasi: '2026-09-28',
    },
  ],
]);

export function findKeaslianByToken(token: string): KeaslianRecord | null {
  return records.get(token) ?? null;
}
