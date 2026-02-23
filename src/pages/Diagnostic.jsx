import React, { useEffect, useState, useMemo } from 'react'
import {
  Microscope, CheckCircle2, Trash2, ArrowLeft,
  Cloud, Sparkles, AlertCircle, History, 
  RefreshCw, ChevronRight, Info, ShieldCheck, 
  Sprout, MapPin, X, Leaf, TreeDeciduous, Cherry, Settings2, Calendar, Activity,
  SearchX, AlertTriangle, HelpCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

const SYMPTOM_MAP = {
  "Base de la tige noire ou brune": "tige_noire.svg",
  "Taches en mosaïque (vert clair / vert foncé)": "mosaique.svg",
  "Gousses vides": "gousse_vide.svg",
  "Galeries blanches dans la feuille": "galerie_blanche.svg",
  "Chancre sur le tronc": "chancre.svg",
  "Épis vides": "epi_vide.svg",
  "Feuilles très pâles, presque blanches": "feuille_pale.svg",
  "Fruits petits ou déformés": "fruit_deforme.svg",
  "Tige molle et pourrie": "tige_pourrie.svg",
  "Galles sur les racines": "galle_racine.svg",
  "Feuilles mangées sur les bords": "feuille_mangee.svg",
  "Jaunissement entre les veines (veines vertes)": "chlorose.svg",
  "Moisissure": "moisissure_legume.svg",
  "Graines couvertes de poudre": "graine_poudre.svg",
  "Plante flétrie sol humide": "fletri_humide.svg",
  "Insectes visibles": "insecte.svg",
  "Feuilles jaunes au sommet (jeunes feuilles)": "feuille_jaune_sommet.svg",
  "Eau stagnante": "eau_stagnante.svg",
  "Poussière orange ou marron (rouille)": "rouille.svg",
  "Feuilles rabougries ou recroquevillées": "feuille_recroqueville.svg",
  "Plante sectionnée au niveau du sol": "plante_coupee.svg",
  "Présence de Striga": "striga.svg",
  "Taches brunes": "tache_brune.svg",
  "Petites taches noires ou brunes": "tache_noire.svg",
  "Mort subite de la plante": "mort_subite.svg",
  "Feuilles totalement jaunes (vieilles feuilles en bas)": "feuille_jaune_base.svg",
  "Taches grasses ou huileuses": "tache_huileuse.svg",
  "Tubercules tachetés à l’intérieur": "tubercule_tache.svg",
  "Grandes taches rondes concentriques": "tache_concentrique.svg",
  "Zones brunes ou noires sur les feuilles": "zone_brune.svg",
  "Feuilles jaunes": "feuille_jaune.svg",
  "Poussière blanche sur les feuilles": "poudre_blanche.svg",
  "Écorce qui se fend ou tombe": "ecorce_fendue.svg",
  "Moisissure grise ou duvet cotonneux": "moisissure_grise.svg",
  "Tige creuse ou fragile": "tige_creuse.svg",
  "Tubercules pourris en terre": "tubercule_pourri.svg",
  "Grains noirs ou poudreux": "grain_noir.svg",
  "Fruits fissurés ou éclatés": "fruit_fissure.svg",
  "Liquide collant sur l’écorce": "gomme_ecorce.svg",
  "Fruits qui tombent avant maturité": "fruit_chute.svg",
  "Fleurs qui tombent avant fruit": "fleur_chute.svg",
  "Feuilles collantes (miellat)": "feuille_collante.svg",
  "Plante rabougrie": "plante_rabougrie.svg",
  "Fruits avec trous de piqûres": "fruit_pique.svg",
  "Croissance lente": "croissance_lente.svg",
  "Feuilles rouges ou violettes": "feuille_violette.svg",
  "Fleurs tachetées ou moisies": "fleur_moisie.svg",
  "Feuilles épaisses et dures": "feuille_epaisse.svg",
  "Racines noires et malodorantes": "racine_noire.svg",
  "Fruits tachetés ou pourris": "fruit_pourri.svg",
  "Absence totale de fleurs": "sans_fleur.svg",
  "Cœur mort de la plante": "coeur_mort.svg",
  "Toiles fines sous les feuilles": "toile_acarien.svg",
  "Feuilles qui s’enroulent ou se tordent": "feuille_enroulee.svg",
  "Feuilles très petites": "feuille_petite.svg",
  "Bords des feuilles brûlés ou grillés": "bord_brule.svg",
  "Petits points blancs ou jaunes": "points_blancs.svg",
  "Trous avec sciure (foreurs)": "trou_sciure.svg",
  "Fleurs déformées ou fermées": "fleur_deformee.svg",
  "Racines grignotées": "racine_grignote.svg"
};

export default function Diagnostic({ user, setStep }) {
  const [zones, setZones] = useState([])
  const [symptomes, setSymptomes] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [activeCategory, setActiveCategory] = useState('Feuilles')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [actions, setActions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [historyActions, setHistoryActions] = useState(null)
  const [diagError, setDiagError] = useState(null)
  const [showGuide, setShowGuide] = useState(false) // Logique de guide
  const online = navigator.onLine

  const categorizedSymptoms = useMemo(() => {
    const categories = {
      "Feuilles": { icon: <Leaf size={20}/>, color: "from-emerald-400 to-emerald-600", list: [] },
      "Tiges & Tronc": { icon: <TreeDeciduous size={20}/>, color: "from-amber-500 to-amber-700", list: [] },
      "Fruits & Fleurs": { icon: <Cherry size={20}/>, color: "from-rose-400 to-rose-600", list: [] },
      "Racines & Sol": { icon: <MapPin size={20}/>, color: "from-slate-500 to-slate-700", list: [] },
      "Global": { icon: <Settings2 size={20}/>, color: "from-indigo-400 to-indigo-600", list: [] }
    }

    symptomes.forEach(s => {
      const lib = s.libelle.toLowerCase();
      if (lib.includes('feuille') || lib.includes('veine') || lib.includes('mosaïque')) categories["Feuilles"].list.push(s);
      else if (lib.includes('tige') || lib.includes('tronc') || lib.includes('écorce') || lib.includes('chancre')) categories["Tiges & Tronc"].list.push(s);
      else if (lib.includes('fruit') || lib.includes('fleur') || lib.includes('gousse') || lib.includes('épi') || lib.includes('grain')) categories["Fruits & Fleurs"].list.push(s);
      else if (lib.includes('racine') || lib.includes('sol') || lib.includes('terre') || lib.includes('eau')) categories["Racines & Sol"].list.push(s);
      else categories["Global"].list.push(s);
    });

    return categories;
  }, [symptomes]);

  const getSymptomIconPath = (libelle) => {
    const filename = SYMPTOM_MAP[libelle] || "default.svg";
    return `/assets/symptomes/${filename}`;
  }

  const getCultureIconPath = (nom = '') => {
    const filename = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    return `/assets/cultures/${filename}.svg`;
  }

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      try {
        const zc = await db.zone_cultures.where('user_id').equals(user.id).toArray()
        const enriched = await Promise.all(
          zc.map(async z => {
            const culture = await db.cultures.get(z.culture_id)
            const zone = await db.zones.get(z.zone_id)
            return { ...z, culture_nom: culture?.nom, zone_nom: zone?.nom }
          })
        )
        setZones(enriched)
        const localHistory = await db.diagnostic_history.where('user_id').equals(user.id).reverse().sortBy('created_at')
        setHistory(localHistory)
        if (online) {
          const { data, error } = await supabase.from('historique_diagnostics').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
          if (data && !error) {
            await db.diagnostic_history.bulkPut(data.map(d => ({ ...d, synced: 1 })))
            const synced = await db.diagnostic_history.where('user_id').equals(user.id).reverse().sortBy('created_at')
            setHistory(synced)
          }
        }
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [user, online])

  useEffect(() => {
    if (!selectedZone) return
    const loadSymptoms = async () => {
      const maladies = await db.maladies.where('culture_id').equals(selectedZone.culture_id).toArray()
      const maladieIds = maladies.map(m => m.id)
      const links = await db.maladie_symptomes.where('maladie_id').anyOf(maladieIds).toArray()
      const linkedIds = [...new Set(links.map(l => l.symptome_id))]
      const linked = await db.symptomes.bulkGet(linkedIds)
      const general = await db.symptomes.filter(s => (s.specificite ?? 1) <= 2).toArray()
      const final = [...linked.filter(Boolean), ...general]
        .filter((s, i, a) => a.findIndex(x => x.id === s.id) === i)
        .sort((a, b) => (b.specificite ?? 1) - (a.specificite ?? 1))
      setSymptomes(final)
      setSelectedSymptoms([])
      setResult(null)
      setActions(null)
      setDiagError(null)
    }
    loadSymptoms()
  }, [selectedZone])

  const runDiagnostic = async () => {
    setDiagError(null)
    setResult(null)
    setActions(null)

    if (!selectedZone || selectedSymptoms.length === 0) return

    const selectedSymptomObjects = await db.symptomes
      .where('id')
      .anyOf(selectedSymptoms)
      .toArray()

    const strongCount = selectedSymptomObjects.filter(
      s => (s.specificite ?? 1) >= 4
    ).length

    const mediumCount = selectedSymptomObjects.filter(
      s => (s.specificite ?? 1) >= 3
    ).length

    if (
      strongCount === 0 &&
      mediumCount < 2 &&
      selectedSymptoms.length < 3
    ) {
      setDiagError({
        title: "Précision insuffisante",
        message:
          "Les symptômes sélectionnés sont trop généraux. Ajoutez des symptômes plus caractéristiques.",
        type: "warning"
      })
      return
    }

    const maladies = await db.maladies
      .where('culture_id')
      .equals(selectedZone.culture_id)
      .toArray()

    if (maladies.length === 0) return

    const maladieIds = maladies.map(m => m.id)

    const allLinks = await db.maladie_symptomes
      .where('maladie_id')
      .anyOf(maladieIds)
      .toArray()

    const scoreMap = {}

    for (const link of allLinks) {
      if (!selectedSymptoms.includes(link.symptome_id)) continue

      const symptome = selectedSymptomObjects.find(
        s => s.id === link.symptome_id
      )

      const poids = link.poids ?? 1
      const specificite = symptome?.specificite ?? 1

      if (!scoreMap[link.maladie_id]) {
        scoreMap[link.maladie_id] = 0
      }

      scoreMap[link.maladie_id] += poids * specificite
    }

    let best = null
    let bestScore = 0

    for (const m of maladies) {
      const score = scoreMap[m.id] ?? 0
      if (score > bestScore) {
        bestScore = score
        best = m
      }
    }

    const avgSpecificite =
      selectedSymptomObjects.reduce((a, s) => a + (s.specificite ?? 1), 0) /
      selectedSymptomObjects.length

    const minScore = Math.max(3, selectedSymptoms.length * avgSpecificite)
    if (!best || bestScore < minScore) {
      setDiagError({
        title: "Correspondance insuffisante",
        message:
          "Aucune maladie ne correspond suffisamment à cette combinaison.",
        type: "search"
      })
      return
    }

    const confidence = Math.min(
      95,
      Math.round(50 + (bestScore / (selectedSymptoms.length * 5)) * 40)
    )

    let actionsData = null

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('actions_prioritaires')
        .select('*')
        .eq('culture_id', selectedZone.culture_id)
        .eq('maladie_id', best.id)
        .single()

      if (!error && data) {
        actionsData = data
        await db.actions_prioritaires.put(data)
      }
    } else {
      actionsData = await db.actions_prioritaires
        .where('[culture_id+maladie_id]')
        .equals([selectedZone.culture_id, best.id])
        .first()
    }

    const record = {
      id: crypto.randomUUID(),
      user_id: user.id,
      zone_id: selectedZone.id,
      maladie_nom: best.nom,
      confidence,
      created_at: new Date().toISOString(),
      actions_snapshot: actionsData
        ? {
            actions_bio: actionsData.actions_bio,
            prevention: actionsData.prevention,
            conseil: actionsData.conseil,
            niveau_urgence: actionsData.niveau_urgence,
            maladie_nom: best.nom,
            culture_nom: selectedZone.culture_nom,
            date: new Date().toISOString(),
            confidence
          }
        : null,
      synced: 0
    }

    await db.diagnostic_history.add(record)
    setHistory(h => [record, ...h])
    setResult({ ...best, confidence })
    setActions(actionsData)

    if (navigator.onLine) {
      const { synced, ...toSupabase } = record
      const { error } = await supabase
        .from('historique_diagnostics')
        .insert([toSupabase])

      if (!error) {
        await db.diagnostic_history.update(record.id, { synced: 1 })
        setHistory(prev =>
          prev.map(item =>
            item.id === record.id ? { ...item, synced: 1 } : item
          )
        )
      }
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Microscope size={56} className="text-emerald-800 animate-bounce" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-emerald-900/10 rounded-full blur-sm" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800/40">Séquençage des données...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 font-sans text-[#1A2E26]">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '80px 80px' }} />

      <div className="relative p-6 max-w-2xl mx-auto space-y-8 pt-10">
        
        {/* TOP BAR AVEC BOUTON GUIDE */}
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center gap-2">
              <Microscope className="text-emerald-700" size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800/50">Analyse Phytosanitaire</span>
           </div>
           <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${showGuide ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-emerald-800 border border-[#E8E2D9]'}`}
           >
             {showGuide ? <X size={16} /> : <HelpCircle size={16} />}
             <span className="text-[10px] font-black uppercase tracking-widest">{showGuide ? "Fermer" : "Guide"}</span>
           </button>
        </div>

        {/* HEADER */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-8 text-white shadow-2xl">
          {showGuide && (
            <div className="absolute inset-0 z-20 bg-[#1A2E26]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
              <Microscope className="text-amber-400 mb-2" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Expertise Phytosanitaire</p>
              <p className="text-sm font-serif italic text-emerald-50 max-w-[240px]">Identifiez les maladies de vos cultures en sélectionnant les symptômes observés sur le terrain.</p>
            </div>
          )}
          <button onClick={() => setStep('dashboard')} className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all z-20">
            <ArrowLeft size={20} />
          </button>
          <div className="relative z-10 text-center space-y-2 pt-4">
            <div className="flex justify-center items-center gap-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Diagnostic Intelligent</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-3xl font-serif font-medium">Santé des Plantes</h1>
            <div className="flex items-center justify-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${navigator.onLine ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`} />
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">{navigator.onLine ? 'Cloud Synchronisé' : 'Mode Local'}</p>
            </div>
          </div>
          <Microscope className="absolute right-[-20px] bottom-[-20px] text-white/5 w-48 h-48 rotate-12" />
        </header>

        {/* 1. SELECTION ZONE */}
        <section className="space-y-4 relative">
          {showGuide && (
            <div className="absolute inset-0 z-20 bg-amber-500/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center text-center p-4 animate-in fade-in zoom-in duration-300">
              <MapPin className="text-white mb-1" size={24} />
              <p className="text-[10px] font-black uppercase text-white mb-1">Étape 1 : La Parcelle</p>
              <p className="text-[10px] text-amber-50 font-bold leading-tight">Choisissez le champ où vous observez un problème.</p>
            </div>
          )}
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
               <MapPin size={16} strokeWidth={2.5} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1A2E26]/60">Étape 1 : Parcelle cible</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
            {zones.map(z => (
              <button
                key={z.id}
                onClick={() => setSelectedZone(z)}
                className={`flex-shrink-0 w-40 p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center text-center gap-4 relative
                  ${selectedZone?.id === z.id 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-900/20 -translate-y-1' 
                    : 'bg-white border-[#E8E2D9] text-[#1A2E26] hover:border-emerald-200'}
                `}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${selectedZone?.id === z.id ? 'bg-white/20 rotate-6 shadow-inner' : 'bg-slate-50 border border-[#E8E2D9]'}`}>
                  <img src={getCultureIconPath(z.culture_nom)} alt="" className="w-9 h-9 object-contain" onError={(e) => { e.target.src = '/assets/cultures/default.svg'; }} />
                </div>
                <div>
                  <p className="font-black text-[11px] uppercase tracking-tighter truncate leading-tight">{z.zone_nom}</p>
                  <p className={`text-[9px] font-medium opacity-60 mt-0.5 ${selectedZone?.id === z.id ? 'text-white' : 'text-slate-500'}`}>{z.culture_nom}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 2. SYMPTOMES PAR CATEGORIES */}
        {selectedZone && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 relative">
            {showGuide && (
              <div className="absolute inset-0 z-20 bg-amber-500/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center text-center p-4 animate-in fade-in zoom-in duration-300">
                <Leaf className="text-white mb-1" size={24} />
                <p className="text-[10px] font-black uppercase text-white mb-1">Étape 2 : Les Symptômes</p>
                <p className="text-[10px] text-amber-50 font-bold leading-tight">Cochez tout ce que vous voyez sur la plante. Plus vous en mettez, plus l'IA sera précise.</p>
              </div>
            )}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs shadow-sm">2</div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1A2E26]/60">Étape 2 : Symptômes</h3>
              </div>
              {selectedSymptoms.length > 0 && (
                <button onClick={() => setSelectedSymptoms([])} className="text-[9px] font-black text-rose-500 uppercase tracking-tighter flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                    Effacer ({selectedSymptoms.length})
                </button>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 px-2 scrollbar-hide">
              {Object.entries(categorizedSymptoms).map(([name, cat]) => {
                const isActive = activeCategory === name;
                const countInCat = cat.list.filter(s => selectedSymptoms.includes(s.id)).length;
                return (
                  <button
                    key={name}
                    onClick={() => setActiveCategory(name)}
                    className={`flex-shrink-0 relative flex flex-col items-center gap-2 p-4 min-w-[95px] rounded-[2rem] border-2 transition-all duration-300
                      ${isActive 
                        ? 'bg-white border-emerald-500 shadow-lg scale-105 z-10' 
                        : 'bg-white/50 border-transparent text-slate-400 opacity-70 hover:bg-white'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${cat.color} transition-transform ${isActive ? 'scale-110' : ''}`}>
                      {cat.icon}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-emerald-800' : ''}`}>{name}</span>
                    {countInCat > 0 && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-amber-400 text-[#1A2E26] text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in">
                            {countInCat}
                        </div>
                    )}
                  </button>
                )
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-3 min-h-[220px]">
              {categorizedSymptoms[activeCategory].list.map(s => {
                const active = selectedSymptoms.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSymptoms(p => active ? p.filter(x => x !== s.id) : [...p, s.id])}
                    className={`group p-4 rounded-[2rem] border-2 transition-all duration-300 flex flex-col gap-3 text-left relative overflow-hidden
                      ${active 
                        ? 'bg-emerald-50 border-emerald-500 shadow-md' 
                        : 'bg-white border-[#F0EFEA] hover:border-emerald-200'}
                    `}
                  >
                    <div className="flex items-center justify-between w-full">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${active ? 'bg-white shadow-md scale-110' : 'bg-slate-50'}`}>
                          <img src={getSymptomIconPath(s.libelle)} alt="" className="w-8 h-8 object-contain" onError={(e) => { e.target.src = '/assets/symptomes/default.svg'; }} />
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-emerald-500 border-emerald-500 rotate-0' : 'border-slate-200 rotate-90'}`}>
                          <CheckCircle2 size={14} className={`text-white transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                    </div>
                    <span className={`text-[11px] font-bold leading-tight pr-2 ${active ? 'text-emerald-900' : 'text-slate-500'}`}>{s.libelle}</span>
                    {active && <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-tl-full" />}
                  </button>
                )
              })}
            </div>

            {diagError && (
              <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2.5rem] flex gap-4 animate-in slide-in-from-top-2">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm flex-shrink-0">
                  {diagError.type === 'warning' ? <AlertTriangle size={24} /> : <SearchX size={24} />}
                </div>
                <div className="space-y-1">
                  <p className="font-black text-xs uppercase text-rose-900">{diagError.title}</p>
                  <p className="text-xs text-rose-800/70 leading-relaxed font-medium">{diagError.message}</p>
                </div>
              </div>
            )}

            <button
              onClick={runDiagnostic}
              disabled={selectedSymptoms.length === 0}
              className={`w-full py-6 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all
                ${selectedSymptoms.length > 0 
                  ? 'bg-amber-500 text-[#1A2E26] shadow-xl shadow-amber-900/10 active:scale-95 hover:bg-amber-400' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'}
              `}
            >
              <Sparkles size={18} className={selectedSymptoms.length > 0 ? 'animate-pulse text-amber-900' : ''} />
              Lancer l'analyse
            </button>
          </section>
        )}

        {/* 3. RESULTAT IMMEDIAT */}
        {result && (
          <div className="bg-[#0A261D] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 border border-emerald-400/20">
            {showGuide && (
              <div className="absolute inset-0 z-20 bg-emerald-600/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                <Activity className="text-white mb-2" size={32} />
                <p className="text-xs font-bold uppercase tracking-widest text-white mb-1">Résultat d'Analyse</p>
                <p className="text-sm font-serif italic text-emerald-50 max-w-[240px]">Voici la maladie la plus probable selon vos indications et le taux de confiance de l'IA.</p>
              </div>
            )}
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="px-4 py-1.5 bg-emerald-400/10 rounded-full border border-emerald-400/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Résultat Détecté
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold">{result.confidence}% de certitude</span>
                </div>
              </div>
              <div>
                <h2 className="text-4xl font-serif leading-tight mb-2">{result.nom}</h2>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${result.confidence}%` }} />
                </div>
              </div>
            </div>
            <Microscope className="absolute right-[-20px] top-[-20px] text-white/5 w-48 h-48 -rotate-12" />
          </div>
        )}

        {/* 3b. ACTIONS DIRECTES */}
        {actions && (
          <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 relative">
             {showGuide && (
              <div className="absolute inset-0 z-20 bg-emerald-500/95 backdrop-blur-md rounded-[3rem] p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                <ShieldCheck className="text-white mb-2" size={32} />
                <p className="text-xs font-bold uppercase tracking-widest text-white mb-1">Plan d'Action</p>
                <p className="text-sm font-serif italic text-emerald-50 max-w-[240px]">Suivez ces étapes bio pour soigner votre culture et sauver votre récolte.</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1A2E26]">Plan de Traitement</h3>
              </div>
              <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter ${actions.niveau_urgence === 'Haut' ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' : 'bg-amber-50 text-amber-600'}`}>
                Urgence : {actions.niveau_urgence}
              </span>
            </div>

            <div className="grid gap-4">
              <div className="bg-emerald-50/40 p-5 rounded-[2.5rem] border border-emerald-100/50">
                <div className="flex items-center gap-2 mb-2">
                    <Sprout size={14} className="text-emerald-600" />
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Action Biologique</p>
                </div>
                <p className="text-sm leading-relaxed text-[#1A2E26]/80 font-medium">{actions.actions_bio}</p>
              </div>
              
              <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 relative overflow-hidden">
                <p className="text-[10px] font-black text-amber-700 uppercase mb-3 tracking-widest flex items-center gap-2">
                    <Info size={14} /> Le mot de l'expert
                </p>
                <p className="text-base text-amber-900 italic font-serif leading-relaxed relative z-10">
                    "{actions.conseil}"
                </p>
                <Sparkles className="absolute -bottom-2 -right-2 text-amber-200/40 w-16 h-16" />
              </div>
            </div>
          </div>
        )}

        {/* 4. HISTORIQUE */}
        <section className="space-y-4 pt-8 border-t border-[#E8E2D9] relative">
           {showGuide && (
              <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center border-2 border-amber-500 animate-in fade-in duration-300">
                <History className="text-amber-600 mb-2" size={32} />
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Journal de Bord</p>
                <p className="text-sm font-serif italic text-slate-600 max-w-[240px]">Retrouvez ici tous vos anciens diagnostics même sans connexion internet.</p>
              </div>
            )}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 text-slate-400">
                <History size={16} />
                <h3 className="text-[11px] font-black uppercase tracking-widest">Journal d'Analyses</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase">{history.length} Entrées</span>
          </div>

          {history.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-[#E8E2D9] opacity-60">
               <p className="text-xs font-serif italic text-slate-400">Votre historique est vide.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(h => (
                <div
                  key={h.id}
                  onClick={() => { 
                    if (h.actions_snapshot) {
                      setHistoryActions({
                        ...h.actions_snapshot,
                        maladie_nom: h.maladie_nom,
                        date: h.created_at,
                        confidence: h.confidence
                      }) 
                    }
                  }}
                  className="group bg-white p-5 rounded-[2.2rem] flex items-center gap-4 border border-[#E8E2D9] hover:border-emerald-300 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${h.synced ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {h.synced ? <Cloud size={22} /> : <RefreshCw size={22} className="animate-spin-slow" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xs uppercase text-[#1A2E26] truncate tracking-tight">{h.maladie_nom}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar size={10} />
                        <span className="text-[9px] font-bold">{new Date(h.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{h.confidence}%</span>
                    </div>
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (window.confirm("Supprimer ce diagnostic de l'historique ?")) {
                        if (online) await supabase.from('historique_diagnostics').delete().eq('id', h.id)
                        await db.diagnostic_history.delete(h.id)
                        setHistory(p => p.filter(x => x.id !== h.id))
                      }
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MODAL HISTORIQUE */}
        {historyActions && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-[#1A2E26]/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-8 space-y-8 relative overflow-hidden animate-in slide-in-from-bottom-12 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-600" />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
                        <Activity size={12} className="animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Rapport Certifié</span>
                    </div>
                    <h3 className="text-3xl font-serif font-medium text-[#1A2E26] leading-tight pt-2">{historyActions.maladie_nom}</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{historyActions.culture_nom || "Culture Identifiée"}</p>
                </div>
                <button onClick={() => setHistoryActions(null)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm">
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center text-center">
                    <Calendar size={16} className="text-slate-400 mb-1" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Date d'analyse</span>
                    <span className="text-xs font-bold text-[#1A2E26]">{new Date(historyActions.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-[2rem] flex flex-col items-center text-center">
                    <ShieldCheck size={16} className="text-emerald-500 mb-1" />
                    <span className="text-[10px] font-black uppercase text-emerald-600">Précision</span>
                    <span className="text-xs font-bold text-emerald-800">{historyActions.confidence}%</span>
                </div>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
                <div className="p-6 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Sprout size={16} className="text-emerald-600" />
                    <p className="font-black text-emerald-700 text-[10px] uppercase tracking-widest">Protocole Bio</p>
                  </div>
                  <p className="text-sm leading-relaxed text-emerald-900 font-medium">{historyActions.actions_bio}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={16} className="text-slate-600" />
                    <p className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Prévention Future</p>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{historyActions.prevention}</p>
                </div>
                <div className="relative p-8 bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[2.8rem] shadow-xl overflow-hidden">
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <span className="text-amber-400"><Info size={16} /></span>
                    <p className="font-black text-white/60 text-[10px] uppercase tracking-widest">Recommandation Expert</p>
                  </div>
                  <p className="text-lg text-white font-serif italic leading-relaxed relative z-10">
                    "{historyActions.conseil}"
                  </p>
                  <Sparkles className="absolute -bottom-4 -right-4 text-white/5 w-24 h-24" />
                </div>
              </div>
              <button 
                onClick={() => setHistoryActions(null)} 
                className="w-full py-6 bg-[#1A2E26] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-emerald-950 active:scale-95 transition-all"
              >
                Fermer le rapport
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}