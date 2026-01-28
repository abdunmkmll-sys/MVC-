
import React, { useState, useEffect, useMemo } from 'react';
import { SlipEntry, StatsData, EntryCategory, AppConfig } from './types';
import { analyzeEntry } from './services/geminiService';
import EntryCard from './components/EntryCard';
import SlipStats from './components/SlipStats';
import { 
  Notebook, Plus, Search, Info, Mic2, Zap, LayoutGrid, 
  BookOpen, Settings, ShieldCheck, LogOut, Trash2, Save, X, RefreshCw 
} from 'lucide-react';

const ADMIN_PASSWORD = 'admin'; // يمكن للمستخدم تغييره

const App: React.FC = () => {
  // --- States ---
  const [entries, setEntries] = useState<SlipEntry[]>(() => {
    const saved = localStorage.getItem('kalajat_entries_v2');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((e: any) => ({
        ...e,
        category: e.category || 'slip',
        content: e.content || e.slip
      }));
    } catch { return []; }
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('kalajat_config');
    return saved ? JSON.parse(saved) : {
      appName: 'دفتر الكلجات',
      successMessage: 'برماوي جديد يضاف للقاموس',
      slipPrompt: '',
      jokePrompt: ''
    };
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminTab, setAdminTab] = useState<'entries' | 'config'>('entries');

  const [activeTab, setActiveTab] = useState<EntryCategory | 'all'>('all');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [formCategory, setFormCategory] = useState<EntryCategory>('slip');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('kalajat_entries_v2', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('kalajat_config', JSON.stringify(config));
  }, [config]);

  // --- Handlers ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setPasswordInput('');
    } else {
      alert('كلمة مرور خاطئة يا برماوي!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    const newEntry: SlipEntry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      content: content.trim(),
      category: formCategory,
      timestamp: Date.now(),
    };

    setEntries([newEntry, ...entries]);
    setName('');
    setContent('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAnalyze = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || entry.aiAnalysis || entry.isAnalyzing) return;

    setEntries(prev => prev.map(e => e.id === id ? { ...e, isAnalyzing: true } : e));
    const analysis = await analyzeEntry(
      entry.name, 
      entry.content, 
      entry.category, 
      entry.category === 'slip' ? config.slipPrompt : config.jokePrompt
    );
    setEntries(prev => prev.map(e => e.id === id ? { ...e, aiAnalysis: analysis, isAnalyzing: false } : e));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من الحذف النهائي؟')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleResetData = () => {
    if (window.confirm('سيتم مسح جميع السجلات! هل أنت متأكد؟')) {
      setEntries([]);
    }
  };

  // --- Memoized Data ---
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || e.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [entries, searchTerm, activeTab]);

  const statsData: StatsData[] = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.name] = (counts[e.name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [entries]);

  return (
    <div className="min-h-screen paper-texture pb-20">
      {/* Success Overlay Screen */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-orange-500/95 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="text-center text-white p-8 max-w-md">
            <div className="bg-white/20 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-white/30">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl font-black mb-4 leading-tight">{config.successMessage}</h2>
            <p className="text-orange-100 text-lg mb-8 opacity-80">تم تخليد الذكرى في الأرشيف الرسمي!</p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="bg-white text-orange-600 font-black px-10 py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform active:scale-95"
            >
              استمر في التوثيق
            </button>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" /> لوحة الإدارة
              </h2>
              <button onClick={() => setShowAdminLogin(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="أدخل كلمة المرور"
                autoFocus
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
                دخول
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-orange-500 text-white py-10 px-4 shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 flex flex-wrap gap-10 p-4 pointer-events-none">
          {Array.from({length: 20}).map((_, i) => (
            i % 2 === 0 ? <Mic2 key={i} size={40} /> : <Zap key={i} size={40} />
          ))}
        </div>
        <div className="max-w-3xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div 
              className="bg-white p-3 rounded-2xl shadow-xl transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer"
              onDoubleClick={() => setShowAdminLogin(true)}
            >
              <Notebook className="w-10 h-10 text-orange-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">{config.appName}</h1>
              <p className="text-orange-100 text-sm font-medium">سجل الأبطال والمكلجين الرسمي</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button 
                onClick={() => setIsAdmin(false)}
                className="bg-white/20 hover:bg-white/30 p-2.5 rounded-xl border border-white/20 transition-all text-white flex items-center gap-2 text-sm font-bold"
              >
                <LogOut className="w-4 h-4" /> خروج المشرف
              </button>
            ) : (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="bg-orange-600/50 hover:bg-orange-600 p-2.5 rounded-xl border border-orange-400/30 transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        {isAdmin ? (
          /* Admin View */
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl border-b-8 border-indigo-700">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black mb-1">لوحة التحكم الكاملة</h2>
                  <p className="text-indigo-300 text-sm">مرحباً أيها المشرف، لديك السيطرة المطلقة.</p>
                </div>
                <div className="flex gap-2 bg-indigo-800 p-1 rounded-2xl">
                  <button 
                    onClick={() => setAdminTab('entries')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${adminTab === 'entries' ? 'bg-indigo-600 shadow-md' : 'text-indigo-300 hover:text-white'}`}
                  >
                    إدارة السجلات
                  </button>
                  <button 
                    onClick={() => setAdminTab('config')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${adminTab === 'config' ? 'bg-indigo-600 shadow-md' : 'text-indigo-300 hover:text-white'}`}
                  >
                    إعدادات المنصة
                  </button>
                </div>
              </div>

              {adminTab === 'entries' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-indigo-800/50 p-4 rounded-2xl">
                    <span className="font-bold">إجمالي السجلات: {entries.length}</span>
                    <button 
                      onClick={handleResetData}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all"
                    >
                      <RefreshCw className="w-3 h-3" /> مسح كل البيانات
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-indigo-800">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-indigo-800/80 text-indigo-200">
                        <tr>
                          <th className="p-4">الاسم</th>
                          <th className="p-4">المحتوى</th>
                          <th className="p-4">النوع</th>
                          <th className="p-4">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-800">
                        {entries.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-indigo-400">لا توجد بيانات</td></tr>
                        ) : (
                          entries.map(e => (
                            <tr key={e.id} className="hover:bg-indigo-800/30">
                              <td className="p-4 font-bold">{e.name}</td>
                              <td className="p-4 truncate max-w-[150px]">{e.content}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${e.category === 'joke' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                                  {e.category === 'joke' ? 'ذبة' : 'كلجة'}
                                </span>
                              </td>
                              <td className="p-4">
                                <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-300 p-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-indigo-300 mb-2 uppercase tracking-widest">اسم المنصة</label>
                      <input 
                        type="text" 
                        value={config.appName}
                        onChange={(e) => setConfig({...config, appName: e.target.value})}
                        className="w-full bg-indigo-800 border border-indigo-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-indigo-300 mb-2 uppercase tracking-widest">رسالة النجاح</label>
                      <input 
                        type="text" 
                        value={config.successMessage}
                        onChange={(e) => setConfig({...config, successMessage: e.target.value})}
                        className="w-full bg-indigo-800 border border-indigo-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-indigo-300 mb-2 uppercase tracking-widest">توجيهات مخصصة لـ Gemini (كلجات)</label>
                    <textarea 
                      value={config.slipPrompt}
                      onChange={(e) => setConfig({...config, slipPrompt: e.target.value})}
                      placeholder="اتركها فارغة لاستخدام الإعداد الافتراضي"
                      className="w-full bg-indigo-800 border border-indigo-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-indigo-300 mb-2 uppercase tracking-widest">توجيهات مخصصة لـ Gemini (ذبات)</label>
                    <textarea 
                      value={config.jokePrompt}
                      onChange={(e) => setConfig({...config, jokePrompt: e.target.value})}
                      placeholder="اتركها فارغة لاستخدام الإعداد الافتراضي"
                      className="w-full bg-indigo-800 border border-indigo-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                    />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button className="bg-green-500 hover:bg-green-600 text-white font-black px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all">
                      <Save className="w-5 h-5" /> حفظ الإعدادات
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-indigo-200 rounded-3xl">
              <p className="text-indigo-400 text-sm font-bold flex items-center gap-2">
                <Info className="w-4 h-4" /> العودة للوضع العادي بالضغط على "خروج المشرف" في الأعلى
              </p>
            </div>
          </div>
        ) : (
          /* User View */
          <>
            {/* Type Toggle for Input */}
            <div className="flex p-1 bg-white/50 backdrop-blur rounded-2xl border border-gray-100 mb-4">
              <button 
                onClick={() => setFormCategory('slip')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${formCategory === 'slip' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-gray-500 hover:bg-white'}`}
              >
                <Mic2 className="w-4 h-4" />
                توثيق كلجة
              </button>
              <button 
                onClick={() => setFormCategory('joke')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${formCategory === 'joke' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-white'}`}
              >
                <Zap className="w-4 h-4" />
                توثيق ذبة بايخة
              </button>
            </div>

            {/* Entry Form */}
            <section className={`bg-white rounded-2xl shadow-sm p-6 mb-8 border-t-4 transition-colors ${formCategory === 'joke' ? 'border-blue-400' : 'border-orange-400'}`}>
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Plus className={`w-5 h-5 ${formCategory === 'joke' ? 'text-blue-500' : 'text-orange-500'}`} />
                {formCategory === 'joke' ? 'سجل جريمة بحق الفكاهة' : 'سجل مطب لغوي'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-500 mb-1.5 mr-1">
                    {formCategory === 'joke' ? 'صاحب الذبة' : 'صاحب الكلجة'}
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={formCategory === 'joke' ? "مين الي يبى ينضرب على ذباتو" : "من هو المكلج اليوم؟"}
                    className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 ${formCategory === 'joke' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'} transition-all`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-500 mb-1.5 mr-1">
                    {formCategory === 'joke' ? 'الهرجة اللي رماها' : 'الكلجة (الكلمة الخطأ)'}
                  </label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={formCategory === 'joke' ? "ايش الهرجة السامجة؟" : "ايش المطب اللي رماه؟"}
                    rows={2}
                    className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 ${formCategory === 'joke' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'} transition-all resize-none`}
                  />
                </div>
                <button 
                  type="submit"
                  className={`w-full py-4 rounded-xl text-white font-black text-lg shadow-md transition-all transform active:scale-[0.98] ${formCategory === 'joke' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-100' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'}`}
                >
                  توثيق السجل
                </button>
              </form>
            </section>

            {/* Filters and Stats Tabs */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${activeTab === 'all' ? 'bg-gray-800 text-white' : 'bg-white'}`}>الكل</button>
                  <button onClick={() => setActiveTab('slip')} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${activeTab === 'slip' ? 'bg-orange-500 text-white' : 'bg-white'}`}>الكلجات</button>
                  <button onClick={() => setActiveTab('joke')} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${activeTab === 'joke' ? 'bg-blue-500 text-white' : 'bg-white'}`}>الذبات</button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث عن مكلج، سماجة، أو كلمة..."
                  className="w-full bg-white border border-gray-200 rounded-2xl pr-12 pl-6 py-4 shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <SlipStats data={statsData} />

            <div className="space-y-6">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-4">
                <LayoutGrid className="w-6 h-6 text-gray-400" />
                آخر التحديثات
              </h2>
              {filteredEntries.length > 0 ? (
                filteredEntries.map(entry => (
                  <EntryCard 
                    key={entry.id} 
                    entry={entry} 
                    onAnalyze={handleAnalyze} 
                    onDelete={isAdmin ? handleDelete : undefined}
                    isAdmin={isAdmin}
                  />
                ))
              ) : (
                <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                  <Notebook className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-black">لا يوجد سجلات!</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="mt-20 text-center py-10 border-t border-orange-100 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Notebook className="w-5 h-5 text-orange-300" />
          <span className="font-black text-gray-400 tracking-tighter">{config.appName}</span>
        </div>
        <p className="text-gray-400 text-xs">تم التصميم بكل حب وتوثيق لكل لحظة مضحكة</p>
      </footer>
    </div>
  );
};

export default App;
