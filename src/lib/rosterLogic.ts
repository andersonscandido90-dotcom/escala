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
  model: RosterModel = 'CORRIDA'
): RosterEntry[] {
  if (militares.length === 0) return [];

  // Sort by antiguidade (1 = Antigo, higher = Moderno)
  // We want to start with the "Mais Moderno", so we sort descending
  const sortedMilitares = [...militares].sort((a, b) => b.antiguidade - a.antiguidade);

  const acompanhanteCounters = new Map<number, number>();
  
  // Indices for different models
  let nextIndex = 0;
  let nextIndexPreta = 0;
  let nextIndexVermelha = 0;

  // QUARTOS state
  const quarterMilitares: Record<number, Military[]> = {
    1: sortedMilitares.filter(m => m.quarto === 1),
    2: sortedMilitares.filter(m => m.quarto === 2),
    3: sortedMilitares.filter(m => m.quarto === 3),
    4: sortedMilitares.filter(m => m.quarto === 4),
  };
  const quarterIndices: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let quarterRotationIdx = 0;
  const rotationOrder = [4, 3, 2, 1];

  let frozenMilitary: Military | null = null;
  let frozenAcompanhante: Military | null = null;
  let frozenPeriod: ShipPeriod | null = null;

  const roster: RosterEntry[] = [];
  let currentDate = parseISO(startDate);

  // Initialize counters for those who are "ACOMPANHANDO"
  militares.forEach(m => {
    if (getStatusAtivo(m.id, startDate, statusPeriods) === 'ACOMPANHANDO') {
      acompanhanteCounters.set(m.id, 0);
    }
  });

  for (let d = 0; d < days; d++) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const shipStatus = getShipStatus(dateStr, shipPeriods);
    const isVermelha = isWeekend(currentDate);

    if (frozenMilitary && frozenPeriod) {
      const endDay = startOfDay(parseISO(frozenPeriod.end));
      if (isAfter(currentDate, endDay)) {
        frozenMilitary = null;
        frozenAcompanhante = null;
        frozenPeriod = null;
      }
    }

    // PAUSA TOTAL
    if (shipStatus.type === 'PAUSA_TOTAL') {
      roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'NAVIO', emNavio: true });
      incrementAcompanhanteCounters(dateStr, militares, statusPeriods, acompanhanteCounters);
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // SERVICO ESTENDIDO
    if (shipStatus.type === 'SERVICO_ESTENDIDO') {
      if (shipStatus.phase === 'inicio' && !frozenMilitary) {
        let titular: Military | null = null;

        if (model === 'PRETA_VERMELHA') {
          const res = findNextTitular(dateStr, isVermelha ? nextIndexVermelha : nextIndexPreta, sortedMilitares, statusPeriods);
          titular = res.titular;
          if (isVermelha) nextIndexVermelha = res.newIndex;
          else nextIndexPreta = res.newIndex;
        } else if (model === 'QUARTOS') {
          const qNum = rotationOrder[quarterRotationIdx % 4];
          const qList = quarterMilitares[qNum] || [];
          const qIdx = quarterIndices[qNum] || 0;
          const res = findNextTitular(dateStr, qIdx, qList, statusPeriods);
          titular = res.titular;
          if (titular) quarterIndices[qNum] = res.newIndex;
          quarterRotationIdx++;
        } else {
          const res = findNextTitular(dateStr, nextIndex, sortedMilitares, statusPeriods);
          titular = res.titular;
          nextIndex = res.newIndex;
        }

        if (titular) {
          frozenMilitary = titular;
          const acomp = chooseAcompanhante(dateStr, militares, statusPeriods, acompanhanteCounters, frozenMilitary.id, acompDuration);
          frozenAcompanhante = acomp;
          frozenPeriod = shipStatus.period;

          roster.push({
            data: dateStr,
            militaryId: frozenMilitary.id,
            acompanhanteId: acomp ? acomp.id : null,
            status: 'SERVICO',
            emNavio: true
          });
        } else {
          roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'INDISPONIVEL', emNavio: true });
        }
      } else if (frozenMilitary) {
        roster.push({
          data: dateStr,
          militaryId: frozenMilitary.id,
          acompanhanteId: frozenAcompanhante ? frozenAcompanhante.id : null,
          status: 'SERVICO',
          emNavio: true
        });
      } else {
        roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'INDISPONIVEL', emNavio: true });
      }

      incrementAcompanhanteCounters(dateStr, militares, statusPeriods, acompanhanteCounters);
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // NORMAL DAY
    let titular: Military | null = null;

    if (model === 'PRETA_VERMELHA') {
      const res = findNextTitular(dateStr, isVermelha ? nextIndexVermelha : nextIndexPreta, sortedMilitares, statusPeriods);
      titular = res.titular;
      if (isVermelha) nextIndexVermelha = res.newIndex;
      else nextIndexPreta = res.newIndex;
    } else if (model === 'QUARTOS') {
      const qNum = rotationOrder[quarterRotationIdx % 4];
      const qList = quarterMilitares[qNum] || [];
      const qIdx = quarterIndices[qNum] || 0;
      const res = findNextTitular(dateStr, qIdx, qList, statusPeriods);
      titular = res.titular;
      if (titular) quarterIndices[qNum] = res.newIndex;
      quarterRotationIdx++;
    } else {
      const res = findNextTitular(dateStr, nextIndex, sortedMilitares, statusPeriods);
      titular = res.titular;
      nextIndex = res.newIndex;
    }

    if (titular) {
      const acomp = chooseAcompanhante(dateStr, militares, statusPeriods, acompanhanteCounters, titular.id, acompDuration);
      roster.push({
        data: dateStr,
        militaryId: titular.id,
        acompanhanteId: acomp ? acomp.id : null,
        status: 'SERVICO',
        emNavio: false
      });
    } else {
      roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'INDISPONIVEL', emNavio: false });
    }

    incrementAcompanhanteCounters(dateStr, militares, statusPeriods, acompanhanteCounters);
    currentDate = addDays(currentDate, 1);
  }

  return applyManualSwaps(roster, manualSwaps);
}

function findNextTitular(dateStr: string, startIndex: number, militares: Military[], statusPeriods: StatusPeriod[]) {
  let idx = startIndex;
  let attempts = 0;
  while (attempts < militares.length) {
    const candidate = militares[idx];
    if (!isMilitaryImpeded(candidate.id, dateStr, statusPeriods)) {
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
  const rosterMap = new Map(baseRoster.map(e => [e.data, { ...e }]));
  
  for (const swap of manualSwaps) {
    const entry = rosterMap.get(swap.data);
    if (!entry) continue;

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
      
      for (const [data, e] of rosterMap) {
        if (isAfter(parseISO(data), parseISO(swap.data)) && e.militaryId === newId) {
          e.militaryId = oldId;
          break;
        }
      }
    }
  }
  
  return Array.from(rosterMap.values());
}
