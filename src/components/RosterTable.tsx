import React from 'react';
import { format, parseISO, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Military, RosterEntry, StatusPeriod, STATUS_COLORS, STATUS_LABELS, RestViolation } from '../types';
import { getStatusAtivo, isMilitaryImpeded } from '../lib/rosterLogic';
import { cn } from '../lib/utils';
import { Zap, Ship, BookOpen, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface RosterTableProps {
  militares: Military[];
  roster: RosterEntry[];
  statusPeriods: StatusPeriod[];
  holidayDates: string[];
  violations?: RestViolation[];
  onCellClick: (date: string, rowMilitaryId: number) => void;
  onHeaderClick?: (date: string) => void;
}

export const RosterTable: React.FC<RosterTableProps> = ({ 
  militares, 
  roster, 
  statusPeriods,
  holidayDates,
  violations = [],
  onCellClick,
  onHeaderClick
}) => {
  const dates = (Array.from(new Set(roster.map(e => e.data))).sort()) as string[];

  return (
    <div id="roster-table-container" className="glass-panel rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden h-full flex flex-col">
      <div id="roster-table-scroll" className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full border-collapse text-sm font-mono table-fixed">
          <thead className="sticky top-0 z-[60]">
            <tr className="bg-bg-card border-b border-white/5 text-text-main">
              <th className="sticky top-0 left-0 z-[70] bg-bg-card p-3 lg:p-6 text-left border-r border-white/5 min-w-[140px] w-[140px] lg:min-w-[240px] lg:w-[240px]">
                <div className="label-tech text-[8px] lg:text-[10px]">Militar</div>
              </th>
              {dates.map(date => {
                const d = parseISO(date);
                const isVerm = isWeekend(d) || holidayDates.includes(date);
                return (
                  <th 
                    key={date} 
                    onClick={() => onHeaderClick?.(date)}
                    className={cn(
                      "sticky top-0 z-[60] p-2 lg:p-4 text-center min-w-[80px] w-[80px] lg:min-w-[120px] lg:w-[120px] border-r border-white/5 transition-colors cursor-pointer hover:bg-white/10 bg-bg-card",
                      isVerm && "bg-red-500/5"
                    )}
                  >
                    <div className={cn(
                      "text-[8px] lg:text-[10px] font-bold uppercase tracking-widest mb-0.5 lg:mb-1",
                      isVerm ? "text-red-400" : "text-accent"
                    )}>
                      {format(d, 'EEE', { locale: ptBR })}
                    </div>
                    <div className={cn(
                      "text-[10px] lg:text-sm font-black",
                      isVerm ? "text-red-400" : "text-text-main"
                    )}>
                      {format(d, 'dd/MM')}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {militares.map((m, idx) => (
              <tr key={m.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                <td className="sticky left-0 z-10 bg-bg-card p-3 lg:p-6 font-bold text-text-main border-r border-white/5 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-2 lg:gap-4">
                    <span className="hidden sm:inline text-[10px] bg-white/5 text-accent px-2.5 py-1 rounded-lg font-black border border-white/5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="tracking-tight font-display font-bold leading-tight truncate text-xs lg:text-sm">{m.name}</span>
                      <span className="text-[7px] lg:text-[9px] text-text-muted mt-0.5 lg:mt-1 font-mono font-bold uppercase tracking-widest">{m.quarto || 1}º Q</span>
                    </div>
                  </div>
                </td>
                {dates.map(dateStr => {
                  const dayEntries = roster.filter(e => e.data === dateStr);
                  const entry = dayEntries.find(e => e.militaryId === m.id) || dayEntries[0];
                  const statusAtivo = getStatusAtivo(m.id, dateStr, statusPeriods);
                  const isTitular = dayEntries.some(e => e.militaryId === m.id);
                  const isAcompanhante = dayEntries.some(e => e.militaryId !== m.id && ((e.acompanhanteIds && e.acompanhanteIds.includes(m.id)) || e.acompanhanteId === m.id));
                  const isNavioPausa = dayEntries.every(e => e.status === 'NAVIO');
                  const isVerm = isWeekend(parseISO(dateStr)) || holidayDates.includes(dateStr);
                  
                  const violation = violations.find(v => v.militaryId === m.id && v.violationDate === dateStr);

                  let content = null;
                  let cellClass = "p-2 lg:p-4 text-center border-r border-white/5 min-h-[60px] lg:min-h-[80px] transition-all";

                  if (isNavioPausa) {
                    cellClass = cn(cellClass, "bg-bg-main/40 text-text-muted opacity-20");
                    content = <Ship className="w-4 h-4 lg:w-5 lg:h-5 mx-auto opacity-50" />;
                  } else if (isTitular) {
                    cellClass = cn(cellClass, "bg-primary text-white shadow-inner relative overflow-hidden");
                    if (isVerm) cellClass = cn(cellClass, "brightness-110 brass-glow");
                    content = (
                      <div className="flex flex-col items-center gap-1 relative z-10">
                        <div className="flex items-center gap-1 font-black text-[9px] lg:text-[11px] uppercase tracking-wider">
                          <span className={cn(
                            "text-accent", 
                            isVerm && "text-red-400",
                            entry?.status === 'TROCA' && "text-purple-400"
                          )}>
                            {entry?.status === 'TROCA' ? 'TROCA' : 'SERV'}
                          </span> 
                          {entry?.status === 'TROCA' ? (
                            <ArrowRightLeft className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 text-purple-400" />
                          ) : (
                            <Zap className={cn("w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 fill-accent text-accent", isVerm && "text-red-400 fill-red-400")} />
                          )}
                        </div>
                        {entry?.shift && (
                          <div className="text-[7px] lg:text-[8px] font-mono font-bold text-white/90 bg-black/20 px-1 py-0.5 rounded border border-white/5 truncate max-w-full">
                            {entry.shift}
                          </div>
                        )}
                        {entry?.acompanhanteIds && entry.acompanhanteIds.length > 0 && (
                          <div className="hidden lg:flex flex-col gap-0.5 mt-1">
                            {entry.acompanhanteIds.map(aid => (
                              <div key={aid} className="text-[8px] font-bold opacity-90 truncate max-w-[100px] bg-white/10 px-2 py-0.5 rounded-full">
                                + {militares.find(mil => mil.id === aid)?.name.split(' ')[0]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  } else if (isAcompanhante) {
                    cellClass = cn(cellClass, "bg-primary-light/40 text-white");
                    content = (
                      <div className="flex flex-col items-center gap-0.5 lg:gap-1">
                        <BookOpen className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-accent" />
                        <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-tighter text-accent">ACOMP</span>
                      </div>
                    );
                  } else if (statusAtivo) {
                    const navalStatusColor = statusAtivo === 'FERIAS' ? 'bg-yellow-400/20 text-yellow-500 border border-yellow-500/20' :
                                           statusAtivo === 'CURSO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                                           statusAtivo === 'DESTACADO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                           statusAtivo === 'PUNICAO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                                           'bg-red-500/20 text-red-400 border border-red-500/20';
                    
                    cellClass = cn(cellClass, navalStatusColor, "font-black text-[8px] lg:text-[10px] uppercase tracking-tighter");
                    content = <span className="animate-pulse-subtle truncate max-w-full px-1">{STATUS_LABELS[statusAtivo] || statusAtivo}</span>;
                  } else {
                    content = <span className="text-white/5">—</span>;
                  }

                  const isClickable = !isNavioPausa;

                  return (
                    <td 
                      key={dateStr} 
                      className={cn(
                        cellClass, 
                        isClickable && "cursor-pointer transition-all",
                        isClickable && !isTitular && !isAcompanhante && !statusAtivo && "hover:bg-white/5",
                        isVerm && !isTitular && !isAcompanhante && !statusAtivo && "bg-red-500/[0.02]"
                      )}
                      onClick={isClickable ? () => onCellClick(dateStr, m.id) : undefined}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
