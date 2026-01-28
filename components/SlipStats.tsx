
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatsData } from '../types';

interface SlipStatsProps {
  data: StatsData[];
}

const COLORS = ['#f97316', '#a855f7', '#3b82f6', '#10b981', '#ef4444'];

const SlipStats: React.FC<SlipStatsProps> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        📊 إحصائيات "المكلجين"
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 40, right: 30 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="#6b7280" 
              fontSize={12} 
              width={60} 
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SlipStats;
