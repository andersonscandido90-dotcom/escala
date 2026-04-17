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
    <div className="flex flex-col gap-8">
      <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="label-tech mb-1">Módulo de Operações</div>
        <h3 className="text-xl font-display font-black text-text-main tracking-tight mb-8 flex items-center gap-3">
          <Ship className="w-6 h-6 text-accent" />
          Registrar Dias de Mar
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="label-tech">Suspender (Data/Hora)</label>
            <input
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-tech">Retorno (Data/Hora)</label>
            <input
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-accent text-bg-main rounded-xl text-sm font-black hover:brightness-110 transition-all shadow-lg brass-glow flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Dias de Mar
          </button>
        </form>
        
        <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-5">
          <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
            <Info className="w-5 h-5 text-accent shrink-0" />
          </div>
          <div className="text-xs text-text-main leading-relaxed">
            <p className="font-mono font-bold mb-2 text-accent uppercase tracking-[0.2em]">Protocolo de Escala (NAM A140)</p>
            <ul className="space-y-2 text-text-muted font-bold font-mono">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-accent rounded-full brass-glow" />
                SUSPENDER ANTES DAS 11:45: SERVIÇO ESTENDIDO ATÉ O RETORNO.
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-accent rounded-full brass-glow" />
                SUSPENDER APÓS 11:45: DIA ATUAL COMPLETO, DIAS SEGUINTES EM PAUSA.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {shipPeriods.map(p => (
          <div key={p.id} className="glass-panel p-6 rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-between group relative overflow-hidden">
            <div className="flex items-center gap-8 relative z-10">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-accent/10 transition-colors">
                <Ship className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-4 text-xl font-display font-black text-text-main tracking-tight">
                  {format(parseISO(p.start), 'dd/MM HH:mm')}
                  <span className="text-white/10">→</span>
                  {format(parseISO(p.end), 'dd/MM HH:mm')}
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-mono font-bold mt-1">Dia de Mar Confirmado</p>
              </div>
            </div>
            <button
              onClick={() => onRemove(p.id)}
              className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all border border-red-500/20 opacity-0 group-hover:opacity-100 relative z-10"
            >
              <Trash2 className="w-5 h-5" />
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
