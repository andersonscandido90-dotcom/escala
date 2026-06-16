import React, { useState } from 'react';
import { Military } from '../types';
import { UserPlus, Trash2, Edit2, LayoutGrid, Lock } from 'lucide-react';

interface PersonnelManagerProps {
  militares: Military[];
  isReadOnly?: boolean;
  onAdd: (name: string, posto: string, especialidade: string, quarto: number, antiguidade: number) => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, name: string, posto: string, especialidade: string, quarto: number, antiguidade: number) => void;
  onUpdateMultiple: (updatedMilitares: Military[]) => void;
}

export const PersonnelManager: React.FC<PersonnelManagerProps> = ({ 
  militares, 
  isReadOnly = false,
  onAdd, 
  onRemove, 
  onUpdate,
  onUpdateMultiple
}) => {
  const [newName, setNewName] = useState('');
  const [newPosto, setNewPosto] = useState('');
  const [newEspecialidade, setNewEspecialidade] = useState('');
  const [newQuarto, setNewQuarto] = useState(1);
  const [newAntiguidade, setNewAntiguidade] = useState(militares.length + 1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosto, setEditPosto] = useState('');
  const [editEspecialidade, setEditEspecialidade] = useState('');
  const [editQuarto, setEditQuarto] = useState(1);
  const [editAntiguidade, setEditAntiguidade] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (newName.trim()) {
      onAdd(newName.trim(), newPosto.trim(), newEspecialidade.trim(), newQuarto, newAntiguidade);
      setNewName('');
      setNewPosto('');
      setNewEspecialidade('');
      setNewQuarto(1);
      setNewAntiguidade(militares.length + 2);
    }
  };

  const handleUpdate = (id: number) => {
    if (isReadOnly) return;
    if (editName.trim()) {
      onUpdate(id, editName.trim(), editPosto.trim(), editEspecialidade.trim(), editQuarto, editAntiguidade);
    }
    setEditingId(null);
  };

  const handleAutoDistribute = () => {
    if (isReadOnly || militares.length === 0) return;
    
    // Sort by seniority (1 is most senior)
    const sorted = [...militares].sort((a, b) => a.antiguidade - b.antiguidade);
    const total = sorted.length;
    const base = Math.floor(total / 4);
    const remainder = total % 4;

    // Distribution target sizes for each quarto
    // If we have 18: base=4, rem=2 -> [5, 5, 4, 4]
    const counts = [base, base, base, base];
    for (let i = 0; i < remainder; i++) {
      counts[i]++;
    }

    const updatedList: Military[] = [];
    let currentIndex = 0;

    counts.forEach((count, quartoIdx) => {
      const quartoNum = quartoIdx + 1;
      for (let i = 0; i < count; i++) {
        const m = sorted[currentIndex];
        if (m) {
          updatedList.push({
            ...m,
            quarto: quartoNum
          });
        }
        currentIndex++;
      }
    });

    onUpdateMultiple(updatedList);
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="glass-panel p-4 lg:p-8 rounded-2xl lg:rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="label-tech mb-1 text-[8px] lg:text-[10px]">Cadastro de Militares</div>
        <h3 className="text-lg lg:text-xl font-display font-black text-text-main tracking-tight mb-4 lg:mb-6 flex justify-between items-center">
          <span>Novo Militar</span>
          {isReadOnly && <span className="text-xs text-red-400 font-mono font-bold uppercase tracking-widest bg-red-400/10 px-2 py-1 rounded">Acesso Bloqueado</span>}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 lg:gap-4 items-end">
          <fieldset disabled={isReadOnly} className="w-full flex flex-wrap gap-3 lg:gap-4 items-end">
            <div className="w-full sm:w-28 flex flex-col gap-1 lg:gap-2">
              <label className="label-tech text-[8px] lg:text-[10px]">Graduação</label>
              <input
                type="text"
                value={newPosto}
                onChange={(e) => setNewPosto(e.target.value.toUpperCase())}
                placeholder="Ex: CB"
                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 lg:px-5 py-2.5 lg:py-3 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main disabled:opacity-50"
              />
            </div>
            <div className="w-full sm:w-28 flex flex-col gap-1 lg:gap-2">
              <label className="label-tech text-[8px] lg:text-[10px]">Espec.</label>
              <input
                type="text"
                value={newEspecialidade}
                onChange={(e) => setNewEspecialidade(e.target.value.toUpperCase())}
                placeholder="Ex: MO"
                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 lg:px-5 py-2.5 lg:py-3 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main disabled:opacity-50"
              />
            </div>
            <div className="flex-1 min-w-[180px] flex flex-col gap-1 lg:gap-2">
              <label className="label-tech text-[8px] lg:text-[10px]">Nome de Guerra</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do Militar"
                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 lg:px-5 py-2.5 lg:py-3 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main disabled:opacity-50"
              />
            </div>
            <div className="w-[48%] sm:w-32 flex flex-col gap-1 lg:gap-2">
              <label className="label-tech text-[8px] lg:text-[10px]">Quarto</label>
              <select
                value={newQuarto}
                onChange={(e) => setNewQuarto(Number(e.target.value))}
                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 lg:px-5 py-2.5 lg:py-3 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main disabled:opacity-50"
              >
                <option value={1}>1º Quarto</option>
                <option value={2}>2º Quarto</option>
                <option value={3}>3º Quarto</option>
                <option value={4}>4º Quarto</option>
              </select>
            </div>
            <div className="w-[48%] sm:w-24 flex flex-col gap-1 lg:gap-2">
              <label className="label-tech text-[8px] lg:text-[10px]">Antig.</label>
              <input
                type="number"
                value={newAntiguidade}
                onChange={(e) => setNewAntiguidade(Number(e.target.value))}
                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 lg:px-5 py-2.5 lg:py-3 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isReadOnly}
              className="w-full sm:w-auto px-6 py-2.5 lg:py-3 bg-accent text-bg-main disabled:bg-white/5 disabled:text-text-muted disabled:border disabled:border-white/5 disabled:shadow-none rounded-xl text-xs lg:text-sm font-black hover:brightness-110 transition-all shadow-lg brass-glow flex items-center justify-center gap-2 h-[42px] lg:h-[46px] disabled:pointer-events-none"
            >
              <UserPlus className="w-4 h-4" />
              {isReadOnly ? "Bloqueado" : "Cadastrar"}
            </button>
          </fieldset>
        </form>
      </div>

      <div className="glass-panel rounded-2xl lg:rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="p-4 lg:p-8 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="label-tech mb-1 text-[8px] lg:text-[10px]">Efetivo</div>
            <h3 className="text-lg lg:text-xl font-display font-black text-text-main tracking-tight">Militares Cadastrados</h3>
          </div>
          <button
            onClick={handleAutoDistribute}
            disabled={isReadOnly}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-accent hover:text-bg-main text-accent rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group disabled:opacity-30 disabled:pointer-events-none"
            title="Distribuir militares nos quartos automaticamente por antiguidade"
          >
            <LayoutGrid className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            Distribuir Quartos
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs lg:text-sm font-mono">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-text-muted">
                <th className="p-4 lg:p-6 text-left label-tech">#</th>
                <th className="p-4 lg:p-6 text-left label-tech w-20 lg:w-28 text-[7px] lg:text-[9px]">P/G</th>
                <th className="p-4 lg:p-6 text-left label-tech w-20 lg:w-28 text-[7px] lg:text-[9px]">Espec.</th>
                <th className="p-4 lg:p-6 text-left label-tech text-[7px] lg:text-[9px]">Militar</th>
                <th className="p-4 lg:p-6 text-left label-tech text-[7px] lg:text-[9px]">Quarto</th>
                <th className="p-4 lg:p-6 text-center label-tech text-[7px] lg:text-[9px]">Anig.</th>
                <th className="p-4 lg:p-6 text-right label-tech text-[7px] lg:text-[9px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {[...militares].sort((a, b) => a.antiguidade - b.antiguidade).map((m, idx) => (
                <tr key={m.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <td className="p-4 lg:p-6 text-text-muted font-bold text-[10px] lg:text-xs">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="p-4 lg:p-6 font-bold text-accent">
                    {editingId === m.id ? (
                      <input
                        type="text"
                        value={editPosto}
                        onChange={(e) => setEditPosto(e.target.value.toUpperCase())}
                        className="bg-bg-main border border-accent/30 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-main w-full"
                      />
                    ) : (
                      m.posto || '—'
                    )}
                  </td>
                  <td className="p-4 lg:p-6 font-bold text-accent">
                    {editingId === m.id ? (
                      <input
                        type="text"
                        value={editEspecialidade}
                        onChange={(e) => setEditEspecialidade(e.target.value.toUpperCase())}
                        className="bg-bg-main border border-accent/30 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-main w-full"
                      />
                    ) : (
                      m.especialidade || '—'
                    )}
                  </td>
                  <td className="p-4 lg:p-6 font-bold">
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
                        className="bg-bg-main border border-accent/30 rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-main w-full"
                      />
                    ) : (
                      <span className="font-display font-bold text-text-main tracking-tight truncate max-w-[120px] block">{m.name}</span>
                    )}
                  </td>
                  <td className="p-4 lg:p-6">
                    {editingId === m.id ? (
                      <select
                        value={editQuarto}
                        onChange={(e) => setEditQuarto(Number(e.target.value))}
                        className="bg-bg-main border border-accent/30 rounded-lg px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-main"
                      >
                        <option value={1}>1º</option>
                        <option value={2}>2º</option>
                        <option value={3}>3º</option>
                        <option value={4}>4º</option>
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 bg-white/5 rounded-lg border border-white/5 text-accent font-bold text-[10px] lg:text-xs">
                        {m.quarto || 1}º Q
                      </span>
                    )}
                  </td>
                  <td className="p-4 lg:p-6 text-center">
                    {editingId === m.id ? (
                      <input
                        type="number"
                        value={editAntiguidade}
                        onChange={(e) => setEditAntiguidade(Number(e.target.value))}
                        className="bg-bg-main border border-accent/30 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-main w-16"
                      />
                    ) : (
                      <span className="text-text-muted font-bold">{m.antiguidade}</span>
                    )}
                  </td>
                  <td className="p-4 lg:p-6 text-right">
                    <div className="flex justify-end gap-1.5 lg:gap-2">
                      {isReadOnly ? (
                        <div className="text-text-muted/40 p-2 border border-white/5 bg-white/[0.01] rounded-lg" title="Operações bloqueadas para consulta">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : editingId === m.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUpdate(m.id)}
                            className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-white/5 border border-white/10 text-text-muted rounded-lg text-[9px] font-black"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex sm:opacity-0 sm:group-hover:opacity-100 transition-opacity gap-1 lg:gap-2">
                          <button
                            onClick={() => {
                              setEditingId(m.id);
                              setEditName(m.name);
                              setEditPosto(m.posto || '');
                              setEditEspecialidade(m.especialidade || '');
                              setEditQuarto(m.quarto || 1);
                              setEditAntiguidade(m.antiguidade);
                            }}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-text-muted transition-all border border-white/5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRemove(m.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-all border border-red-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
