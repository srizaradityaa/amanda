import { useState, type FormEvent } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { FormDinamis, FormField } from '@/data/formDinamisMock';
import type { KuitansiRow } from '@/data/mockData';
import { PageHeader } from '@/components/ui/Primitives';
import type { SpjIsian } from '@/pages/modules/spj/formDinamisRules';

interface SpjIsianFormProps {
  kuitansi: KuitansiRow;
  form: FormDinamis;
  initial: SpjIsian | undefined;
  onSave: (isian: SpjIsian) => string | null;
  onBack: () => void;
}

function FieldInput({
  idPrefix,
  field,
  value,
  onChange,
}: {
  idPrefix: string;
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `${idPrefix}-${field.key}`;
  const common = 'input-base w-full text-sm';
  const input =
    field.tipe === 'textarea' ? (
      <textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={common} />
    ) : (
      <input
        id={id}
        type={field.tipe === 'date' ? 'date' : field.tipe === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={common}
      />
    );
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-ink-primary mb-1.5">
        {field.label}
        {field.wajib ? <span className="text-status-red"> *</span> : <span className="text-ink-muted font-normal"> (opsional)</span>}
      </label>
      {input}
    </div>
  );
}

function emptyEntry(fields: FormField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

export function SpjIsianForm({ kuitansi, form, initial, onSave, onBack }: SpjIsianFormProps) {
  const [fields, setFields] = useState<Record<string, string>>(() => initial?.fields ?? emptyEntry(form.fields));
  const blokDef = form.blok;
  const [blok, setBlok] = useState<Record<string, string>[]>(() => {
    if (!blokDef) return [];
    return initial?.blok.length ? initial.blok : [emptyEntry(blokDef.fields)];
  });
  const [error, setError] = useState<string | null>(null);

  const updateBlok = (idx: number, key: string, value: string) => {
    setBlok((prev) => prev.map((entri, i) => (i === idx ? { ...entri, [key]: value } : entri)));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = onSave({ fields, blok: blokDef ? blok : [] });
    setError(result);
  };

  return (
    <div className="animate-fade-in">
      <button type="button" onClick={onBack} className="btn-ghost text-xs px-2 py-1 mb-4 flex items-center gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Kembali ke daftar SPJ
      </button>
      <PageHeader title="Isian SPJ" subtitle={`${kuitansi.uraian} • ${form.jenisBelanja}`} />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <section className="surface-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-ink-primary">Rincian Form Dinamis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.fields.map((field) => (
              <FieldInput
                key={field.key}
                idPrefix="utama"
                field={field}
                value={fields[field.key] ?? ''}
                onChange={(value) => setFields((prev) => ({ ...prev, [field.key]: value }))}
              />
            ))}
          </div>
        </section>

        {blokDef && (
          <section className="surface-card p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-ink-primary">{blokDef.nama}</h2>
              <p className="text-2xs text-ink-muted mt-1">Minimal satu entri. Tambah entri untuk setiap pelaku.</p>
            </div>
            {blok.map((entri, idx) => (
              <div key={idx} className="border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-secondary">Entri {idx + 1}</span>
                  {blok.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Hapus entri ${idx + 1}`}
                      onClick={() => setBlok((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-status-red hover:bg-status-red/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {blokDef.fields.map((field) => (
                    <FieldInput
                      key={field.key}
                      idPrefix={`blok-${idx}`}
                      field={field}
                      value={entri[field.key] ?? ''}
                      onChange={(value) => updateBlok(idx, field.key, value)}
                    />
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setBlok((prev) => [...prev, emptyEntry(blokDef.fields)])}
              className="btn-ghost text-xs px-2 py-1 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Tambah
            </button>
          </section>
        )}

        {error && <p role="alert" className="text-xs text-status-red leading-relaxed">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onBack}>
            Batal
          </button>
          <button type="submit" className="btn-amber text-xs px-3 py-1.5">
            Simpan Isian SPJ
          </button>
        </div>
      </form>
    </div>
  );
}
