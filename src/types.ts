export type StatusType = 
  | 'CURSO' 
  | 'FERIAS' 
  | 'DISPENSA_MEDICA' 
  | 'PATERNIDADE' 
  | 'LUTO' 
  | 'ACOMPANHANDO'
  | 'NAVIO'
  | 'INDISPONIVEL'
  | 'SERVICO';

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
}

export interface RosterEntry {
  data: string;
  militaryId: number | null;
  acompanhanteId: number | null;
  status: StatusType;
  emNavio: boolean;
  shift?: string;
}

export const STATUS_LABELS: Partial<Record<StatusType, string>> = {
  CURSO: 'Curso',
  FERIAS: 'Férias',
  DISPENSA_MEDICA: 'Médico',
  PATERNIDADE: 'Paternidade',
  LUTO: 'Luto',
  ACOMPANHANDO: 'Acompanhando',
};

export const STATUS_COLORS: Partial<Record<StatusType, string>> = {
  CURSO: 'bg-blue-500 text-white',
  FERIAS: 'bg-yellow-400 text-slate-900',
  DISPENSA_MEDICA: 'bg-red-500 text-white',
  PATERNIDADE: 'bg-pink-400 text-white',
  LUTO: 'bg-slate-600 text-white',
  ACOMPANHANDO: 'bg-purple-500 text-white',
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
  config: { startDate: string; days: number };
}
