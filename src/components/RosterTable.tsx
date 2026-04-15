import React from 'react';
import { format, parseISO, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Military, RosterEntry, StatusPeriod, STATUS_COLORS, STATUS_LABELS } from '../types';
import { getStatusAtivo, isMilitaryImpeded } from '../lib/rosterLogic';
import { cn } from '../lib/utils';
import { Zap, Ship, BookOpen } from 'lucide-react';

interface RosterTableProps {
  militares: Military[];
  roster: RosterEntry[];
  statusPeriods: StatusPeriod[];
  onCellClick: (date: string, rowMilitaryId: number) => void;
}

export const RosterTable: React.FC<RosterTableProps> = ({ 
  militares, 
  roster, 
  statusPeriods,
  onCellClick 
}) => {
  const dates = roster.map(e => e.data);

  return (
    <div id="roster-table-container" className="glass-panel rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse text-sm font-mono">
          <thead>
            <tr className="bg-white/5 border-b border-white/5 text-text-main">
              <th className="sticky left-0 z-20 bg-bg-card p-6 text-left border-r border-white/5 min-w-[240px]">
                <div className="label-tech">Operador / Militar</div>
              </th>
              {dates.map(date => {
                const d = parseISO(date);
                const isVerm = isWeekend(d);
                return (
                  <th key={date} className={cn(
                    "p-4 text-center min-w-[120px] border-r border-white/5 transition-colors",
                    isVerm && "bg-red-500/5"
                  )}>
                    <div className={cn(
                      "text-[10px] font-bold uppercase tracking-widest mb-1",
                      isVerm ? "text-red-400" : "text-accent"
                    )}>
                      {format(d, 'EEE', { locale: ptBR })}
                    </div>
                    <div className={cn(
                      "text-sm font-black",
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
                <td className="sticky left-0 z-10 bg-bg-card p-6 font-bold text-text-main border-r border-white/5 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] bg-white/5 text-accent px-2.5 py-1 rounded-lg font-black border border-white/5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex flex-col">
                      <span className="tracking-tight font-display font-bold leading-none">{m.name}</span>
                      <span className="text-[9px] text-text-muted mt-1 font-mono font-bold uppercase tracking-widest">{m.quarto || 1}º QUARTO</span>
                    </div>
                  </div>
                </td>
                {dates.map(dateStr => {
                  const entry = roster.find(e => e.data === dateStr);
                  const statusAtivo = getStatusAtivo(m.id, dateStr, statusPeriods);
                  const isTitular = entry?.militaryId === m.id;
                  const isAcompanhante = entry?.acompanhanteId === m.id;
                  const isNavioPausa = entry?.status === 'NAVIO';
                  const isVerm = isWeekend(parseISO(dateStr));

                  let content = null;
                  let cellClass = "p-4 text-center border-r border-white/5 min-h-[80px] transition-all";

                  if (isNavioPausa) {
                    cellClass = cn(cellClass, "bg-bg-main/40 text-text-muted opacity-20");
                    content = <Ship className="w-5 h-5 mx-auto opacity-50" />;
                  } else if (isTitular) {
                    cellClass = cn(cellClass, "bg-primary text-white shadow-inner relative overflow-hidden");
                    if (isVerm) cellClass = cn(cellClass, "brightness-110 brass-glow");
                    content = (
                      <div className="flex flex-col items-center gap-1.5 relative z-10">
                        <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider">
                          <Zap className={cn("w-3.5 h-3.5 fill-accent text-accent", isVerm && "text-red-400 fill-red-400")} />
                          <span className={cn("text-accent", isVerm && "text-red-400")}>SERV</span> 
                          {entry?.emNavio && <Ship className="w-3.5 h-3.5 text-white" />}
                        </div>
                        {entry?.acompanhanteId && (
                          <div className="text-[9px] font-bold opacity-90 truncate max-w-full bg-white/10 px-2 py-0.5 rounded-full">
                            + {militares.find(mil => mil.id === entry.acompanhanteId)?.name.split(' ')[0]}
                          </div>
                        )}
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                          <Zap className="w-12 h-12" />
                        </div>
                      </div>
                    );
                  } else if (isAcompanhante) {
                    cellClass = cn(cellClass, "bg-primary-light/40 text-white");
                    content = (
                      <div className="flex flex-col items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-accent">ACOMP</span>
                      </div>
                    );
                  } else if (statusAtivo) {
                    const navalStatusColor = statusAtivo === 'FERIAS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                           statusAtivo === 'CURSO' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                                           'bg-red-500/20 text-red-400 border border-red-500/20';
                    
                    cellClass = cn(cellClass, navalStatusColor, "font-black text-[10px] uppercase tracking-tighter");
                    content = <span className="animate-pulse-subtle">{STATUS_LABELS[statusAtivo]}</span>;
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
