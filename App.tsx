
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SlipEntry, StatsData, EntryCategory } from './types';
import { auth, loginWithGoogle, logout, addEntry, deleteEntry, subscribeToEntries } from './services/firebaseService';
import { analyzeKalja } from './services/geminiService';
import EntryCard from './components/EntryCard';
import SlipStats from './components/SlipStats';
import { 
  Notebook, Search, LayoutGrid, 
  LogOut, Sparkles, Send, User as UserIcon
} from 'lucide-react';

const App: React.FC = () => {
  // تخزين بيانات المستخدم الأساسية فقط لتجنب تعقيدات الكائنات الدائرية الخاصة بـ Firebase
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null>(null);
  const [entries, setEntries] = useState<SlipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [victimName, setVictimName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<EntryCategory>('slip');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // مراقبة حالة المصادقة
    const unsubAuth = auth.onAuthStateChanged((u) => {
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
    
    // الاشتراك في تحديثات قاعدة البيانات
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
      await loginWithGoogle();
    } catch (e) {
      // الخطأ يتم معالجته داخلياً في الخدمة
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !victimName.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // تحليل الكلجة عبر الذكاء الاصطناعي
      const aiAnalysis = category === 'slip' ? await analyzeKalja(victimName, content) : undefined;
      
      // إرسال البيانات (مع التأكد من أنها كائنات بسيطة فقط)
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
      console.error("Submit error details:", err);
      alert("تعذر الحفظ حالياً. قد يكون هناك مشكلة في الاتصال بالخادم.");
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
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-bold text-slate-500">جاري الاتصال بالسحابة...</p>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center paper-texture p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="bg-slate-900 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg">
          <Notebook className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">أرشيف الكلجات</h1>
        <p className="text-slate-500 mb-8 font-medium">وثق زلات أصدقائك بذكاء. الأرشيف الذي لا ينسى الحقيقة!</p>
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-teal-500 p-4 rounded-2xl transition-all duration-300 font-bold text-slate-700 shadow-sm hover:shadow-md active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          الدخول باستخدام جوجل
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen paper-texture pb-20">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-4 mb-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl">
              <Notebook className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900">أرشيف الكلجات</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 py-1 px-3 rounded-full border border-slate-100">
              {user.photoURL ? (
                <img src={user.photoURL} className="w-6 h-6 rounded-full shadow-sm" alt="avatar" />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-[10px] font-bold text-slate-600 hidden sm:inline">{user.displayName || 'مستخدم'}</span>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4">
        <section className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl">
            <button 
              onClick={() => setCategory('slip')} 
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${category === 'slip' ? 'bg-white text-teal-600 shadow-md' : 'text-slate-400'}`}
            >
              كلجة 🙊
            </button>
            <button 
              onClick={() => setCategory('joke')} 
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${category === 'joke' ? 'bg-white text-violet-600 shadow-md' : 'text-slate-400'}`}
            >
              ذبة 🔥
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 mr-2">اسم الضحية</label>
              <input 
                type="text" 
                value={victimName} 
                onChange={(e) => setVictimName(e.target.value)} 
                placeholder="من هو بطل الكلجة؟" 
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-base outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 mr-2">ماذا حدث؟</label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder={category === 'slip' ? "اكتب الخطأ النطقي حرفياً..." : "وثق الذبة التاريخية..."}
                rows={2} 
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-base outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-50 transition-all resize-none"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${category === 'joke' ? 'bg-violet-600 shadow-violet-200' : 'bg-teal-600 shadow-teal-200'} shadow-lg`}
            >
              {isSubmitting ? 'جاري التوثيق...' : (
                <>
                  <Send className="w-5 h-5" />
                  توثيق اللحظة للأبد
                </>
              )}
            </button>
          </form>
        </section>

        <div className="mb-8 relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-teal-500 transition-colors" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="ابحث في تاريخ الضحايا..." 
            className="w-full bg-white border border-slate-100 rounded-2xl pr-12 pl-4 py-4 text-base outline-none focus:border-slate-300 shadow-sm transition-all" 
          />
        </div>

        <SlipStats data={statsData} />

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-tight">الأرشيف الحي</h2>
          </div>
          
          <div className="grid gap-6">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="group relative animate-in fade-in slide-in-from-top-2 duration-300">
                <EntryCard 
                  entry={{...entry, userName: entry.victimName} as any} 
                  onDelete={entry.userId === user.uid ? () => deleteEntry(entry.id) : undefined}
                  isAdmin={entry.userId === user.uid}
                />
                {entry.aiAnalysis && (
                  <div className="mt-2 mr-6 ml-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 border-dashed">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-bold leading-relaxed">
                      <span className="opacity-50">رأي الذكاء: </span> {entry.aiAnalysis}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredEntries.length === 0 && !loading && (
            <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-bold italic">لا يوجد نتائج.. الجميع يتحدث ببراعة اليوم!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
