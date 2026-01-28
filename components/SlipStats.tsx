
import React from 'react';
import { StatsData } from '../types';

interface SlipStatsProps {
  data: StatsData[];
}

const COLORS = ['bg-violet-500', 'bg-teal-500', 'bg-pink-500', 'bg-blue-500', 'bg-orange-500'];

const SlipStats: React.FC<SlipStatsProps> = ({ data }) => {
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm mb-8 border border-slate-100">
      <h2 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2 uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-violet-500"></span>
        أكثر الضحايا "كلجة"
      </h2>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.name} className="group">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-xs font-bold text-slate-600">{item.name}</span>
              <span className="text-[10px] font-black text-slate-400">{item.count} سجلات</span>
            </div>
            <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full ${COLORS[index % COLORS.length]} transition-all duration-1000 ease-out rounded-full`}
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlipStats;
