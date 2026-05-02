import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  Cell as RechartsCell
} from 'recharts';
import { Military, RosterEntry, StatusPeriod, STATUS_LABELS } from '../types';
import { 
  Users, 
  Calendar, 
  ShieldAlert, 
  Ship, 
  Zap, 
  Download, 
  RotateCcw, 
  Upload, 
  Trash2,
  Activity,
  History,
  Settings,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format, isWithinInterval, parseISO } from 'date-fns';

interface DashboardProps {
  militares: Military[];
  roster: RosterEntry[];
  statusPeriods: StatusPeriod[];
  logos: { navy: string; ship: string };
  onLogoUpload: (type: 'navy' | 'ship', e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: (type: 'navy' | 'ship') => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  militares, 
  roster, 
  statusPeriods,
  logos,
  onLogoUpload,
  onRemoveLogo,
  onExportBackup,
  onImportBackup
}) => {
  const stats = useMemo(() => {
    const serviceCounts = new Map<number, number>();
    roster.forEach(entry => {
      if (entry.militaryId) {
        serviceCounts.set(entry.militaryId, (serviceCounts.get(entry.militaryId) || 0) + 1);
      }
    });

    const chartData = militares.map(m => ({
      name: m.name.split(' ').pop() || m.name,
      servicos: serviceCounts.get(m.id) || 0,
    })).sort((a, b) => b.servicos - a.servicos).slice(0, 10);

    const statusCounts: Record<string, number> = {};
    statusPeriods.forEach(p => {
      statusCounts[p.type] = (statusCounts[p.type] || 0) + 1;
    });

    const pieData = Object.entries(statusCounts).map(([type, count]) => ({
      name: STATUS_LABELS[type as keyof typeof STATUS_LABELS] || type,
      value: count,
    }));

    // Current Impediments
    const now = new Date();
    const currentImpediments = statusPeriods.filter(p => {
      try {
        const start = parseISO(p.startDate);
        const end = parseISO(p.endDate);
        return isWithinInterval(now, { start, end });
      } catch (e) {
        return false;
      }
    }).map(p => ({
      militar: militares.find(m => m.id === p.militaryId),
      period: p
    })).filter(x => x.militar);

    return { 
      chartData, 
      pieData, 
      currentImpediments,
      totalServices: roster.filter(e => e.militaryId).length,
      shipDays: roster.filter(e => e.status === 'NAVIO' || e.emNavio).length
    };
  }, [militares, roster, statusPeriods]);

  const COLORS = ['#C5A059', '#1A5F7A', '#002B5B', '#ef4444', '#8b5cf6', '#ec4899'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 lg:gap-10 pb-20"
    >
      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard 
          title="Efetivo" 
          value={militares.length} 
          icon={<Users className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />} 
          subtitle="Militares"
        />
        <StatCard 
          title="Serviços" 
          value={stats.totalServices} 
          icon={<Zap className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />} 
          subtitle="Totais"
        />
        <StatCard 
          title="Indisponíveis" 
          value={stats.currentImpediments.length} 
          icon={<ShieldAlert className="w-4 h-4 lg:w-5 lg:h-5 text-red-400" />} 
          subtitle="Hoje"
          variant="danger"
        />
        <StatCard 
          title="Operacional" 
          value={stats.shipDays} 
          icon={<Ship className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />} 
          subtitle="Dias de Mar"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-4 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity className="w-32 h-32" />
          </div>
          <div className="flex justify-between items-start mb-6 lg:mb-10 relative z-10">
            <div>
              <div className="label-tech mb-2">Carga de Trabalho</div>
              <h3 className="text-lg lg:text-2xl font-display font-black text-text-main tracking-tight">Frequência</h3>
            </div>
          </div>
          <div className="h-[240px] lg:h-[340px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.05)" />
                <XAxis 
                  dataKey="name" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94A3B8', fontWeight: 'bold' }}
                />
                <YAxis 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94A3B8', fontWeight: 'bold' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: '#F1F5F9', fontSize: '11px', fontWeight: '800' }}
                  labelStyle={{ color: '#94A3B8', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Bar dataKey="servicos" radius={[4, 4, 0, 0]}>
                  {stats.chartData.map((_entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={index === 0 ? '#C5A059' : 'rgba(197, 160, 89, 0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Current Impediments List */}
        <motion.div variants={itemVariants} className="glass-panel p-4 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col">
          <div className="mb-6 lg:mb-8">
            <div className="label-tech mb-2">Pessoal</div>
            <h3 className="text-lg lg:text-xl font-display font-black text-text-main tracking-tight flex items-center gap-2">
              <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
              Impedimentos
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 max-h-[300px] lg:max-h-[400px]">
            {stats.currentImpediments.length > 0 ? (
              stats.currentImpediments.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/10 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center text-red-400 text-xs font-bold shrink-0">
                    {item.militar?.posto?.charAt(0) || 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] lg:text-xs font-black text-text-main truncate group-hover:text-accent transition-colors">{item.militar?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.5 bg-red-400/20 text-red-400 text-[7px] font-black rounded border border-red-400/30 uppercase tracking-wider">
                        {STATUS_LABELS[item.period.type as keyof typeof STATUS_LABELS] || item.period.type}
                      </span>
                      <span className="text-[8px] text-text-muted font-mono leading-none">até {format(parseISO(item.period.endDate), 'dd/MM')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
                <CheckCircle2 className="w-10 h-10 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Disponível</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Second Row: Distributions and Configs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <motion.div variants={itemVariants} className="glass-panel p-4 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="label-tech mb-2">Composição</div>
          <h3 className="text-lg lg:text-xl font-display font-black text-text-main tracking-tight mb-6 lg:mb-8 text-center sm:text-left">Restrições Registradas</h3>
          <div className="h-[220px] lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  lg:innerRadius={65}
                  lg:outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '11px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '9px', fontWeight: '800', color: '#94A3B8', paddingTop: '12px', textTransform: 'uppercase' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Unified Config & Backup Card */}
        <motion.div variants={itemVariants} className="glass-panel p-4 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col justify-between gap-8">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="label-tech mb-2">Administração</div>
                <h3 className="text-lg lg:text-xl font-display font-black text-text-main tracking-tight">Configurações</h3>
              </div>
              <div className="p-2 lg:p-3 bg-accent/10 rounded-xl lg:rounded-2xl border border-accent/10">
                <Settings className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:gap-8 mb-4 lg:mb-10">
              <LogoUploadCard 
                title="Símbolo MB"
                logo={logos.navy}
                onUpload={(e) => onLogoUpload('navy', e)}
                onRemove={() => onRemoveLogo('navy')}
              />
              <LogoUploadCard 
                title="Heraldica"
                logo={logos.ship}
                onUpload={(e) => onLogoUpload('ship', e)}
                onRemove={() => onRemoveLogo('ship')}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 lg:pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 mb-1 lg:mb-2">
              <History className="w-3.5 h-3.5 lg:w-4 h-4 text-accent" />
              <span className="text-[9px] lg:text-[10px] font-black text-text-muted uppercase tracking-widest">Backup</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <button 
                onClick={onExportBackup}
                className="flex items-center justify-center gap-3 px-4 lg:px-6 py-3 lg:py-4 bg-accent text-bg-main rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black shadow-lg hover:brightness-110 transition-all brass-glow uppercase"
              >
                <Download className="w-3.5 h-3.5 lg:w-4 h-4" />
                Exportar
              </button>
              <label className="flex items-center justify-center gap-3 px-4 lg:px-6 py-3 lg:py-4 bg-white/5 border border-white/10 text-text-main rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black hover:bg-white/10 transition-all cursor-pointer uppercase">
                <RotateCcw className="w-3.5 h-3.5 lg:w-4 h-4" />
                Importar
                <input type="file" accept=".json" onChange={onImportBackup} className="hidden" />
              </label>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const LogoUploadCard = ({ title, logo, onUpload, onRemove }: { 
  title: string, 
  logo: string, 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onRemove: () => void 
}) => {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-mono font-black text-text-muted uppercase tracking-widest">{title}</p>
      <div className="relative group aspect-square max-w-[120px] bg-bg-main border border-white/5 rounded-3xl overflow-hidden flex items-center justify-center p-4">
        {logo ? (
          <>
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-bg-main/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="p-2 bg-accent text-bg-main rounded-xl cursor-pointer hover:scale-110 transition-transform">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
              </label>
              <button 
                onClick={onRemove}
                className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-2 text-text-muted hover:text-accent transition-colors">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <Upload className="w-5 h-5 opacity-40" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Carregar</span>
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, subtitle, trend, variant = 'default' }: { 
  title: string, 
  value: number | string, 
  icon: React.ReactNode, 
  subtitle: string,
  trend?: string,
  variant?: 'default' | 'danger'
}) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 15 },
      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    }}
    className="glass-panel p-4 lg:p-7 rounded-2xl lg:rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col gap-3 lg:gap-6 relative overflow-hidden group hover:border-accent/30 transition-all duration-500"
  >
    <div className="flex justify-between items-start relative z-10">
      <div className="flex flex-col">
        <p className="text-[7px] lg:text-[10px] font-mono font-black text-text-muted uppercase tracking-widest mb-1 lg:mb-2">{title}</p>
        <p className={cn(
          "text-xl lg:text-4xl font-display font-black tracking-tighter tabular-nums",
          variant === 'danger' ? 'text-red-400' : 'text-text-main'
        )}>{value}</p>
      </div>
      <div className={cn(
        "p-2 lg:p-3.5 rounded-lg lg:rounded-2xl border transition-all duration-500 group-hover:scale-110",
        variant === 'danger' ? 'bg-red-400/10 border-red-400/20' : 'bg-white/5 border-white/5 group-hover:bg-accent/10 group-hover:border-accent/20'
      )}>
        {icon}
      </div>
    </div>
    
    <div className="space-y-0.5 lg:space-y-1 relative z-10">
      <div className="text-[7px] lg:text-[9px] font-mono font-black text-text-muted tracking-widest uppercase truncate">{subtitle}</div>
    </div>

    {/* Background Decorative Element */}
    <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-700 blur-lg scale-125 rotate-12">
      {icon}
    </div>
  </motion.div>
);
