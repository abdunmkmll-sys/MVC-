
import React, { useState, useEffect, useMemo } from 'react';
import { SlipEntry, StatsData, EntryCategory } from './types';
import { 
  isFirebaseConfigured, 
  auth, 
  loginWithGoogle, 
  logout, 
  addEntry, 
  deleteEntry, 
  subscribeToEntries 
} from './services/firebaseService';
import { analyzeKalja } from './services/geminiService';
import EntryCard from './components/EntryCard';
import SlipStats from './components/SlipStats';
import { 
  Notebook, Search, LayoutGrid, 
  LogOut, Sparkles, Send, User as UserIcon, AlertTriangle, CloudOff, UserPlus
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null>(null);
  const [entries, setEntries] = useState<SlipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [victimName, setVictimName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<EntryCategory>('slip');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let unsubAuth = () => {};
    
    if (isFirebaseConfigured && auth) {
      unsubAuth = auth.onAuthStateChanged((u: any) => {
        if (u) {
          setUser({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    } else {
      // تحقق من وجود جلسة ضيف سابقة في المتصفح
      const savedGuest = localStorage.getItem('kalja_guest_user');
      if (savedGuest) setUser(JSON.parse(savedGuest));
      setLoading(false);
    }
    
    const unsubEntries = subscribeToEntries((data) => {
      setEntries(data as SlipEntry[]);
    });

    return () => {
      unsubAuth();
      unsubEntries();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      if (!isFirebaseConfigured) {
        // في وضع التجربة، نحفظ بيانات الضيف محلياً
        const guestUser = (result as any).user;
        setUser(guestUser);
        localStorage.setItem('kalja_guest_user', JSON.stringify(guestUser));
      }
    } catch (e) {
      alert("خطأ في تسجيل الدخول. تم تفعيل وضع التجربة تلقائياً.");
    }
  };

  const handleLogout = () => {
    if (isFirebaseConfigured) {
      logout();
    } else {
      setUser(null);
      localStorage.removeItem('kalja_guest_user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !victimName.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const aiAnalysis = category === 'slip' ? await analyzeKalja(victimName, content) : undefined;
      
      await addEntry({
        userId: user.uid,
        userEmail: user.email,
        userPhoto: user.photoURL,
        victimName: victimName.trim(),
        content: content.trim(),
        category,
        aiAnalysis,
        timestamp: Date.now()
      });

      setVictimName('');
      setContent('');
    } catch (err) {
      console.error("Submit error:", err);
      alert("حدث خطأ أثناء الحفظ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return entries.filter(e => 
      (e.victimName || '').toLowerCase().includes(term) || 
      (e.content || '').toLowerCase().includes(term)
    );
  }, [entries, searchTerm]);

  const statsData: StatsData[] = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      if (e.category === 'slip') {
        const name = e.victimName || 'مجهول';
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [entries]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-bold text-slate-400 text-sm">جاري فتح الأرشيف...</p>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center paper-texture p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="bg-slate-900 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg">
          <Notebook className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">أرشيف الكلجات</h1>
        <p className="text-slate-500 mb-8 font-medium italic">"الكلمة التي تخرج لا تعود.. لكنها تُسجل هنا!"</p>
        
        <div className="space-y-3">
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white p-4 rounded-2xl transition-all duration-300 font-bold shadow-lg hover:bg-slate-800 active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            ابدأ كضيف (وضع التجربة)
          </button>
          
          {!isFirebaseConfigured && (
            <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100">
              ملاحظة: وضع التجربة يحفظ البيانات في جهازك فقط ولا يشاركها سحابياً.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen paper-texture pb-20">
      {!isFirebaseConfigured && (
        <div className="bg-amber-500 text-white text-[10px] font-black py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <CloudOff className="w-3 h-3" />
          أنت الآن في وضع التجربة (التخزين المحلي مفعل)
        </div>
      )}
      
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-4 mb-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-md shadow-slate-200">
              <Notebook className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">أرشيف الكلجات</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-full border border-slate-100">
              {user.photoURL ? (
                <img src={user.photoURL} className="w-6 h-6 rounded-full shadow-sm" alt="avatar" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                  <UserIcon className="w-3 h-3 text-teal-600" />
                </div>
              )}
              <span className="text-[10px] font-black text-slate-600 hidden sm:inline truncate max-w-[80px]">
                {user.displayName || 'ضيف'}
              </span>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4">
        <section className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex gap-2 mb-6 bg-slate-100/50 p-1.5 rounded-2xl">
            <button 
              onClick={() => setCategory('slip')} 
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${category === 'slip' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
            >
              كلجة 🙊
            </button>
            <button 
              onClick={() => setCategory('joke')} 
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${category === 'joke' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
            >
              ذبة 🔥
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">اسم الضحية</label>
              <input 
                type="text" 
                value={victimName} 
                onChange={(e) => setVictimName(e.target.value)} 
                placeholder="من هو بطل اللحظة؟" 
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-base outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-50 transition-all placeholder:text-slate-300"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">ماذا حدث؟</label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder={category === 'slip' ? "اكتب الخطأ النطقي حرفياً..." : "وثق الذبة التاريخية..."}
                rows={2} 
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-base outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-50 transition-all resize-none placeholder:text-slate-300"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 ${category === 'joke' ? 'bg-violet-600 shadow-violet-100' : 'bg-teal-600 shadow-teal-100'} shadow-lg`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  توثيق الآن
                </>
              )}
            </button>
          </form>
        </section>

        <div className="mb-8 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="ابحث في الأرشيف..." 
            className="w-full bg-white border border-slate-100 rounded-2xl pr-12 pl-4 py-4 text-base outline-none focus:border-slate-300 shadow-sm transition-all shadow-slate-100" 
          />
        </div>

        <SlipStats data={statsData} />

        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-slate-400" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الأرشيف الحي</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-300">{filteredEntries.length} سجل</span>
          </div>
          
          <div className="grid gap-6">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="animate-in fade-in slide-in-from-top-2 duration-300">
                <EntryCard 
                  entry={{...entry, userName: entry.victimName} as any} 
                  onDelete={() => deleteEntry(entry.id)}
                  isAdmin={true}
                />
                {entry.aiAnalysis && (
                  <div className="mt-2 mr-6 ml-4 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-3 border-dashed shadow-sm">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 font-bold leading-relaxed">
                      {entry.aiAnalysis}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredEntries.length === 0 && !loading && (
            <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-bold italic">الأرشيف فارغ.. يبدو أن الجميع فصحاء اليوم!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
