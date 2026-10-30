import type { FormDinamis, FormField } from '@/data/formDinamisMock';

export interface SpjIsian {
  fields: Record<string, string>;
  blok: Record<string, string>[];
}

function isKosong(value: string | undefined): boolean {
  return value === undefined || value.trim() === '';
}

function fieldWajibKosong(fields: FormField[], values: Record<string, string>): FormField | undefined {
  return fields.find((f) => f.wajib && isKosong(values[f.key]));
}

export function validateIsianWajib(form: FormDinamis, isian: SpjIsian): string | null {
  const kosongUtama = fieldWajibKosong(form.fields, isian.fields);
  if (kosongUtama) return `Field "${kosongUtama.label}" wajib diisi.`;

  if (form.blok) {
    if (isian.blok.length === 0) return `Blok "${form.blok.nama}" minimal memiliki satu entri.`;
    for (const [idx, entri] of isian.blok.entries()) {
      const kosongBlok = fieldWajibKosong(form.blok.fields, entri);
      if (kosongBlok) return `Field "${kosongBlok.label}" pada entri ${idx + 1} blok "${form.blok.nama}" wajib diisi.`;
    }
  }
  return null;
}
