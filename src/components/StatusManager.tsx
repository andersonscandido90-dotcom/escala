import React, { useState } from 'react';
import { Military, StatusPeriod, STATUS_LABELS, StatusType } from '../types';
import { ShieldAlert, Calendar, Trash2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

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
    <div className="flex flex-col gap-8">
      <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="label-tech mb-1">Módulo de Restrições</div>
        <h3 className="text-xl font-display font-black text-text-main tracking-tight mb-8 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-400" />
          Registrar Novo Impedimento
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="label-tech">Militar</label>
            <select
              value={formData.militaryId}
              onChange={(e) => setFormData({ ...formData, militaryId: Number(e.target.value) })}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            >
              {militares.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-tech">Tipo de Status</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as StatusType })}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-tech">Data Início</label>
            <input
              type="date"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-tech">Data Fim</label>
            <input
              type="date"
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
            Registrar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statusPeriods.map(p => {
          const mil = militares.find(m => m.id === p.militaryId);
          return (
            <div key={p.id} className="glass-panel p-6 rounded-[2rem] border border-white/5 shadow-2xl group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent brass-glow" />
                  <span className="font-display font-bold text-text-main tracking-tight text-lg">{mil?.name}</span>
                </div>
                <button
                  onClick={() => onRemove(p.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all border border-red-500/20 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs relative z-10">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  p.type === 'FERIAS' ? "bg-yellow-400/10 text-yellow-500 border-yellow-500/20" :
                  p.type === 'CURSO' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  p.type === 'DESTACADO' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  p.type === 'PUNICAO' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                  "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  {STATUS_LABELS[p.type] || p.type}
                </span>
                <div className="flex items-center gap-2 text-text-muted font-mono font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(parseISO(p.start), 'dd/MM')} — {format(parseISO(p.end), 'dd/MM')}
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
                <ShieldAlert className="w-24 h-24" />
              </div>
            </div>
          );
        })}
        {statusPeriods.length === 0 && (
          <div className="col-span-full py-16 text-center text-text-muted font-mono text-sm font-bold uppercase tracking-widest glass-panel rounded-[2rem] border border-dashed border-white/10">
            Nenhum impedimento registrado no sistema.
          </div>
        )}
      </div>
    </div>
  );
};
