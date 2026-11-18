// Pemutar video YouTube untuk portal TV: otomatis, tanpa suara, berulang, tanpa subtitle.
// Memakai IFrame Player API resmi agar halaman dapat memerintahkan mute/play/matikan subtitle sendiri,
// dan menjalankan ulang bila terhenti. Bila skrip YouTube tidak termuat, memakai iframe biasa sebagai cadangan.
import { useEffect, useRef, useState } from 'react';
import { alamatEmbed } from '@/lib/youtube';

interface YTPlayer { mute(): void; playVideo(): void; getPlayerState(): number; unloadModule(m: string): void; destroy(): void }
interface YTNamespace { Player: new (el: HTMLElement, opt: unknown) => YTPlayer }
declare global { interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void } }

let apiSiap: Promise<boolean> | null = null;
function muatApi(): Promise<boolean> {
  if (window.YT?.Player) return Promise.resolve(true);
  apiSiap ??= new Promise<boolean>((res) => {
    const sebelumnya = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { sebelumnya?.(); res(true); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => { apiSiap = null; res(false); };
    document.head.appendChild(s);
    setTimeout(() => res(!!window.YT?.Player), 8000);
  });
  return apiSiap;
}

export function PemutarVideo({ id }: { id: string }) {
  const tempat = useRef<HTMLDivElement>(null);
  const [cadangan, setCadangan] = useState(false);

  useEffect(() => {
    let batal = false;
    let pemutar: YTPlayer | null = null;
    let jaga: ReturnType<typeof setInterval> | undefined;
    const matikanSubtitle = () => { try { pemutar?.unloadModule('captions'); pemutar?.unloadModule('cc'); } catch { /* abaikan */ } };
    void muatApi().then((ok) => {
      if (batal) return;
      if (!ok || !window.YT?.Player || !tempat.current) { setCadangan(true); return; }
      const el = document.createElement('div');
      tempat.current.replaceChildren(el);
      pemutar = new window.YT.Player(el, {
        host: 'https://www.youtube-nocookie.com',
        videoId: id,
        width: '100%', height: '100%',
        playerVars: { autoplay: 1, mute: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, disablekb: 1, fs: 0, cc_load_policy: 0, loop: 1, playlist: id },
        events: {
          onReady: (e: { target: YTPlayer }) => { e.target.mute(); matikanSubtitle(); e.target.playVideo(); },
          onStateChange: (e: { data: number; target: YTPlayer }) => { if (e.data === 0) e.target.playVideo(); if (e.data === 1) matikanSubtitle(); },
        },
      });
      // Penjaga untuk layar yang menyala lama: bila terhenti/tertunda, jalankan lagi.
      jaga = setInterval(() => {
        try { const st = pemutar?.getPlayerState(); if (st === -1 || st === 2 || st === 5 || st === 0) { pemutar?.mute(); pemutar?.playVideo(); } } catch { /* abaikan */ }
      }, 15000);
    });
    return () => { batal = true; if (jaga) clearInterval(jaga); try { pemutar?.destroy(); } catch { /* abaikan */ } };
  }, [id]);

  if (cadangan) return <iframe title="Video informasi" src={alamatEmbed(id)} className="h-full w-full" allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" />;
  return <div ref={tempat} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" aria-label="Video informasi" />;
}
