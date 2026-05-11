import React from 'react';
import { RosterModel } from '../types';
import { BookText, ShieldAlert, Clock, Users, CalendarDays } from 'lucide-react';

interface RulesNotebookProps {
  model: RosterModel;
}

export const RulesNotebook: React.FC<RulesNotebookProps> = ({ model }) => {
  const isQuartos = model.startsWith('QUARTOS');

  return (
    <div className="glass-panel p-6 lg:p-8 rounded-2xl lg:rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <BookText className="w-32 h-32" />
      </div>

      <div className="label-tech mb-1 text-[8px] lg:text-[10px]">Documentação</div>
      <h3 className="text-lg lg:text-xl font-display font-black text-text-main tracking-tight mb-6 flex items-center gap-3">
        <BookText className="w-5 h-5 text-accent" />
        Regras da Escala Ativa
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 font-mono text-sm leading-relaxed">
        
        {/* Lógica de Distribuição */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-accent font-bold mb-1 uppercase text-xs tracking-widest">
            <Users className="w-4 h-4" />
            Lógica de Escala: {model.replace('_', ' ')}
          </div>
          <ul className="space-y-2 text-text-muted text-xs">
            {isQuartos ? (
              <>
                <li className="flex gap-2">
                  <span className="text-accent">»</span>
                  Divisão em 4 quartos fixos baseados em antiguidade.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">»</span>
                  Priorização: O 1º quarto recebe os mais antigos, o 4º os mais modernos.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">»</span>
                  Distribuição Automática: Garante maior efetivo nos primeiros quartos em caso de divisão desigual.
                </li>
              </>
            ) : (
              <>
                <li className="flex gap-2">
                  <span className="text-accent">»</span>
                  Sistema de Corrida (Fila): O militar que sai de serviço vai para o fim da fila.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">»</span>
                  A ordem inicial respeita a antiguidade configurada.
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Impedimentos e Restrições */}
        <div className="space-y-3 font-mono">
           <div className="flex items-center gap-2 text-red-400 font-bold mb-1 uppercase text-xs tracking-widest">
            <ShieldAlert className="w-4 h-4" />
            Filtros de Impedimento
          </div>
          <ul className="space-y-2 text-text-muted text-xs">
            <li className="flex gap-2">
              <span className="text-red-400">×</span>
              Militares com status <span className="text-red-300">CURSO, FOLGA, FÉRIAS ou DISPENSA</span> são ignorados na geração.
            </li>
            <li className="flex gap-2 text-[10px]">
              <span className="text-yellow-400">⚠️</span>
              <span className="italic">Acompanhando</span>: O militar permanece na escala, mas em status de instrução (não conta como efetivo serviço p/ restrições).
            </li>
          </ul>
        </div>

        {/* Turnos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-1 uppercase text-xs tracking-widest">
            <Clock className="w-4 h-4" />
            Horários & Turnos
          </div>
          <div className="glass-panel p-3 rounded-xl bg-white/5 border-white/5">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="text-blue-300">08:00 - 12:00</div>
              <div className="text-blue-300">12:00 - 16:00</div>
              <div className="text-blue-300">16:00 - 20:00</div>
              <div className="text-blue-300">20:00 - 00:00</div>
              <div className="text-blue-300">00:00 - 04:00</div>
              <div className="text-blue-300">04:00 - 08:00</div>
            </div>
          </div>
        </div>

        {/* Comissões (Suspender) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1 uppercase text-xs tracking-widest">
            <CalendarDays className="w-4 h-4" />
            Comissões (Suspender)
          </div>
          <p className="text-[10px] text-text-muted leading-tight">
            Durante períodos de <span className="text-emerald-300">COMISSÃO</span>, o sistema utiliza a lógica de "Quartos de Viagem" ou mantém a distribuição fixa dependendo da configuração de skip.
          </p>
        </div>

      </div>
    </div>
  );
};
