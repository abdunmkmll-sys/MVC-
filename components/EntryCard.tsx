
import React, { memo } from 'react';
import { SlipEntry } from '../types';
import { Clock, Quote, Zap, Mic2, Trash2 } from 'lucide-react';

interface EntryCardProps {
  entry: SlipEntry;
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
    <div className={`bg-white rounded-2xl shadow-sm p-5 border-r-4 ${isJoke ? 'border-violet-500' : 'border-teal-500'} relative overflow-hidden transition-transform duration-200 active:scale-[0.99] border border-slate-100`}>
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl text-white ${isJoke ? 'bg-violet-500' : 'bg-teal-500'}`}>
            {isJoke ? <Zap className="w-4 h-4" /> : <Mic2 className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base leading-tight">{entry.userName}</h3>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase ${isJoke ? 'bg-violet-50 text-violet-600' : 'bg-teal-50 text-teal-600'}`}>
                {isJoke ? 'ذبة' : 'كلجة'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{date}</span>
            </div>
          </div>
        </div>
        {isAdmin && onDelete && (
          <button 
            onClick={() => onDelete(entry.id)}
            className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative z-10">
        <div className={`${isJoke ? 'bg-violet-50/30 text-violet-950' : 'bg-teal-50/30 text-teal-950'} p-4 rounded-xl border ${isJoke ? 'border-violet-100/50' : 'border-teal-100/50'} italic text-lg font-bold text-center leading-relaxed`}>
          "{entry.content}"
        </div>
      </div>
    </div>
  );
});

export default EntryCard;
