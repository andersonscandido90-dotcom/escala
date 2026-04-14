import { 
  addDays, 
  format, 
  isWithinInterval, 
  parseISO, 
  startOfDay, 
  isAfter,
  getHours,
  getMinutes
} from 'date-fns';
import { 
  Military, 
  StatusPeriod, 
  ShipPeriod, 
  ManualSwap, 
  RosterEntry, 
  StatusType 
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
  acompDuration: number = 3
): RosterEntry[] {
  if (militares.length === 0) return [];

  const acompanhanteCounters = new Map<number, number>();
  let nextIndex = 0;

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
        const result = findNextTitular(dateStr, nextIndex, militares, statusPeriods);
        if (result.titular) {
          frozenMilitary = result.titular;
          nextIndex = result.newIndex;
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
    const result = findNextTitular(dateStr, nextIndex, militares, statusPeriods);
    if (result.titular) {
      const acomp = chooseAcompanhante(dateStr, militares, statusPeriods, acompanhanteCounters, result.titular.id, acompDuration);
      nextIndex = result.newIndex;
      roster.push({
        data: dateStr,
        militaryId: result.titular.id,
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
      // If the new person was the companion, remove them from companion spot
      if (entry.acompanhanteId === newId) entry.acompanhanteId = null;
    } else if (swap.type === 'troca') {
      // Only swap if the current day has a military assigned
      if (oldId === null) {
        entry.militaryId = newId;
        continue;
      }

      entry.militaryId = newId;
      
      // Find the next time the new person was supposed to serve and give it to the old person
      let swapped = false;
      for (const [data, e] of rosterMap) {
        // Must be after the current swap date and must be the new person's service
        if (isAfter(parseISO(data), parseISO(swap.data)) && e.militaryId === newId) {
          e.militaryId = oldId;
          swapped = true;
          break;
        }
      }

      // If no future service was found for the new person, it effectively becomes a substitution
      // but we keep the oldId in mind for future roster generations if needed (not applicable here)
    }
  }
  
  return Array.from(rosterMap.values());
}
