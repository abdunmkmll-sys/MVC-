
import React, { memo } from 'react';
import { SlipEntry } from '../types';
import { Clock, Quote, Zap, Mic2, Trash2 } from 'lucide-react';

interface EntryCardProps {
  entry: any; // We'll adapt to the new structure
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const EntryCard: React.FC<EntryCardProps> = memo(({ entry, onDelete, isAdmin }) => {
  const isJoke = entry.category === 'joke';
  
  const date = new Date(entry.timestamp).toLocaleString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className={`bg-white rounded-3xl shadow-sm p-6 border-r-8 ${isJoke ? 'border-violet-500' : 'border-teal-500'} relative overflow-hidden transition-all duration-300 hover:shadow-md border border-slate-100`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl text-white ${isJoke ? 'bg-violet-500' : 'bg-teal-500'} shadow-sm`}>
            {isJoke ? <Zap className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-800 text-lg leading-tight">{entry.userName}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase ${isJoke ? 'bg-violet-50 text-violet-600' : 'bg-teal-50 text-teal-600'}`}>
                {isJoke ? 'ذبة' : 'كلجة'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{date}</span>
            </div>
          </div>
        </div>
        {isAdmin && onDelete && (
          <button 
            onClick={() => onDelete(entry.id)}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="حذف السجل"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="relative z-10">
        <div className={`${isJoke ? 'bg-violet-50/50 text-violet-950 border-violet-100' : 'bg-teal-50/50 text-teal-950 border-teal-100'} p-5 rounded-2xl border italic text-xl font-black text-center leading-relaxed shadow-inner`}>
          "{entry.content}"
        </div>
      </div>
      
      {/* Decorative Background Element */}
      <div className={`absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-[0.03] ${isJoke ? 'bg-violet-900' : 'bg-teal-900'}`}></div>
    </div>
  );
});

export default EntryCard;
