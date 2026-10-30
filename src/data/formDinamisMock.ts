export type FormFieldType = 'text' | 'textarea' | 'date' | 'number';

export interface FormField {
  key: string;
  label: string;
  tipe: FormFieldType;
  wajib: boolean;
}

export interface FormBlock {
  nama: string;
  fields: FormField[];
}

export interface FormDinamis {
  jenisBelanja: string;
  fields: FormField[];
  blok?: FormBlock;
}

export const mockFormDinamis: Record<string, FormDinamis> = {
  Honor: {
    jenisBelanja: 'Honor',
    fields: [
      { key: 'nama_penerima', label: 'Nama Penerima', tipe: 'text', wajib: true },
      { key: 'nip', label: 'NIP', tipe: 'text', wajib: false },
      { key: 'uraian_kegiatan', label: 'Uraian Kegiatan', tipe: 'textarea', wajib: true },
      { key: 'nomor_sk', label: 'Nomor SK Penugasan', tipe: 'text', wajib: false },
    ],
  },
  'Barang & Jasa': {
    jenisBelanja: 'Barang & Jasa',
    fields: [
      { key: 'nama_penyedia', label: 'Nama Penyedia', tipe: 'text', wajib: true },
      { key: 'uraian_barang', label: 'Uraian Barang atau Jasa', tipe: 'textarea', wajib: true },
      { key: 'tanggal_pekerjaan', label: 'Tanggal Pekerjaan', tipe: 'date', wajib: true },
      { key: 'nomor_berita_acara', label: 'Nomor Berita Acara', tipe: 'text', wajib: false },
    ],
  },
  'Perjalanan Dinas': {
    jenisBelanja: 'Perjalanan Dinas',
    fields: [
      { key: 'nama', label: 'Nama', tipe: 'text', wajib: true },
      { key: 'nip', label: 'NIP', tipe: 'text', wajib: true },
      { key: 'nomor_surat_tugas', label: 'Nomor Surat Perintah Tugas', tipe: 'text', wajib: true },
      { key: 'tanggal_surat_tugas', label: 'Tanggal Surat Perintah Tugas', tipe: 'date', wajib: true },
      { key: 'daerah_tujuan', label: 'Daerah Tujuan', tipe: 'text', wajib: true },
      { key: 'tanggal_berangkat', label: 'Tanggal Berangkat', tipe: 'date', wajib: true },
      { key: 'tanggal_kembali', label: 'Tanggal Kembali', tipe: 'date', wajib: true },
      { key: 'nama_hotel', label: 'Nama Hotel', tipe: 'text', wajib: false },
    ],
    blok: {
      nama: 'Pelaku Perjalanan',
      fields: [
        { key: 'nama_pelaku', label: 'Nama Pelaku', tipe: 'text', wajib: true },
        { key: 'nip_pelaku', label: 'NIP Pelaku', tipe: 'text', wajib: false },
      ],
    },
  },
};
