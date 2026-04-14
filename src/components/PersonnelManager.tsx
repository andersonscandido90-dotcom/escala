import React, { useState } from 'react';
import { Military } from '../types';
import { UserPlus, Trash2, Edit2 } from 'lucide-react';

interface PersonnelManagerProps {
  militares: Military[];
  onAdd: (name: string) => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, name: string) => void;
}

export const PersonnelManager: React.FC<PersonnelManagerProps> = ({ 
  militares, 
  onAdd, 
  onRemove, 
  onUpdate 
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  const handleUpdate = (id: number) => {
    if (editName.trim()) {
      onUpdate(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="label-tech mb-1">Módulo de Cadastro</div>
        <h3 className="text-xl font-display font-black text-text-main tracking-tight mb-6">Adicionar Novo Militar</h3>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome Completo do Militar"
            className="flex-1 bg-bg-main border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-accent text-bg-main rounded-xl text-sm font-black hover:brightness-110 transition-all shadow-lg brass-glow flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar
          </button>
        </form>
      </div>

      <div className="glass-panel rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/5">
          <div className="label-tech mb-1">Quadro de Pessoal</div>
          <h3 className="text-xl font-display font-black text-text-main tracking-tight">Militares Cadastrados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm font-mono">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-text-muted">
                <th className="p-6 text-left label-tech">ID</th>
                <th className="p-6 text-left label-tech">Nome do Militar</th>
                <th className="p-6 text-right label-tech">Ações</th>
              </tr>
            </thead>
            <tbody>
              {militares.map((m, idx) => (
                <tr key={m.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <td className="p-6 text-text-muted font-bold">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="p-6">
                    {editingId === m.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleUpdate(m.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(m.id)}
                        autoFocus
                        className="bg-bg-main border border-accent/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none text-text-main w-full max-w-md"
                      />
                    ) : (
                      <span className="font-display font-bold text-text-main tracking-tight">{m.name}</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setEditName(m.name);
                        }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-text-muted hover:text-text-main transition-all border border-white/5"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemove(m.id)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all border border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
