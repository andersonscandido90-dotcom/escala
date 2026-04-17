import React, { useState } from 'react';
import { Military } from '../types';
import { UserPlus, Trash2, Edit2 } from 'lucide-react';

interface PersonnelManagerProps {
  militares: Military[];
  onAdd: (name: string, quarto: number, antiguidade: number) => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, name: string, quarto: number, antiguidade: number) => void;
}

export const PersonnelManager: React.FC<PersonnelManagerProps> = ({ 
  militares, 
  onAdd, 
  onRemove, 
  onUpdate 
}) => {
  const [newName, setNewName] = useState('');
  const [newQuarto, setNewQuarto] = useState(1);
  const [newAntiguidade, setNewAntiguidade] = useState(militares.length + 1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuarto, setEditQuarto] = useState(1);
  const [editAntiguidade, setEditAntiguidade] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd(newName.trim(), newQuarto, newAntiguidade);
      setNewName('');
      setNewQuarto(1);
      setNewAntiguidade(militares.length + 2);
    }
  };

  const handleUpdate = (id: number) => {
    if (editName.trim()) {
      onUpdate(id, editName.trim(), editQuarto, editAntiguidade);
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="label-tech mb-1">Módulo de Cadastro</div>
        <h3 className="text-xl font-display font-black text-text-main tracking-tight mb-6">Adicionar Novo Militar</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] flex flex-col gap-2">
            <label className="label-tech">Nome do Militar</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome Completo do Militar"
              className="w-full bg-bg-main border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            />
          </div>
          <div className="w-32 flex flex-col gap-2">
            <label className="label-tech">Quarto</label>
            <select
              value={newQuarto}
              onChange={(e) => setNewQuarto(Number(e.target.value))}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            >
              <option value={1}>1º Quarto</option>
              <option value={2}>2º Quarto</option>
              <option value={3}>3º Quarto</option>
              <option value={4}>4º Quarto</option>
            </select>
          </div>
          <div className="w-32 flex flex-col gap-2">
            <label className="label-tech">Antiguidade</label>
            <input
              type="number"
              value={newAntiguidade}
              onChange={(e) => setNewAntiguidade(Number(e.target.value))}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-accent text-bg-main rounded-xl text-sm font-black hover:brightness-110 transition-all shadow-lg brass-glow flex items-center gap-2 h-[46px]"
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
                <th className="p-6 text-left label-tech">Quarto</th>
                <th className="p-6 text-left label-tech">Antig.</th>
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(m.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="bg-bg-main border border-accent/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent text-text-main w-full"
                      />
                    ) : (
                      <span className="font-display font-bold text-text-main tracking-tight">{m.name}</span>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === m.id ? (
                      <select
                        value={editQuarto}
                        onChange={(e) => setEditQuarto(Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(m.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="bg-bg-main border border-accent/30 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent text-text-main"
                      >
                        <option value={1}>1º</option>
                        <option value={2}>2º</option>
                        <option value={3}>3º</option>
                        <option value={4}>4º</option>
                      </select>
                    ) : (
                      <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-accent font-bold">
                        {m.quarto || 1}º Quarto
                      </span>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === m.id ? (
                      <input
                        type="number"
                        value={editAntiguidade}
                        onChange={(e) => setEditAntiguidade(Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(m.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="bg-bg-main border border-accent/30 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent text-text-main w-20"
                      />
                    ) : (
                      <span className="text-text-muted font-bold">
                        {m.antiguidade}
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === m.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(m.id)}
                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black hover:brightness-110 transition-all shadow-sm"
                          >
                            SALVAR
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 text-text-muted rounded-lg text-[10px] font-black hover:bg-white/10 transition-all"
                          >
                            CANCELAR
                          </button>
                        </>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(m.id);
                              setEditName(m.name);
                              setEditQuarto(m.quarto || 1);
                              setEditAntiguidade(m.antiguidade);
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
                      )}
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
