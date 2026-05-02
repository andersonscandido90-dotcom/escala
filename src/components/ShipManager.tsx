import React, { useState } from 'react';
import { ShipPeriod } from '../types';
import { Ship, Trash2, Plus, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ShipManagerProps {
  shipPeriods: ShipPeriod[];
  onAdd: (period: Omit<ShipPeriod, 'id'>) => void;
  onRemove: (id: number) => void;
}

export const ShipManager: React.FC<ShipManagerProps> = ({ 
  shipPeriods, 
  onAdd, 
  onRemove 
}) => {
  const [formData, setFormData] = useState({
    start: format(new Date(), "yyyy-MM-dd'T'10:00"),
    end: format(new Date(), "yyyy-MM-dd'T'18:00"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="glass-panel p-4 lg:p-8 rounded-2xl lg:rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="label-tech mb-1 text-[8px] lg:text-[10px]">Módulo de Operações</div>
        <h3 className="text-lg lg:text-xl font-display font-black text-text-main tracking-tight mb-4 lg:mb-8 flex items-center gap-3">
          <Ship className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
          Registrar Missão
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 items-end">
          <div className="flex flex-col gap-1.5 lg:gap-2">
            <label className="label-tech text-[8px] lg:text-[10px]">Suspender</label>
            <input
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-2.5 lg:py-3 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            />
          </div>
          <div className="flex flex-col gap-1.5 lg:gap-2">
            <label className="label-tech text-[8px] lg:text-[10px]">Retorno</label>
            <input
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-2.5 lg:py-3 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-2.5 lg:py-3 bg-accent text-bg-main rounded-xl text-xs lg:text-sm font-black hover:brightness-110 transition-all shadow-lg brass-glow flex items-center justify-center gap-2 h-[42px] lg:h-[46px]"
          >
            <Plus className="w-4 h-4" />
            Salvar
          </button>
        </form>
        
        <div className="mt-6 lg:mt-8 p-4 lg:p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-4 lg:gap-5">
          <div className="p-2 lg:p-3 bg-accent/10 rounded-xl border border-accent/20 w-fit">
            <Info className="w-4 h-4 lg:w-5 lg:h-5 text-accent shrink-0" />
          </div>
          <div className="text-[10px] lg:text-xs text-text-main leading-relaxed">
            <p className="font-mono font-bold mb-1 lg:mb-2 text-accent uppercase tracking-widest lg:tracking-[0.2em]">Protocolo NAM A140</p>
            <ul className="space-y-1 lg:space-y-2 text-text-muted font-bold font-mono">
              <li className="flex items-start gap-3">
                <div className="w-1 lg:w-1.5 h-1 lg:h-1.5 bg-accent rounded-full mt-1 shrink-0" />
                SUSPENDER ANTES DAS 11:45: SERVIÇO ATÉ RETORNO.
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1 lg:w-1.5 h-1 lg:h-1.5 bg-accent rounded-full mt-1 shrink-0" />
                SUSPENDER APÓS 11:45: PAUSA APENAS DIAS SEGUINTES.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:gap-4">
        {shipPeriods.map(p => (
          <div key={p.id} className="glass-panel p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-between group relative overflow-hidden">
            <div className="flex items-center gap-4 lg:gap-8 relative z-10 min-w-0">
              <div className="p-3 lg:p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-accent/10 transition-colors shrink-0">
                <Ship className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1 lg:gap-4 text-sm lg:text-xl font-display font-black text-text-main tracking-tight">
                  <span className="truncate">{format(parseISO(p.start), 'dd/MM HH:mm')}</span>
                  <span className="text-white/10">→</span>
                  <span className="truncate">{format(parseISO(p.end), 'dd/MM HH:mm')}</span>
                </div>
                <p className="text-[8px] lg:text-[10px] text-text-muted uppercase tracking-widest font-mono font-bold mt-0.5 lg:mt-1">Missão Operacional</p>
              </div>
            </div>
            <button
              onClick={() => onRemove(p.id)}
              className="p-2 lg:p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all border border-red-500/20 sm:opacity-0 sm:group-hover:opacity-100 relative z-10 shrink-0"
            >
              <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            <div className="absolute -right-4 -bottom-4 opacity-[0.02] pointer-events-none">
              <Ship className="w-32 h-32" />
            </div>
          </div>
        ))}
        {shipPeriods.length === 0 && (
          <div className="py-16 text-center text-text-muted font-mono text-sm font-bold uppercase tracking-widest glass-panel rounded-[2rem] border border-dashed border-white/10">
            Nenhuma missão operacional agendada.
          </div>
        )}
      </div>
    </div>
  );
};
