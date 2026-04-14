import React, { useState } from 'react';
import { Military, StatusPeriod, STATUS_LABELS, StatusType } from '../types';
import { ShieldAlert, Calendar, Trash2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatusManagerProps {
  militares: Military[];
  statusPeriods: StatusPeriod[];
  onAdd: (period: Omit<StatusPeriod, 'id'>) => void;
  onRemove: (id: number) => void;
}

export const StatusManager: React.FC<StatusManagerProps> = ({ 
  militares, 
  statusPeriods, 
  onAdd, 
  onRemove 
}) => {
  const [formData, setFormData] = useState({
    militaryId: militares[0]?.id || 0,
    type: 'CURSO' as StatusType,
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.militaryId) {
      onAdd(formData);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-8 rounded-2xl border border-border-sleek shadow-sleek">
        <h3 className="text-lg font-bold text-text-main mb-8 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Registrar Impedimento
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Militar</label>
            <select
              value={formData.militaryId}
              onChange={(e) => setFormData({ ...formData, militaryId: Number(e.target.value) })}
              className="w-full bg-bg-main border border-border-sleek rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {militares.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as StatusType })}
              className="w-full bg-bg-main border border-border-sleek rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Início</label>
            <input
              type="date"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              className="w-full bg-bg-main border border-border-sleek rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Fim</label>
            <input
              type="date"
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
            Adicionar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statusPeriods.map(p => {
          const mil = militares.find(m => m.id === p.militaryId);
          return (
            <div key={p.id} className="bg-white p-6 rounded-2xl border border-border-sleek shadow-sleek group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-bold text-text-main">{mil?.name}</span>
                </div>
                <button
                  onClick={() => onRemove(p.id)}
                  className="p-1.5 text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="bg-accent text-primary px-2 py-1 rounded-lg font-bold uppercase tracking-tighter">
                  {STATUS_LABELS[p.type]}
                </span>
                <div className="flex items-center gap-1 text-text-muted font-medium">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(p.start), 'dd/MM')} — {format(parseISO(p.end), 'dd/MM')}
                </div>
              </div>
            </div>
          );
        })}
        {statusPeriods.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-muted italic bg-white rounded-2xl border border-dashed border-border-sleek">
            Nenhum impedimento registrado.
          </div>
        )}
      </div>
    </div>
  );
};
