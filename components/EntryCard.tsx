
import React from 'react';
import { SlipEntry } from '../types';
import { Sparkles, Clock, Quote, Zap, Mic2, Trash2 } from 'lucide-react';

interface EntryCardProps {
  entry: SlipEntry;
  onAnalyze: (id: string) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onAnalyze, onDelete, isAdmin }) => {
  const isJoke = entry.category === 'joke';
  
  const date = new Date(entry.timestamp).toLocaleString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 border-r-8 ${isJoke ? 'border-blue-400' : 'border-orange-400'} relative overflow-hidden transition-all hover:shadow-xl group`}>
      {/* Decorative background circle */}
      <div className={`absolute -top-10 -left-10 w-32 h-32 ${isJoke ? 'bg-blue-50' : 'bg-orange-50'} rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-br ${isJoke ? 'from-blue-400 to-blue-600' : 'from-orange-400 to-orange-600'} p-2.5 rounded-xl shadow-sm text-white`}>
            {isJoke ? <Zap className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-lg leading-tight">{entry.name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isJoke ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                {isJoke ? 'ذبة بايخة' : 'كلجة'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{date}</span>
            </div>
          </div>
        </div>
        {isAdmin && onDelete && (
          <button 
            onClick={() => onDelete(entry.id)}
            className="p-2 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="حذف السجل (أدمن)"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="relative mb-6 z-10">
        <div className={`absolute -top-2 -right-2 ${isJoke ? 'text-blue-200' : 'text-orange-200'} opacity-50`}>
          <Quote className="w-8 h-8 rotate-180" />
        </div>
        <div className={`${isJoke ? 'bg-blue-50/80 border-blue-100 text-blue-950' : 'bg-orange-50/80 border-orange-100 text-orange-950'} backdrop-blur-sm p-5 rounded-2xl border italic text-xl font-bold text-center shadow-inner`}>
          "{entry.content}"
        </div>
      </div>

      {!entry.aiAnalysis && !entry.isAnalyzing && (
        <button
          onClick={() => onAnalyze(entry.id)}
          className={`w-full relative overflow-hidden group/btn flex items-center justify-center gap-2 bg-gradient-to-r ${isJoke ? 'from-cyan-600 to-blue-600' : 'from-indigo-600 to-purple-600'} text-white py-3 rounded-xl hover:shadow-lg transition-all text-sm font-black active:scale-[0.97]`}
        >
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
          <Sparkles className="w-4 h-4" />
          {isJoke ? 'حلل مستوى السماجة' : 'حلل "الكلجة" ذكياً'}
        </button>
      )}

      {entry.isAnalyzing && (
        <div className="flex flex-col items-center justify-center gap-3 py-4 animate-pulse">
          <div className="relative">
            <div className={`w-10 h-10 border-4 ${isJoke ? 'border-blue-100 border-t-blue-600' : 'border-indigo-100 border-t-indigo-600'} rounded-full animate-spin`}></div>
            <Sparkles className={`w-4 h-4 ${isJoke ? 'text-blue-600' : 'text-indigo-600'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
          </div>
          <span className={`text-xs font-bold ${isJoke ? 'text-blue-600' : 'text-indigo-600'} tracking-wide uppercase`}>
            {isJoke ? 'جاري قياس درجة البرودة...' : 'جاري استخراج المعنى العميق...'}
          </span>
        </div>
      )}

      {entry.aiAnalysis && (
        <div className="mt-6 animate-in slide-in-from-top-2 duration-500">
          <div className={`bg-gradient-to-br ${isJoke ? 'from-blue-50 via-cyan-50 to-indigo-50 border-blue-100/50' : 'from-indigo-50 via-purple-50 to-pink-50 border-indigo-100/50'} p-5 rounded-2xl border shadow-sm relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isJoke ? 'from-blue-500 via-cyan-500 to-indigo-500' : 'from-indigo-500 via-purple-500 to-pink-500'}`}></div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-indigo-100">
                <Sparkles className={`w-4 h-4 ${isJoke ? 'text-blue-600' : 'text-indigo-600'}`} />
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${isJoke ? 'text-blue-700' : 'text-indigo-700'}`}>
                {isJoke ? 'حكم السماجة' : 'تحليل ذكي'}
              </span>
            </div>

            <div className="relative">
              <p className="text-[15px] text-gray-800 leading-relaxed font-medium">
                {entry.aiAnalysis}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryCard;
