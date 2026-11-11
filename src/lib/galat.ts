// Pemberitahuan galat global untuk operasi yang tidak punya tempat menampilkan pesan sendiri (mis. tombol tanpa formulir).
type Pendengar = (pesan: string | null) => void;
const pendengar = new Set<Pendengar>();
export function langgananGalat(fn: Pendengar): () => void { pendengar.add(fn); return () => { pendengar.delete(fn); }; }
export function tampilkanGalat(pesan: string): void { for (const f of pendengar) f(pesan); }
