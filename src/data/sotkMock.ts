export type SotkStatus = 'aktif' | 'diarsipkan';

export interface SotkUnit {
  id: string;
  nama: string;
  tmtMulai: string;
  tmtSelesai: string | null;
  dasarHukum: string;
  penggantiDariId: string | null;
  status: SotkStatus;
}

export const initialSotkUnits: SotkUnit[] = [
  { id: 'sotk-001', nama: 'Seksi Pemerintahan', tmtMulai: '2025-01-01', tmtSelesai: null, dasarHukum: 'Perbup No. 12 Tahun 2024', penggantiDariId: null, status: 'aktif' },
  { id: 'sotk-002', nama: 'Seksi Pembangunan', tmtMulai: '2025-01-01', tmtSelesai: null, dasarHukum: 'Perbup No. 12 Tahun 2024', penggantiDariId: null, status: 'aktif' },
  { id: 'sotk-003', nama: 'Seksi Perekonomian', tmtMulai: '2025-01-01', tmtSelesai: null, dasarHukum: 'Perbup No. 12 Tahun 2024', penggantiDariId: null, status: 'aktif' },
  { id: 'sotk-004', nama: 'Seksi Kesejahteraan Rakyat', tmtMulai: '2025-01-01', tmtSelesai: null, dasarHukum: 'Perbup No. 12 Tahun 2024', penggantiDariId: null, status: 'aktif' },
  { id: 'sotk-005', nama: 'Seksi Pembinaan Desa', tmtMulai: '2023-01-01', tmtSelesai: '2025-12-31', dasarHukum: 'Perbup No. 4 Tahun 2023', penggantiDariId: null, status: 'diarsipkan' },
  { id: 'sotk-006', nama: 'Seksi Pemberdayaan Desa', tmtMulai: '2026-01-01', tmtSelesai: null, dasarHukum: 'Perbup No. 3 Tahun 2025', penggantiDariId: 'sotk-005', status: 'aktif' },
];
