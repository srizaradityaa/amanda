// REK-01/REK-02 — Split View rekening penerima pada SPJ (D02 §5, D03 §13, D01 §14)
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Button, Field, Input, SearchBox, EmptyState, useToast, TombolIkon } from '@/components/ui';
import { ErrorLine } from '@/components/AnggaranShared';
import { repo } from '@/data/repo';
import type { SPJ, SessionPayload } from '@/data/types';
import { Plus, Save, Trash2 } from 'lucide-react';

/** `dariDirektori` true: rincian dari direktori atau snapshot SPJ, hanya-baca. false: rekening baru yang diketik manual. */
export type BarisRekening = { key: number; account_name: string; bank_name: string; account_number: string; alias: string; dariDirektori: boolean };
type Baris = BarisRekening;

// Baris awal dari snapshot rekening pada SPJ.
export function barisDariSPJ(spj: SPJ): BarisRekening[] {
  return (spj.rekening_penerima ?? []).map((r, i) => ({ key: i, account_name: r.account_name, bank_name: r.bank_name, account_number: r.account_number, alias: r.alias ?? '', dariDirektori: true }));
}

/** Hanya bidang rekening yang dikirim ke penyimpanan (tanpa penanda tampilan). */
export function barisUntukSimpan(baris: BarisRekening[]) {
  return baris.map((r) => ({ account_name: r.account_name, bank_name: r.bank_name, account_number: r.account_number, alias: r.alias }));
}

// State baris dipegang oleh induk (EditSPJModal) agar isian tidak hilang saat berpindah tab
// dan ikut tersimpan ketika "Simpan Draft" atau "Ajukan" ditekan.
export function RekeningPenerimaPanel({ sesi, spj, isDraft, baris, setBaris }: {
  sesi: SessionPayload; spj: SPJ; isDraft: boolean;
  baris: BarisRekening[]; setBaris: Dispatch<SetStateAction<BarisRekening[]>>;
}) {
  const { notify } = useToast();
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const hasilCari = repo.cariRekeningBank(q);

  // Satu SPJ = satu rekening penerima: memilih atau membuat rekening menggantikan yang ada.
  const setRekening = (isi: Omit<Baris, 'key'>) => setBaris([{ key: 0, ...isi }]);
  const pilihDariDirektori = (d: { account_name: string; bank_name: string; account_number: string; alias: string | null }) => {
    setRekening({ account_name: d.account_name, bank_name: d.bank_name, account_number: d.account_number, alias: d.alias ?? '', dariDirektori: true });
  };
  const ubahBaris = (key: number, patch: Partial<Omit<Baris, 'key'>>) =>
    setBaris((b) => b.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const hapusBaris = (key: number) => setBaris((b) => b.filter((r) => r.key !== key));

  const simpan = async () => {
    setErr(null);
    const r = await repo.simpanRekeningSPJ(spj.id, barisUntukSimpan(baris), sesi);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    notify('Tersimpan');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="min-w-0 rounded-md border border-ink-edge bg-ink p-3">
        <h4 className="mb-2 text-sm font-semibold text-mist">Direktori Rekening Bank</h4>
        <SearchBox value={q} onChange={setQ} placeholder="Cari nama, alias, atau no. rekening..." />
        <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
          {hasilCari.length === 0 ? (
            <EmptyState title="Tidak ada rekening yang cocok" desc='Gunakan tombol "Rekening baru" pada panel kanan.' />
          ) : hasilCari.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-ink-edge bg-ink-surface p-3">
              <div className="min-w-0 text-2xs">
                <div className="truncate text-mist">{d.account_name}</div>
                <div className="truncate text-mist-dim">{d.alias ? `${d.alias} • ` : ''}{d.bank_name} • <span className="mono">{d.account_number}</span></div>
              </div>
              <Button variant="secondary" disabled={!isDraft}
                onClick={() => pilihDariDirektori(d)}>
                Pilih
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 space-y-3">
        <h4 className="text-sm font-semibold text-mist">Rekening Penerima <span className="text-2xs font-normal text-mist-dim">(satu SPJ, satu rekening)</span></h4>
        {baris.length === 0 && <p className="text-2xs text-mist-dim">Belum ada rekening penerima. Pilih dari direktori di panel kiri, atau buat rekening baru.</p>}
        {baris.slice(0, 1).map((r) => (
          <div key={r.key} className="rounded-md border border-ink-edge bg-ink p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xs text-mist-dim">{r.dariDirektori ? 'Dari direktori (hanya baca)' : 'Rekening baru'}</span>
              {isDraft && (
                <TombolIkon ikon={Trash2} label="Hapus rekening (untuk memilih yang lain)" variant="danger" onClick={() => hapusBaris(r.key)} />
              )}
            </div>
            {r.dariDirektori ? (
              <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <div><dt className="text-2xs text-mist-dim">Nama penerima</dt><dd className="text-mist">{r.account_name}</dd></div>
                <div><dt className="text-2xs text-mist-dim">Nama bank</dt><dd className="text-mist">{r.bank_name}</dd></div>
                <div><dt className="text-2xs text-mist-dim">Nomor rekening</dt><dd className="mono tnum text-mist">{r.account_number}</dd></div>
                <div><dt className="text-2xs text-mist-dim">Alias / instansi</dt><dd className="text-mist">{r.alias || '-'}</dd></div>
              </dl>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nama Penerima" required>
                  <Input value={r.account_name} disabled={!isDraft} onChange={(e) => ubahBaris(r.key, { account_name: e.target.value })} />
                </Field>
                <Field label="Nama Bank" required>
                  <Input value={r.bank_name} disabled={!isDraft} onChange={(e) => ubahBaris(r.key, { bank_name: e.target.value })} />
                </Field>
                <Field label="Nomor Rekening" required>
                  <Input value={r.account_number} disabled={!isDraft} onChange={(e) => ubahBaris(r.key, { account_number: e.target.value })} />
                </Field>
                <Field label="Alias / Instansi">
                  <Input value={r.alias} disabled={!isDraft} onChange={(e) => ubahBaris(r.key, { alias: e.target.value })} />
                </Field>
              </div>
            )}
          </div>
        ))}
        {isDraft && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="secondary" ikon={<Plus size={16} />} tip="Hanya bila rekening belum ada di direktori; menggantikan pilihan saat ini" onClick={() => setRekening({ account_name: '', bank_name: '', account_number: '', alias: '', dariDirektori: false })}>
              Rekening baru (belum ada di direktori)
            </Button>
            <Button variant="primary" onClick={simpan}><Save size={14} /> Simpan Rekening</Button>
          </div>
        )}
        <ErrorLine msg={err} />
        {!isDraft && <p className="text-2xs text-mist-dim">Rekening SPJ {spj.status} tidak dapat diubah.</p>}
      </div>
    </div>
  );
}
