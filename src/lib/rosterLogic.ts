import { 
  addDays, 
  format, 
  isWithinInterval, 
  parseISO, 
  startOfDay, 
  isAfter,
  getHours,
  getMinutes,
  isWeekend
} from 'date-fns';
import { 
  Military, 
  StatusPeriod, 
  ShipPeriod, 
  ManualSwap, 
  RosterEntry, 
  StatusType,
  RosterModel
} from '../types';

const STATUS_IMPEDITIVOS: StatusType[] = ['CURSO', 'FERIAS', 'DISPENSA_MEDICA', 'PATERNIDADE', 'LUTO'];

export function getStatusAtivo(militaryId: number, dateStr: string, statusPeriods: StatusPeriod[]): StatusType | null {
  const date = parseISO(dateStr);
  for (const s of statusPeriods) {
    if (s.militaryId === militaryId) {
      const start = parseISO(s.start);
      const end = parseISO(s.end);
      if (isWithinInterval(date, { start, end })) {
        return s.type;
      }
    }
  }
  return null;
}

export function isMilitaryImpeded(militaryId: number, dateStr: string, statusPeriods: StatusPeriod[]): boolean {
  const status = getStatusAtivo(militaryId, dateStr, statusPeriods);
  return !!status && (STATUS_IMPEDITIVOS.includes(status) || status === 'ACOMPANHANDO');
}

export function getShipStatus(dateStr: string, shipPeriods: ShipPeriod[]) {
  const date = startOfDay(parseISO(dateStr));
  const sortedPeriods = [...shipPeriods].sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

  for (const p of sortedPeriods) {
    const start = parseISO(p.start);
    const end = parseISO(p.end);
    const startDay = startOfDay(start);
    const endDay = startOfDay(end);

    if (isWithinInterval(date, { start: startDay, end: endDay })) {
      if (startDay.getTime() === endDay.getTime()) return { type: 'NORMAL' as const };
      
      if (date.getTime() === startDay.getTime()) {
        const minutes = getHours(start) * 60 + getMinutes(start);
        if (minutes < 11 * 60 + 45) {
          return { type: 'SERVICO_ESTENDIDO' as const, period: p, phase: 'inicio' as const };
        } else {
          return { type: 'NORMAL' as const };
        }
      }
      
      if (date.getTime() === endDay.getTime()) {
        const minutesStart = getHours(start) * 60 + getMinutes(start);
        if (minutesStart < 11 * 60 + 45) {
          return { type: 'SERVICO_ESTENDIDO' as const, period: p, phase: 'retorno' as const };
        } else {
          return { type: 'NORMAL' as const };
        }
      }
      
      const minutesStart = getHours(start) * 60 + getMinutes(start);
      if (minutesStart < 11 * 60 + 45) {
        return { type: 'SERVICO_ESTENDIDO' as const, period: p, phase: 'intermediario' as const };
      } else {
        return { type: 'PAUSA_TOTAL' as const, period: p };
      }
    }
  }
  return { type: 'NORMAL' as const };
}

export function generateRoster(
  startDate: string,
  days: number,
  militares: Military[],
  statusPeriods: StatusPeriod[],
  shipPeriods: ShipPeriod[],
  manualSwaps: ManualSwap[],
  acompDuration: number = 3,
  model: RosterModel = 'CORRIDA',
  holidayDates: string[] = []
): RosterEntry[] {
  if (militares.length === 0) return [];

  // Determine count per day from model
  let countPerDay = 1;
  if (model.endsWith('_2')) countPerDay = 2;
  if (model.endsWith('_3')) countPerDay = 3;

  const baseModel = model.replace(/_2$|_3$/, '') as 'CORRIDA' | 'QUARTOS' | 'PRETA_VERMELHA';

  // Sort by antiguidade (1 = Antigo, higher = Moderno)
  const sortedMilitares = [...militares].sort((a, b) => b.antiguidade - a.antiguidade);

  const acompanhanteCounters = new Map<number, number>();
  
  let nextIndex = 0;
  let nextIndexPreta = 0;
  let nextIndexVermelha = 0;

  const quarterMilitares: Record<number, Military[]> = {
    1: sortedMilitares.filter(m => m.quarto === 1),
    2: sortedMilitares.filter(m => m.quarto === 2),
    3: sortedMilitares.filter(m => m.quarto === 3),
    4: sortedMilitares.filter(m => m.quarto === 4),
  };
  const quarterIndices: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let quarterRotationIdx = 0;
  const rotationOrder = [4, 3, 2, 1];

  let frozenMilitaries: Military[] = [];
  let frozenAcompanhantes: (Military | null)[] = [];
  let frozenPeriod: ShipPeriod | null = null;

  const roster: RosterEntry[] = [];
  let currentDate = parseISO(startDate);

  militares.forEach(m => {
    if (getStatusAtivo(m.id, startDate, statusPeriods) === 'ACOMPANHANDO') {
      acompanhanteCounters.set(m.id, 0);
    }
  });

  for (let d = 0; d < days; d++) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const shipStatus = getShipStatus(dateStr, shipPeriods);
    const isVermelha = isWeekend(currentDate) || holidayDates.includes(dateStr);

    if (frozenMilitaries.length > 0 && frozenPeriod) {
      const endDay = startOfDay(parseISO(frozenPeriod.end));
      if (isAfter(currentDate, endDay)) {
        frozenMilitaries = [];
        frozenAcompanhantes = [];
        frozenPeriod = null;
      }
    }

    if (shipStatus.type === 'PAUSA_TOTAL') {
      roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'NAVIO', emNavio: true });
      incrementAcompanhanteCounters(dateStr, militares, statusPeriods, acompanhanteCounters);
      currentDate = addDays(currentDate, 1);
      continue;
    }

    if (shipStatus.type === 'SERVICO_ESTENDIDO') {
      if (shipStatus.phase === 'inicio' && frozenMilitaries.length === 0) {
        for (let i = 0; i < countPerDay; i++) {
          let titular: Military | null = null;
          if (baseModel === 'PRETA_VERMELHA') {
            const res = findNextTitular(dateStr, isVermelha ? nextIndexVermelha : nextIndexPreta, sortedMilitares, statusPeriods, frozenMilitaries.map(m => m.id));
            titular = res.titular;
            if (isVermelha) nextIndexVermelha = res.newIndex;
            else nextIndexPreta = res.newIndex;
          } else if (baseModel === 'QUARTOS') {
            const qNum = rotationOrder[quarterRotationIdx % 4];
            const qList = quarterMilitares[qNum] || [];
            const qIdx = quarterIndices[qNum] || 0;
            const res = findNextTitular(dateStr, qIdx, qList, statusPeriods, frozenMilitaries.map(m => m.id));
            titular = res.titular;
            if (titular) quarterIndices[qNum] = res.newIndex;
          } else {
            const res = findNextTitular(dateStr, nextIndex, sortedMilitares, statusPeriods, frozenMilitaries.map(m => m.id));
            titular = res.titular;
            nextIndex = res.newIndex;
          }

          if (titular) {
            frozenMilitaries.push(titular);
            const acomp = chooseAcompanhante(dateStr, militares, statusPeriods, acompanhanteCounters, titular.id, acompDuration);
            frozenAcompanhantes.push(acomp);
            frozenPeriod = shipStatus.period;
            roster.push({ data: dateStr, militaryId: titular.id, acompanhanteId: acomp ? acomp.id : null, status: 'SERVICO', emNavio: true });
          }
        }
        if (baseModel === 'QUARTOS') quarterRotationIdx++;
        if (frozenMilitaries.length === 0) {
          roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'INDISPONIVEL', emNavio: true });
        }
      } else if (frozenMilitaries.length > 0) {
        frozenMilitaries.forEach((m, idx) => {
          roster.push({ data: dateStr, militaryId: m.id, acompanhanteId: frozenAcompanhantes[idx]?.id || null, status: 'SERVICO', emNavio: true });
        });
      } else {
        roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'INDISPONIVEL', emNavio: true });
      }

      incrementAcompanhanteCounters(dateStr, militares, statusPeriods, acompanhanteCounters);
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // NORMAL DAY
    const dayTitulars: Military[] = [];
    for (let i = 0; i < countPerDay; i++) {
      let titular: Military | null = null;
      if (baseModel === 'PRETA_VERMELHA') {
        const res = findNextTitular(dateStr, isVermelha ? nextIndexVermelha : nextIndexPreta, sortedMilitares, statusPeriods, dayTitulars.map(m => m.id));
        titular = res.titular;
        if (isVermelha) nextIndexVermelha = res.newIndex;
        else nextIndexPreta = res.newIndex;
      } else if (baseModel === 'QUARTOS') {
        const qNum = rotationOrder[quarterRotationIdx % 4];
        const qList = quarterMilitares[qNum] || [];
        const qIdx = quarterIndices[qNum] || 0;
        const res = findNextTitular(dateStr, qIdx, qList, statusPeriods, dayTitulars.map(m => m.id));
        titular = res.titular;
        if (titular) quarterIndices[qNum] = res.newIndex;
      } else {
        const res = findNextTitular(dateStr, nextIndex, sortedMilitares, statusPeriods, dayTitulars.map(m => m.id));
        titular = res.titular;
        nextIndex = res.newIndex;
      }

      if (titular) {
        dayTitulars.push(titular);
        const acomp = chooseAcompanhante(dateStr, militares, statusPeriods, acompanhanteCounters, titular.id, acompDuration);
        roster.push({ data: dateStr, militaryId: titular.id, acompanhanteId: acomp ? acomp.id : null, status: 'SERVICO', emNavio: false });
      }
    }
    if (baseModel === 'QUARTOS') quarterRotationIdx++;
    if (dayTitulars.length === 0) {
      roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'INDISPONIVEL', emNavio: false });
    }

    incrementAcompanhanteCounters(dateStr, militares, statusPeriods, acompanhanteCounters);
    currentDate = addDays(currentDate, 1);
  }

  return applyManualSwaps(roster, manualSwaps);
}

function findNextTitular(dateStr: string, startIndex: number, militares: Military[], statusPeriods: StatusPeriod[], alreadyPickedIds: number[] = []) {
  let idx = startIndex;
  let attempts = 0;
  while (attempts < militares.length) {
    const candidate = militares[idx];
    if (!isMilitaryImpeded(candidate.id, dateStr, statusPeriods) && !alreadyPickedIds.includes(candidate.id)) {
      const newIndex = (idx + 1) % militares.length;
      return { titular: candidate, newIndex };
    }
    idx = (idx + 1) % militares.length;
    attempts++;
  }
  return { titular: null, newIndex: startIndex };
}

function chooseAcompanhante(
  dateStr: string,
  militares: Military[],
  statusPeriods: StatusPeriod[],
  counters: Map<number, number>,
  titularId: number,
  acompDuration: number
) {
  const active = militares.filter(m => {
    if (m.id === titularId) return false;
    return getStatusAtivo(m.id, dateStr, statusPeriods) === 'ACOMPANHANDO';
  });

  for (const m of active) {
    if (!counters.has(m.id)) counters.set(m.id, 0);
    if ((counters.get(m.id) || 0) >= acompDuration) {
      counters.set(m.id, 0);
      return m;
    }
  }
  return null;
}

function incrementAcompanhanteCounters(
  dateStr: string,
  militares: Military[],
  statusPeriods: StatusPeriod[],
  counters: Map<number, number>
) {
  const active = militares.filter(m => getStatusAtivo(m.id, dateStr, statusPeriods) === 'ACOMPANHANDO');
  for (const m of active) {
    if (!counters.has(m.id)) counters.set(m.id, 0);
    counters.set(m.id, (counters.get(m.id) || 0) + 1);
  }
}

function applyManualSwaps(baseRoster: RosterEntry[], manualSwaps: ManualSwap[]): RosterEntry[] {
  const workingRoster = baseRoster.map(e => ({ ...e }));
  
  for (const swap of manualSwaps) {
    const entryIndex = workingRoster.findIndex(e => e.data === swap.data && e.militaryId === swap.originalMilitaryId);
    if (entryIndex === -1) continue;

    const entry = workingRoster[entryIndex];
    const oldId = entry.militaryId;
    const newId = swap.newMilitaryId;

    if (swap.type === 'substituir') {
      entry.militaryId = newId;
      if (entry.acompanhanteId === newId) entry.acompanhanteId = null;
    } else if (swap.type === 'troca') {
      if (oldId === null) {
        entry.militaryId = newId;
        continue;
      }

      entry.militaryId = newId;
      
      for (let i = 0; i < workingRoster.length; i++) {
        const e = workingRoster[i];
        if (isAfter(parseISO(e.data), parseISO(swap.data)) && e.militaryId === newId) {
          e.militaryId = oldId;
          break;
        }
      }
    }
  }
  
  return workingRoster;
}
