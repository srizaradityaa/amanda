// Latar kisi kotak untuk halaman login: kotak mengecil dan memudar menjauhi kursor atau jari, lalu tumbuh kembali.
// Ringan: satu kanvas, hanya berjalan saat ada gerakan; diam bila pengguna memilih "kurangi gerak" atau tab tersembunyi.
import { useEffect, useRef } from 'react';

const S = 36;      // jarak antar kotak (px)
const R = 150;     // jari-jari pengaruh pointer (px)

export function LatarKisi() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; const induk = cv?.parentElement;
    if (!cv || !induk) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const kurangi = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, cols = 0, rows = 0, C = new Float32Array(0);
    let ptr: { x: number; y: number } | null = null;
    let jalan = false, akhir = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const gambar = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const s = C[r * cols + c]; if (s <= 0.04) continue;
        const sz = (S - 12) * s;
        ctx.globalAlpha = 0.25 + 0.75 * s;
        ctx.strokeStyle = (r * 3 + c * 5) % 13 === 0 ? 'rgba(245,158,11,.4)' : 'rgba(107,114,128,.38)';
        ctx.strokeRect(c * S + S / 2 - sz / 2, r * S + S / 2 - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    };
    const ukur = () => {
      const b = induk.getBoundingClientRect(); W = b.width; H = b.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / S) + 1; rows = Math.ceil(H / S) + 1; C = new Float32Array(cols * rows).fill(1);
      gambar();
    };
    const langkah = (ts: number) => {
      if (!jalan) return;
      const dt = Math.min(0.05, (ts - akhir) / 1000 || 0.016); akhir = ts;
      const k = 1 - Math.pow(0.003, dt); let bergerak = false;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        let t = 1;
        if (ptr) { const dx = c * S + S / 2 - ptr.x, dy = r * S + S / 2 - ptr.y, d = Math.hypot(dx, dy); if (d < R) t = Math.pow(d / R, 1.4); }
        const i = r * cols + c, selisih = t - C[i];
        if (Math.abs(selisih) > 0.002) { C[i] += selisih * k; bergerak = true; } else C[i] = t;
      }
      gambar();
      if (bergerak || ptr) raf = requestAnimationFrame(langkah); else jalan = false; // diam total saat semua kotak sudah kembali
    };
    const mulai = () => { if (kurangi || jalan || document.hidden) return; jalan = true; akhir = performance.now(); raf = requestAnimationFrame(langkah); };
    const pos = (e: PointerEvent) => { const b = induk.getBoundingClientRect(); ptr = { x: e.clientX - b.left, y: e.clientY - b.top }; mulai(); };
    const lepas = () => { ptr = null; mulai(); };
    const tersembunyi = () => { if (document.hidden) { jalan = false; cancelAnimationFrame(raf); } else mulai(); };

    ukur();
    const ro = new ResizeObserver(ukur); ro.observe(induk);
    induk.addEventListener('pointermove', pos); induk.addEventListener('pointerdown', pos);
    induk.addEventListener('pointerleave', lepas); induk.addEventListener('pointerup', lepas); induk.addEventListener('pointercancel', lepas);
    document.addEventListener('visibilitychange', tersembunyi);
    return () => {
      jalan = false; cancelAnimationFrame(raf); ro.disconnect();
      induk.removeEventListener('pointermove', pos); induk.removeEventListener('pointerdown', pos);
      induk.removeEventListener('pointerleave', lepas); induk.removeEventListener('pointerup', lepas); induk.removeEventListener('pointercancel', lepas);
      document.removeEventListener('visibilitychange', tersembunyi);
    };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
