export type StatusType = 
  | 'CURSO' 
  | 'FERIAS' 
  | 'DISPENSA_MEDICA' 
  | 'PATERNIDADE' 
  | 'LUTO' 
  | 'ACOMPANHANDO'
  | 'NAVIO'
  | 'INDISPONIVEL'
  | 'SERVICO'
  | 'DESTACADO'
  | 'PUNICAO'
  | 'TROCA'
  | 'DISPENSA';

export type RosterModel = 
  | 'CORRIDA' | 'CORRIDA_2' | 'CORRIDA_3' 
  | 'QUARTOS' | 'QUARTOS_2' | 'QUARTOS_3' 
  | 'PRETA_VERMELHA' | 'PRETA_VERMELHA_2' | 'PRETA_VERMELHA_3';

export interface Military {
  id: number;
  name: string;
  posto?: string; // Ex: CB, 1SG, MN
  especialidade?: string; // Ex: MO, EL, MP
  quarto?: number; // 1, 2, 3, 4
  antiguidade: number; // 1 = Mais Antigo, higher = Mais Moderno
}

export interface StatusPeriod {
  id: number;
  militaryId: number;
  type: StatusType;
  start: string;
  end: string;
}

export interface ShipPeriod {
  id: number;
  start: string;
  end: string;
}

export interface ManualSwap {
  data: string;
  originalMilitaryId: number;
  newMilitaryId: number;
  type: 'troca' | 'substituir';
  shift?: string;
  shiftIndex?: number;
  externalName?: string;
}

export interface RosterEntry {
  data: string;
  militaryId: number | null;
  acompanhanteIds?: number[]; // Support for multiple shadowers
  acompanhanteId?: number | null; // Keep for backward compatibility if needed, but will prefer list
  status: StatusType;
  emNavio: boolean;
  isSundayRoutine?: boolean;
  shift?: string;
  externalName?: string;
}

export const STATUS_LABELS: Partial<Record<StatusType, string>> = {
  CURSO: 'Curso',
  FERIAS: 'Férias',
  DISPENSA_MEDICA: 'Médico',
  PATERNIDADE: 'Paternidade',
  LUTO: 'Luto',
  ACOMPANHANDO: 'Acompanhando',
  DESTACADO: 'Destacado',
  PUNICAO: 'Punição',
  TROCA: 'Troca',
};

export const STATUS_COLORS: Partial<Record<StatusType, string>> = {
  CURSO: 'bg-blue-500 text-white',
  FERIAS: 'bg-yellow-400 text-slate-900',
  DISPENSA_MEDICA: 'bg-red-500 text-white',
  PATERNIDADE: 'bg-pink-400 text-white',
  LUTO: 'bg-slate-600 text-white',
  ACOMPANHANDO: 'bg-purple-500 text-white',
  DESTACADO: 'bg-emerald-600 text-white',
  PUNICAO: 'bg-orange-700 text-white',
  TROCA: 'bg-purple-600 text-white',
};

export interface RosterService {
  id: number;
  name: string;
  militares: Military[];
  statusPeriods: StatusPeriod[];
  shipPeriods: ShipPeriod[];
  manualSwaps: ManualSwap[];
  acompDuration: number;
  rosterModel: RosterModel;
  holidayDates: string[];
  nextIds: { military: number; status: number; ship: number };
  config: { 
    startDate: string; 
    days: number;
    quartoOrder?: 'MODERNO_PRIMEIRO' | 'ANTIGO_PRIMEIRO';
    militaryOrder?: 'MAIS_MODERNO' | 'MAIS_ANTIGO';
    militaryOrderVermelha?: 'MAIS_MODERNO' | 'MAIS_ANTIGO';
    skipVermelha?: boolean;
  };
}
