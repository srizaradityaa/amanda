import type { SotkUnit } from '@/data/sotkMock';
import { previousDay } from '@/lib/witaDate';

export interface UnitInput {
  nama: string;
  tmtMulai: string;
  dasarHukum: string;
}

export type RuleResult = { error: string } | { units: SotkUnit[] };

function normalizeName(nama: string): string {
  return nama.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function validateName(units: SotkUnit[], nama: string, exceptId?: string): string | null {
  if (!nama.trim()) return 'Nama unit wajib diisi.';
  const clean = normalizeName(nama);
  if (units.some((u) => u.status === 'aktif' && u.id !== exceptId && normalizeName(u.nama) === clean)) {
    return 'Sudah ada unit aktif dengan nama tersebut.';
  }
  return null;
}

function newUnitId(): string {
  return `sotk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function addUnit(units: SotkUnit[], input: UnitInput): RuleResult {
  if (!input.tmtMulai) return { error: 'TMT mulai wajib diisi.' };
  if (!input.dasarHukum.trim()) return { error: 'Dasar hukum wajib diisi.' };
  const nameError = validateName(units, input.nama);
  if (nameError) return { error: nameError };
  const unit: SotkUnit = {
    id: newUnitId(),
    nama: input.nama.trim(),
    tmtMulai: input.tmtMulai,
    tmtSelesai: null,
    dasarHukum: input.dasarHukum.trim(),
    penggantiDariId: null,
    status: 'aktif',
  };
  return { units: [...units, unit] };
}

export function reorganizeUnit(units: SotkUnit[], unitId: string, input: UnitInput): RuleResult {
  const target = units.find((u) => u.id === unitId);
  if (!target || target.status !== 'aktif') return { error: 'Unit ini sudah diarsipkan dan tidak dapat diubah.' };
  if (!input.tmtMulai) return { error: 'TMT mulai nomenklatur baru wajib diisi.' };
  if (input.tmtMulai <= target.tmtMulai) {
    return { error: 'TMT nomenklatur baru harus setelah TMT mulai unit lama.' };
  }
  if (!input.dasarHukum.trim()) return { error: 'Dasar hukum wajib diisi.' };
  const nameError = validateName(units, input.nama, unitId);
  if (nameError) return { error: nameError };

  const closed: SotkUnit = {
    ...target,
    tmtSelesai: previousDay(input.tmtMulai),
    status: 'diarsipkan',
  };
  const successor: SotkUnit = {
    id: newUnitId(),
    nama: input.nama.trim(),
    tmtMulai: input.tmtMulai,
    tmtSelesai: null,
    dasarHukum: input.dasarHukum.trim(),
    penggantiDariId: target.id,
    status: 'aktif',
  };
  return { units: [...units.map((u) => (u.id === unitId ? closed : u)), successor] };
}

export function correctUnitName(units: SotkUnit[], unitId: string, nama: string): RuleResult {
  const target = units.find((u) => u.id === unitId);
  if (!target || target.status !== 'aktif') return { error: 'Unit ini sudah diarsipkan dan tidak dapat diubah.' };
  const nameError = validateName(units, nama, unitId);
  if (nameError) return { error: nameError };
  return { units: units.map((u) => (u.id === unitId ? { ...u, nama: nama.trim() } : u)) };
}

export function archiveUnit(units: SotkUnit[], unitId: string, tmtSelesai: string): RuleResult {
  const target = units.find((u) => u.id === unitId);
  if (!target || target.status !== 'aktif') return { error: 'Unit ini sudah diarsipkan.' };
  if (!tmtSelesai) return { error: 'Tanggal pengakhiran wajib diisi.' };
  if (tmtSelesai < target.tmtMulai) {
    return { error: 'Tanggal pengakhiran tidak boleh sebelum TMT mulai unit.' };
  }
  return {
    units: units.map((u) => (u.id === unitId ? { ...u, tmtSelesai, status: 'diarsipkan' } : u)),
  };
}
