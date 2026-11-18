// Pengaturan Portal Keterbukaan (Admin): video YouTube dan logo kabupaten untuk layar TV.
import { useEffect, useRef, useState } from 'react';
import { Button, Card, Field, Input } from '@/components/ui';
import { pengaturanPortalAsync, simpanPengaturanPortal } from '@/data/pengaturanPortal';
import { idYoutube } from '@/lib/youtube';
import { PemutarVideo } from '@/components/PemutarVideo';

const MAKS_SISI = 256;        // logo diperkecil sampai sisi terpanjang 256 px
const MAKS_BYTE_DATAURL = 200_000;

function bacaLogo(file: File): Promise<string> {
  return new Promise((res, rej) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { rej(new Error('Logo harus berupa gambar PNG, JPEG, atau WebP.')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const sk = Math.min(1, MAKS_SISI / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * sk)); c.height = Math.max(1, Math.round(img.height * sk));
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      const png = c.toDataURL('image/png');
      if (png.length <= MAKS_BYTE_DATAURL) { res(png); return; }
      const jpg = c.toDataURL('image/webp', 0.85);
      if (jpg.startsWith('data:image/webp') && jpg.length <= MAKS_BYTE_DATAURL) res(jpg); else rej(new Error('Gambar terlalu besar. Gunakan logo yang lebih sederhana.'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak dapat dibaca.')); };
    img.src = url;
  });
}

function PageHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-bold text-mist">{title}{desc && <span title={desc} aria-label={desc} className="cursor-help text-sm font-normal text-mist-dim">ⓘ</span>}</h2>
    </div>
  );
}

export function PengaturanPortalPage() {
  const [video, setVideo] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoBaru, setLogoBaru] = useState<string | undefined>(undefined); // undefined = tidak diubah, '' = hapus
  const [awalVideo, setAwalVideo] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galatLogo, setGalatLogo] = useState('');
  const berkas = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let batal = false;
    void pengaturanPortalAsync().then((p) => { if (batal) return; setVideo(p.video_id ? `https://youtu.be/${p.video_id}` : ''); setAwalVideo(p.video_id ?? ''); setLogo(p.logo); });
    return () => { batal = true; };
  }, []);

  const id = idYoutube(video);
  const videoSalah = video.trim() !== '' && !id;
  const logoTampil = logoBaru === undefined ? logo : logoBaru === '' ? null : logoBaru;
  const berubah = logoBaru !== undefined || (id ?? '') !== awalVideo;

  const pilihLogo = async (f: File | undefined) => {
    setGalatLogo('');
    if (!f) return;
    try { setLogoBaru(await bacaLogo(f)); } catch (e) { setGalatLogo((e as Error).message); }
    if (berkas.current) berkas.current.value = '';
  };
  const simpan = async () => {
    if (videoSalah) return;
    setSibuk(true);
    const r = await simpanPengaturanPortal(video.trim(), logoBaru);
    setSibuk(false);
    if (r.ok) {
      setAwalVideo(id ?? ''); if (logoBaru !== undefined) { setLogo(logoBaru === '' ? null : logoBaru); setLogoBaru(undefined); }
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Pengaturan Portal Keterbukaan" desc="Video dan logo yang tampil di layar TV portal keterbukaan. Hanya Admin yang dapat mengubah; pengunjung portal hanya dapat melihat." />
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-mist">Video YouTube</h3>
        <Field label="Tautan video" hint="Tempel tautan YouTube (youtube.com atau youtu.be). Kosongkan untuk tanpa video. Video diputar otomatis, tanpa suara, berulang." >
          <Input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." aria-invalid={videoSalah} />
        </Field>
        {videoSalah && <p className="text-2xs text-crit" role="alert">Tautan bukan tautan video YouTube yang dikenali.</p>}
        {id && (
          <div>
            <p className="mb-1 text-2xs text-mist-dim">Pratinjau (jika video tidak tampil, pemilik video melarang diputar di situs lain; pilih video lain):</p>
            <div className="aspect-video w-full max-w-xl overflow-hidden rounded-lg border border-ink-edge bg-black">
              <PemutarVideo id={id} />
            </div>
          </div>
        )}
      </Card>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-mist">Logo Kabupaten</h3>
        <p className="text-2xs text-mist-dim">Tampil di kiri atas layar portal. Gunakan PNG dengan latar transparan. Gambar diperkecil otomatis (maksimal 256 px).</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-ink-edge bg-ink">
            {logoTampil ? <img src={logoTampil} alt="Logo kabupaten" className="max-h-16 max-w-16 object-contain" /> : <span className="text-2xs text-mist-dim">Belum ada</span>}
          </div>
          <input ref={berkas} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { void pilihLogo(e.target.files?.[0]); }} />
          <Button variant="secondary" onClick={() => berkas.current?.click()}>Pilih gambar logo</Button>
          {logoTampil && <Button variant="ghost" onClick={() => setLogoBaru('')}>Hapus logo</Button>}
        </div>
        {galatLogo && <p className="text-2xs text-crit" role="alert">{galatLogo}</p>}
      </Card>
      <div className="flex items-center gap-3">
        <Button onClick={() => { void simpan(); }} disabled={!berubah || videoSalah || sibuk}>Simpan</Button>
        {berubah && !sibuk && <span className="text-2xs text-mist-dim">Ada perubahan yang belum disimpan.</span>}
      </div>
    </div>
  );
}
