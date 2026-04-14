import React, { useState } from 'react';
import { ShipPeriod } from '../types';
import { Ship, Calendar, Trash2, Plus, Info } from 'lucide-react';
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
    <div className="flex flex-col gap-6">
      <div className="bg-white p-8 rounded-2xl border border-border-sleek shadow-sleek">
        <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
          <Ship className="w-5 h-5 text-primary" />
          Registrar Período no Mar
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Suspensão</label>
            <input
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              className="w-full bg-bg-main border border-border-sleek rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Retorno</label>
            <input
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              className="w-full bg-bg-main border border-border-sleek rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-sleek flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar
          </button>
        </form>
        
        <div className="mt-8 p-6 bg-accent rounded-2xl border border-primary/10 flex gap-4">
          <Info className="w-5 h-5 text-primary shrink-0" />
          <div className="text-xs text-text-main leading-relaxed">
            <p className="font-bold mb-2 text-primary uppercase tracking-widest">Regra de Escala no Mar</p>
            <ul className="space-y-1.5 text-text-muted font-medium">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full" />
                Suspensão antes das 11:45: Serviço estendido até o retorno.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full" />
                Suspensão após 11:45: Dia atual completo, dias seguintes em pausa.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {shipPeriods.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-2xl border border-border-sleek shadow-sleek flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-accent rounded-xl">
                <Ship className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 text-base font-extrabold text-text-main">
                  {format(parseISO(p.start), 'dd/MM HH:mm')}
                  <span className="text-border-sleek">→</span>
                  {format(parseISO(p.end), 'dd/MM HH:mm')}
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">Missão Operacional</p>
              </div>
            </div>
            <button
              onClick={() => onRemove(p.id)}
              className="p-2 text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {shipPeriods.length === 0 && (
          <div className="py-12 text-center text-text-muted italic bg-white rounded-2xl border border-dashed border-border-sleek">
            Nenhum período no mar registrado.
          </div>
        )}
      </div>
    </div>
  );
};
