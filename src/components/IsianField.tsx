// Isian satu field Form Dinamis untuk semua tipe (dipakai form SPJ dan pratinjau Admin).
// Semua jawaban berupa teks; pengodean pilihan ganda dan kisi ada di lib/formDinamis.
import type { ReactNode } from 'react';
import { Field, Input, Select } from '@/components/ui';
import type { FieldFormDinamis } from '@/data/types';
import { pisahDaftar, gabungDaftar, bacaKisi, tulisKisi, rentangSkala, maksRating } from '@/lib/formDinamis';
import { Star } from 'lucide-react';

const AREA = 'w-full rounded-md border border-ink-edge bg-ink px-3 py-2 text-sm text-mist focus-visible:outline-amber focus-visible:outline-2';

function Kelompok({ f, children }: { f: FieldFormDinamis; children: ReactNode }) {
  return (
    <fieldset className="block">
      <legend className="mb-1.5 block text-sm font-medium text-mist">
        {f.label}{f.wajib && <span className="ml-0.5 text-crit">*</span>}
      </legend>
      {children}
      {f.bantuan && <span className="mt-1 block text-2xs text-mist-dim">{f.bantuan}</span>}
    </fieldset>
  );
}

export function IsianField({ f, value, onChange, disabled = false }: {
  f: FieldFormDinamis; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const hint = f.bantuan;
  switch (f.tipe) {
    case 'area':
      return <Field label={f.label} required={f.wajib} hint={hint}><textarea className={AREA} rows={3} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} /></Field>;
    case 'tanggal':
      return <Field label={f.label} required={f.wajib} hint={hint}><Input type="date" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} /></Field>;
    case 'waktu':
      return <Field label={f.label} required={f.wajib} hint={hint}><Input type="time" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} /></Field>;
    case 'angka':
      return <Field label={f.label} required={f.wajib} hint={hint}><Input type="text" inputMode="numeric" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} /></Field>;
    case 'dropdown':
      return (
        <Field label={f.label} required={f.wajib} hint={hint}>
          <Select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
            <option value="">Pilih</option>
            {(f.opsi ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </Field>
      );
    case 'pilihan':
      return (
        <Kelompok f={f}>
          <div className="space-y-1.5">
            {(f.opsi ?? []).map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm text-mist">
                <input type="radio" name={f.id} checked={value === o} disabled={disabled} onChange={() => onChange(o)} /> {o}
              </label>
            ))}
            {value && !f.wajib && !disabled && <button type="button" className="text-2xs text-mist-dim underline" onClick={() => onChange('')}>Hapus pilihan</button>}
          </div>
        </Kelompok>
      );
    case 'kotak': {
      const dipilih = pisahDaftar(value);
      const ubah = (o: string, on: boolean) => {
        const baru = on ? [...dipilih, o] : dipilih.filter((x) => x !== o);
        onChange(gabungDaftar((f.opsi ?? []).filter((x) => baru.includes(x))));
      };
      return (
        <Kelompok f={f}>
          <div className="space-y-1.5">
            {(f.opsi ?? []).map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm text-mist">
                <input type="checkbox" checked={dipilih.includes(o)} disabled={disabled} onChange={(e) => ubah(o, e.target.checked)} /> {o}
              </label>
            ))}
          </div>
        </Kelompok>
      );
    }
    case 'skala': {
      const angka = rentangSkala(f);
      return (
        <Kelompok f={f}>
          <div className="flex flex-wrap items-end gap-3">
            {f.label_min && <span className="text-2xs text-mist-dim">{f.label_min}</span>}
            {angka.map((n) => (
              <label key={n} className="flex flex-col items-center gap-1 text-2xs text-mist">
                {n}
                <input type="radio" name={f.id} checked={value === String(n)} disabled={disabled} onChange={() => onChange(String(n))} />
              </label>
            ))}
            {f.label_maks && <span className="text-2xs text-mist-dim">{f.label_maks}</span>}
          </div>
          {value && !f.wajib && !disabled && <button type="button" className="mt-1 text-2xs text-mist-dim underline" onClick={() => onChange('')}>Hapus pilihan</button>}
        </Kelompok>
      );
    }
    case 'rating': {
      const maks = maksRating(f);
      const nilai = Number(value) || 0;
      return (
        <Kelompok f={f}>
          <div className="flex gap-1" role="radiogroup" aria-label={f.label}>
            {Array.from({ length: maks }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" disabled={disabled} role="radio" aria-checked={nilai === n} aria-label={`${n} dari ${maks}`}
                onClick={() => onChange(nilai === n ? '' : String(n))} className="rounded p-0.5 text-amber disabled:opacity-60">
                <Star size={22} fill={n <= nilai ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </Kelompok>
      );
    }
    case 'kisi_pilihan':
    case 'kisi_kotak': {
      const tunggal = f.tipe === 'kisi_pilihan';
      const baris = f.baris ?? [];
      const kolom = f.kolom ?? [];
      const m = bacaKisi(value);
      const ubah = (b: string, k: string, on: boolean) => {
        const sekarang = m[b] ?? [];
        const baru = tunggal ? (on ? [k] : []) : (on ? [...sekarang, k] : sekarang.filter((x) => x !== k));
        onChange(tulisKisi({ ...m, [b]: kolom.filter((x) => baru.includes(x)) }, baris));
      };
      return (
        <Kelompok f={f}>
          <div className="overflow-x-auto">
            <table className="text-2xs text-mist">
              <thead>
                <tr><th />{kolom.map((k) => <th key={k} className="px-3 py-1 text-center font-medium">{k}</th>)}</tr>
              </thead>
              <tbody>
                {baris.map((b) => (
                  <tr key={b} className="border-t border-ink-edge">
                    <td className="py-1.5 pr-3">{b}</td>
                    {kolom.map((k) => (
                      <td key={k} className="px-3 py-1.5 text-center">
                        <input type={tunggal ? 'radio' : 'checkbox'} name={`${f.id}-${b}`} aria-label={`${b}, ${k}`}
                          checked={(m[b] ?? []).includes(k)} disabled={disabled} onChange={(e) => ubah(b, k, e.target.checked)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kelompok>
      );
    }
    case 'file':
      return <Field label={f.label} required={f.wajib} hint="Tipe lama. Unggah berkas dilakukan pada langkah Lampiran SPJ."><Input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} /></Field>;
    default:
      return <Field label={f.label} required={f.wajib} hint={hint}><Input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} /></Field>;
  }
}
