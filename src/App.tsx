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
  Timer,
  Plus,
  Trash2,
  FolderPlus,
  Pencil,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Military, 
  StatusPeriod, 
  ShipPeriod, 
  ManualSwap, 
  RosterEntry,
  STATUS_LABELS,
  RosterModel,
  RosterService
} from './types';
import { generateRoster, getStatusAtivo, STATUS_IMPEDITIVOS, isMilitaryImpeded } from './lib/rosterLogic';
import { exportDailyDetailPDF, DailyExportData } from './lib/pdfExport';
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
  
  // Multi-service State
  const [services, setServices] = useState<RosterService[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<number | null>(null);

  // Current Active Service State
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
  const [serviceName, setServiceName] = useState("Escala Geral");
  const [newServiceName, setNewServiceName] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [signatureData, setSignatureData] = useState({
    chefe: { name: 'BRUNO AFONSO PINTO', rank: 'Capitão de Fragata', title: 'Chefe do Departamento de Máquinas' },
    detalhista: { name: 'ANDRE VINICIUS FERNANDES DA SILVA', rank: 'Terceiro-Sargento (MO)', title: 'Detalhista do Departamento de Máquinas' }
  });
  const [exportMappings, setExportMappings] = useState<Record<string, number | null>>({});
  const [logos, setLogos] = useState({
    navy: '', // base64
    ship: ''  // base64
  });

  // Manage body scroll in full screen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFullScreen]);

  // Modal State
  const [modal, setModal] = useState<{
    type: 'CHOICE' | 'SELECT_NEW' | 'CONFIRM_ASSIGN' | 'ALERT' | 'SELECT_TITULAR_TO_REPLACE' | 'SELECT_SHIFT_SWAP' | 'SELECT_SPECIFIC_SHIFT' | 'MANAGE_SERVICES' | 'CONFIRM_DELETE_SERVICE' | 'CONFIRM_CLEAR_DATA' | 'DAILY_EXPORT';
    date: string;
    rowMilitaryId: number;
    oldId?: number;
    newId?: number;
    swapType?: 'troca' | 'substituir';
    message?: string;
    shift?: string;
    serviceId?: number;
  } | null>(null);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        // Migration to multi-service
        if (data.services && data.services.length > 0) {
          setServices(data.services);
          const activeId = data.activeServiceId || data.services[0]?.id;
          setActiveServiceId(activeId);
          const active = data.services.find((s: any) => s.id === activeId) || data.services[0];
          if (active) {
            loadServiceData(active);
          }
        } else {
          // Migrate old single service data
          const initialService: RosterService = {
            id: Date.now(),
            name: "Escala Geral",
            militares: data.militares || [],
            statusPeriods: data.statusPeriods || [],
            shipPeriods: data.shipPeriods || [],
            manualSwaps: data.manualSwaps || [],
            acompDuration: data.acompDuration || 3,
            rosterModel: data.rosterModel || 'CORRIDA',
            holidayDates: data.holidayDates || [],
            nextIds: data.nextIds || { military: 1, status: 1, ship: 1 },
            config: data.config || { startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), days: 30 }
          };
          setServices([initialService]);
          setActiveServiceId(initialService.id);
          loadServiceData(initialService);
        }

        if (data.activeTab) {
          setActiveTab(data.activeTab);
        }
        if (data.signatureData) {
          setSignatureData(data.signatureData);
        }
        if (data.exportMappings) {
          setExportMappings(data.exportMappings);
        }
        if (data.logos) {
          setLogos(data.logos);
        }
      } catch (e) {
        console.error('Error loading data', e);
      }
    } else {
      // Default initial data
      const initialMilitares = Array.from({ length: 16 }, (_, i) => ({
        id: i + 1,
        name: `Militar ${String(i + 1).padStart(2, '0')}`,
        quarto: (i % 4) + 1,
        antiguidade: i + 1
      }));
      const initialService: RosterService = {
        id: Date.now(),
        name: "Escala Geral",
        militares: initialMilitares,
        statusPeriods: [],
        shipPeriods: [],
        manualSwaps: [],
        acompDuration: 3,
        rosterModel: 'CORRIDA',
        holidayDates: [],
        nextIds: { military: 17, status: 1, ship: 1 },
        config: { startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), days: 30 }
      };
      setServices([initialService]);
      setActiveServiceId(initialService.id);
      loadServiceData(initialService);
    }
  }, []);

  const loadServiceData = (service: RosterService) => {
    setMilitares(service.militares);
    setStatusPeriods(service.statusPeriods || []);
    setShipPeriods(service.shipPeriods || []);
    setManualSwaps(service.manualSwaps || []);
    setAcompDuration(service.acompDuration || 3);
    setRosterModel(service.rosterModel || 'CORRIDA');
    setHolidayDates(service.holidayDates || []);
    setNextIds(service.nextIds || { military: 1, status: 1, ship: 1 });
    setConfig(service.config || { startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), days: 30 });
    setServiceName(service.name);
  };

  const createNewService = () => {
    setNewServiceName("");
    setModal({ type: 'MANAGE_SERVICES', date: '', rowMilitaryId: 0, message: 'CREATE' });
  };

  const handleServiceSave = () => {
    if (!newServiceName.trim()) {
      setModal({ type: 'ALERT', date: '', rowMilitaryId: 0, message: "O nome não pode ser vazio." });
      return;
    }

    if (modal?.message === 'CREATE') {
      const newService: RosterService = {
        id: Date.now(),
        name: newServiceName,
        militares: [],
        statusPeriods: [],
        shipPeriods: [],
        manualSwaps: [],
        acompDuration: 3,
        rosterModel: 'CORRIDA',
        holidayDates: [],
        nextIds: { military: 1, status: 1, ship: 1 },
        config: { startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), days: 30 }
      };
      setServices(prev => [...prev, newService]);
      setActiveServiceId(newService.id);
      loadServiceData(newService);
    } else if (modal?.message === 'RENAME') {
      setServiceName(newServiceName);
    }
    setModal(null);
  };

  const openDailyExport = () => {
    const newMappings = { ...exportMappings };
    let changed = false;
    
    const mappingKeys = [
      { key: 'fielAux', terms: ['fiel'] },
      { key: 'eletrlux', terms: ['eletri', 'eletr'] },
      { key: 'patrulhaCav', terms: ['patrulha', 'cav'] },
      { key: 'supervisorMaq', terms: ['sup', 'maq'] },
      { key: 'fielCav', terms: ['fiel', 'cav'] },
      { key: 'supervisorMO', terms: ['sup', 'mo'] },
      { key: 'supervisorEL', terms: ['sup', 'el'] },
      { key: 'caboDia', terms: ['cabo'] },
    ];

    mappingKeys.forEach(m => {
      if (!newMappings[m.key]) {
        // Try multiple matching strategies
        const match = services.find(s => {
          const name = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return m.terms.every(term => name.includes(term));
        }) || services.find(s => {
          const name = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return m.terms.some(term => name.includes(term));
        });

        if (match) {
          newMappings[m.key] = match.id;
          changed = true;
        }
      }
    });

    if (changed) setExportMappings(newMappings);
    setModal({ type: 'DAILY_EXPORT', date: format(new Date(), 'yyyy-MM-dd'), rowMilitaryId: 0 });
  };

  const getRosterData = (id: number | null | undefined, customDate?: string) => {
    if (!id) return null;
    const srv = services.find(s => s.id === id);
    if (!srv) return null;

    // Use current live state for active service to avoid stale PDF data before save
    const useLive = id === activeServiceId;
    const currentMilitares = useLive ? militares : srv.militares;
    const currentStatus = useLive ? statusPeriods : (srv.statusPeriods || []);
    const currentShip = useLive ? shipPeriods : (srv.shipPeriods || []);
    const currentSwaps = useLive ? manualSwaps : (srv.manualSwaps || []);
    const currentHoliday = useLive ? holidayDates : (srv.holidayDates || []);
    const currentAcomp = useLive ? acompDuration : (srv.acompDuration || 3);
    const currentModel = useLive ? rosterModel : (srv.rosterModel || 'CORRIDA');

    const sDate = parseISO(srv.config.startDate);
    const tDate = customDate ? parseISO(customDate) : (modal?.date ? parseISO(modal.date) : sDate);
    
    const diffDays = Math.abs(differenceInDays(tDate, sDate));
    const rangeDays = Math.max(srv.config.days, diffDays + 60); // Increased buffer
    
    const rosterResult = generateRoster(
      srv.config.startDate,
      rangeDays,
      currentMilitares,
      currentStatus,
      currentShip,
      currentSwaps,
      currentAcomp,
      currentModel,
      currentHoliday
    );

    const srvWithLive = useLive ? {
      ...srv,
      militares: currentMilitares,
      statusPeriods: currentStatus,
      manualSwaps: currentSwaps,
      rosterModel: currentModel
    } : srv;

    return { srv: srvWithLive, roster: rosterResult };
  };

  const handleDailyExport = () => {
    if (!modal) return;
    
    const mappedServiceIds = Object.values(exportMappings).filter(v => v !== null && v !== undefined);
    if (mappedServiceIds.length === 0) {
      setModal({ 
        type: 'ALERT', 
        date: '', 
        rowMilitaryId: 0, 
        message: 'Por favor, realize o "Mapeamento de Escalas" selecionando qual escala corresponde a cada serviço antes de gerar o PDF.' 
      });
      return;
    }

    try {
      const rostersCache: Record<number, { srv: RosterService, roster: RosterEntry[] }> = {};
      const getRosterCached = (id: number | null | undefined) => {
        if (!id) return null;
        if (rostersCache[id]) return rostersCache[id];
        const res = getRosterData(id);
        if (res) rostersCache[id] = res;
        return res;
      };

      const getShiftInfo = (srvId: number | null | undefined, date: string, shiftIndex: number = 0) => {
        const data = getRosterCached(srvId);
        if (!data) return null;
        
        // Get all entries for the day and sort them logically
        const dayEntries = data.roster.filter(e => e.data === date);
        const entry = dayEntries[shiftIndex];

        if (!entry) return null;
        return data.srv.militares.find(m => m.id === entry.militaryId) || null;
      };

    const getRetem = (srvId: number | null | undefined, date: string, shiftIndex: number = 0) => {
      const data = getRosterData(srvId);
      if (!data) return null;
      
      const duty = getShiftInfo(srvId, date, shiftIndex);
      if (!duty) {
        const nextDay = format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
        return getShiftInfo(srvId, nextDay, shiftIndex);
      }

      const isQuartos = data.srv.rosterModel.startsWith('QUARTOS');
      
      if (isQuartos && duty.quarto) {
        // Find the next available military in the same quarter
        const sameQuarter = [...data.srv.militares]
          .filter(m => m.quarto === duty.quarto)
          .sort((a, b) => b.antiguidade - a.antiguidade);
        
        const currentIdx = sameQuarter.findIndex(m => m.id === duty.id);
        if (currentIdx !== -1) {
          for (let i = 1; i < sameQuarter.length; i++) {
            const candidate = sameQuarter[(currentIdx + i) % sameQuarter.length];
            // If the person is active and not impeded, they are the standby
            if (!isMilitaryImpeded(candidate.id, date, data.srv.statusPeriods || [])) {
               return candidate;
            }
          }
        }
      }

      const nextDay = format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
      return getShiftInfo(srvId, nextDay, shiftIndex);
    };

    const getAcompForScale = (srvId: number | null | undefined, date: string) => {
      const data = getRosterData(srvId);
      if (!data) return [];
      
      const dayEntries = data.roster.filter(e => e.data === date);
      const acompIds = new Set<number>();
      dayEntries.forEach(e => {
        if (e.acompanhanteId) acompIds.add(e.acompanhanteId);
        if (e.acompanhanteIds) e.acompanhanteIds.forEach(id => acompIds.add(id));
      });

      const shadowers = data.srv.militares.filter(m => acompIds.has(m.id));

      // Sort by the start date of the ACOMPANHANDO period that includes today
      return shadowers.sort((a, b) => {
        const pA = (data.srv.statusPeriods || []).find(p => 
          p.militaryId === a.id && 
          p.type === 'ACOMPANHANDO' && 
          date >= p.start && 
          date <= p.end
        );
        const pB = (data.srv.statusPeriods || []).find(p => 
          p.militaryId === b.id && 
          p.type === 'ACOMPANHANDO' && 
          date >= p.start && 
          date <= p.end
        );
        if (pA && pB) return pA.start.localeCompare(pB.start);
        return 0;
      });
    };

    const data: DailyExportData = {
      date: modal.date,
      fielAux: [null, null, null],
      retenFielAux: [null, null, null],
      acompFielAux: [[], [], []],
      patrulhaCav: [null, null, null],
      retenPatrulhaCav: [null, null, null],
      acompPatrulhaCav: [[], [], []],
      supervisorMaq: null,
      fielCav: null,
      supervisorMO: null,
      supervisorEL: null,
      caboDia: null,
      retenMaq: null, acompMaq: [],
      retenCav: null, acompCav: [],
      retenMO: null, acompMO: [],
      retenEL: null, acompEL: [],
      boys: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]],
      navyLogo: logos.navy,
      shipLogo: logos.ship,
      chefeDept: signatureData.chefe,
      detalhista: signatureData.detalhista
    };

    // Fiel das Auxiliares (2 from scale 1, 1 from scale 2)
    const rawFiel1 = getShiftInfo(exportMappings['fielAux'], modal.date, 0);
    const rawFiel2 = getShiftInfo(exportMappings['fielAux'], modal.date, 1);
    const rawEletr = getShiftInfo(exportMappings['eletrlux'], modal.date, 0);

    const rawRetemFiel1 = getRetem(exportMappings['fielAux'], modal.date, 0);
    const rawRetemFiel2 = getRetem(exportMappings['fielAux'], modal.date, 1);
    const rawRetemEletr = getRetem(exportMappings['eletrlux'], modal.date, 0);

    // Acompanhando lists
    const acompFielList = getAcompForScale(exportMappings['fielAux'], modal.date);
    const acompEletrList = getAcompForScale(exportMappings['eletrlux'], modal.date);

    // Prepare combined arrays to rotate
    const baseTitulars = [rawFiel1, rawFiel2, rawEletr];
    const baseRetens = [rawRetemFiel1, rawRetemFiel2, rawRetemEletr];
    const baseAcomps: (Military[])[] = [[], [], []];
    
    // Initial distribution for Acompanhando
    acompFielList.forEach((m, idx) => baseAcomps[idx % 2].push(m));
    acompEletrList.forEach(m => baseAcomps[2].push(m));

    // Calculate rotation offset based on days from startDate to interleave slots
    const startObj = config.startDate ? parseISO(config.startDate) : new Date();
    const currentObj = parseISO(modal.date);
    const dayDiff = Math.abs(differenceInDays(currentObj, startObj));
    const rotationOffset = dayDiff % 3;

    // Apply rotation
    for (let i = 0; i < 3; i++) {
      const targetIdx = (i + rotationOffset) % 3;
      data.fielAux[targetIdx] = baseTitulars[i];
      data.retenFielAux[targetIdx] = baseRetens[i];
      data.acompFielAux[targetIdx] = baseAcomps[i];
    }

    // Patrulha do CAV
    const p1 = getShiftInfo(exportMappings['patrulhaCav'], modal.date, 0);
    const p2 = getShiftInfo(exportMappings['patrulhaCav'], modal.date, 1);
    const p3 = getShiftInfo(exportMappings['patrulhaCav'], modal.date, 2);
    data.patrulhaCav = [p1, p2, p3];

    data.retenPatrulhaCav = [
      getRetem(exportMappings['patrulhaCav'], modal.date, 0),
      getRetem(exportMappings['patrulhaCav'], modal.date, 1),
      getRetem(exportMappings['patrulhaCav'], modal.date, 2),
    ];

    // Patrulha do CAV Acompanhamento Rules
    const acompCavListRaw = getAcompForScale(exportMappings['patrulhaCav'], modal.date);
    
    if (acompCavListRaw.length === 1) {
      // Rule: 1 person goes to preferred 16-20h slot (index 2)
      data.acompPatrulhaCav[2].push(acompCavListRaw[0]);
    } else if (acompCavListRaw.length === 2) {
      // Rule: 2 people rotate preference based on date
      const dateVal = parseISO(modal.date).getDate();
      if (dateVal % 2 === 0) {
        data.acompPatrulhaCav[1].push(acompCavListRaw[0]);
        data.acompPatrulhaCav[2].push(acompCavListRaw[1]);
      } else {
        data.acompPatrulhaCav[1].push(acompCavListRaw[1]);
        data.acompPatrulhaCav[2].push(acompCavListRaw[0]);
      }
    } else if (acompCavListRaw.length >= 3) {
      // Rule: Unlimited shadowers distributed across slots
      acompCavListRaw.forEach((m, idx) => {
        const slot = idx % 3;
        data.acompPatrulhaCav[slot].push(m);
      });
    }

    // Daily services (Unlimited shadowers)
    const sm = getShiftInfo(exportMappings['supervisorMaq'], modal.date);
    data.supervisorMaq = sm;
    data.retenMaq = getRetem(exportMappings['supervisorMaq'], modal.date);
    data.acompMaq = getAcompForScale(exportMappings['supervisorMaq'], modal.date);

    const fc = getShiftInfo(exportMappings['fielCav'], modal.date);
    data.fielCav = fc;
    data.retenCav = getRetem(exportMappings['fielCav'], modal.date);
    data.acompCav = getAcompForScale(exportMappings['fielCav'], modal.date);

    const mo = getShiftInfo(exportMappings['supervisorMO'], modal.date);
    data.supervisorMO = mo;
    data.retenMO = getRetem(exportMappings['supervisorMO'], modal.date);
    data.acompMO = getAcompForScale(exportMappings['supervisorMO'], modal.date);

    const el = getShiftInfo(exportMappings['supervisorEL'], modal.date);
    data.supervisorEL = el;
    data.retenEL = getRetem(exportMappings['supervisorEL'], modal.date);
    data.acompEL = getAcompForScale(exportMappings['supervisorEL'], modal.date);

    data.caboDia = getShiftInfo(exportMappings['caboDia'], modal.date);

    // Boys distribution logic
    // source_08_12 = { f: data.fielAux[0], p: data.patrulhaCav[0] }
    // source_12_16 = { f: data.fielAux[1], p: data.patrulhaCav[1] }
    // source_16_20 = { f: data.fielAux[2], p: data.patrulhaCav[2] }

    const s08 = { f: data.fielAux[0], p: data.patrulhaCav[0] };
    const s12 = { f: data.fielAux[1], p: data.patrulhaCav[1] };
    const s16 = { f: data.fielAux[2], p: data.patrulhaCav[2] };

    data.boys = [
      // Row 0 (Fiel row for windows 08-10, 10-12, 12-14)
      [s12.f, s16.f, s16.f],
      // Row 1 (Patrulha row for windows 08-10, 10-12, 12-14)
      [s12.p, s16.p, s16.p],
      // Row 2 (Fiel row for windows 14-16, 16-18, 18-20)
      [s08.f, s08.f, s12.f],
      // Row 3 (Patrulha row for windows 14-16, 16-18, 18-20)
      [s08.p, s08.p, s12.p],
    ];

    const totalFound = [
      ...data.fielAux, ...data.patrulhaCav, 
      data.supervisorMaq, data.fielCav, data.supervisorMO, data.supervisorEL, data.caboDia
    ].filter(v => v !== null).length;

    if (totalFound === 0) {
      setModal({ 
        type: 'ALERT', 
        date: '', 
        rowMilitaryId: 0, 
        message: 'Nenhum militar foi encontrado para esta data nas escalas selecionadas. Verifique se o mapeamento está correto e se a data selecionada está dentro do período das escalas.' 
      });
      return;
    }

    exportDailyDetailPDF(data);
    setModal(null);
  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error);
    const errorMsg = error?.message || 'Erro desconhecido';
    setModal({ 
      type: 'ALERT', 
      date: '', 
      rowMilitaryId: 0, 
      message: `Ocorreu um erro ao gerar o PDF: ${errorMsg}. Verifique os mapeamentos e os dados das escalas.` 
    });
  }
};

  const exportFullData = () => {
    const data = {
      services,
      activeServiceId,
      activeTab,
      signatureData,
      exportMappings,
      logos
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_escala_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importFullData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.services) {
          // Sync current service before replacing
          setServices(data.services);
          if (data.activeServiceId) {
            setActiveServiceId(data.activeServiceId);
            const active = data.services.find((s: any) => s.id === data.activeServiceId);
            if (active) loadServiceData(active);
          }
          if (data.activeTab) setActiveTab(data.activeTab);
          if (data.signatureData) setSignatureData(data.signatureData);
          if (data.exportMappings) setExportMappings(data.exportMappings);
          if (data.logos) setLogos(data.logos);
          setModal({ type: 'ALERT', date: '', rowMilitaryId: 0, message: "Dados importados com sucesso!" });
        }
      } catch (err) {
        setModal({ type: 'ALERT', date: '', rowMilitaryId: 0, message: "Erro ao importar arquivo. Certifique-se de que é um JSON válido." });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleLogoUpload = (type: 'navy' | 'ship', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogos(prev => ({ ...prev, [type]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = (type: 'navy' | 'ship') => {
    setLogos(prev => ({ ...prev, [type]: '' }));
  };

  const switchService = (id: number) => {
    if (id === activeServiceId) return;
    
    // Explicit sync before switching
    const currentData = {
      name: serviceName,
      militares, statusPeriods, shipPeriods, manualSwaps, acompDuration, rosterModel, holidayDates, nextIds, config
    };
    
    setServices(prev => prev.map(s => s.id === activeServiceId ? { ...s, ...currentData } : s));

    const next = services.find(s => s.id === id);
    if (next) {
      setActiveServiceId(id);
      loadServiceData(next);
    }
  };

  const deleteService = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (services.length <= 1) {
      setModal({ type: 'ALERT', date: '', rowMilitaryId: 0, message: "Você deve ter pelo menos um tipo de serviço." });
      return;
    }
    
    setModal({ type: 'CONFIRM_DELETE_SERVICE', date: '', rowMilitaryId: 0, serviceId: id });
  };

  const handleServiceDelete = (id: number) => {
    const filtered = services.filter(s => s.id !== id);
    setServices(filtered);
    if (activeServiceId === id) {
      const next = filtered[0];
      setActiveServiceId(next.id);
      loadServiceData(next);
    }
    setModal(null);
  };

  const renameService = () => {
    setNewServiceName(serviceName);
    setModal({ type: 'MANAGE_SERVICES', date: '', rowMilitaryId: 0, message: 'RENAME' });
  };

  // Sync active states with services array
  useEffect(() => {
    if (activeServiceId !== null) {
      setServices(prev => prev.map(s => {
        // shipPeriods is global: update for ALL services
        const baseUpdate = {
          ...s,
          shipPeriods
        };

        // Other states are local to active service
        if (s.id === activeServiceId) {
          return {
            ...baseUpdate,
            name: serviceName,
            militares,
            statusPeriods,
            manualSwaps,
            acompDuration,
            rosterModel,
            holidayDates,
            nextIds,
            config
          };
        }
        return baseUpdate;
      }));
    }
  }, [militares, statusPeriods, shipPeriods, manualSwaps, acompDuration, rosterModel, holidayDates, nextIds, config, serviceName, activeServiceId]);

  // Save data to localStorage
  useEffect(() => {
    if (services.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        services,
        activeServiceId,
        activeTab,
        signatureData,
        exportMappings,
        logos
      }));
    }
  }, [services, activeServiceId, activeTab, signatureData, exportMappings]);

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

  const handleAddMilitary = (name: string, posto: string = '', especialidade: string = '', quarto: number = 1, antiguidade: number = 1) => {
    setMilitares([...militares, { id: nextIds.military, name, posto, especialidade, quarto, antiguidade }]);
    setNextIds({ ...nextIds, military: nextIds.military + 1 });
  };

  const handleRemoveMilitary = (id: number) => {
    setMilitares(militares.filter(m => m.id !== id));
    setStatusPeriods(statusPeriods.filter(s => s.militaryId !== id));
    setManualSwaps([]); // Reset swaps to avoid inconsistency
  };

  const handleUpdateMilitary = (id: number, name: string, posto: string, especialidade: string, quarto: number, antiguidade: number) => {
    setMilitares(militares.map(m => m.id === id ? { ...m, name, posto, especialidade, quarto, antiguidade } : m));
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
      if (dayEntries.length > 1) {
        setModal({ type: 'SELECT_TITULAR_TO_REPLACE', date, rowMilitaryId, newId: rowMilitaryId });
      } else {
        const titularId = dayEntries[0]?.militaryId || 0;
        const shift = dayEntries[0]?.shift;
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
    
    // Determine shiftIndex if possible
    const dayEntries = roster.filter(e => e.data === date);
    const shiftIndex = shift ? dayEntries.findIndex(e => e.shift === shift) : undefined;

    setManualSwaps([...manualSwaps, {
      data: date,
      originalMilitaryId: oldId,
      newMilitaryId: newId,
      type,
      shift,
      shiftIndex: shiftIndex !== -1 ? shiftIndex : undefined
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
        const isAcomp = dayEntries.some(e => e.militaryId !== m.id && ((e.acompanhanteIds && e.acompanhanteIds.includes(m.id)) || e.acompanhanteId === m.id));
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
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-bg-card border-r border-white/5 p-8 z-50 hidden lg:flex flex-col shadow-2xl overflow-y-auto custom-scrollbar">
        <div className="flex flex-col items-center gap-1 mb-8 text-center">
          <div className="mb-3">
            {logos.ship ? (
              <img src={logos.ship} alt="Ship" className="w-16 h-16 object-contain mx-auto" />
            ) : logos.navy ? (
              <img src={logos.navy} alt="Navy" className="w-16 h-16 object-contain mx-auto" />
            ) : null}
          </div>
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
              label="Dias de Mar" 
            />
          </ul>
        </nav>

        <div className="mt-8 px-4 flex flex-col gap-4">
          <div className="label-tech px-2 flex justify-between items-center">
            <span>Tipos de Serviço</span>
            <button onClick={createNewService} className="p-1 hover:text-accent transition-colors"><FolderPlus className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
            {services.map(s => (
              <button 
                key={s.id}
                onClick={() => switchService(s.id)}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all group",
                  activeServiceId === s.id ? "bg-accent text-bg-main brass-glow font-bold" : "text-text-muted hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <CalendarRange className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-xs">{s.name}</span>
                </div>
                {services.length > 1 && (
                  <Trash2 
                    onClick={(e) => deleteService(s.id, e)}
                    className={cn(
                      "w-3.5 h-3.5 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity flex-shrink-0 cursor-pointer",
                      activeServiceId === s.id && "text-bg-main"
                    )} 
                  />
                )}
              </button>
            ))}
          </div>
          <button 
            onClick={createNewService}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-accent border border-accent/20 hover:bg-accent/10 transition-all mt-2"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[260px] p-10 flex flex-col gap-8 technical-grid min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {logos.ship ? (
                <img src={logos.ship} alt="Ship" className="w-14 h-14 object-contain" />
              ) : logos.navy ? (
                <img src={logos.navy} alt="Navy" className="w-14 h-14 object-contain" />
              ) : (
                <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
                  <ShieldAlert className="w-6 h-6 text-accent" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="label-tech">Tipo: {serviceName}</span>
                <button onClick={renameService} className="text-text-muted hover:text-accent transition-colors"><Pencil className="w-3 h-3" /></button>
              </div>
              <h1 className="text-3xl font-display font-black text-text-main tracking-tight leading-tight">
                {activeTab === 'dashboard' ? 'Painel de Controle' : 
                 activeTab === 'roster' ? 'Escala de Serviço' : 
                 activeTab === 'personnel' ? 'Quadro de Militares' : 
                 activeTab === 'status' ? 'Status e Impedimentos' : 'Dias de Mar'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={openDailyExport}
              className="px-5 py-2.5 bg-white/5 border border-white/10 text-text-main rounded-xl text-xs font-black hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Detalhe Diário (PDF)
            </button>
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
              logos={logos}
              onLogoUpload={handleLogoUpload}
              onRemoveLogo={removeLogo}
              onExportBackup={exportFullData}
              onImportBackup={importFullData}
            />
          )}

          {activeTab === 'roster' && (
            <div className={cn(
              "flex flex-col gap-8 transition-all duration-500",
              isFullScreen ? "fixed inset-0 z-[100] bg-bg-main p-6 overflow-hidden flex flex-col h-screen w-screen" : "relative"
            )}>
              {isFullScreen && (
                <div className="flex items-center justify-between mb-6 animate-in slide-in-from-top duration-500">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
                      <CalendarRange className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <div className="label-tech mb-1">Visualização Ampla • {serviceName}</div>
                      <h2 className="text-2xl font-display font-black text-text-main tracking-tight uppercase">Escala de Serviço Geral</h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsFullScreen(false)}
                    className="flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-black text-red-400 hover:bg-red-500/20 transition-all group"
                  >
                    <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    FECHAR MÓDULO AMPLO
                  </button>
                </div>
              )}

              <div className={cn(
                "glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-wrap items-end gap-8",
                isFullScreen && "hidden"
              )}>
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
                    onClick={() => setIsFullScreen(true)}
                    className="px-5 py-3 bg-accent/10 border border-accent/20 text-accent rounded-xl text-xs font-bold hover:bg-accent/20 transition-all flex items-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Maximizar Escala
                  </button>
                  <button 
                    onClick={() => setModal({ type: 'CONFIRM_CLEAR_DATA', date: '', rowMilitaryId: 0 })}
                    className="px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all font-mono"
                  >
                    Limpar Tudo
                  </button>
                </div>
              </div>

              <div className={cn(
                "flex-1 overflow-hidden flex flex-col min-h-0",
                isFullScreen && "animate-in zoom-in-95 duration-500"
              )}>
                <RosterTable 
                  militares={militares} 
                  roster={roster} 
                  statusPeriods={statusPeriods}
                  holidayDates={holidayDates}
                  onCellClick={handleCellClick}
                  onHeaderClick={toggleHoliday}
                />
              </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button 
                onClick={() => setModal({ ...modal, type: 'SELECT_NEW', oldId: modal.rowMilitaryId, swapType: 'substituir' })}
                className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 hover:border-accent/50 transition-all group text-left"
              >
                <div className="p-3 bg-bg-main rounded-xl border border-white/5 group-hover:text-accent transition-colors shadow-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-black text-text-main text-base tracking-tight leading-tight">Substituir</div>
                  <div className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-widest mt-1">Alteração pontual</div>
                </div>
              </button>
              <button 
                onClick={() => setModal({ ...modal, type: 'SELECT_NEW', oldId: modal.rowMilitaryId, swapType: 'troca' })}
                className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 hover:border-accent/50 transition-all group text-left"
              >
                <div className="p-3 bg-bg-main rounded-xl border border-white/5 group-hover:text-accent transition-colors shadow-lg">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-black text-text-main text-base tracking-tight leading-tight">Permutar</div>
                  <div className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-widest mt-1">Troca bilateral</div>
                </div>
              </button>
            </div>

            {roster.filter(e => e.data === modal.date).length > 1 && (
              <>
                <button 
                  onClick={() => setModal({ ...modal, type: 'SELECT_SPECIFIC_SHIFT' })}
                  className="w-full p-5 bg-accent/5 border border-accent/20 rounded-2xl flex items-center gap-5 hover:bg-accent/10 hover:border-accent/50 transition-all group text-left"
                >
                  <div className="p-3 bg-accent/20 rounded-xl border border-accent/20 text-accent transition-colors shadow-lg">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-black text-accent text-lg tracking-tight">Alterar Horário de Turno</div>
                    <div className="text-[10px] font-mono font-bold text-accent/80 uppercase tracking-widest leading-relaxed">Mudar para qualquer horário disponível</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-accent/50 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => setModal({ ...modal, type: 'SELECT_SHIFT_SWAP' })}
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5 hover:bg-white/10 hover:border-accent/50 transition-all group text-left"
                >
                  <div className="p-3 bg-bg-main rounded-xl border border-white/5 group-hover:text-accent transition-colors shadow-lg">
                    <ArrowRightLeft className="w-5 h-5 rotate-90" />
                  </div>
                  <div>
                    <div className="font-display font-black text-text-main text-lg tracking-tight">Permutar com Colega do Dia</div>
                    <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Inverter horários internamente</div>
                  </div>
                </button>
              </>
            )}
          </div>
        )}

        {modal?.type === 'SELECT_NEW' && (
          <div className="flex flex-col gap-4">
            <p className="label-tech mb-2">Selecione o militar para {modal.swapType === 'troca' ? 'permutar' : 'substituir'}:</p>
            <div className="max-h-[400px] overflow-y-auto flex flex-col gap-2 pr-2 custom-scrollbar">
              {militares
                .filter(m => m.id !== modal.oldId)
                .sort((a, b) => a.antiguidade - b.antiguidade)
                .map((m) => {
                  const status = getStatusAtivo(m.id, modal.date, statusPeriods);
                  const isImpeded = isMilitaryImpeded(m.id, modal.date, statusPeriods);
                  
                  return (
                    <button
                      key={m.id}
                      disabled={isImpeded}
                      onClick={() => {
                        if (modal.swapType === 'substituir' && modal.shift === undefined && roster.filter(e => e.data === modal.date).length > 1) {
                          setModal({ ...modal, type: 'SELECT_TITULAR_TO_REPLACE', newId: m.id });
                        } else {
                          addSwap(modal.date, modal.oldId!, m.id, modal.swapType!, modal.shift);
                        }
                      }}
                      className={cn(
                        "w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between transition-all text-left group",
                        isImpeded ? "opacity-40 cursor-not-allowed" : "hover:bg-accent/10 hover:border-accent/40"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border",
                          isImpeded ? "bg-white/5 border-white/10" : "bg-bg-main border-white/5 text-accent"
                        )}>
                          {m.antiguidade}
                        </div>
                        <div>
                          <div className="font-display font-black text-text-main text-sm tracking-tight leading-none mb-1">{m.name}</div>
                          {isImpeded && status && <div className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">{STATUS_LABELS[status]}</div>}
                        </div>
                      </div>
                      {!isImpeded && (
                        <div className="text-[10px] font-mono font-bold text-text-muted opacity-0 group-hover:opacity-100 uppercase tracking-widest transition-opacity">
                          Selecionar
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {modal?.type === 'SELECT_SPECIFIC_SHIFT' && (
          <div className="flex flex-col gap-4">
            <p className="label-tech mb-2">Mudar turno para:</p>
            <div className="flex flex-col gap-2">
              {['08:00 - 12:00', '12:00 - 16:00', '16:00 - 20:00'].map((s, idx) => {
                const isCurrent = s === modal.shift;
                
                // Detection logic
                let occupantId: number | null = null;
                const currentData = getRosterData(activeServiceId);
                const dayEntries = currentData?.roster.filter(e => e.data === modal.date) || [];
                
                if (dayEntries.length > 1) {
                  // For scales with multiple slots, find the occupant of this specific shift
                  occupantId = dayEntries.find(e => e.shift === s)?.militaryId || null;
                } else if (dayEntries.length === 1) {
                  // For scales with only one slot (like Eletricista)
                  // The person can't move between these 3 shifts in the canonical sense, 
                  // but we show who is in the only slot available.
                  occupantId = dayEntries[0].militaryId;
                }

                const occupantName = occupantId ? militares.find(m => m.id === occupantId)?.name : 'VAGO';

                return (
                  <button
                    key={s}
                    disabled={isCurrent && dayEntries.length > 1}
                    onClick={() => {
                      setManualSwaps([
                        ...manualSwaps,
                        { 
                          data: modal.date, 
                          originalMilitaryId: modal.rowMilitaryId, 
                          newMilitaryId: occupantId || 0, 
                          type: 'substituir', 
                          shift: modal.shift || undefined,
                          shiftIndex: modal.shift ? dayEntries.findIndex(e => e.shift === modal.shift) : 0
                        }
                      ]);
                      setModal(null);
                    }}
                    className={cn(
                      "w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5 transition-all text-left group",
                      isCurrent ? "opacity-40 cursor-not-allowed" : "hover:bg-white/10 hover:border-accent/40"
                    )}
                  >
                    <div className={cn("p-3 rounded-xl border border-white/5 shadow-lg", isCurrent ? "bg-white/10" : "bg-bg-main text-accent")}>
                      <Timer className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-1">Turno</div>
                      <div className="font-display font-black text-text-main text-lg tracking-tight">{s}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-1">Ocupante atual</div>
                      <div className={cn(
                        "font-bold text-sm",
                        occupantId ? "text-text-main" : "text-amber-500/80"
                      )}>{occupantName}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {modal?.type === 'SELECT_TITULAR_TO_REPLACE' && (
          <div className="flex flex-col gap-4">
            <p className="label-tech mb-2">Selecione o turno para assumir:</p>
            <div className="flex flex-col gap-2">
              {roster.filter(e => e.data === modal.date).map((e) => (
                <button
                  key={e.shift}
                  onClick={() => setModal({
                    type: 'CONFIRM_ASSIGN',
                    date: modal.date,
                    rowMilitaryId: modal.rowMilitaryId,
                    oldId: e.militaryId || 0,
                    newId: modal.newId!,
                    shift: e.shift
                  })}
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5 hover:bg-white/10 hover:border-accent/40 transition-all text-left"
                >
                  <div className="p-3 bg-bg-main rounded-xl border border-white/5 text-accent shadow-lg">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-black text-text-main text-lg tracking-tight">{e.shift || 'Regime 24h'}</div>
                    <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">
                      Ocupante atual: {e.militaryId ? militares.find(m => m.id === e.militaryId)?.name : 'VAGO'}
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
                onClick={() => {
                  addSwap(modal.date, modal.oldId!, modal.newId!, 'substituir', modal.shift);
                  setModal(null);
                }}
                className="flex-1 px-6 py-4 bg-accent text-bg-main rounded-2xl text-sm font-black hover:brightness-110 transition-all shadow-lg brass-glow"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        )}

        {modal?.type === 'MANAGE_SERVICES' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
                <FolderPlus className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="label-tech mb-1">{modal.message === 'CREATE' ? 'Novo Serviço' : 'Renomear Serviço'}</div>
                <h3 className="text-2xl font-display font-black text-text-main tracking-tight">Configuração de Serviço</h3>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest px-1">Nome do Serviço</label>
              <input 
                autoFocus
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Ex: Escala de Máquinas"
                onKeyDown={(e) => e.key === 'Enter' && handleServiceSave()}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-text-main focus:outline-none focus:ring-2 focus:ring-accent/50 text-lg transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <button 
                onClick={() => setModal(null)}
                className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-text-muted hover:bg-white/10 transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleServiceSave}
                className="px-6 py-4 bg-accent text-bg-main rounded-2xl text-sm font-black hover:brightness-110 transition-all shadow-lg brass-glow"
              >
                {modal.message === 'CREATE' ? 'CRIAR' : 'SALVAR'}
              </button>
            </div>
          </div>
        )}

        {modal?.type === 'CONFIRM_DELETE_SERVICE' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5 p-6 bg-red-500/10 rounded-3xl border border-red-500/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500 rounded-2xl shadow-lg">
                  <Trash2 className="w-6 h-6 text-white shrink-0" />
                </div>
                <div className="font-display font-black text-text-main text-xl tracking-tight">Excluir Serviço</div>
              </div>
              <p className="text-sm text-text-main font-medium leading-relaxed">
                Deseja realmente excluir o serviço <span className="font-black text-red-500">{services.find(s => s.id === modal.serviceId)?.name}</span>?
                <br /><br />
                <span className="text-red-400 font-bold uppercase text-[10px] tracking-widest">Esta ação é irreversível e apagará todos os dados desta escala.</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setModal(null)}
                className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-text-muted hover:bg-white/10 transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={() => handleServiceDelete(modal.serviceId!)}
                className="px-6 py-4 bg-red-500 text-white rounded-2xl text-sm font-black hover:brightness-110 transition-all shadow-lg"
              >
                EXCLUIR
              </button>
            </div>
          </div>
        )}

        {modal?.type === 'DAILY_EXPORT' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="label-tech">Data do Detalhe</label>
              <input 
                type="date" 
                value={modal.date}
                onChange={(e) => setModal({ ...modal, date: e.target.value })}
                className="w-full bg-bg-main border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main"
              />
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="label-tech border-b border-white/5 pb-2">Mapeamento de Escalas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  { key: 'fielAux', label: 'Fiel das Auxiliares' },
                  { key: 'eletrlux', label: 'Eletricista (P/ Auxiliares)' },
                  { key: 'patrulhaCav', label: 'Patrulha do CAV' },
                  { key: 'supervisorMaq', label: 'Supervisor da Máquina' },
                  { key: 'fielCav', label: 'Fiel de CAV' },
                  { key: 'supervisorMO', label: 'Supervisor "MO"' },
                  { key: 'supervisorEL', label: 'Supervisor "EL"' },
                  { key: 'caboDia', label: 'Cabo de Dia' },
                ].map(item => (
                  <div key={item.key} className="flex flex-col gap-1">
                    <label className={cn(
                      "text-[10px] uppercase font-bold transition-colors",
                      exportMappings[item.key] ? "text-accent" : "text-text-muted"
                    )}>
                      {item.label}
                    </label>
                    <select 
                      value={exportMappings[item.key] || ''}
                      onChange={(e) => setExportMappings({ ...exportMappings, [item.key]: e.target.value ? Number(e.target.value) : null })}
                      className={cn(
                        "bg-bg-main border rounded-lg px-3 py-2 text-xs text-text-main focus:ring-1 focus:ring-accent outline-none transition-all",
                        exportMappings[item.key] ? "border-accent/30 bg-accent/5" : "border-white/10"
                      )}
                    >
                      <option value="">Não Escalar</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.militares.length} militares)</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="label-tech border-b border-white/5 pb-2">Assinaturas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-text-muted">Chefe do Dept.</label>
                  <input 
                    type="text" 
                    placeholder="Nome Completo"
                    value={signatureData.chefe.name}
                    onChange={(e) => setSignatureData({ ...signatureData, chefe: { ...signatureData.chefe, name: e.target.value } })}
                    className="bg-bg-main border border-white/10 rounded-lg px-3 py-2 text-xs text-text-main"
                  />
                  <input 
                    type="text" 
                    placeholder="Posto/Grad."
                    value={signatureData.chefe.rank}
                    onChange={(e) => setSignatureData({ ...signatureData, chefe: { ...signatureData.chefe, rank: e.target.value } })}
                    className="bg-bg-main border border-white/10 rounded-lg px-3 py-2 text-[10px] text-text-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-text-muted">Detalhista</label>
                  <input 
                    type="text" 
                    placeholder="Nome Completo"
                    value={signatureData.detalhista.name}
                    onChange={(e) => setSignatureData({ ...signatureData, detalhista: { ...signatureData.detalhista, name: e.target.value } })}
                    className="bg-bg-main border border-white/10 rounded-lg px-3 py-2 text-xs text-text-main"
                  />
                  <input 
                    type="text" 
                    placeholder="Posto/Grad."
                    value={signatureData.detalhista.rank}
                    onChange={(e) => setSignatureData({ ...signatureData, detalhista: { ...signatureData.detalhista, rank: e.target.value } })}
                    className="bg-bg-main border border-white/10 rounded-lg px-3 py-2 text-[10px] text-text-muted"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleDailyExport}
              className="w-full py-4 bg-accent text-bg-main rounded-2xl text-sm font-black hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg brass-glow"
            >
              <FileText className="w-4 h-4" />
              Gerar PDF Detalhado
            </button>
          </div>
        )}

        {modal?.type === 'CONFIRM_CLEAR_DATA' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5 p-6 bg-red-500/10 rounded-3xl border border-red-500/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500 rounded-2xl shadow-lg brass-glow">
                  <AlertCircle className="w-6 h-6 text-white shrink-0" />
                </div>
                <div className="font-display font-black text-text-main text-xl tracking-tight">Limpeza de Dados</div>
              </div>
              <p className="text-sm text-text-main font-medium leading-relaxed">
                Atenção! Esta ação irá resetar <span className="font-black text-red-500">TODOS</span> os impedimentos, suspensões, trocas manuais e feriados deste serviço operacional.
                <br /><br />
                <span className="text-red-400 font-bold uppercase text-[10px] tracking-widest">O quadro de militares cadastrados será mantido.</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setModal(null)}
                className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-text-muted hover:bg-white/10 transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={() => {
                  setStatusPeriods([]);
                  setShipPeriods([]);
                  setManualSwaps([]);
                  setHolidayDates([]);
                  setModal(null);
                }}
                className="px-6 py-4 bg-red-500 text-white rounded-2xl text-sm font-black hover:brightness-110 transition-all shadow-lg"
              >
                LIMPAR TUDO
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
