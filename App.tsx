
import React, { useState, useEffect, useMemo } from 'react';
import { SlipEntry, StatsData, EntryCategory, AppConfig } from './types';
import { isFirebaseConfigured, addEntry, deleteEntry, subscribeToEntries } from './services/firebaseService';
import EntryCard from './components/EntryCard';
import SlipStats from './components/SlipStats';
import { 
  Notebook, Search, LayoutGrid, 
  BookOpen, ShieldCheck, X, RefreshCw, AlertCircle
} from 'lucide-react';

const ADMIN_PASSWORD = 'admin';

const App: React.FC = () => {
  const [entries, setEntries] = useState<SlipEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('kalajat_config');
    return saved ? JSON.parse(saved) : {
      appName: 'أرشيف الكلجات',
      successMessage: 'تم بنجاح!',
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

  useEffect(() => {
    const unsubscribe = subscribeToEntries((data) => {
      setEntries(data as SlipEntry[]);
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    try {
      await addEntry({
        userName: name.trim(),
        content: content.trim(),
        category: formCategory,
        postId: "global_feed",
        timestamp: Date.now()
      });

      setName('');
      setContent('');
      setShowSuccess(true);
      
      if (!isFirebaseConfigured) {
        const saved = localStorage.getItem('kalajat_fallback_data');
        if (saved) setEntries(JSON.parse(saved));
      }

      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      alert("خطأ!");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('حذف؟')) {
      await deleteEntry(id);
      if (!isFirebaseConfigured) {
        const saved = localStorage.getItem('kalajat_fallback_data');
        if (saved) setEntries(JSON.parse(saved));
      }
    }
  };

  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return entries.filter(e => {
      const matchesSearch = (e.userName || '').toLowerCase().includes(term) || 
                          (e.content || '').toLowerCase().includes(term);
      const matchesTab = activeTab === 'all' || e.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [entries, searchTerm, activeTab]);

  const statsData: StatsData[] = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.userName] = (counts[e.userName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [entries]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <RefreshCw className="w-8 h-8 text-violet-600 animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-texture pb-20">
      {!isFirebaseConfigured && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest">
          وضع العمل بدون إنترنت نشط
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/95">
          <div className="text-center text-white p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6">{config.successMessage}</h2>
            <button onClick={() => setShowSuccess(false)} className="bg-white text-slate-900 font-bold px-8 py-3 rounded-xl shadow-lg">تم</button>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-violet-600" /> الإدارة</h2>
              <button onClick={() => setShowAdminLogin(false)}><X className="w-5 h-5 text-slate-300" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (passwordInput === ADMIN_PASSWORD) { setIsAdmin(true); setShowAdminLogin(false); setPasswordInput(''); }
              else alert('خطأ');
            }} className="space-y-4">
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="كلمة المرور" className="w-full bg-slate-50 border p-3.5 rounded-xl outline-none" />
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl">دخول</button>
            </form>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-100 py-6 px-4 mb-8 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl cursor-pointer" onDoubleClick={() => setShowAdminLogin(true)}>
              <Notebook className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{config.appName}</h1>
          </div>
          {isAdmin && (
            <button onClick={() => setAdminTab(adminTab === 'config' ? 'entries' : 'config')} className="text-[10px] font-black uppercase bg-slate-100 px-3 py-1.5 rounded-lg">
              {adminTab === 'config' ? 'السجلات' : 'الإعدادات'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4">
        {isAdmin && adminTab === 'config' ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
            <div className="space-y-4">
              <input type="text" value={config.appName} onChange={(e) => setConfig({...config, appName: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm" placeholder="اسم المنصة" />
              <input type="text" value={config.successMessage} onChange={(e) => setConfig({...config, successMessage: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm" placeholder="رسالة النجاح" />
              <button onClick={() => setAdminTab('entries')} className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold">حفظ</button>
            </div>
          </div>
        ) : (
          <>
            <section className="bg-white rounded-2xl shadow-sm p-5 mb-8 border border-slate-100">
              <div className="flex gap-1.5 mb-5 bg-slate-50 p-1 rounded-xl">
                <button onClick={() => setFormCategory('slip')} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${formCategory === 'slip' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>كلجة</button>
                <button onClick={() => setFormCategory('joke')} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${formCategory === 'joke' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}>ذبة</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الضحية" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm outline-none focus:border-slate-300 transition-colors" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="ماذا حدث؟" rows={2} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm outline-none focus:border-slate-300 transition-colors resize-none" />
                <button type="submit" className={`w-full py-3.5 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-transform active:scale-[0.98] ${formCategory === 'joke' ? 'bg-violet-600' : 'bg-teal-600'}`}>توثيق اللحظة</button>
              </form>
            </section>

            <div className="mb-8 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث عن فضيحة..." className="w-full bg-white border border-slate-100 rounded-xl pr-10 pl-4 py-3 text-sm outline-none focus:border-slate-300 transition-colors" />
            </div>

            <SlipStats data={statsData} />

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-tighter">
                  <LayoutGrid className="w-3 h-3" /> السجل التاريخي
                </h2>
                <div className="flex gap-1">
                   {['all', 'slip', 'joke'].map(tab => (
                     <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}>
                       {tab === 'all' ? 'الكل' : tab === 'slip' ? 'الكلجات' : 'الذبات'}
                     </button>
                   ))}
                </div>
              </div>
              
              <div className="grid gap-4">
                {filteredEntries.map(entry => (
                  <EntryCard 
                    key={entry.id} 
                    entry={entry} 
                    onDelete={isAdmin ? handleDelete : undefined}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
              
              {filteredEntries.length === 0 && (
                <div className="text-center py-16 opacity-20">
                   <p className="text-sm font-black italic">لا يوجد شيء هنا بعد...</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
