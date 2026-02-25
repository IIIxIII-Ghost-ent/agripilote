import { useEffect, useState, useCallback, useMemo } from "react"
import { supabase } from "../lib/supabase"
import { db } from "../lib/db"
import { 
  ArrowLeft, Calendar, Sprout, ChevronDown, 
  CheckCircle2, Info, LayoutGrid, Sparkles,
  MapPin, Clock, ShieldCheck, Waves, TrendingUp,
  AlertCircle, HelpCircle, X, Microscope, TrendingDown
} from "lucide-react"

export default function ZoneDetails({ zone, user, zoneCultures, setZoneCultures, goBack }) {
  const [cultures, setCultures] = useState([])
  const [cultureId, setCultureId] = useState("")
  const [expandedCat, setExpandedCat] = useState(null)
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showGuide, setShowGuide] = useState(false) // Logique du Guide

  const categoriesDef = {
    "Céréales": { icon: "🌾", list: ["Mil", "Riz", "Maïs", "Sorgho", "Fonio", "Blé", "Orge"], accent: "amber" },
    "Légumineuses": { icon: "🫘", list: ["Arachide", "Niébé", "Pois d'Angole", "Soja", "Pois Bambara"], accent: "orange" },
    "Tubercules": { icon: "🥔", list: ["Manioc", "Patate douce", "Igname"], accent: "yellow" },
    "Légumes": { icon: "🍅", list: ["Oignon", "Tomate", "Gombo", "Chou", "Laitue"], accent: "rose" },
    "Fruits": { icon: "🍉", list: ["Mangue", "Banane", "Papaye", "Fraise", "Ananas", "Avocat", "Goyave", "Citron", "Pastèque"], accent: "pink" },
    "Rente & Épices": { icon: "🌿", list: ["Coton", "Anacardier", "Canne à sucre", "Sésame", "Bissap", "Gingembre", "Curcuma"], accent: "emerald" },
    "Fourrages": { icon: "🌱", list: ["Brachiaria", "Panicum", "Neem", "Moringa"], accent: "green" }
  }

  const activeCulture = zoneCultures.find(zc => zc.zone_id === zone.id)
  const selectedCultureData = cultures.find(c => c.id === (activeCulture?.culture_id || cultureId))

  const progress = useMemo(() => {
    if (!activeCulture) return 0;
    const start = new Date(activeCulture.date_debut);
    const today = new Date();
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(Math.round((diff / 90) * 100), 5), 100);
  }, [activeCulture]);

  const loadCulturesRef = useCallback(async () => {
    try {
      const local = await db.cultures.toArray()
      if (local.length) setCultures(local)
      if (navigator.onLine) {
        const { data } = await supabase.from("cultures").select("*").order("nom")
        if (data) {
          await db.cultures.bulkPut(data.map(c => ({ ...c, synced: 1 })))
          setCultures(data)
        }
      }
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => { loadCulturesRef() }, [loadCulturesRef])

  const formatFileName = (name) => {
    return name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') || "default"
  }

  const generateTasks = async (zoneCultureId, selectedCultureId, startDate) => {
    try {
      const { data: templates } = await supabase.from('culture_tasks').eq('culture_id', selectedCultureId)
      if (!templates) return []
      const tasksToCreate = templates.map(temp => {
        const d = new Date(startDate); d.setDate(d.getDate() + temp.offset_days)
        return {
          id: crypto.randomUUID(), user_id: user.id, zone_culture_id: zoneCultureId,
          titre: temp.titre, description: temp.description || "",
          date_prevue: d.toISOString().split('T')[0], termine: false, synced: 0
        }
      })
      await db.taches.bulkAdd(tasksToCreate)
      if (navigator.onLine) await supabase.from('taches').insert(tasksToCreate.map(({synced, ...t}) => t))
    } catch (err) { console.error(err) }
  }

  async function submit(e) {
    e.preventDefault()
    if (activeCulture || !cultureId || !dateDebut) return
    setLoading(true)
    setMessage("🌱 Analyse de la parcelle...")
    const newId = crypto.randomUUID()
    const newRecord = { id: newId, zone_id: zone.id, culture_id: cultureId, date_debut: dateDebut, user_id: user.id, created_at: new Date().toISOString(), synced: 0 }
    
    try {
      await db.zone_cultures.add(newRecord)
      setZoneCultures(prev => [...prev, newRecord])
      await generateTasks(newId, cultureId, dateDebut)
      if (navigator.onLine) {
        const { synced, ...toSupabase } = newRecord
        await supabase.from("zone_cultures").insert([toSupabase])
        await db.zone_cultures.update(newId, { synced: 1 })
      }
      setMessage("✨ Campagne initialisée avec succès")
    } catch (err) { setMessage("❌ Erreur réseau") } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 font-sans text-[#1A2E26] selection:bg-emerald-100">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")` }} />

      <div className="relative p-6 max-w-2xl mx-auto space-y-8 pt-10">
        
        {/* BOUTON GUIDE (Même logique que Dashboard) */}
        <div className="flex justify-between items-center px-2">
            <button 
              onClick={goBack}
              className="w-11 h-11 rounded-2xl bg-white border border-[#E8E2D9] flex items-center justify-center text-[#1A2E26] active:scale-90 transition-all"
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

        {/* HEADER PREMIUM */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-8 text-white shadow-2xl">
          {showGuide && (
            <div className="absolute inset-0 z-20 bg-[#1A2E26]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
              <LayoutGrid className="text-amber-400 mb-2" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Identité de Zone</p>
              <p className="text-sm font-serif italic text-emerald-50 max-w-[240px]">Retrouvez ici les détails techniques et la localisation de votre parcelle.</p>
            </div>
          )}
          <div className="relative z-10 text-center space-y-2 pt-4">
            <div className="flex justify-center items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 opacity-90">Exploitation</span>
            </div>
            <h1 className="text-4xl font-serif font-medium tracking-tight italic">{zone.nom}</h1>
            <div className="flex items-center justify-center gap-3">
                <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2 border border-white/10">
                    <LayoutGrid size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{zone.surface} ha</span>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2 border border-white/10">
                    <MapPin size={12} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Secteur A</span>
                </div>
            </div>
          </div>
          <Waves className="absolute right-[-20px] bottom-[-20px] text-white/5 w-40 h-40 -rotate-12" />
        </header>

        {activeCulture ? (
          /* --- ÉTAT PRODUCTION ACTIVE --- */
          <div className="space-y-6 animate-in fade-in duration-1000">
            <div className="bg-white rounded-[3rem] p-8 border border-[#E8E2D9] shadow-sm relative overflow-hidden group">
                {showGuide && (
                  <div className="absolute inset-0 z-20 bg-[#1A2E26]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                    <TrendingUp className="text-emerald-400 mb-2" size={32} />
                    <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Suivi de Croissance</p>
                    <p className="text-xs text-emerald-50 font-medium">Visualisez l'évolution de votre culture en temps réel depuis le semis.</p>
                  </div>
                )}
                <div className="flex justify-between items-start mb-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Culture actuelle</p>
                        <h2 className="text-3xl font-serif font-bold text-[#1A2E26]">{selectedCultureData?.nom}</h2>
                    </div>
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl p-4 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                        <img 
                            src={`/assets/cultures/${formatFileName(selectedCultureData?.nom)}.svg`} 
                            className="w-full h-full object-contain drop-shadow-md"
                            onError={(e) => e.target.src = "/assets/cultures/default.svg"}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <TrendingUp size={10} /> En croissance
                        </span>
                        <span className="text-2xl font-black text-[#1A2E26] tabular-nums">{progress}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-50">
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A2E26] p-6 rounded-[2.5rem] text-white flex flex-col justify-between h-40 shadow-lg relative overflow-hidden">
                    {showGuide && (
                      <div className="absolute inset-0 z-20 bg-amber-500/95 p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                        <p className="text-[9px] font-black uppercase text-white">Chronologie</p>
                        <p className="text-[10px] text-white leading-tight mt-1">Date exacte où vous avez lancé ce cycle.</p>
                      </div>
                    )}
                    <Calendar className="text-amber-400 opacity-50" size={24} />
                    <div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Date de semis</p>
                        <p className="text-lg font-bold">{new Date(activeCulture.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-[#E8E2D9] flex flex-col justify-between h-40 shadow-sm relative overflow-hidden group">
                    {showGuide && (
                      <div className="absolute inset-0 z-20 bg-emerald-600/95 p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                        <p className="text-[9px] font-black uppercase text-white">État Sanitaire</p>
                        <p className="text-[10px] text-white leading-tight mt-1">Analyse automatique de la vitalité de vos plants.</p>
                      </div>
                    )}
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Santé Parcelle</p>
                        <p className="text-lg font-bold text-[#1A2E26]">Optimale</p>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 rounded-[2rem] p-5 border border-amber-100 flex items-center gap-4 relative overflow-hidden">
                {showGuide && (
                  <div className="absolute inset-0 z-20 bg-amber-500/95 p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                    <Sparkles className="text-white mb-1" size={20} />
                    <p className="text-[10px] text-white font-bold italic">Prédictions intelligentes pour anticiper vos récoltes.</p>
                  </div>
                )}
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                    <Sparkles size={20} />
                </div>
                <p className="text-[11px] text-amber-900 leading-snug font-medium">
                    L'IA prévoit une récolte d'ici <b>45 jours</b>. Les conditions météo sont favorables cette semaine.
                </p>
            </div>
          </div>
        ) : (
          /* --- ÉTAT CONFIGURATION --- */
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
            <div className="space-y-1 relative">
                <h2 className="text-2xl font-serif font-bold">Lancer une culture</h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Étape 1 : Sélection biologique</p>
                {showGuide && (
                  <div className="absolute -top-4 -right-2 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-bounce">
                    CHOISISSEZ VOTRE PLANTE ICI
                  </div>
                )}
            </div>

            <div className="space-y-3">
              {Object.entries(categoriesDef).map(([catName, details]) => {
                const isExpanded = expandedCat === catName;
                return (
                  <div key={catName} className="group relative">
                    <button 
                      onClick={() => setExpandedCat(isExpanded ? null : catName)}
                      className={`w-full p-5 flex items-center justify-between transition-all duration-300 rounded-[2rem] border-2 ${
                        isExpanded ? 'bg-white border-[#1A2E26] shadow-xl translate-y-[-2px]' : 'bg-white border-[#E8E2D9] text-slate-500 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-12 h-12 flex items-center justify-center rounded-2xl text-2xl transition-transform ${isExpanded ? 'bg-emerald-50 scale-110' : 'bg-[#FDFCF9]'}`}>
                          {details.icon}
                        </span>
                        <span className={`font-black text-[11px] uppercase tracking-[0.15em] ${isExpanded ? 'text-[#1A2E26]' : ''}`}>{catName}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-[#1A2E26] text-white rotate-180' : 'bg-slate-50 text-slate-300'}`}>
                        <ChevronDown size={16} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300">
                        {cultures.filter(c => details.list.includes(c.nom)).map(c => (
                          <button
                            key={c.id}
                            onClick={() => setCultureId(c.id)}
                            className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all group/item ${
                              cultureId === c.id 
                              ? 'bg-[#1A2E26] border-[#1A2E26] text-white shadow-lg' 
                              : 'bg-white border-slate-50 text-slate-600 hover:border-emerald-100'
                            }`}
                          >
                            <div className={`w-14 h-14 p-3 rounded-2xl transition-transform ${cultureId === c.id ? 'bg-white/10' : 'bg-[#FDFCF9] group-hover/item:scale-110'}`}>
                                <img 
                                    src={`/assets/cultures/${formatFileName(c.nom)}.svg`} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => e.target.src = "/assets/cultures/default.svg"}
                                />
                            </div>
                            <span className="text-[10px] font-black uppercase text-center tracking-tighter leading-tight">{c.nom}</span>
                            {cultureId === c.id && <CheckCircle2 size={16} className="text-emerald-400 absolute top-4 right-4 animate-in zoom-in" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-6 pt-4">
                <div className="bg-white p-2 rounded-[2.5rem] border-2 border-[#E8E2D9] flex items-center gap-2 relative overflow-hidden">
                    {showGuide && (
                      <div className="absolute inset-0 z-20 bg-amber-500/90 backdrop-blur-sm flex items-center justify-center text-center px-4 animate-in fade-in duration-300">
                        <p className="text-[10px] text-white font-black uppercase">Sélectionnez la date de mise en terre pour générer votre calendrier.</p>
                      </div>
                    )}
                    <div className="w-14 h-14 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center text-emerald-600">
                        <Calendar size={22} />
                    </div>
                    <div className="flex-1 px-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date de mise en terre</p>
                        <input
                            type="date"
                            value={dateDebut}
                            onChange={e => setDateDebut(e.target.value)}
                            className="w-full bg-transparent font-bold text-lg text-[#1A2E26] outline-none"
                        />
                    </div>
                </div>

                <button
                    onClick={submit}
                    disabled={loading || !cultureId}
                    className="group relative w-full h-20 bg-[#1A2E26] rounded-[2.5rem] text-white font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-20 overflow-hidden"
                >
                    <div className="relative z-10 flex items-center justify-center gap-4">
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Initialiser le cycle</span>
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Sprout size={20} className="group-hover:rotate-12 transition-transform" />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                </button>
            </div>
          </div>
        )}

        {message && (
          <div className="fixed bottom-10 left-6 right-6 p-5 bg-[#1A2E26] text-white rounded-[2rem] flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 border border-white/10 z-[100]">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}