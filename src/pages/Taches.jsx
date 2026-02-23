import React, { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Droplets,
  Bug,
  Sprout,
  MapPin,
  ListChecks,
  History,
  Lock,
  CalendarDays,
  ChevronRight,
  HelpCircle,
  X,
  Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

export default function Taches({ user, setStep }) {
  const [taches, setTaches] = useState([])
  const [filter, setFilter] = useState('todo')
  const [showGuide, setShowGuide] = useState(false)

  // PERSISTANCE & NAVIGATION
  useEffect(() => {
    localStorage.setItem('currentStep', 'taches');
    const handlePopState = (e) => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getStatus = (t) => {
    const d = new Date(t.date_prevue)
    d.setHours(0, 0, 0, 0)
    if (t.termine) return 'done'
    if (d.getTime() === today.getTime()) return 'today'
    if (d < today) return 'late'
    return 'future'
  }

  const loadData = async () => {
    if (!user?.id) return;
    const local = await db.tasks.where('user_id').equals(user.id).toArray()
    setTaches(local)
    
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('taches')
        .select(`*, zone_cultures (zones (nom))`)
        .eq('user_id', user.id)

      if (data && !error) {
        const pendingIds = new Set(local.filter(t => t.sync_status === 'pending').map(t => t.id));
        const formatted = data.map(t => ({
          ...t,
          user_id: user.id,
          sync_status: pendingIds.has(t.id) ? 'pending' : 'synced',
          nom_zone: t.zone_cultures?.zones?.nom || 'Zone inconnue'
        }))

        for (const t of formatted) { 
          if (!pendingIds.has(t.id)) { await db.tasks.put(t) }
        }
        const finalLocal = await db.tasks.where('user_id').equals(user.id).toArray()
        setTaches(finalLocal)
      }
    }
  }

  useEffect(() => { loadData(); }, [user?.id]);

  const toggleTask = async (e, t) => {
    e.preventDefault();
    e.stopPropagation();
    if (getStatus(t) === 'future') return 
    const updated = { ...t, termine: !t.termine, sync_status: 'pending' }
    await db.tasks.put(updated)
    setTaches(prev => prev.map(x => x.id === t.id ? updated : x))

    if (navigator.onLine) {
      const { error } = await supabase.from('taches').update({ termine: updated.termine }).eq('id', t.id)
      if (!error) {
        await db.tasks.update(t.id, { sync_status: 'synced' })
        setTaches(prev => prev.map(x => x.id === t.id ? { ...updated, sync_status: 'synced' } : x))
      }
    }
  }

  const summary = useMemo(() => ({
    total: taches.filter(t => !t.termine).length,
    late: taches.filter(t => getStatus(t) === 'late' && !t.termine).length,
    today: taches.filter(t => getStatus(t) === 'today' && !t.termine).length,
    done: taches.filter(t => t.termine).length
  }), [taches]);

  const filtered = useMemo(() => {
    let list = [...taches]
    list.sort((a, b) => new Date(a.date_prevue) - new Date(b.date_prevue))
    if (filter === 'done') return list.filter(t => t.termine)
    if (filter === 'todo') return list.filter(t => !t.termine)
    return list
  }, [filter, taches])

  const getTaskIcon = (titre) => {
    const t = titre?.toLowerCase() || '';
    if (t.includes('arrosage')) return <Droplets size={22} />;
    if (t.includes('traitement')) return <Bug size={22} />;
    if (t.includes('fertilisation')) return <Sprout size={22} />;
    return <ListChecks size={22} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 font-sans text-[#1A2E26]">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '80px 80px' }} />

      <div className="relative p-6 max-w-2xl mx-auto space-y-8 pt-10">
        
        <div className="flex justify-between items-center px-2">
           <button 
            onClick={() => setStep('dashboard')}
            className="w-10 h-10 rounded-2xl bg-white border border-[#E8E2D9] flex items-center justify-center text-[#1A2E26] active:scale-90 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${showGuide ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-emerald-800 border border-[#E8E2D9]'}`}
          >
            {showGuide ? <X size={16} /> : <HelpCircle size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{showGuide ? "Fermer" : "Guide"}</span>
          </button>
        </div>

        <header className="relative overflow-hidden bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-8 text-white shadow-xl">
          {showGuide && (
            <div className="absolute inset-0 z-20 bg-[#1A2E26]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
              <Calendar className="text-amber-400 mb-2" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Journal de Bord</p>
              <p className="text-sm font-serif italic text-emerald-50 max-w-[240px]">Suivez l'état de synchronisation et l'avancement global de vos travaux.</p>
            </div>
          )}
          <div className="relative z-10 text-center space-y-2 pt-4">
            <div className="flex justify-center items-center gap-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Journal de Culture</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-3xl font-serif font-medium">Mes Tâches</h1>
            <div className="flex items-center justify-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${navigator.onLine ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`} />
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">{navigator.onLine ? 'Cloud Synchronisé' : 'Mode Local'}</p>
            </div>
          </div>
          <Calendar className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32 rotate-12" />
        </header>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative overflow-hidden bg-emerald-600 p-6 rounded-[2.5rem] text-white shadow-lg group">
            {showGuide && (
              <div className="absolute inset-0 z-20 bg-amber-500/95 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <Clock className="text-white mb-1" size={20} />
                <p className="text-[10px] text-white font-bold leading-tight">Tâches prévues pour aujourd'hui.</p>
              </div>
            )}
            <div className="relative z-10">
              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Aujourd'hui</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-black tracking-tighter">{summary.today}</span>
                <span className="text-[10px] font-bold opacity-60 uppercase">Jobs</span>
              </div>
            </div>
            <Clock className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700" size={100} />
          </div>

          <div className="relative overflow-hidden bg-orange-600 p-6 rounded-[2.5rem] text-white shadow-lg group">
            {showGuide && (
              <div className="absolute inset-0 z-20 bg-amber-500/95 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <AlertTriangle className="text-white mb-1" size={20} />
                <p className="text-[10px] text-white font-bold leading-tight">Travaux en retard à prioriser d'urgence.</p>
              </div>
            )}
            <div className="relative z-10">
              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">En Retard</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-black tracking-tighter">{summary.late}</span>
                <span className="text-[10px] font-bold opacity-60 uppercase">Urgent</span>
              </div>
            </div>
            <AlertTriangle className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" size={100} />
          </div>
        </div>

        <div className="bg-white p-1.5 rounded-[2rem] flex gap-1 border border-[#E8E2D9] shadow-sm">
          <FilterButton active={filter === 'todo'} onClick={() => setFilter('todo')} label="À faire" icon={<ListChecks size={16}/>} />
          <FilterButton active={filter === 'done'} onClick={() => setFilter('done')} label="Terminées" icon={<History size={16}/>} />
        </div>

        <section className="space-y-4 relative">
          {showGuide && filtered.length > 0 && (
            <div className="absolute inset-x-0 -top-2 z-20 bg-amber-500/95 backdrop-blur-md rounded-[2rem] p-4 flex items-center gap-4 text-white animate-in slide-in-from-top-4 duration-300 border border-white/20 shadow-lg">
              <Info size={24} className="shrink-0" />
              <p className="text-[11px] font-bold leading-snug">Cliquez sur le cercle à gauche pour valider une tâche. Les tâches à venir sont verrouillées.</p>
            </div>
          )}
          
          {filtered.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-16 border-2 border-dashed border-emerald-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mb-4 shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-sm font-medium text-slate-400 font-serif italic">Tout est en ordre dans vos champs.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {filtered.map(t => {
                const status = getStatus(t);
                const isLate = status === 'late' && !t.termine;
                const isToday = status === 'today' && !t.termine;
                const isFuture = status === 'future';

                return (
                  <div
                    key={t.id}
                    className={`group bg-white rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden
                      ${t.termine ? 'opacity-60 border-transparent bg-slate-50' : 
                        isLate ? 'border-rose-100 shadow-md ring-1 ring-rose-500/5' : 
                        isToday ? 'border-emerald-100 shadow-md' : 'border-[#E8E2D9]'}
                    `}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* CASE À COCHER / ETAT */}
                        <button
                          disabled={isFuture}
                          onClick={(e) => toggleTask(e, t)}
                          className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all relative
                            ${t.termine 
                              ? 'bg-emerald-600 text-white' 
                              : isFuture 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-white border-2 border-slate-100 text-slate-300 group-hover:border-emerald-300 shadow-sm'}
                            ${!isFuture && 'active:scale-90'}
                          `}
                        >
                          {t.termine ? <CheckCircle2 size={26} strokeWidth={2.5} /> : 
                           isFuture ? <Lock size={20} /> : <div className="w-6 h-6 rounded-lg border-2 border-current" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* BADGES D'ÉTAT */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {isLate && (
                              <span className="bg-rose-50 text-rose-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                <AlertTriangle size={10} /> Retard
                              </span>
                            )}
                            {isToday && (
                              <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                <Clock size={10} /> Aujourd'hui
                              </span>
                            )}
                            {isFuture && (
                              <span className="bg-slate-50 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                <CalendarDays size={10} /> À venir
                              </span>
                            )}
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                              {t.type_tache || 'Entretien'}
                            </span>
                          </div>

                          <h4 className={`font-bold text-lg leading-tight mb-1 ${t.termine ? 'line-through text-slate-400' : 'text-[#1A2E26]'}`}>
                            {t.titre}
                          </h4>
                          
                          {/* DESCRIPTION */}
                          {t.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3 font-medium italic">
                              {t.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <MapPin size={10} />
                                {t.nom_zone || '...'}
                             </div>
                             <div className={`flex items-center gap-1 text-[10px] font-bold ${isLate ? 'text-orange-600' : 'text-slate-400'}`}>
                                <Clock size={10} />
                                {t.heure_prevue || '06:00'} • {new Date(t.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                             </div>
                          </div>
                        </div>

                        {/* ICONE CATEGORIE */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${t.termine ? 'bg-slate-100 text-slate-300' : 'bg-emerald-50 text-emerald-600'}`}>
                           {getTaskIcon(t.titre)}
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS BAR SYNC */}
                    {t.sync_status === 'pending' && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-400/30">
                        <div className="h-full bg-amber-400 animate-[progress_2s_ease-in-out_infinite] w-1/3" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, label, icon }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`flex-1 py-4 px-2 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
        ${active ? 'bg-[#1A2E26] text-white shadow-lg translate-y-[-1px]' : 'text-slate-400 hover:bg-slate-50'}
      `}
    >
      {icon}
      {label}
    </button>
  )
}