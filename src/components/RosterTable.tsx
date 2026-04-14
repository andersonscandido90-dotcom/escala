import React from 'react';
import { format, parseISO } from 'date-fns';
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
    <div id="roster-table-container" className="bg-white rounded-2xl border border-border-sleek shadow-sleek overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-white border-b border-border-sleek text-text-main">
              <th className="sticky left-0 z-20 bg-white p-6 text-left font-bold text-xs uppercase tracking-widest min-w-[220px] border-r border-border-sleek">
                Militar
              </th>
              {dates.map(date => {
                const d = parseISO(date);
                return (
                  <th key={date} className="p-4 text-center min-w-[110px] border-r border-border-sleek">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{format(d, 'EEE', { locale: ptBR })}</div>
                    <div className="text-sm font-extrabold">{format(d, 'dd/MM')}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {militares.map((m, idx) => (
              <tr key={m.id} className="group hover:bg-bg-main transition-colors border-b border-border-sleek last:border-0">
                <td className="sticky left-0 z-10 bg-white p-6 font-bold text-text-main border-r border-border-sleek shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-accent text-primary px-2 py-1 rounded-md font-extrabold">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {m.name}
                  </div>
                </td>
                {dates.map(dateStr => {
                  const entry = roster.find(e => e.data === dateStr);
                  const statusAtivo = getStatusAtivo(m.id, dateStr, statusPeriods);
                  const isTitular = entry?.militaryId === m.id;
                  const isAcompanhante = entry?.acompanhanteId === m.id;
                  const isNavioPausa = entry?.status === 'NAVIO';

                  let content = null;
                  let cellClass = "p-4 text-center border-r border-border-sleek min-h-[70px]";

                  if (isNavioPausa) {
                    cellClass = cn(cellClass, "bg-bg-main text-text-muted opacity-40");
                    content = <Ship className="w-4 h-4 mx-auto" />;
                  } else if (isTitular) {
                    cellClass = cn(cellClass, "bg-primary text-white hover:bg-primary/90 transition-all shadow-inner");
                    content = (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1 font-extrabold text-[11px] uppercase tracking-tighter">
                          <Zap className="w-3 h-3 fill-current" />
                          SERV {entry?.emNavio && <Ship className="w-3 h-3" />}
                        </div>
                        {entry?.acompanhanteId && (
                          <div className="text-[9px] font-medium opacity-80 truncate max-w-full">
                            + {militares.find(mil => mil.id === entry.acompanhanteId)?.name.split(' ')[0]}
                          </div>
                        )}
                      </div>
                    );
                  } else if (isAcompanhante) {
                    cellClass = cn(cellClass, "bg-purple-500 text-white");
                    content = (
                      <div className="flex flex-col items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="text-[10px] font-extrabold uppercase tracking-tighter">ACOMP</span>
                      </div>
                    );
                  } else if (statusAtivo) {
                    cellClass = cn(cellClass, STATUS_COLORS[statusAtivo], "font-extrabold text-[10px] uppercase tracking-tighter");
                    content = <span>{STATUS_LABELS[statusAtivo]}</span>;
                  } else {
                    content = <span className="text-border-sleek">—</span>;
                  }

                  const isClickable = !isNavioPausa;

                  return (
                    <td 
                      key={dateStr} 
                      className={cn(
                        cellClass, 
                        isClickable && "cursor-pointer transition-all",
                        isClickable && !isTitular && !isAcompanhante && !statusAtivo && "hover:bg-accent/50"
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
