import { useState, type FormEvent } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import {
  formatRupiah,
  mockRekeningBySubkegiatan,
  mockSeksiList,
  mockSubkegiatanBySeksi,
  type KuitansiRow,
} from '@/data/mockData';
import { PageHeader } from '@/components/ui/Primitives';

export type KuitansiInput = Omit<KuitansiRow, 'id' | 'status' | 'spjStatus'>;

interface KuitansiFormProps {
  seksiId: string;
  tanggalHariIni: string;
  initial: KuitansiRow | null;
  onSave: (input: KuitansiInput) => void;
  onBack: () => void;
}

type FieldErrors = Partial<Record<'subkegiatan' | 'rekening' | 'uraian' | 'penerima' | 'bruto' | 'tanggal', string>>;

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const fieldClass = 'input-base w-full mt-1 text-sm';
const labelClass = 'text-2xs uppercase tracking-wider text-ink-muted';

export function KuitansiForm({ seksiId, tanggalHariIni, initial, onSave, onBack }: KuitansiFormProps) {
  const subkegiatanOptions = mockSubkegiatanBySeksi[seksiId] ?? [];

  const [subkegiatanId, setSubkegiatanId] = useState(initial?.subkegiatanId ?? '');
  const [rekeningId, setRekeningId] = useState(initial?.rekeningId ?? '');
  const [uraian, setUraian] = useState(initial?.uraian ?? '');
  const [penerima, setPenerima] = useState(initial?.penerima ?? '');
  const [brutoDigits, setBrutoDigits] = useState(initial ? String(initial.bruto) : '');
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? tanggalHariIni);
  const [errors, setErrors] = useState<FieldErrors>({});

  const rekeningOptions = mockRekeningBySubkegiatan[subkegiatanId] ?? [];
  const bruto = Number(brutoDigits);
  const isEdit = initial !== null;

  const handleSubkegiatanChange = (value: string) => {
    setSubkegiatanId(value);
    setRekeningId('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const sub = subkegiatanOptions.find((item) => item.id === subkegiatanId);
    const rek = rekeningOptions.find((item) => item.id === rekeningId);

    const nextErrors: FieldErrors = {};
    if (!sub) nextErrors.subkegiatan = 'Pilih subkegiatan.';
    if (!rek) nextErrors.rekening = 'Pilih rekening belanja.';
    if (!uraian.trim()) nextErrors.uraian = 'Uraian wajib diisi.';
    if (!penerima.trim()) nextErrors.penerima = 'Nama penerima wajib diisi.';
    if (bruto <= 0) nextErrors.bruto = 'Bruto harus lebih dari Rp 0.';
    if (!tanggal) nextErrors.tanggal = 'Tanggal kuitansi wajib diisi.';
    setErrors(nextErrors);

    if (!sub || !rek || Object.keys(nextErrors).length > 0) return;

    onSave({
      seksiId,
      seksiName: mockSeksiList.find((s) => s.id === seksiId)?.name ?? '',
      uraian: uraian.trim(),
      penerima: penerima.trim(),
      subkegiatanId: sub.id,
      subkegiatanName: sub.nama,
      kodeSubkegiatan: sub.kode,
      rekeningId: rek.id,
      kodeRekening: rek.kode,
      bruto,
      tanggal,
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? 'Ubah Kuitansi' : 'Buat Kuitansi'}
        subtitle="Kuitansi Aktif dapat diubah selama belum masuk SPJ"
        mode="STANDAR"
      />

      <form onSubmit={handleSubmit} noValidate className="surface-card max-w-3xl p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="kwt-subkegiatan" className={labelClass}>Subkegiatan</label>
            <select
              id="kwt-subkegiatan"
              className={fieldClass}
              value={subkegiatanId}
              onChange={(event) => handleSubkegiatanChange(event.target.value)}
              aria-invalid={Boolean(errors.subkegiatan)}
            >
              <option value="">Pilih subkegiatan</option>
              {subkegiatanOptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.kode} — {sub.nama}
                </option>
              ))}
            </select>
            {errors.subkegiatan && <p className="mt-1 text-xs text-status-red">{errors.subkegiatan}</p>}
          </div>

          <div>
            <label htmlFor="kwt-rekening" className={labelClass}>Rekening Belanja</label>
            <select
              id="kwt-rekening"
              className={fieldClass}
              value={rekeningId}
              onChange={(event) => setRekeningId(event.target.value)}
              disabled={!subkegiatanId}
              aria-invalid={Boolean(errors.rekening)}
            >
              <option value="">{subkegiatanId ? 'Pilih rekening belanja' : 'Pilih subkegiatan dahulu'}</option>
              {rekeningOptions.map((rek) => (
                <option key={rek.id} value={rek.id}>
                  {rek.kode} — {rek.nama}
                </option>
              ))}
            </select>
            {errors.rekening && <p className="mt-1 text-xs text-status-red">{errors.rekening}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="kwt-uraian" className={labelClass}>Uraian</label>
            <input
              id="kwt-uraian"
              className={fieldClass}
              placeholder="Mis. Honor narasumber kegiatan"
              value={uraian}
              onChange={(event) => setUraian(event.target.value)}
              aria-invalid={Boolean(errors.uraian)}
            />
            {errors.uraian && <p className="mt-1 text-xs text-status-red">{errors.uraian}</p>}
          </div>

          <div>
            <label htmlFor="kwt-penerima" className={labelClass}>Nama Penerima</label>
            <input
              id="kwt-penerima"
              className={fieldClass}
              value={penerima}
              onChange={(event) => setPenerima(event.target.value)}
              aria-invalid={Boolean(errors.penerima)}
            />
            {errors.penerima && <p className="mt-1 text-xs text-status-red">{errors.penerima}</p>}
          </div>

          <div>
            <label htmlFor="kwt-bruto" className={labelClass}>Bruto (Rp)</label>
            <input
              id="kwt-bruto"
              inputMode="numeric"
              className={`${fieldClass} font-mono tnum`}
              placeholder="0"
              value={brutoDigits ? Number(brutoDigits).toLocaleString('id-ID') : ''}
              onChange={(event) => setBrutoDigits(digitsOnly(event.target.value))}
              aria-invalid={Boolean(errors.bruto)}
            />
            <p className="mt-1 text-xs text-ink-muted tnum">
              {bruto > 0 ? formatRupiah(bruto) : 'Nominal bruto kuitansi sebelum pajak'}
            </p>
            {errors.bruto && <p className="mt-1 text-xs text-status-red">{errors.bruto}</p>}
          </div>

          <div>
            <label htmlFor="kwt-tanggal" className={labelClass}>Tanggal Kuitansi</label>
            <input
              id="kwt-tanggal"
              type="date"
              className={fieldClass}
              value={tanggal}
              onChange={(event) => setTanggal(event.target.value)}
              aria-invalid={Boolean(errors.tanggal)}
            />
            {errors.tanggal && <p className="mt-1 text-xs text-status-red">{errors.tanggal}</p>}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
          <button type="button" className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Kembali ke Daftar
          </button>
          <button type="submit" className="btn-amber flex items-center gap-1.5 px-4 py-2 text-xs">
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {isEdit ? 'Simpan Perubahan' : 'Simpan Kuitansi'}
          </button>
        </div>
      </form>
    </div>
  );
}
