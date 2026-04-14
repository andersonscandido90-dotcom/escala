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
import { Military, RosterEntry, StatusPeriod, STATUS_COLORS } from '../types';
import { Users, Calendar, ShieldAlert, Ship } from 'lucide-react';

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

    return { chartData, pieData, totalServices: roster.filter(e => e.militaryId).length };
  }, [militares, roster, statusPeriods]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Militares" 
          value={militares.length} 
          icon={<Users className="w-5 h-5 text-primary" />} 
        />
        <StatCard 
          title="Serviços no Período" 
          value={stats.totalServices} 
          icon={<Calendar className="w-5 h-5 text-emerald-500" />} 
        />
        <StatCard 
          title="Impedimentos Ativos" 
          value={statusPeriods.length} 
          icon={<ShieldAlert className="w-5 h-5 text-red-500" />} 
        />
        <StatCard 
          title="Dias de Mar" 
          value={roster.filter(e => e.status === 'NAVIO' || e.emNavio).length} 
          icon={<Ship className="w-5 h-5 text-text-muted" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-border-sleek shadow-sleek">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-text-main">Distribuição de Serviços</h3>
            <span className="text-primary text-xs font-bold cursor-pointer">Ver Detalhes</span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#eff6ff' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="servicos" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-border-sleek shadow-sleek">
          <h3 className="text-lg font-bold text-text-main mb-8">Tipos de Impedimentos</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-2xl border border-border-sleek shadow-sleek flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{title}</p>
      <div className="p-2 bg-accent rounded-lg">
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-text-main">{value}</p>
  </div>
);
