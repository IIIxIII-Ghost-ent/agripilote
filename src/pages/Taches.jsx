import React, { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Droplets,
  Bug,
  Sprout,
  ListChecks,
  History,
  Lock,
  CalendarDays,
  HelpCircle,
  Search,
  Check,
  ChevronDown,
  Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

export default function Taches({ user, setStep }) {
  const [taches, setTaches] = useState([])
  const [filter, setFilter] = useState('todo') 
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZone, setSelectedZone] = useState('all')
  const [expandedTask, setExpandedTask] = useState(null)
  
  // LOGIQUE DU GUIDE (Exactement comme Parcelles)
  const [guideStep, setGuideStep] = useState(0);

  // --- LOGIQUE COULEURS ---
  const getZoneStyle = (zoneNom) => {
    if (!zoneNom || zoneNom === 'all') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' };
    const hash = zoneNom.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const colors = [
      { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
      { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
      { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
      { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' }
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const loadData = async () => {
    if (!user?.id) return;
    const local = await db.tasks.where('user_id').equals(user.id).toArray();
    setTaches(local);
    
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('taches')
        .select(`*, zone_cultures ( cultures ( nom ), zones ( nom, parcelles ( nom ) ) )`)
        .eq('user_id', user.id);

      if (data && !error) {
        const formatted = data.map(t => ({
          ...t,
          user_id: user.id,
          sync_status: 'synced',
          nom_zone: t.zone_cultures?.zones?.nom || 'Zone inconnue',
          nom_parcelle: t.zone_cultures?.zones?.parcelles?.nom || 'Exploitation inconnue',
          nom_culture: t.zone_cultures?.cultures?.nom || ''
        }));
        await db.tasks.bulkPut(formatted);
        setTaches(formatted);
      }
    }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getStatus = (t) => {
    const d = new Date(t.date_prevue);
    d.setHours(0, 0, 0, 0);
    if (t.termine) return 'done';
    if (d.getTime() === today.getTime()) return 'today';
    if (d < today) return 'late';
    return 'future';
  };

  const zonesList = useMemo(() => {
    const zones = taches
      .map(t => ({ key: `${t.nom_parcelle}||${t.nom_zone}`, label: `${t.nom_parcelle} • ${t.nom_zone}`, nom_zone: t.nom_zone }))
      .filter(z => z.nom_zone);
    const uniqueZones = Array.from(new Map(zones.map(z => [z.key, z])).values());
    return [{ key: 'all', label: 'Toutes les zones' }, ...uniqueZones];
  }, [taches]);

  const filteredTasks = useMemo(() => {
    return taches
      .filter(t => {
        const matchesFilter = filter === 'todo' ? !t.termine : t.termine;
        const matchesSearch = t.titre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.nom_zone?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesZone = selectedZone === 'all' || `${t.nom_parcelle}||${t.nom_zone}` === selectedZone;
        return matchesFilter && matchesSearch && matchesZone;
      })
      .sort((a, b) => new Date(a.date_prevue) - new Date(b.date_prevue));
  }, [taches, filter, searchQuery, selectedZone]);

  const summary = useMemo(() => ({
    today: taches.filter(t => getStatus(t) === 'today' && !t.termine).length,
    late: taches.filter(t => getStatus(t) === 'late' && !t.termine).length,
  }), [taches]);

  const toggleTask = async (t) => {
    if (getStatus(t) === 'future' && !t.termine) return;
    const updated = { ...t, termine: !t.termine, sync_status: 'pending' };
    setTaches(prev => prev.map(x => x.id === t.id ? updated : x));
    await db.tasks.put(updated);
    if (navigator.onLine) {
      const { error } = await supabase.from('taches').update({ termine: updated.termine }).eq('id', t.id);
      if (!error) await db.tasks.update(t.id, { sync_status: 'synced' });
    }
  };

  const getTaskIcon = (titre) => {
    const t = titre?.toLowerCase() || '';
    if (t.includes('arrosage')) return <Droplets size={22} />;
    if (t.includes('traitement')) return <Bug size={22} />;
    return <ListChecks size={22} />;
  }

  // COMPOSANT BULLE D'AIDE - IDENTIQUE À PARCELLES
  const TutorialPopUp = ({ title, text, position = "bottom" }) => (
    <div className={`absolute left-1/2 -translate-x-1/2 z-[500] w-[280px] animate-in zoom-in-95 duration-300 ${position === 'bottom' ? 'top-full mt-6' : 'bottom-full mb-6'}`}>
      <div className="bg-white border-2 border-amber-400 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] text-center relative">
        <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-amber-400 rotate-45 ${position === 'bottom' ? '-top-2.5' : '-bottom-2.5 rotate-[225deg]'}`} />
        <div className="flex justify-center mb-2">
            <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Guide • {guideStep}/3</div>
        </div>
        <h4 className="text-[#1A2E26] font-black text-xs uppercase tracking-widest mb-2">{title}</h4>
        <p className="text-slate-600 text-[13px] font-bold leading-snug mb-5">{text}</p>
        <div className="flex gap-2">
            {guideStep > 1 && (
                <button onClick={(e) => {e.stopPropagation(); setGuideStep(p => p-1)}} className="flex-1 py-3 rounded-2xl bg-slate-100 text-[#1A2E26] text-[10px] font-black uppercase">Retour</button>
            )}
            <button 
                onClick={(e) => {e.stopPropagation(); guideStep < 3 ? setGuideStep(p => p+1) : setGuideStep(0)}} 
                className="flex-[2] bg-emerald-700 text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform"
            >
                {guideStep === 3 ? "Terminer" : "Suivant"}
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 font-sans text-[#1A2E26]">
      {/* BOUTON AIDE FLOTTANT */}
      <button 
        onClick={() => setGuideStep(1)}
        className="fixed bottom-24 right-6 z-[400] w-14 h-14 bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all border-4 border-white"
      >
        <HelpCircle size={28} />
      </button>

      {/* OVERLAY TUTO */}
      {guideStep > 0 && (
        <div className="fixed inset-0 bg-[#1A2E26]/80 backdrop-blur-[3px] z-[150] transition-opacity duration-500" onClick={() => setGuideStep(0)} />
      )}

      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")` }} />

      <div className="relative p-6 max-w-2xl mx-auto space-y-6 pt-10">
        
        <div className="flex justify-between items-center px-2">
          <button onClick={() => setStep('dashboard')} className="w-10 h-10 rounded-2xl bg-white border border-[#E8E2D9] flex items-center justify-center shadow-sm active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* HEADER - ÉTAPE 1 */}
        <header className={`relative overflow-visible bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-8 text-white shadow-xl transition-all duration-500 ${guideStep === 1 ? 'z-[200] scale-[1.02] ring-4 ring-amber-400' : 'z-10'}`}>
          {guideStep === 1 && <TutorialPopUp title="Planning Intelligent" text="Retrouvez ici toutes les interventions prévues sur vos parcelles." />}
          <div className="relative z-10 text-center space-y-2">
            <div className="flex justify-center items-center gap-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Carnet de Travail</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-3xl font-serif font-medium italic">Mon Planning</h1>
          </div>
          <Calendar className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32 rotate-12" />
        </header>

        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Aujourd'hui" value={summary.today} color="emerald" icon={<Clock />} />
          <StatCard label="En Retard" value={summary.late} color={summary.late > 0 ? "red" : "orange"} icon={<AlertTriangle />} />
        </div>

        {/* FILTRES - ÉTAPE 2 */}
        <section className={`relative overflow-visible bg-white rounded-[2.5rem] border border-[#E8E2D9] p-4 shadow-sm space-y-3 transition-all duration-500 ${guideStep === 2 ? 'z-[200] scale-[1.02] ring-4 ring-amber-400' : 'z-10'}`}>
          {guideStep === 2 && <TutorialPopUp title="Recherche & Zones" text="Filtrez vos tâches par nom ou sélectionnez une zone spécifique pour y voir plus clair." />}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Chercher une tâche..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FDFCF9] border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {zonesList.map(zone => {
              const style = getZoneStyle(zone.nom_zone);
              const isActive = selectedZone === zone.key;
              return (
                <button
                  key={zone.key}
                  onClick={() => setSelectedZone(zone.key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all border
                    ${isActive ? 'bg-[#1A2E26] text-white border-[#1A2E26]' : `${style.bg} ${style.text} ${style.border}`}`}
                >
                  {zone.label}
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex p-1.5 bg-[#E8E2D9]/30 rounded-[2rem] gap-1">
          <TabBtn active={filter === 'todo'} onClick={() => setFilter('todo')} label={`À faire (${filteredTasks.length})`} icon={<ListChecks size={16}/>} />
          <TabBtn active={filter === 'done'} onClick={() => setFilter('done')} label="Terminées" icon={<History size={16}/>} />
        </div>

        {/* LISTE - ÉTAPE 3 */}
        <section className={`relative space-y-4 transition-all duration-500 ${guideStep === 3 ? 'z-[200]' : 'z-10'}`}>
          {guideStep === 3 && <TutorialPopUp title="Validation" text="Cochez le bouton à gauche pour valider une tâche. Cliquez sur le titre pour voir les détails." position="top" />}
          
          <div className={`space-y-4 rounded-[2.5rem] transition-all ${guideStep === 3 ? 'bg-white p-2 ring-4 ring-amber-400' : ''}`}>
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-16 border-2 border-dashed border-emerald-100 text-center italic text-slate-400">
                Aucune tâche trouvée
              </div>
            ) : (
              filteredTasks.map((t) => (
                <TaskItem 
                  key={t.id} 
                  t={t} 
                  status={getStatus(t)} 
                  onToggle={() => toggleTask(t)} 
                  icon={getTaskIcon(t.titre)}
                  isExpanded={expandedTask === t.id}
                  onExpand={() => setExpandedTask(expandedTask === t.id ? null : t.id)}
                  zoneStyle={getZoneStyle(t.nom_zone)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// COMPOSANTS INTERNES
function StatCard({ label, value, color, icon }) {
  const themes = {
    emerald: 'bg-emerald-700 text-white',
    orange: 'bg-orange-600 text-white',
    red: 'bg-rose-700 text-white animate-pulse'
  }
  return (
    <div className={`${themes[color]} p-6 rounded-[2.5rem] shadow-lg relative overflow-hidden`}>
      <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-4xl font-black">{value}</span>
        <span className="text-[10px] font-bold opacity-60 uppercase">Jobs</span>
      </div>
      {React.cloneElement(icon, { className: "absolute -right-4 -bottom-4 opacity-10 size-24" })}
    </div>
  )
}

function TabBtn({ active, onClick, label, icon }) {
  return (
    <button onClick={onClick} className={`flex-1 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${active ? 'bg-white text-[#1A2E26] shadow-sm' : 'text-slate-500'}`}>
      {icon} {label}
    </button>
  )
}

function TaskItem({ t, status, onToggle, icon, isExpanded, onExpand, zoneStyle }) {
  const isLate = status === 'late' && !t.termine;
  const isToday = status === 'today' && !t.termine;
  const isFuture = status === 'future';

  return (
    <div 
      onClick={onExpand}
      className={`bg-white rounded-[2.5rem] border border-[#E8E2D9] transition-all duration-300 relative overflow-hidden cursor-pointer ${t.termine ? 'opacity-60 bg-slate-50' : 'hover:shadow-md'}`}
    >
      <div className="p-5 flex items-center gap-4">
        <button
          disabled={isFuture && !t.termine}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all ${t.termine ? 'bg-emerald-600 text-white' : isFuture ? 'bg-slate-100 text-slate-300' : 'bg-white border-2 border-slate-200 text-slate-300'}`}
        >
          {t.termine ? <Check size={24} strokeWidth={3} /> : isFuture ? <Lock size={18} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {isLate && <span className="bg-red-50 text-red-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">Retard</span>}
            {isToday && <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">Aujourd'hui</span>}
            <span className={`${zoneStyle.bg} ${zoneStyle.text} text-[8px] font-black uppercase px-2 py-0.5 rounded-lg`}>{t.nom_zone}</span>
          </div>
          <h4 className={`font-bold text-base truncate ${t.termine ? 'line-through' : ''}`}>{t.titre}</h4>
          <div className="flex items-center gap-3 mt-1.5 opacity-60">
             <div className="flex items-center gap-1 text-[10px] font-bold">
               <CalendarDays size={12} />
               {new Date(t.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
             </div>
             <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.termine ? 'bg-slate-200 text-slate-400' : 'bg-[#FDFCF9] border border-[#E8E2D9] text-emerald-600'}`}>
          {icon}
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-50 bg-slate-50/30">
          <div className="flex items-start gap-3">
             <Info size={14} className="mt-1 text-emerald-600" />
             <p className="text-xs font-medium text-slate-600 leading-relaxed">{t.description || "Aucune consigne particulière."}</p>
          </div>
        </div>
      )}
    </div>
  )
}