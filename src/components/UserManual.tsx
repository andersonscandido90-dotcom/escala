import React from 'react';
import { 
  Book, 
  Users, 
  CalendarRange, 
  ShieldAlert, 
  Ship, 
  Download, 
  LayoutDashboard,
  CheckCircle2,
  Info
} from 'lucide-react';

export const UserManual: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass-panel p-8 lg:p-12 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Book className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="label-tech mb-2">Documentação Oficial</div>
          <h2 className="text-3xl lg:text-4xl font-display font-black text-text-main tracking-tight mb-4">
            Manual do Operador
          </h2>
          <p className="text-text-muted font-mono text-sm max-w-2xl leading-relaxed">
            Este guia fornece instruções detalhadas sobre como gerenciar o efetivo, configurar impedimentos e gerar escalas de serviço otimizadas para o NAM Atlântico.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gestão de Efetivo */}
        <section className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4 text-accent">
            <Users className="w-6 h-6" />
            <h3 className="font-display font-bold text-lg text-text-main">1. Gestão de Efetivo</h3>
          </div>
          <ul className="space-y-4 text-sm font-mono text-text-muted">
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span><strong>Cadastro:</strong> Insira Nome, Posto/Grad, Especialidade e a Antiguidade (número menor = mais antigo).</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span><strong>Antiguidade:</strong> Essencial para a distribuição automática. O sistema ordena a lista sempre por este valor.</span>
            </li>
            <li className="flex gap-3 border-t border-white/5 pt-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Info className="w-4 h-4 text-accent" />
              </div>
              <span className="text-[11px] italic">Utilize o botão "Distribuir Quartos" para dividir o efetivo automaticamente em 4 quartos, priorizando os mais antigos para preencher os primeiros quartos.</span>
            </li>
          </ul>
        </section>

        {/* Impedimentos */}
        <section className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4 text-red-400">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="font-display font-bold text-lg text-text-main">2. Impedimentos e Status</h3>
          </div>
          <ul className="space-y-4 text-sm font-mono text-text-muted">
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Lógica de Ausência:</strong> Status como Férias, Curso, Folga ou Dispensa Médica retiram o militar automaticamente da escala no período selecionado.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Trocas:</strong> Utilize o status "Troca" para registrar permutas temporárias sem alterar o cadastro fixo do militar.</span>
            </li>
          </ul>
        </section>

        {/* Geração de Escala */}
        <section className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4 text-blue-400">
            <CalendarRange className="w-6 h-6" />
            <h3 className="font-display font-bold text-lg text-text-main">3. Geração da Escala</h3>
          </div>
          <ul className="space-y-4 text-sm font-mono text-text-muted">
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span><strong>Data de Início:</strong> Defina o dia em que o ciclo da escala começa.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span><strong>Visualização:</strong> A tabela mostra a distribuição por turno. Espaços vazios indicam que o militar está de folga ou em restrição de descanso.</span>
            </li>
          </ul>
        </section>

        {/* Backup e Exportação */}
        <section className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4 text-emerald-400">
            <Download className="w-6 h-6" />
            <h3 className="font-display font-bold text-lg text-text-main">4. Dados e Exportação</h3>
          </div>
          <ul className="space-y-4 text-sm font-mono text-text-muted">
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Backup JSON:</strong> Exporte periodicamente a base de dados (militares e status) para evitar perda de dados.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Importar:</strong> Você pode restaurar sua lista de militares em outro computador carregando o arquivo .json salvo.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>PDF:</strong> O PDF gerado já sai com o timbre oficial e formatação de Detalhe de Serviço.</span>
            </li>
          </ul>
        </section>
      </div>

      {/* Dicas de Atalho */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-accent/5">
        <div className="flex items-center gap-2 text-accent font-bold mb-4 uppercase text-xs tracking-widest">
          <LayoutDashboard className="w-4 h-4" />
          Navegação Rápida
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono text-text-muted">
          <div className="flex flex-col gap-1">
            <span className="text-text-main font-bold">Dashboard:</span>
            Visão Geral e Backup
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-text-main font-bold">Escala:</span>
            Controle de Turnos
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-text-main font-bold">Efetivo:</span>
            Cadastro e Quartos
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-text-main font-bold">Imped.:</span>
            Férias e Cursos
          </div>
        </div>
      </div>
    </div>
  );
};
