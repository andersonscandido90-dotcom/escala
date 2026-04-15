import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './components/Modal';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Users, 
  ShieldAlert, 
  Ship, 
  Download, 
  RotateCcw,
  Eraser,
  ChevronRight,
  Zap,
  ArrowRightLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Military, 
  StatusPeriod, 
  ShipPeriod, 
  ManualSwap, 
  RosterEntry,
  STATUS_LABELS,
  RosterModel
} from './types';
import { generateRoster } from './lib/rosterLogic';
import { Dashboard } from './components/Dashboard';
import { RosterTable } from './components/RosterTable';
import { PersonnelManager } from './components/PersonnelManager';
import { StatusManager } from './components/StatusManager';
import { ShipManager } from './components/ShipManager';
import { cn } from './lib/utils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const STORAGE_KEY = 'escala_pro_data';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'personnel' | 'status' | 'ship'>('roster');
  
  // State
  const [militares, setMilitares] = useState<Military[]>([]);
  const [statusPeriods, setStatusPeriods] = useState<StatusPeriod[]>([]);
  const [shipPeriods, setShipPeriods] = useState<ShipPeriod[]>([]);
  const [manualSwaps, setManualSwaps] = useState<ManualSwap[]>([]);
  const [acompDuration, setAcompDuration] = useState(3);
  const [rosterModel, setRosterModel] = useState<RosterModel>('CORRIDA');
  const [config, setConfig] = useState({
    startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    days: 30
  });

  // IDs
  const [nextIds, setNextIds] = useState({ military: 1, status: 1, ship: 1 });

  // Modal State
  const [modal, setModal] = useState<{
    type: 'CHOICE' | 'SELECT_NEW' | 'CONFIRM_ASSIGN' | 'ALERT';
    date: string;
    rowMilitaryId: number;
    oldId?: number;
    newId?: number;
    swapType?: 'troca' | 'substituir';
    message?: string;
  } | null>(null);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMilitares(data.militares || []);
        setStatusPeriods(data.statusPeriods || []);
        setShipPeriods(data.shipPeriods || []);
        setManualSwaps(data.manualSwaps || []);
        setAcompDuration(data.acompDuration || 3);
        setRosterModel(data.rosterModel || 'CORRIDA');
        setNextIds(data.nextIds || { military: 1, status: 1, ship: 1 });
      } catch (e) {
        console.error('Error loading data', e);
      }
    } else {
      // Default data
      const initialMilitares = Array.from({ length: 16 }, (_, i) => ({
        id: i + 1,
        name: `Militar ${String(i + 1).padStart(2, '0')}`,
        quarto: (i % 4) + 1,
        antiguidade: i + 1 // 1 = Antigo, 16 = Moderno
      }));
      setMilitares(initialMilitares);
      setNextIds({ military: 17, status: 1, ship: 1 });
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      militares,
      statusPeriods,
      shipPeriods,
      manualSwaps,
      acompDuration,
      rosterModel,
      nextIds
    }));
  }, [militares, statusPeriods, shipPeriods, manualSwaps, acompDuration, rosterModel, nextIds]);

  // Generate Roster
  const roster = useMemo(() => {
    return generateRoster(
      config.startDate,
      config.days,
      militares,
      statusPeriods,
      shipPeriods,
      manualSwaps,
      acompDuration,
      rosterModel
    );
  }, [config, militares, statusPeriods, shipPeriods, manualSwaps, acompDuration, rosterModel]);

  // Handlers
  const handleAddMilitary = (name: string, quarto: number = 1, antiguidade: number = 1) => {
    setMilitares([...militares, { id: nextIds.military, name, quarto, antiguidade }]);
    setNextIds({ ...nextIds, military: nextIds.military + 1 });
  };

  const handleRemoveMilitary = (id: number) => {
    setMilitares(militares.filter(m => m.id !== id));
    setStatusPeriods(statusPeriods.filter(s => s.militaryId !== id));
    setManualSwaps([]); // Reset swaps to avoid inconsistency
  };

  const handleUpdateMilitary = (id: number, name: string, quarto: number, antiguidade: number) => {
    setMilitares(militares.map(m => m.id === id ? { ...m, name, quarto, antiguidade } : m));
  };

  const handleAddStatus = (period: Omit<StatusPeriod, 'id'>) => {
    setStatusPeriods([...statusPeriods, { ...period, id: nextIds.status }]);
    setNextIds({ ...nextIds, status: nextIds.status + 1 });
  };

  const handleRemoveStatus = (id: number) => {
    setStatusPeriods(statusPeriods.filter(s => s.id !== id));
  };

  const handleAddShip = (period: Omit<ShipPeriod, 'id'>) => {
    setShipPeriods([...shipPeriods, { ...period, id: nextIds.ship }]);
    setNextIds({ ...nextIds, ship: nextIds.ship + 1 });
  };

  const handleRemoveShip = (id: number) => {
    setShipPeriods(shipPeriods.filter(s => s.id !== id));
  };

  const handleCellClick = (date: string, rowMilitaryId: number) => {
    const entry = roster.find(e => e.data === date);
    const titularId = entry?.militaryId;

    if (titularId === rowMilitaryId) {
      setModal({ type: 'CHOICE', date, rowMilitaryId });
    } else {
      setModal({ 
        type: 'CONFIRM_ASSIGN', 
        date, 
        rowMilitaryId, 
        oldId: titularId || 0, 
        newId: rowMilitaryId 
      });
    }
  };

  const addSwap = (date: string, oldId: number, newId: number, type: 'troca' | 'substituir') => {
    if (oldId === newId) {
      setModal({ type: 'ALERT', date: '', rowMilitaryId: 0, message: 'O militar selecionado já é o titular.' });
      return;
    }
    setManualSwaps([...manualSwaps, {
      data: date,
      originalMilitaryId: oldId,
      newMilitaryId: newId,
      type
    }]);
    setModal(null);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(roster.map(e => ({
      Data: e.data,
      Militar: militares.find(m => m.id === e.militaryId)?.name || 'N/A',
      Acompanhante: militares.find(m => m.id === e.acompanhanteId)?.name || 'N/A',
      Status: e.status,
      'Em Mar': e.emNavio ? 'Sim' : 'Não'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Escala');
    XLSX.writeFile(wb, `escala_${config.startDate}.xlsx`);
  };

  const exportWeeklyPDF = async () => {
    const element = document.getElementById('roster-table-container');
    if (!element) return;

    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.setFontSize(18);
    pdf.setTextColor(37, 99, 235);
    pdf.text('Escala de Serviço Semanal', 15, 15);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Período: ${format(parseISO(config.startDate), 'dd/MM/yyyy')} a ${format(addDays(parseISO(config.startDate), 6), 'dd/MM/yyyy')}`, 15, 22);

    pdf.addImage(imgData, 'PNG', 10, 30, pdfWidth - 20, pdfHeight);

    // Add Impediments section
    const currentImpediments = statusPeriods.filter(p => {
      const start = parseISO(p.start);
      const end = parseISO(p.end);
      const rosterStart = parseISO(config.startDate);
      const rosterEnd = addDays(rosterStart, 7);
      return (start <= rosterEnd && end >= rosterStart);
    });

    if (currentImpediments.length > 0) {
      const startY = pdfHeight + 40;
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Observações / Impedimentos do Período', 15, startY);

      (pdf as any).autoTable({
        startY: startY + 5,
        head: [['Militar', 'Tipo', 'Início', 'Fim']],
        body: currentImpediments.map(p => [
          militares.find(m => m.id === p.militaryId)?.name || 'N/A',
          STATUS_LABELS[p.type],
          format(parseISO(p.start), 'dd/MM'),
          format(parseISO(p.end), 'dd/MM')
        ]),
        theme: 'striped',
        headStyles: { fillStyle: [37, 99, 235] },
        margin: { left: 15, right: 15 }
      });
    }

    pdf.save(`escala_semanal_${config.startDate}.pdf`);
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-accent">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-bg-card border-r border-white/5 p-8 z-50 hidden lg:flex flex-col shadow-2xl">
        <div className="flex flex-col gap-1 mb-12">
          <div className="text-accent font-black text-2xl tracking-tighter leading-none">
            NAM ATLÂNTICO
          </div>
          <div className="text-[10px] font-mono font-bold tracking-[0.3em] text-text-muted">
            A140 • SUPERVISÃO
          </div>
        </div>

        <nav className="flex-1">
          <div className="label-tech mb-4">Menu de Operações</div>
          <ul className="space-y-2">
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard className="w-4 h-4" />} 
              label="Painel de Controle" 
            />
            <NavItem 
              active={activeTab === 'roster'} 
              onClick={() => setActiveTab('roster')} 
              icon={<CalendarRange className="w-4 h-4" />} 
              label="Escala de Serviço" 
            />
            <NavItem 
              active={activeTab === 'personnel'} 
              onClick={() => setActiveTab('personnel')} 
              icon={<Users className="w-4 h-4" />} 
              label="Quadro de Militares" 
            />
            <NavItem 
              active={activeTab === 'status'} 
              onClick={() => setActiveTab('status')} 
              icon={<ShieldAlert className="w-4 h-4" />} 
              label="Impedimentos" 
            />
            <NavItem 
              active={activeTab === 'ship'} 
              onClick={() => setActiveTab('ship')} 
              icon={<Ship className="w-4 h-4" />} 
              label="Missões no Mar" 
            />
          </ul>
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5">
          <div className="label-tech mb-2">Status da Missão</div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold animate-pulse-subtle">
            <div className="w-2 h-2 bg-emerald-400 rounded-full brass-glow" />
            OPERACIONAL
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[260px] p-10 flex flex-col gap-8 technical-grid min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div>
            <div className="label-tech mb-1">Módulo de Comando</div>
            <h1 className="text-3xl font-display font-black text-text-main tracking-tight">
              {activeTab === 'dashboard' ? 'Painel de Controle' : 
               activeTab === 'roster' ? 'Escala de Serviço' : 
               activeTab === 'personnel' ? 'Quadro de Militares' : 
               activeTab === 'status' ? 'Status e Impedimentos' : 'Missões no Mar'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={exportExcel}
              className="px-5 py-2.5 bg-bg-main border border-white/10 rounded-xl text-xs font-bold text-text-main hover:bg-white/5 transition-all shadow-lg"
            >
              Exportar Dados
            </button>
            <button 
              onClick={exportWeeklyPDF}
              className="px-5 py-2.5 bg-accent text-bg-main rounded-xl text-xs font-black hover:brightness-110 transition-all shadow-lg brass-glow"
            >
              Gerar Relatório PDF
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex flex-col gap-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              militares={militares} 
              roster={roster} 
              statusPeriods={statusPeriods} 
            />
          )}

          {activeTab === 'roster' && (
            <div className="flex flex-col gap-8">
              <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-wrap items-end gap-8">
                <div className="flex flex-col gap-2">
                  <label className="label-tech">Data de Início</label>
                  <input 
                    type="date" 
                    value={config.startDate}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="bg-bg-main border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="label-tech">Dias de Previsão</label>
                  <input 
                    type="number" 
                    min="7" 
                    max="90"
                    value={config.days}
                    onChange={(e) => setConfig({ ...config, days: parseInt(e.target.value) })}
                    className="bg-bg-main border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main w-28"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="label-tech">Duração Acomp.</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={acompDuration}
                    onChange={(e) => setAcompDuration(parseInt(e.target.value))}
                    className="bg-bg-main border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main w-28"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="label-tech">Modelo de Escala</label>
                  <select 
                    value={rosterModel}
                    onChange={(e) => setRosterModel(e.target.value as RosterModel)}
                    className="bg-bg-main border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
                  >
                    <option value="CORRIDA">Escala Corrida</option>
                    <option value="QUARTOS">Escala por Quartos</option>
                    <option value="PRETA_VERMELHA">Preta e Vermelha</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setManualSwaps([])}
                    className="px-5 py-3 bg-white/5 border border-white/10 text-text-main rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
                  >
                    Resetar Trocas
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm('Deseja realmente limpar todos os dados?')) {
                        setStatusPeriods([]);
                        setShipPeriods([]);
                        setManualSwaps([]);
                      }
                    }}
                    className="px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all"
                  >
                    Limpar Tudo
                  </button>
                </div>
              </div>

              <RosterTable 
                militares={militares} 
                roster={roster} 
                statusPeriods={statusPeriods}
                onCellClick={handleCellClick}
              />
            </div>
          )}

          {activeTab === 'personnel' && (
            <PersonnelManager 
              militares={militares} 
              onAdd={handleAddMilitary} 
              onRemove={handleRemoveMilitary} 
              onUpdate={handleUpdateMilitary} 
            />
          )}

          {activeTab === 'status' && (
            <StatusManager 
              militares={militares} 
              statusPeriods={statusPeriods} 
              onAdd={handleAddStatus} 
              onRemove={handleRemoveStatus} 
            />
          )}

          {activeTab === 'ship' && (
            <ShipManager 
              shipPeriods={shipPeriods} 
              onAdd={handleAddShip} 
              onRemove={handleRemoveShip} 
            />
          )}
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-sleek p-2 flex justify-around lg:hidden z-50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-6 h-6" />} />
        <MobileNavItem active={activeTab === 'roster'} onClick={() => setActiveTab('roster')} icon={<CalendarRange className="w-6 h-6" />} />
        <MobileNavItem active={activeTab === 'personnel'} onClick={() => setActiveTab('personnel')} icon={<Users className="w-6 h-6" />} />
        <MobileNavItem active={activeTab === 'status'} onClick={() => setActiveTab('status')} icon={<ShieldAlert className="w-6 h-6" />} />
        <MobileNavItem active={activeTab === 'ship'} onClick={() => setActiveTab('ship')} icon={<Ship className="w-6 h-6" />} />
      </nav>

      {/* Modals */}
      <Modal 
        isOpen={!!modal} 
        onClose={() => setModal(null)} 
        title={
          modal?.type === 'CHOICE' ? 'Ações de Serviço' :
          modal?.type === 'SELECT_NEW' ? 'Selecionar Militar' :
          modal?.type === 'CONFIRM_ASSIGN' ? 'Confirmar Atribuição' : 'Aviso'
        }
      >
        {modal?.type === 'CHOICE' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted mb-4 font-mono font-bold uppercase tracking-wider">
              Ação requerida para: <span className="text-accent">{militares.find(m => m.id === modal.rowMilitaryId)?.name}</span>
              <br />
              Data: <span className="text-accent">{format(parseISO(modal.date), 'dd/MM/yyyy')}</span>
            </p>
            <button 
              onClick={() => setModal({ ...modal, type: 'SELECT_NEW', oldId: modal.rowMilitaryId, swapType: 'substituir' })}
              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5 hover:bg-white/10 hover:border-accent/50 transition-all group text-left"
            >
              <div className="p-3 bg-bg-main rounded-xl border border-white/5 group-hover:text-accent transition-colors shadow-lg">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-black text-text-main text-lg tracking-tight">Substituir Operador</div>
                <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Alteração pontual de serviço</div>
              </div>
            </button>
            <button 
              onClick={() => setModal({ ...modal, type: 'SELECT_NEW', oldId: modal.rowMilitaryId, swapType: 'troca' })}
              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5 hover:bg-white/10 hover:border-accent/50 transition-all group text-left"
            >
              <div className="p-3 bg-bg-main rounded-xl border border-white/5 group-hover:text-accent transition-colors shadow-lg">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-black text-text-main text-lg tracking-tight">Permutar Escala</div>
                <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Troca bilateral de datas</div>
              </div>
            </button>
          </div>
        )}

        {modal?.type === 'SELECT_NEW' && (
          <div className="flex flex-col gap-4">
            <p className="label-tech mb-2">Selecione o Substituto</p>
            <div className="max-h-[400px] overflow-y-auto flex flex-col gap-2 pr-2 custom-scrollbar">
              {militares.filter(m => m.id !== modal.oldId).map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => addSwap(modal.date, modal.oldId!, m.id, modal.swapType!)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/10 hover:border-accent/30 transition-all text-left group"
                >
                  <span className="text-[10px] bg-bg-main text-accent px-2.5 py-1 rounded-lg font-black border border-white/5 group-hover:brass-glow transition-all">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display font-bold text-text-main tracking-tight">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {modal?.type === 'CONFIRM_ASSIGN' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-5 p-6 bg-accent/10 rounded-3xl border border-accent/20">
              <div className="p-3 bg-accent rounded-2xl shadow-lg brass-glow">
                <AlertCircle className="w-6 h-6 text-bg-main shrink-0" />
              </div>
              <p className="text-sm text-text-main font-bold leading-relaxed">
                Confirmar atribuição de serviço para <span className="text-accent">{militares.find(m => m.id === modal.newId)?.name}</span> no dia <span className="text-accent">{format(parseISO(modal.date), 'dd/MM/yyyy')}</span>?
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setModal(null)}
                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-text-muted hover:bg-white/10 transition-all"
              >
                ABORTAR
              </button>
              <button 
                onClick={() => addSwap(modal.date, modal.oldId!, modal.newId!, 'substituir')}
                className="flex-1 px-6 py-4 bg-accent text-bg-main rounded-2xl text-sm font-black hover:brightness-110 transition-all shadow-lg brass-glow"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        )}

        {modal?.type === 'ALERT' && (
          <div className="flex flex-col items-center gap-8 py-6">
            <div className="p-6 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertCircle className="w-16 h-16 text-red-400" />
            </div>
            <div className="text-center">
              <div className="label-tech mb-2 text-red-400">Erro de Validação</div>
              <p className="text-xl font-display font-black text-text-main tracking-tight">{modal.message}</p>
            </div>
            <button 
              onClick={() => setModal(null)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-text-main hover:bg-white/10 transition-all"
            >
              FECHAR MÓDULO
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all text-sm font-bold tracking-tight",
      active 
        ? "bg-accent text-bg-main shadow-lg brass-glow" 
        : "text-text-muted hover:text-text-main hover:bg-white/5"
    )}
  >
    <div className={cn("p-1.5 rounded-lg transition-colors", active ? "bg-bg-main/20" : "bg-transparent")}>
      {icon}
    </div>
    <span>{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "p-4 rounded-2xl transition-all",
      active ? "text-accent bg-accent/10 shadow-inner" : "text-text-muted"
    )}
  >
    {icon}
  </button>
);
