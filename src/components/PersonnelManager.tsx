import React, { useState } from 'react';
import { Military } from '../types';
import { UserPlus, Trash2, User } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-8 rounded-2xl border border-border-sleek shadow-sleek">
        <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Adicionar Militar
        </h3>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: 1º Ten Silva"
            className="flex-1 bg-bg-main border border-border-sleek rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-sleek"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-border-sleek shadow-sleek overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-main border-b border-border-sleek text-text-muted uppercase text-[10px] tracking-widest font-bold">
              <th className="px-8 py-4 text-left">Ordem</th>
              <th className="px-8 py-4 text-left">Nome</th>
              <th className="px-8 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-sleek">
            {militares.map((m, idx) => (
              <tr key={m.id} className="hover:bg-bg-main transition-colors">
                <td className="px-8 py-5 font-bold text-text-muted">
                  {String(idx + 1).padStart(2, '0')}º
                </td>
                <td className="px-8 py-5">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => onUpdate(m.id, e.target.value)}
                    className="bg-transparent border-none focus:ring-0 w-full font-bold text-text-main"
                  />
                </td>
                <td className="px-8 py-5 text-right">
                  <button
                    onClick={() => onRemove(m.id)}
                    className="p-2 text-text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
