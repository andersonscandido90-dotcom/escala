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
  AlertCircle,
  Timer
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
import { generateRoster, getStatusAtivo } from './lib/rosterLogic';
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
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const [config, setConfig] = useState({
    startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    days: 30
  });

  // IDs
  const [nextIds, setNextIds] = useState({ military: 1, status: 1, ship: 1 });

  // Modal State
  const [modal, setModal] = useState<{
    type: 'CHOICE' | 'SELECT_NEW' | 'CONFIRM_ASSIGN' | 'ALERT' | 'SELECT_TITULAR_TO_REPLACE' | 'SELECT_SHIFT_SWAP';
    date: string;
    rowMilitaryId: number;
    oldId?: number;
    newId?: number;
    swapType?: 'troca' | 'substituir';
    message?: string;
    shift?: string;
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
        setHolidayDates(data.holidayDates || []);
        setNextIds(data.nextIds || { military: 1, status: 1, ship: 1 });
        if (data.config) {
          setConfig(data.config);
        }
        if (data.activeTab) {
          setActiveTab(data.activeTab);
        }
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
      holidayDates,
      nextIds,
      config,
      activeTab
    }));
  }, [militares, statusPeriods, shipPeriods, manualSwaps, acompDuration, rosterModel, holidayDates, nextIds, config, activeTab]);

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
      rosterModel,
      holidayDates
    );
  }, [config, militares, statusPeriods, shipPeriods, manualSwaps, acompDuration, rosterModel, holidayDates]);

  // Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'roster') return;
      
      // Don't scroll if user is typing in an input or select
      const activeElement = document.activeElement;
      const isInput = activeElement instanceof HTMLInputElement || 
                      activeElement instanceof HTMLTextAreaElement || 
                      activeElement instanceof HTMLSelectElement;
      
      if (isInput) return;

      const container = document.getElementById('roster-table-scroll');
      if (!container) return;

      const scrollAmount = 300;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

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
    const dayEntries = roster.filter(e => e.data === date);
    const titularEntry = dayEntries.find(e => e.militaryId === rowMilitaryId);

    if (titularEntry) {
      setModal({ type: 'CHOICE', date, rowMilitaryId, shift: titularEntry.shift });
    } else {
      const activeEntries = dayEntries.filter(e => e.militaryId !== null);
      if (activeEntries.length > 1) {
        setModal({ type: 'SELECT_TITULAR_TO_REPLACE', date, rowMilitaryId, newId: rowMilitaryId });
      } else {
        const titularId = activeEntries[0]?.militaryId || 0;
        const shift = activeEntries[0]?.shift;
        setModal({ 
          type: 'CONFIRM_ASSIGN', 
          date, 
          rowMilitaryId, 
          oldId: titularId, 
          newId: rowMilitaryId,
          shift
        });
      }
    }
  };

  const addSwap = (date: string, oldId: number, newId: number, type: 'troca' | 'substituir', shift?: string) => {
    if (oldId === newId) {
      setModal({ type: 'ALERT', date: '', rowMilitaryId: 0, message: 'O militar selecionado já é o titular.' });
      return;
    }
    setManualSwaps([...manualSwaps, {
      data: date,
      originalMilitaryId: oldId,
      newMilitaryId: newId,
      type,
      shift
    }]);
    setModal(null);
  };

  const exportExcel = () => {
    // Create a matrix: first column is Military Name, subsequent columns are dates
    const dates = (Array.from(new Set(roster.map(e => e.data))).sort()) as string[];
    
    const data = militares.map(m => {
      const row: any = { 'Militar': m.name };
      dates.forEach(date => {
        const dayEntries = roster.filter(e => e.data === date);
        const entry = dayEntries.find(e => e.militaryId === m.id) || dayEntries[0];
        const isTitular = dayEntries.some(e => e.militaryId === m.id);
        const isAcomp = dayEntries.some(e => e.acompanhanteId === m.id);
        const status = getStatusAtivo(m.id, date, statusPeriods);
        
        let cellValue = '—';
        if (isTitular) {
          cellValue = 'SERVIÇO' + (entry.emNavio ? ' (NAVIO)' : '');
          if (entry.shift) cellValue += ` [${entry.shift}]`;
        }
        else if (isAcomp) cellValue = 'ACOMP.';
        else if (status) cellValue = STATUS_LABELS[status];
        
        const dateLabel = format(parseISO(date), 'dd/MM');
        row[dateLabel] = cellValue;
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Escala');
    XLSX.writeFile(wb, `escala_${config.startDate}.xlsx`);
  };

  const toggleHoliday = (date: string) => {
    setHolidayDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date) 
        : [...prev, date]
    );
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
              className="px-5 py-2.5 bg-accent text-bg-main rounded-xl text-xs font-black hover:brightness-110 transition-all shadow-lg brass-glow"
            >
              Exportar Escala Excel
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
                    <optgroup label="Escala Corrida">
                      <option value="CORRIDA">Corrida (1/dia)</option>
                      <option value="CORRIDA_2">Corrida (2/dia)</option>
                      <option value="CORRIDA_3">Corrida (3/dia)</option>
                    </optgroup>
                    <optgroup label="Escala por Quartos">
                      <option value="QUARTOS">Quartos (1/dia)</option>
                      <option value="QUARTOS_2">Quartos (2/dia)</option>
                      <option value="QUARTOS_3">Quartos (3/dia)</option>
                    </optgroup>
                    <optgroup label="Preta e Vermelha">
                      <option value="PRETA_VERMELHA">Preta e Vermelha (1/dia)</option>
                      <option value="PRETA_VERMELHA_2">Preta e Vermelha (2/dia)</option>
                      <option value="PRETA_VERMELHA_3">Preta e Vermelha (3/dia)</option>
                    </optgroup>
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
                        setHolidayDates([]);
                      }
                    }}
                    className="px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all"
                  >
                    Limpar Tudo
                  </button>
                </div>
              </div>

              <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl flex items-center gap-4">
                <div className="p-2 bg-accent/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-accent" />
                </div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-wider leading-relaxed">
                  <span className="text-accent">Dica:</span> Clique no cabeçalho das datas (ex: SEG 17/04) para alternar entre <span className="text-red-400">Escala Vermelha</span> (Feriados/Folgas) e Escala Preta.
                </p>
              </div>

              <RosterTable 
                militares={militares} 
                roster={roster} 
                statusPeriods={statusPeriods}
                holidayDates={holidayDates}
                onCellClick={handleCellClick}
                onHeaderClick={toggleHoliday}
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
          modal?.type === 'SELECT_TITULAR_TO_REPLACE' ? 'Turnos do Dia' :
          modal?.type === 'SELECT_SHIFT_SWAP' ? 'Trocar Horário' :
          modal?.type === 'CONFIRM_ASSIGN' ? 'Confirmar Atribuição' : 'Aviso'
        }
      >
        {modal?.type === 'CHOICE' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted mb-4 font-mono font-bold uppercase tracking-wider">
              Ação requerida para: <span className="text-accent">{militares.find(m => m.id === modal.rowMilitaryId)?.name}</span>
              <br />
              Horário: <span className="text-accent">{modal.shift || 'Regime 24h'}</span>
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
            {modal.shift && roster.filter(e => e.data === modal.date && e.militaryId !== null).length > 1 && (
              <button 
                onClick={() => setModal({ ...modal, type: 'SELECT_SHIFT_SWAP' })}
                className="w-full p-5 bg-accent/5 border border-accent/20 rounded-2xl flex items-center gap-5 hover:bg-accent/10 hover:border-accent/50 transition-all group text-left"
              >
                <div className="p-3 bg-accent/20 rounded-xl border border-accent/20 text-accent transition-colors shadow-lg">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-black text-accent text-lg tracking-tight">Trocar Horário (Turno)</div>
                  <div className="text-[10px] font-mono font-bold text-accent/80 uppercase tracking-widest">Trocar com outro militar do dia</div>
                </div>
              </button>
            )}
          </div>
        )}

        {modal?.type === 'SELECT_NEW' && (
          <div className="flex flex-col gap-4">
            <p className="label-tech mb-2">Selecione o Substituto</p>
            <div className="max-h-[400px] overflow-y-auto flex flex-col gap-2 pr-2 custom-scrollbar">
              {militares.filter(m => m.id !== modal.oldId).map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => addSwap(modal.date, modal.oldId!, m.id, modal.swapType!, modal.shift)}
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

        {modal?.type === 'SELECT_TITULAR_TO_REPLACE' && (
          <div className="flex flex-col gap-4">
            <p className="label-tech mb-2">Substituir qual turno?</p>
            <div className="flex flex-col gap-2">
              {roster.filter(e => e.data === modal.date && e.militaryId !== null).map((e) => (
                <button
                  key={e.shift}
                  onClick={() => setModal({
                    type: 'CONFIRM_ASSIGN',
                    date: modal.date,
                    rowMilitaryId: modal.rowMilitaryId,
                    oldId: e.militaryId!,
                    newId: modal.newId!,
                    shift: e.shift
                  })}
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all text-left"
                >
                  <div className="p-3 bg-bg-main rounded-xl border border-white/5 text-accent shadow-lg">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-black text-text-main text-lg tracking-tight">{e.shift || 'Serviço'}</div>
                    <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">
                      Atual: {militares.find(m => m.id === e.militaryId)?.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {modal?.type === 'SELECT_SHIFT_SWAP' && (
          <div className="flex flex-col gap-4">
            <p className="label-tech mb-2">Trocar turno com quem?</p>
            <div className="flex flex-col gap-2">
              {roster.filter(e => e.data === modal.date && e.militaryId !== null && e.militaryId !== modal.rowMilitaryId).map((e) => (
                <button
                  key={e.shift}
                  onClick={() => {
                    const newManualSwaps = [
                      ...manualSwaps,
                      { data: modal.date, originalMilitaryId: modal.rowMilitaryId, newMilitaryId: e.militaryId!, type: 'substituir', shift: modal.shift },
                      { data: modal.date, originalMilitaryId: e.militaryId!, newMilitaryId: modal.rowMilitaryId, type: 'substituir', shift: e.shift }
                    ];
                    setManualSwaps(newManualSwaps as ManualSwap[]);
                    setModal(null);
                  }}
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all text-left"
                >
                  <div className="p-3 bg-bg-main rounded-xl border border-white/5 text-accent shadow-lg">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-black text-text-main text-lg tracking-tight">{e.shift}</div>
                    <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">
                      Com: {militares.find(m => m.id === e.militaryId)?.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {modal?.type === 'CONFIRM_ASSIGN' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5 p-6 bg-accent/10 rounded-3xl border border-accent/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent rounded-2xl shadow-lg brass-glow">
                  <AlertCircle className="w-6 h-6 text-bg-main shrink-0" />
                </div>
                <div className="font-display font-black text-text-main text-xl tracking-tight">Atribuir Serviço</div>
              </div>
              <p className="text-sm text-text-main font-medium leading-relaxed">
                Deseja atribuir serviço para <span className="text-accent font-bold">{militares.find(m => m.id === modal.newId)?.name}</span>?
                <br /><br />
                <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest block mb-1">Detalhes:</span>
                • Data: <span className="font-bold">{format(parseISO(modal.date), 'dd/MM/yyyy')}</span>
                {modal.shift && <><br />• Horário: <span className="font-bold">{modal.shift}</span></>}
                {modal.oldId !== 0 && <><br />• Substituindo: <span className="font-bold">{militares.find(m => m.id === modal.oldId)?.name}</span></>}
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
                onClick={() => addSwap(modal.date, modal.oldId!, modal.newId!, 'substituir', modal.shift)}
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
