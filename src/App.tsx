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
  STATUS_LABELS
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
        setNextIds(data.nextIds || { military: 1, status: 1, ship: 1 });
      } catch (e) {
        console.error('Error loading data', e);
      }
    } else {
      // Default data
      const initialMilitares = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `Militar ${String(15 - i).padStart(2, '0')}`
      }));
      setMilitares(initialMilitares);
      setNextIds({ military: 16, status: 1, ship: 1 });
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
      nextIds
    }));
  }, [militares, statusPeriods, shipPeriods, manualSwaps, acompDuration, nextIds]);

  // Generate Roster
  const roster = useMemo(() => {
    return generateRoster(
      config.startDate,
      config.days,
      militares,
      statusPeriods,
      shipPeriods,
      manualSwaps,
      acompDuration
    );
  }, [config, militares, statusPeriods, shipPeriods, manualSwaps, acompDuration]);

  // Handlers
  const handleAddMilitary = (name: string) => {
    setMilitares([{ id: nextIds.military, name }, ...militares]);
    setNextIds({ ...nextIds, military: nextIds.military + 1 });
  };

  const handleRemoveMilitary = (id: number) => {
    setMilitares(militares.filter(m => m.id !== id));
    setStatusPeriods(statusPeriods.filter(s => s.militaryId !== id));
    setManualSwaps([]); // Reset swaps to avoid inconsistency
  };

  const handleUpdateMilitary = (id: number, name: string) => {
    setMilitares(militares.map(m => m.id === id ? { ...m, name } : m));
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
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-border-sleek p-8 z-50 hidden lg:flex flex-col">
        <div className="text-primary font-extrabold text-xl tracking-tighter mb-12">
          ESCALA PRO
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard className="w-4 h-4" />} 
              label="Dashboard" 
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
              label="Militares" 
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
              label="Navio no Mar" 
            />
          </ul>
        </nav>

        <div className="mt-auto pt-8 border-t border-border-sleek">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-1">Status</div>
          <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Sistema Online
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[240px] p-10 flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-main">
              {activeTab === 'dashboard' ? 'Visão Geral do Sistema' : 
               activeTab === 'roster' ? 'Escala de Serviço' : 
               activeTab === 'personnel' ? 'Gestão de Pessoal' : 
               activeTab === 'status' ? 'Status e Impedimentos' : 'Missões no Mar'}
            </h1>
            <div className="text-text-muted text-sm mt-1">
              {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={exportExcel}
              className="px-4 py-2 bg-white border border-border-sleek rounded-lg text-xs font-bold text-text-main hover:bg-bg-main transition-all shadow-sleek"
            >
              Exportar Excel
            </button>
            <button 
              onClick={exportWeeklyPDF}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-sleek"
            >
              Gerar PDF Semanal
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
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-2xl border border-border-sleek shadow-sleek flex flex-wrap items-end gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Data de Início</label>
                  <input 
                    type="date" 
                    value={config.startDate}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="bg-bg-main border border-border-sleek rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Dias de Previsão</label>
                  <input 
                    type="number" 
                    min="7" 
                    max="90"
                    value={config.days}
                    onChange={(e) => setConfig({ ...config, days: parseInt(e.target.value) })}
                    className="bg-bg-main border border-border-sleek rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-24"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Duração Acomp. (Dias)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={acompDuration}
                    onChange={(e) => setAcompDuration(parseInt(e.target.value))}
                    className="bg-bg-main border border-border-sleek rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-24"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setManualSwaps([])}
                    className="px-4 py-2 bg-accent text-primary rounded-lg text-xs font-bold hover:brightness-95 transition-all"
                  >
                    Resetar Trocas
                  </button>
                  <button 
                    onClick={() => {
                      setStatusPeriods([]);
                      setShipPeriods([]);
                      setManualSwaps([]);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
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
            <p className="text-sm text-text-muted mb-2">
              Selecione o que deseja fazer com o serviço de <span className="font-bold text-text-main">{militares.find(m => m.id === modal.rowMilitaryId)?.name}</span> no dia <span className="font-bold text-text-main">{format(parseISO(modal.date), 'dd/MM/yyyy')}</span>.
            </p>
            <button 
              onClick={() => setModal({ ...modal, type: 'SELECT_NEW', oldId: modal.rowMilitaryId, swapType: 'substituir' })}
              className="w-full p-4 bg-bg-main border border-border-sleek rounded-2xl flex items-center gap-4 hover:border-primary transition-all group"
            >
              <div className="p-3 bg-white rounded-xl shadow-sleek group-hover:text-primary">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-text-main">Substituir</div>
                <div className="text-xs text-text-muted">Apenas troca o militar neste dia específico.</div>
              </div>
            </button>
            <button 
              onClick={() => setModal({ ...modal, type: 'SELECT_NEW', oldId: modal.rowMilitaryId, swapType: 'troca' })}
              className="w-full p-4 bg-bg-main border border-border-sleek rounded-2xl flex items-center gap-4 hover:border-primary transition-all group"
            >
              <div className="p-3 bg-white rounded-xl shadow-sleek group-hover:text-primary">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-text-main">Trocar Serviço</div>
                <div className="text-xs text-text-muted">Troca este dia pelo próximo serviço do outro militar.</div>
              </div>
            </button>
          </div>
        )}

        {modal?.type === 'SELECT_NEW' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted mb-2">Selecione o novo militar para o serviço:</p>
            <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2 pr-2 custom-scrollbar">
              {militares.filter(m => m.id !== modal.oldId).map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => addSwap(modal.date, modal.oldId!, m.id, modal.swapType!)}
                  className="w-full p-3 bg-white border border-border-sleek rounded-xl flex items-center gap-3 hover:bg-bg-main transition-all text-left"
                >
                  <span className="text-[10px] bg-accent text-primary px-2 py-1 rounded-md font-extrabold">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-bold text-text-main">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {modal?.type === 'CONFIRM_ASSIGN' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 p-4 bg-accent rounded-2xl border border-primary/10">
              <AlertCircle className="w-6 h-6 text-primary shrink-0" />
              <p className="text-sm text-text-main leading-relaxed">
                Deseja atribuir o serviço do dia <span className="font-bold">{format(parseISO(modal.date), 'dd/MM/yyyy')}</span> para <span className="font-bold">{militares.find(m => m.id === modal.newId)?.name}</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-3 bg-white border border-border-sleek rounded-xl text-sm font-bold text-text-muted hover:bg-bg-main transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => addSwap(modal.date, modal.oldId!, modal.newId!, 'substituir')}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-sleek"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}

        {modal?.type === 'ALERT' && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="p-4 bg-red-50 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <p className="text-center font-bold text-text-main">{modal.message}</p>
            <button 
              onClick={() => setModal(null)}
              className="w-full px-4 py-3 bg-bg-main border border-border-sleek rounded-xl text-sm font-bold text-text-main hover:bg-white transition-all"
            >
              Entendido
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
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
      active ? "bg-accent text-primary" : "text-text-muted hover:text-text-main hover:bg-bg-main"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "p-3 rounded-xl transition-all",
      active ? "text-blue-600 bg-blue-50" : "text-slate-400"
    )}
  >
    {icon}
  </button>
);
