import { useState } from 'react';
import { Button, Modal, useToast } from '@/components/ui';
import { ErrorLine, aktorSesi } from '@/components/AnggaranShared';
import * as anggaran from '@/data/anggaran';
import { repo } from '@/data/repo';
import { formatRupiah } from '@/lib/format';

export function ApbdPModal({ taId, onClose, onSaved }: { taId: string; onClose: () => void; onSaved: () => void }) {
  const ta = repo.tahunAnggaranById(taId);
  const toast = useToast();
  const [err, setErr] = useState<string | null>(null);
  if (!ta) return null;

  const aktifkan = async () => {
    const aktor = aktorSesi();
    if (!aktor) { setErr('Sesi tidak ditemukan. Silakan masuk kembali.'); return; }
    const hasil = await anggaran.aktifkanApbdP(taId, 0, aktor);
    if (!hasil.ok) { setErr(hasil.error ?? 'Gagal'); return; }
    toast.notify('Tersimpan');
    onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Aktifkan APBD-P — TA ${ta.tahun}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={aktifkan}>Aktifkan</Button>
        </>
      }
    >
      <p className="text-sm text-mist-dim">
        Pagu Induk murni <span className="mono tnum text-mist">{formatRupiah(ta.pagu_induk)}</span>. Pagu Induk perubahan tidak diisi Admin:
        nilainya mengikuti total pagu subkegiatan yang direvisi Bendahara. Setelah APBD-P aktif, Bendahara membuka jendela waktu,
        merevisi pagu, lalu Sahkan ulang sebelum SPD disesuaikan.
      </p>
      <ErrorLine msg={err} />
    </Modal>
  );
}
