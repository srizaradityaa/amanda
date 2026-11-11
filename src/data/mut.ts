// Pembungkus operasi tulis: mode demo menjalankan logika lokal (data contoh); mode server memanggil RPC Supabase.
// Hasil selalu Promise supaya layar cukup satu cara pemanggilan (await).
import { modeServer } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = (...a: any[]) => any;

export function mut<D extends Fn>(demo: D, server: (...a: Parameters<D>) => Promise<unknown>): (...a: Parameters<D>) => Promise<Awaited<ReturnType<D>>> {
  return (...a: Parameters<D>) => (modeServer ? server(...a) : Promise.resolve(demo(...a))) as Promise<Awaited<ReturnType<D>>>;
}
