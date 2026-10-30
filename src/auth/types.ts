export type Role =
  | 'admin'
  | 'bendahara'
  | 'pptk'
  | 'verifikator'
  | 'pa_kpa'
  | 'auditor';

export type TaStatus = 'draft' | 'aktif_penuh' | 'masa_transisi' | 'arsip_readonly';

export interface TaAssignment {
  taId: string;
  taYear: number;
  role: Role;
  seksiId?: string;
  seksiName?: string;
}

export interface SessionUser {
  id: string;
  displayName: string;
  nipNikOrEmail: string;
  role: Role;
  actorType: 'internal' | 'auditor';
  assignments: TaAssignment[];
  activeTa?: TaAssignment;
  // extras for auditor
  instansiAsal?: string;
  nomorSuratTugas?: string;
}

export interface MockUser {
  identifier: string;
  password: string;
  label: string;
  description: string;
  user: Omit<SessionUser, 'activeTa'>;
}
