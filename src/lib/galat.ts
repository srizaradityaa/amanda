// Pemberitahuan galat global untuk operasi yang tidak punya tempat menampilkan pesan sendiri (mis. tombol tanpa formulir).
type Pendengar = (pesan: string | null) => void;
const pendengar = new Set<Pendengar>();
export function langgananGalat(fn: Pendengar): () => void { pendengar.add(fn); return () => { pendengar.delete(fn); }; }
export function tampilkanGalat(pesan: string): void { for (const f of pendengar) { f(null); f(pesan); } }

// Penanda "sedang memproses" global: tombol simpan/tambah/aksi lain langsung memberi tanda walau server jauh.
let sibuk = 0;
const pendengarSibuk = new Set<() => void>();
export function langgananSibuk(fn: () => void): () => void { pendengarSibuk.add(fn); return () => { pendengarSibuk.delete(fn); }; }
export function sedangSibuk(): number { return sibuk; }
function kabarSibuk() { for (const f of pendengarSibuk) f(); }
export async function denganSibuk<T>(p: () => Promise<T>): Promise<T> {
  sibuk += 1; kabarSibuk();
  try { return await p(); } finally { sibuk -= 1; kabarSibuk(); }
}

// Pemberitahuan singkat saat berhasil.
const pendengarInfo = new Set<(pesan: string) => void>();
export function langgananInfo(fn: (pesan: string) => void): () => void { pendengarInfo.add(fn); return () => { pendengarInfo.delete(fn); }; }
export function tampilkanInfo(pesan: string): void { for (const f of pendengarInfo) f(pesan); }
