import { 
  addDays, 
  format, 
  isWithinInterval, 
  parseISO, 
  startOfDay, 
  isAfter,
  getHours,
  getMinutes,
  isWeekend,
  differenceInDays
} from 'date-fns';
import { 
  Military, 
  StatusPeriod, 
  ShipPeriod, 
  ManualSwap, 
  RosterEntry, 
  StatusType,
  RosterModel,
  RestViolation
} from '../types';

export const STATUS_IMPEDITIVOS: StatusType[] = ['CURSO', 'FERIAS', 'DISPENSA_MEDICA', 'PATERNIDADE', 'LUTO', 'DESTACADO', 'PUNICAO'];
const SHIFTS = ['08:00 - 12:00', '12:00 - 16:00', '16:00 - 20:00'];

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
  const currentStatus = getStatusAtivo(militaryId, dateStr, statusPeriods);
  if (currentStatus && (STATUS_IMPEDITIVOS.includes(currentStatus) || currentStatus === 'ACOMPANHANDO')) {
    return true;
  }

  // Pre-vacation rule: The day before a vacation is also an impediment day
  const nextDay = format(addDays(parseISO(dateStr), 1), 'yyyy-MM-dd');
  const nextStatus = getStatusAtivo(militaryId, nextDay, statusPeriods);
  if (nextStatus === 'FERIAS') {
    return true;
  }

  return false;
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
  holidayDates: string[] = [],
  quartoOrder: 'MODERNO_PRIMEIRO' | 'ANTIGO_PRIMEIRO' = 'MODERNO_PRIMEIRO',
  militaryOrder: 'MAIS_MODERNO' | 'MAIS_ANTIGO' = 'MAIS_MODERNO',
  militaryOrderVermelha: 'MAIS_MODERNO' | 'MAIS_ANTIGO' = 'MAIS_MODERNO',
  skipVermelha: boolean = false
): RosterEntry[] {
  if (militares.length === 0) return [];

  // Determine count per day from model
  let countPerDay = 1;
  if (model.endsWith('_2')) countPerDay = 2;
  if (model.endsWith('_3')) countPerDay = 3;

  const baseModel = model.replace(/_2$|_3$/, '') as 'CORRIDA' | 'QUARTOS' | 'PRETA_VERMELHA';

  // Internal sorting: default is Most Modern first (Highest antiguidade)
  const sortedMilitares = [...militares].sort((a, b) => 
    militaryOrder === 'MAIS_MODERNO' ? b.antiguidade - a.antiguidade : a.antiguidade - b.antiguidade
  );

  const sortedMilitaresVermelha = [...militares].sort((a, b) => 
    militaryOrderVermelha === 'MAIS_MODERNO' ? b.antiguidade - a.antiguidade : a.antiguidade - b.antiguidade
  );

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
  
  // Rotation Order: Modern to Ancient or Ancient to Modern
  const rotationOrder = quartoOrder === 'MODERNO_PRIMEIRO' ? [4, 3, 2, 1] : [1, 2, 3, 4];

  let frozenMilitaries: Military[] = [];
  let frozenAcompanhantesList: (Military[])[] = [];
  let frozenPeriod: ShipPeriod | null = null;

  const roster: RosterEntry[] = [];
  let currentDate = parseISO(startDate);

  militares.forEach(m => {
    if (getStatusAtivo(m.id, startDate, statusPeriods) === 'ACOMPANHANDO') {
      acompanhanteCounters.set(m.id, acompDuration);
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
        frozenAcompanhantesList = [];
        frozenPeriod = null;
      }
    }

    if (shipStatus.type === 'PAUSA_TOTAL') {
      roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'NAVIO', emNavio: true });
      incrementAcompanhanteCounters(dateStr, militares, statusPeriods, acompanhanteCounters);
      currentDate = addDays(currentDate, 1);
      continue;
    }

    if (skipVermelha && isVermelha) {
      // Just push empty entries for each shift/position
      for (let i = 0; i < countPerDay; i++) {
        roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'DISPENSA', emNavio: false, isSundayRoutine: true });
      }
      incrementAcompanhanteCounters(dateStr, militares, statusPeriods, acompanhanteCounters);
      currentDate = addDays(currentDate, 1);
      continue;
    }

    const maxSlots = countPerDay > 1 ? 3 : 1;

    if (shipStatus.type === 'SERVICO_ESTENDIDO') {
      if (shipStatus.phase === 'inicio' && frozenMilitaries.length === 0) {
        const dayAcompIds: number[] = [];
        for (let i = 0; i < maxSlots; i++) {
          let titular: Military | null = null;
          if (i < countPerDay) {
            if (baseModel === 'PRETA_VERMELHA') {
              const list = isVermelha ? sortedMilitaresVermelha : sortedMilitares;
              const res = findNextTitular(dateStr, isVermelha ? nextIndexVermelha : nextIndexPreta, list, statusPeriods, frozenMilitaries.map(m => m.id));
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
          }

          if (titular) {
            frozenMilitaries.push(titular);
            const acomps = chooseAcompanhantes(dateStr, militares, statusPeriods, acompanhanteCounters, titular.id, acompDuration, model, dayAcompIds);
            acomps.forEach(a => dayAcompIds.push(a.id));
            frozenAcompanhantesList.push(acomps || []);
            roster.push({ 
              data: dateStr, 
              militaryId: titular.id, 
              acompanhanteId: acomps[0]?.id || null, 
              acompanhanteIds: acomps.map(a => a.id),
              status: 'SERVICO', 
              emNavio: true,
              shift: maxSlots > 1 ? SHIFTS[i] : undefined
            });
            frozenPeriod = shipStatus.period;
          } else {
            roster.push({ 
              data: dateStr, 
              militaryId: null, 
              acompanhanteId: null, 
              status: 'INDISPONIVEL', 
              emNavio: true, 
              shift: maxSlots > 1 ? SHIFTS[i] : undefined 
            });
          }
        }
        if (baseModel === 'QUARTOS') quarterRotationIdx++;
      } else if (frozenMilitaries.length > 0) {
        frozenMilitaries.forEach((m, idx) => {
          const acomps = frozenAcompanhantesList[idx] || [];
          roster.push({ 
            data: dateStr, 
            militaryId: m.id, 
            acompanhanteId: acomps[0]?.id || null, 
            acompanhanteIds: acomps.map(a => a.id),
            status: 'SERVICO', 
            emNavio: true,
            shift: maxSlots > 1 ? SHIFTS[idx] : undefined
          });
        });
        // Add remaining empty slots if needed
        for (let i = frozenMilitaries.length; i < maxSlots; i++) {
          roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'INDISPONIVEL', emNavio: true, shift: maxSlots > 1 ? SHIFTS[i] : undefined });
        }
      } else {
        for (let i = 0; i < maxSlots; i++) {
          roster.push({ data: dateStr, militaryId: null, acompanhanteId: null, status: 'INDISPONIVEL', emNavio: true, shift: maxSlots > 1 ? SHIFTS[i] : undefined });
        }
      }

      incrementAcompanhanteCounters(dateStr, militares, statusPeriods, acompanhanteCounters);
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // NORMAL DAY
    const dayTitulars: Military[] = [];
    const dayAcompIds: number[] = [];
    for (let i = 0; i < maxSlots; i++) {
      let titular: Military | null = null;
      if (i < countPerDay) {
        if (baseModel === 'PRETA_VERMELHA') {
          const list = isVermelha ? sortedMilitaresVermelha : sortedMilitares;
          const res = findNextTitular(dateStr, isVermelha ? nextIndexVermelha : nextIndexPreta, list, statusPeriods, dayTitulars.map(m => m.id));
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
      }

      if (titular) {
        dayTitulars.push(titular);
        const acomps = chooseAcompanhantes(dateStr, militares, statusPeriods, acompanhanteCounters, titular.id, acompDuration, model, dayAcompIds);
        acomps.forEach(a => dayAcompIds.push(a.id));
        roster.push({ 
          data: dateStr, 
          militaryId: titular.id, 
          acompanhanteId: acomps[0]?.id || null, 
          acompanhanteIds: acomps.map(a => a.id),
          status: 'SERVICO', 
          emNavio: false,
          shift: maxSlots > 1 ? SHIFTS[i] : undefined
        });
      } else {
        roster.push({ 
          data: dateStr, 
          militaryId: null, 
          acompanhanteId: null, 
          status: 'INDISPONIVEL', 
          emNavio: false, 
          shift: maxSlots > 1 ? SHIFTS[i] : undefined 
        });
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

function chooseAcompanhantes(
  dateStr: string,
  militares: Military[],
  statusPeriods: StatusPeriod[],
  counters: Map<number, number>,
  titularId: number,
  acompDuration: number,
  model: string,
  excludeIds: number[] = []
): Military[] {
  const eligible = militares.filter(m => {
    if (m.id === titularId) return false;
    if (excludeIds.includes(m.id)) return false;
    if (getStatusAtivo(m.id, dateStr, statusPeriods) !== 'ACOMPANHANDO') return false;
    
    const count = counters.get(m.id) ?? acompDuration; 
    return count >= acompDuration;
  });

  // Sort by start date of the status period for today
  eligible.sort((a, b) => {
    const pA = statusPeriods.find(p => p.militaryId === a.id && p.type === 'ACOMPANHANDO' && dateStr >= p.start && dateStr <= p.end);
    const pB = statusPeriods.find(p => p.militaryId === b.id && p.type === 'ACOMPANHANDO' && dateStr >= p.start && dateStr <= p.end);
    if (pA && pB) return pA.start.localeCompare(pB.start);
    return 0;
  });

  const isDailyService = !model.endsWith('_2') && !model.endsWith('_3');

  if (isDailyService) {
    // For daily services, everyone eligible today shadows, reset their counters
    eligible.forEach(m => counters.set(m.id, 0));
    return eligible;
  }

  // For shift services, we pick the first eligible one for this shift slot
  if (eligible.length > 0) {
    const picked = eligible[0];
    counters.set(picked.id, 0);
    return [picked]; 
  }
  
  return [];
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
    // Collect all entries for this day to handle index-based matching
    const dayEntries = workingRoster.filter(e => e.data === swap.data);
    
    let entryIndex = -1;
    
    // 1. Try matching by shiftIndex (Most robust)
    if (swap.shiftIndex !== undefined && dayEntries[swap.shiftIndex]) {
      entryIndex = workingRoster.indexOf(dayEntries[swap.shiftIndex]);
    }
    
    // 2. Try matching by shift name
    if (entryIndex === -1 && swap.shift) {
      entryIndex = workingRoster.findIndex(e => e.data === swap.data && e.shift === swap.shift);
    }
    
    // 3. One-slot scale fallback
    if (entryIndex === -1 && dayEntries.length === 1) {
      entryIndex = workingRoster.indexOf(dayEntries[0]);
    }
    
    // 4. Fallback to militaryId match on that day if still not found
    if (entryIndex === -1) {
      entryIndex = workingRoster.findIndex(e => {
        if (e.data !== swap.data) return false;
        return (e.militaryId === swap.originalMilitaryId || (e.militaryId === null && swap.originalMilitaryId === 0));
      });
    }

    if (entryIndex === -1) continue;

    const entry = workingRoster[entryIndex];
    const oldId = entry.militaryId;
    const newId = swap.newMilitaryId === 0 ? null : swap.newMilitaryId;

    entry.militaryId = newId;
    entry.externalName = swap.externalName;
    if (swap.externalName) {
      // If external replacement, keep the original ID so it stays "filled" in UI
      // but mark it as TROCA
      entry.militaryId = swap.originalMilitaryId;
      entry.status = 'TROCA';
    }
    
    // Clean up acompanhantes
    if (newId !== null && !swap.externalName) {
      if (entry.acompanhanteIds) {
        entry.acompanhanteIds = entry.acompanhanteIds.filter(id => id !== newId);
      }
      if (entry.acompanhanteId === newId) entry.acompanhanteId = null;
    }

    // Balancing Logic: Find where the new occupant came from and put the old occupant there
    const isRealPerson = (newId !== null);
    
    // Search on same day first
    const sameDaySwapIdx = workingRoster.findIndex((e, idx) => {
      if (idx === entryIndex || e.data !== swap.data) return false;
      
      // If we move someone to a VAGO slot and specify the target shift indirectly or via replacement, 
      // we need to find that VAGO slot to put the old person there.
      return e.militaryId === newId;
    });

    if (sameDaySwapIdx !== -1) {
      workingRoster[sameDaySwapIdx].militaryId = oldId;
    } else if (isRealPerson) {
      // Fallback to future dates
      for (let i = 0; i < workingRoster.length; i++) {
        const e = workingRoster[i];
        if (isAfter(parseISO(e.data), parseISO(swap.data)) && e.militaryId === newId) {
          workingRoster[i].militaryId = oldId;
          break;
        }
      }
    }
  }
  
  return workingRoster;
}

export function validateRosterRest(roster: RosterEntry[], militares: Military[]): RestViolation[] {
  const violations: RestViolation[] = [];
  const lastServiceDate = new Map<number, string>();

  // Use a map for fast name lookup
  const nameMap = new Map(militares.map(m => [m.id, m.name]));

  // Sort roster by date to ensure sequential processing
  const sortedRoster = [...roster].sort((a, b) => a.data.localeCompare(b.data));

  for (const entry of sortedRoster) {
    if (entry.militaryId === null || entry.status !== 'SERVICO') continue;

    const currentId = entry.militaryId;
    const currentDateStr = entry.data;
    const prevDateStr = lastServiceDate.get(currentId);

    if (prevDateStr) {
      const current = parseISO(currentDateStr);
      const prev = parseISO(prevDateStr);
      const diff = differenceInDays(current, prev) - 1; // days OFF

      if (diff < 2) {
        violations.push({
          militaryId: currentId,
          militaryName: nameMap.get(currentId) || 'Unknown',
          precedingDate: prevDateStr,
          violationDate: currentDateStr,
          restDays: diff
        });
      }
    }

    lastServiceDate.set(currentId, currentDateStr);
  }

  return violations;
}
