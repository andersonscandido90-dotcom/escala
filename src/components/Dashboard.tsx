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
  Legend
} from 'recharts';
import { Military, RosterEntry, StatusPeriod } from '../types';
import { Users, Calendar, ShieldAlert, Ship, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardProps {
  militares: Military[];
  roster: RosterEntry[];
  statusPeriods: StatusPeriod[];
}

export const Dashboard: React.FC<DashboardProps> = ({ militares, roster, statusPeriods }) => {
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
    })).sort((a, b) => b.servicos - a.servicos);

    const statusCounts: Record<string, number> = {};
    statusPeriods.forEach(p => {
      statusCounts[p.type] = (statusCounts[p.type] || 0) + 1;
    });

    const pieData = Object.entries(statusCounts).map(([type, count]) => ({
      name: type,
      value: count,
    }));

    return { 
      chartData, 
      pieData, 
      totalServices: roster.filter(e => e.militaryId).length,
      shipDays: roster.filter(e => e.status === 'NAVIO' || e.emNavio).length
    };
  }, [militares, roster, statusPeriods]);

  const COLORS = ['#C5A059', '#1A5F7A', '#002B5B', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Efetivo Total" 
          value={militares.length} 
          icon={<Users className="w-5 h-5 text-accent" />} 
          label="MILITARES ATIVOS"
        />
        <StatCard 
          title="Serviços Alocados" 
          value={stats.totalServices} 
          icon={<Zap className="w-5 h-5 text-accent" />} 
          label="MISSÕES ESCALADAS"
        />
        <StatCard 
          title="Impedimentos" 
          value={statusPeriods.length} 
          icon={<ShieldAlert className="w-5 h-5 text-red-400" />} 
          label="RESTRIÇÕES TÉCNICAS"
        />
        <StatCard 
          title="Dias em Mar" 
          value={stats.shipDays} 
          icon={<Ship className="w-5 h-5 text-primary-light" />} 
          label="OPERAÇÃO A140"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="label-tech mb-1">Análise de Carga</div>
              <h3 className="text-xl font-display font-black text-text-main tracking-tight">Distribuição de Serviços</h3>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontWeight: 'bold' }} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontWeight: 'bold' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#151E3F', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#E2E8F0', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="servicos" fill="#C5A059" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-2xl">
          <div className="label-tech mb-1">Status de Quadro</div>
          <h3 className="text-xl font-display font-black text-text-main tracking-tight mb-8">Tipos de Impedimentos</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151E3F', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#94A3B8', paddingTop: '20px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, label }: { title: string, value: number | string, icon: React.ReactNode, label: string }) => (
  <div className="glass-panel p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group">
    <div className="flex justify-between items-start relative z-10">
      <div className="flex flex-col">
        <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-display font-black text-text-main tracking-tighter">{value}</p>
      </div>
      <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-accent/10 transition-colors">
        {icon}
      </div>
    </div>
    <div className="text-[9px] font-mono font-bold text-text-muted tracking-[0.2em] relative z-10">{label}</div>
    <div className="absolute -right-2 -bottom-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
      {icon}
    </div>
  </div>
);
