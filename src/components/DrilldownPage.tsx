import { Fragment, useState } from 'react';
import { Button, Card, EmptyState, StatusBadge } from '@/components/ui';
import { aktorSesi, ErrorLine, SectionTitle, StatusSeksiBadge } from '@/components/AnggaranShared';
import { getSession } from '@/lib/auth';
import { repo } from '@/data/repo';
import * as drill from '@/data/drilldown';
import type { AngkaTingkat } from '@/data/drilldown';
import { formatRupiah } from '@/lib/format';
import { ChevronRight, Layers } from 'lucide-react';

const BOLEH_REKENING = ['bendahara', 'verifikator', 'pptk'];
const BOLEH_PAGU_INDUK = ['bendahara', 'verifikator', 'pa_kpa'];

function persen(n: number) {
  return `${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
}

export function DrilldownPage() {
  const sesi = getSession();
  const aktor = aktorSesi();
  const [buka, setBuka] = useState<Set<string>>(() => { const a = aktorSesi(); return new Set(a?.peran === 'pptk' && a.seksi_ta_id ? ['s:' + a.seksi_ta_id] : []); });
  if (!sesi || !aktor || !sesi.active_ta_id) return null;
  const ta_id = sesi.active_ta_id;
  const ta = repo.tahunAnggaranById(ta_id);
  if (!ta) return null;

  const seksiRes = drill.drillSeksi(ta_id, aktor);
  if (!seksiRes.ok) return <ErrorLine msg={seksiRes.error} />;
  const totalSeksi = seksiRes.data.reduce((t, s) => t + s.pagu, 0);
  const bisaRekening = BOLEH_REKENING.includes(aktor.peran);
  // Kolom Status hanya perlu bila ada seksi yang belum tuntas; bila semua seimbang kolom ini tidak memberi informasi.
  const tampilStatus = seksiRes.data.some((x) => x.status !== 'Tuntas (100% Seimbang)');
  const kolom = tampilStatus ? 7 : 6;

  const toggle = (k: string) => setBuka((b) => { const n = new Set(b); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const bukaSemua = () => {
    const n = new Set<string>();
    for (const sk of seksiRes.data) {
      n.add('s:' + sk.seksi_ta_id);
      if (!bisaRekening) continue;
      const sr = drill.drillSubkegiatan(ta_id, sk.seksi_ta_id, aktor);
      if (sr.ok) for (const x of sr.data) n.add('p:' + x.pemetaan_id);
    }
    setBuka(n);
  };

  return (
    <div>
      {BOLEH_PAGU_INDUK.includes(aktor.peran) && (
        <Card className="mb-4 p-5">
          <div className="flex flex-wrap items-center gap-6 text-sm text-mist">
            <span>Pagu Induk TA {ta.tahun} <span className="mono tnum">{formatRupiah(ta.pagu_induk)}</span></span>
            <span>Total seluruh seksi <span className="mono tnum">{formatRupiah(totalSeksi)}</span></span>
          </div>
        </Card>
      )}
      <Card className="p-5">
        <SectionTitle title="Rincian Anggaran" desc="Seksi, subkegiatan, dan rekening belanja dalam satu daftar. Klik panah untuk membuka tingkat di bawahnya. Nilai setiap tingkat merupakan jumlah tingkat di bawahnya." />
        <div className="mb-3 flex gap-2">
          <Button variant="secondary" onClick={bukaSemua}>Buka semua</Button>
          <Button variant="secondary" onClick={() => setBuka(new Set())}>Tutup semua</Button>
        </div>
        {seksiRes.data.length === 0 ? (
          <EmptyState icon={<Layers size={28} />} title="Tidak ada seksi" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-ink-edge text-left text-2xs text-mist-dim">
                  <th className="py-2">Seksi / Subkegiatan / Rekening Belanja</th>
                  {(tampilStatus ? HEAD : HEAD.slice(0, 5)).map((h) => <th key={h} className="px-3 py-2 text-right">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {seksiRes.data.map((sk) => {
                  const kS = 's:' + sk.seksi_ta_id;
                  const terbuka = buka.has(kS);
                  const subRes = terbuka ? drill.drillSubkegiatan(ta_id, sk.seksi_ta_id, aktor) : null;
                  return (
                    <Fragment key={sk.seksi_ta_id}>
                      <tr className="border-b border-ink-edge bg-ink-surface text-mist">
                        <td className="border-l-4 border-amber py-3 pl-2 text-[15px] font-semibold"><Pembuka terbuka={terbuka} ada onKlik={() => toggle(kS)} label={sk.nama} /><ChipTingkat tingkat="seksi" />{sk.nama}</td>
                        <Angka a={sk} />
                        {tampilStatus && <td className="px-3 text-center"><StatusSeksiBadge status={sk.status} /></td>}
                      </tr>
                      {subRes && !subRes.ok && <tr><td colSpan={kolom}><ErrorLine msg={subRes.error} /></td></tr>}
                      {subRes?.ok && subRes.data.length === 0 && <tr><td colSpan={kolom} className="py-2 pl-8 text-mist-dim">Belum ada subkegiatan.</td></tr>}
                      {subRes?.ok && subRes.data.map((sb) => {
                        const kP = 'p:' + sb.pemetaan_id;
                        const terbukaP = bisaRekening && buka.has(kP);
                        const rekRes = terbukaP ? drill.drillRekening(ta_id, sb.pemetaan_id, aktor) : null;
                        return (
                          <Fragment key={sb.pemetaan_id}>
                            <tr className="border-b border-ink-edge/60 bg-ink/50 text-mist">
                              <td className="border-l-4 border-mist-dim/40 py-2.5 pl-8 font-medium"><Pembuka terbuka={terbukaP} ada={bisaRekening} onKlik={() => toggle(kP)} label={sb.nama} /><ChipTingkat tingkat="sub" /><span className="mono text-mist-dim">{sb.kode}</span> {sb.nama}</td>
                              <Angka a={sb} />
                              {tampilStatus && <td className="px-3 text-center"><StatusSeimbang seimbang={sb.seimbang} /></td>}
                            </tr>
                            {rekRes && !rekRes.ok && <tr><td colSpan={kolom}><ErrorLine msg={rekRes.error} /></td></tr>}
                            {rekRes?.ok && rekRes.data.length === 0 && <tr><td colSpan={kolom} className="py-2 pl-14 text-mist-dim">Belum ada rekening belanja.</td></tr>}
                            {rekRes?.ok && rekRes.data.map((rk) => (
                              <tr key={rk.alokasi_id} className="border-b border-ink-edge/30 text-[13px] text-mist-dim">
                                <td className="border-l-4 border-transparent py-1.5 pl-16"><ChipTingkat tingkat="rek" /><span className="mono">{rk.kode}</span> {rk.nama}</td>
                                <Angka a={rk} />
                                {tampilStatus && <td className="px-3 text-center"><StatusSeimbang seimbang={rk.seimbang} /></td>}
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// Penanda tingkat agar seksi, subkegiatan, dan rekening belanja mudah dibedakan.
export function ChipTingkat({ tingkat }: { tingkat: 'seksi' | 'sub' | 'rek' }) {
  const gaya = tingkat === 'seksi' ? 'bg-amber/15 text-amber' : tingkat === 'sub' ? 'bg-mist/10 text-mist' : 'border border-ink-edge text-mist-dim';
  const teks = tingkat === 'seksi' ? 'Seksi' : tingkat === 'sub' ? 'Subkegiatan' : 'Rekening';
  return <span className={`mr-2 inline-block rounded px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide ${gaya}`}>{teks}</span>;
}

// Tombol panah buka-tutup; tanpa panah bila tingkat di bawahnya tidak boleh dilihat peran ini.
function Pembuka({ terbuka, ada, onKlik, label }: { terbuka: boolean; ada: boolean; onKlik: () => void; label: string }) {
  if (!ada) return <span className="mr-1 inline-block w-5" />;
  return (
    <button type="button" onClick={onKlik} aria-expanded={terbuka} aria-label={`${terbuka ? 'Tutup' : 'Buka'} ${label}`}
      className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded text-mist-dim hover:text-mist focus-visible:outline-2 focus-visible:outline-amber">
      <ChevronRight size={14} className={`transition-transform ${terbuka ? 'rotate-90' : ''}`} />
    </button>
  );
}

function Angka({ a }: { a: AngkaTingkat }) {
  return (
    <>
      <td className="mono tnum whitespace-nowrap px-3 text-right">{formatRupiah(a.pagu)}</td>
      <td className="mono tnum whitespace-nowrap px-3 text-right">{formatRupiah(a.realisasi)}</td>
      <td className="mono tnum whitespace-nowrap px-3 text-right">{formatRupiah(a.komitmen)}</td>
      <td className="mono tnum whitespace-nowrap px-3 text-right">{formatRupiah(a.sisaSpdBebas)}</td>
      <td className="mono tnum whitespace-nowrap px-3 text-right">{persen(a.serapanPersen)}</td>
    </>
  );
}

function StatusSeimbang({ seimbang }: { seimbang: boolean }) {
  return <StatusBadge kind={seimbang ? 'ok' : 'warn'} label={seimbang ? 'Seimbang' : 'Belum Seimbang'} />;
}

const HEAD = ['Pagu', 'Realisasi BKU', 'Komitmen', 'Sisa SPD Bebas', 'Serapan', 'Status'];
