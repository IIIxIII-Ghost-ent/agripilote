import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Microscope, CheckCircle2, Trash2, ArrowLeft,
  Cloud, Sparkles, AlertCircle, History, 
  RefreshCw, ChevronRight, Info, ShieldCheck, 
  Sprout, MapPin, X, Leaf, TreeDeciduous, Cherry, Settings2, Calendar, Activity,
  SearchX, AlertTriangle, HelpCircle, Layers, LandPlot
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
  "Petites taches noires ou bribes": "tache_noire.svg",
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
  const [showGuide, setShowGuide] = useState(false)
  const [diagToDelete, setDiagToDelete] = useState(null)
  const [offlineDeleteError, setOfflineDeleteError] = useState(false)
  const online = navigator.onLine

  const categorizedSymptoms = useMemo(() => {
    const categories = {
      "Feuilles": { icon: <Leaf size={18}/>, list: [] },
      "Tiges & Tronc": { icon: <TreeDeciduous size={18}/>, list: [] },
      "Fruits & Fleurs": { icon: <Cherry size={18}/>, list: [] },
      "Racines & Sol": { icon: <MapPin size={18}/>, list: [] },
      "Global": { icon: <Settings2 size={18}/>, list: [] }
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
            const parcelle = await db.parcelles.get(zone?.parcelle_id)
            return { 
                ...z, 
                culture_nom: culture?.nom, 
                zone_nom: zone?.nom, 
                exploitation_nom: parcelle?.nom || "Exploitation" 
            }
          })
        )
        setZones(enriched)
        const localHistory = await db.diagnostic_history.where('user_id').equals(user.id).reverse().sortBy('created_at')
        setHistory(localHistory)
        
        if (online) {
          const { data, error } = await supabase
            .from('historique_diagnostics')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (data && !error) {
            const remoteIds = new Set(data.map(d => d.id))
            for (const local of localHistory) {
              if (!remoteIds.has(local.id) && local.synced === 1) {
                await db.diagnostic_history.delete(local.id)
              }
            }
            await db.diagnostic_history.bulkPut(
              data.map(d => ({ ...d, synced: 1 }))
            )
            const synced = await db.diagnostic_history
              .where('user_id')
              .equals(user.id)
              .reverse()
              .sortBy('created_at')
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

    const selectedSymptomObjects = await db.symptomes.where('id').anyOf(selectedSymptoms).toArray()
    const strongCount = selectedSymptomObjects.filter(s => (s.specificite ?? 1) >= 4).length
    const mediumCount = selectedSymptomObjects.filter(s => (s.specificite ?? 1) >= 3).length

    if (strongCount === 0 && mediumCount < 2 && selectedSymptoms.length < 3) {
      setDiagError({
        title: "Précision insuffisante",
        message: "Les symptômes sélectionnés sont trop généraux. Ajoutez des symptômes plus caractéristiques.",
        type: "warning"
      })
      return
    }

    const maladies = await db.maladies.where('culture_id').equals(selectedZone.culture_id).toArray()
    if (maladies.length === 0) return

    const maladieIds = maladies.map(m => m.id)
    const allLinks = await db.maladie_symptomes.where('maladie_id').anyOf(maladieIds).toArray()
    const scoreMap = {}

    for (const link of allLinks) {
      if (!selectedSymptoms.includes(link.symptome_id)) continue
      const symptome = selectedSymptomObjects.find(s => s.id === link.symptome_id)
      const poids = link.poids ?? 1
      const specificite = symptome?.specificite ?? 1
      if (!scoreMap[link.maladie_id]) scoreMap[link.maladie_id] = 0
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

    const avgSpecificite = selectedSymptomObjects.reduce((a, s) => a + (s.specificite ?? 1), 0) / selectedSymptomObjects.length
    const minScore = Math.max(3, selectedSymptoms.length * avgSpecificite)
    
    if (!best || bestScore < minScore) {
      setDiagError({
        title: "Correspondance insuffisante",
        message: "Aucune maladie ne correspond suffisamment à cette combinaison.",
        type: "search"
      })
      return
    }

    const confidence = Math.min(95, Math.round(50 + (bestScore / (selectedSymptoms.length * 5)) * 40))
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
      actionsData = await db.actions_prioritaires.where('[culture_id+maladie_id]').equals([selectedZone.culture_id, best.id]).first()
    }

    const record = {
      id: crypto.randomUUID(),
      user_id: user.id,
      zone_id: selectedZone.id,
      maladie_nom: best.nom,
      confidence,
      created_at: new Date().toISOString(),
      actions_snapshot: actionsData ? {
            actions_bio: actionsData.actions_bio,
            prevention: actionsData.prevention,
            conseil: actionsData.conseil,
            niveau_urgence: actionsData.niveau_urgence,
            maladie_nom: best.nom,
            culture_nom: selectedZone.culture_nom,
            date: new Date().toISOString(),
            confidence
          } : null,
      synced: 0
    }

    await db.diagnostic_history.add(record)
    setHistory(h => [record, ...h])
    setResult({ ...best, confidence })
    setActions(actionsData)

    if (navigator.onLine) {
      const { synced, ...toSupabase } = record
      const { error } = await supabase.from('historique_diagnostics').insert([toSupabase])
      if (!error) {
        await db.diagnostic_history.update(record.id, { synced: 1 })
        setHistory(prev => prev.map(item => item.id === record.id ? { ...item, synced: 1 } : item))
      }
    }
  }

  const confirmDeleteDiag = async () => {
    if (!navigator.onLine) {
      setOfflineDeleteError(true)
      setDiagToDelete(null)
      return
    }
    if (!diagToDelete) return
    const id = diagToDelete

    setHistory(prev => prev.filter(h => h.id !== id))
    await db.diagnostic_history.update(id, { synced: -1 })

    if (navigator.onLine) {
      const { error } = await supabase.from('historique_diagnostics').delete().eq('id', id)
      if (!error) await db.diagnostic_history.delete(id)
    }
    setDiagToDelete(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Microscope size={56} className="text-[#1A2E26] animate-bounce" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-emerald-900/10 rounded-full blur-sm" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1A2E26]/40">Séquençage des données...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 font-sans text-[#1A2E26]">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")` }} />

      <div className="relative p-6 max-w-2xl mx-auto space-y-8 pt-10">
        
        {/* Navigation */}
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center gap-2">
              <Microscope className="text-emerald-700" size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800/50">Analyse Phytosanitaire</span>
           </div>
           <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all z-30 ${showGuide ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-emerald-800 border border-[#E8E2D9]'}`}
           >
             {showGuide ? <X size={16} /> : <HelpCircle size={16} />}
             <span className="text-[10px] font-black uppercase tracking-widest">{showGuide ? "Fermer" : "Guide"}</span>
           </button>
        </div>

        {/* Header */}
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
                <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`} />
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                  {online ? 'Données synchronisées' : 'Mode hors-ligne'}
                </p>
            </div>
          </div>
          <Microscope className="absolute right-[-20px] bottom-[-20px] text-white/5 w-48 h-48 rotate-12" />
        </header>

        {/* SECTION 1: SÉLECTEUR DE ZONE */}
        <section className="space-y-4 relative group">
          {showGuide && (
            <div className="absolute inset-0 z-20 bg-emerald-900/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center text-center p-4 animate-in fade-in zoom-in duration-300 border-2 border-amber-500">
              <Layers className="text-amber-400 mb-1" size={24} />
              <p className="text-[10px] font-black uppercase text-amber-400">Choix de la parcelle</p>
              <p className="text-[10px] text-emerald-50">Sélectionnez l'unité culturale à inspecter aujourd'hui.</p>
            </div>
          )}
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
              <Layers size={14} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A2E26]/60">Étape 1 : Localiser le problème</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {zones.map(z => {
              const isSelected = selectedZone?.id === z.id;
              return (
                <button
                  key={z.id}
                  onClick={() => setSelectedZone(z)}
                  className={`relative p-5 rounded-[2.5rem] border-2 transition-all duration-500 flex items-center gap-4 text-left overflow-hidden ${isSelected ? 'bg-[#1A2E26] border-[#1A2E26] text-white shadow-xl shadow-emerald-900/10' : 'bg-white border-[#E8E2D9] text-[#1A2E26] hover:border-emerald-200'} `}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 ${isSelected ? 'bg-white/10 rotate-6' : 'bg-slate-50 border border-[#E8E2D9]'}`}>
                    <img src={getCultureIconPath(z.culture_nom)} alt="" className="w-8 h-8" onError={(e) => e.target.src = '/assets/cultures/default.svg'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-amber-400' : 'text-emerald-700/60'}`}>{z.culture_nom}</p>
                    <h4 className="text-lg font-bold truncate leading-tight">{z.zone_nom}</h4>
                    <p className={`text-[9px] font-medium opacity-60 ${isSelected ? 'text-white' : 'text-slate-500'}`}>{z.exploitation_nom}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="text-amber-400 animate-in zoom-in duration-300" size={24} />}
                </button>
              )
            })}
          </div>
        </section>

        {/* SECTION 2: SÉLECTEUR DE SYMPTÔMES */}
        {selectedZone && (
          <section className="space-y-6 animate-in slide-in-from-bottom-10 duration-700 relative group">
            {showGuide && (
              <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300 border-2 border-amber-500">
                <AlertCircle className="text-amber-600 mb-2" size={32} />
                <p className="text-xs font-black uppercase text-amber-600 mb-1">Observation des symptômes</p>
                <p className="text-sm text-slate-600 font-medium">Naviguez par catégorie et cochez ce que vous voyez sur la plante. Plus vous en mettez, plus le diagnostic est précis.</p>
              </div>
            )}
            <div className="flex flex-col gap-4">
               <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                      <AlertCircle size={14} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A2E26]/60">Étape 2 : Signes observés</h3>
                 </div>
                 <span className="text-[9px] font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-widest">
                    {selectedSymptoms.length} Sélectionnés
                 </span>
               </div>

               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                 {Object.entries(categorizedSymptoms).map(([cat, data]) => (
                   <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-all text-[10px] font-black uppercase tracking-widest ${activeCategory === cat ? 'bg-[#1A2E26] text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-[#E8E2D9] hover:border-emerald-200'}`}
                   >
                     {data.icon} {cat}
                   </button>
                 ))}
               </div>

               <div className="bg-white rounded-[3rem] p-6 border border-[#E8E2D9] shadow-sm">
                 <div className="grid grid-cols-2 gap-3">
                   {categorizedSymptoms[activeCategory].list.map(s => {
                     const active = selectedSymptoms.includes(s.id);
                     return (
                       <button
                        key={s.id}
                        onClick={() => setSelectedSymptoms(prev => active ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                        className={`group relative p-4 rounded-[2rem] border-2 flex flex-col items-center text-center gap-3 transition-all duration-300 ${active ? 'bg-orange-50 border-orange-400 shadow-md scale-[1.02]' : 'bg-[#FDFCF9] border-transparent hover:border-orange-100 hover:bg-white'}`}
                       >
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center p-2 transition-transform duration-500 ${active ? 'bg-white shadow-sm rotate-3' : 'bg-white'}`}>
                           <img src={getSymptomIconPath(s.libelle)} alt="" className="w-full h-full object-contain" />
                         </div>
                         <p className={`text-[10px] font-bold leading-tight ${active ? 'text-orange-900' : 'text-slate-600'}`}>{s.libelle}</p>
                         {active && <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-sm animate-in zoom-in"><CheckCircle2 size={12} /></div>}
                       </button>
                     )
                   })}
                 </div>
               </div>

               <button
                disabled={selectedSymptoms.length === 0}
                onClick={runDiagnostic}
                className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${selectedSymptoms.length > 0 ? 'bg-gradient-to-r from-[#1A2E26] to-[#0A261D] text-white shadow-emerald-900/20' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
               >
                 <Activity size={18} className={selectedSymptoms.length > 0 ? 'animate-pulse' : ''} />
                 Lancer l'analyse
               </button>
            </div>
          </section>
        )}

        {/* SECTION 3: RÉSULTATS */}
        {diagError && (
          <div className="animate-in zoom-in duration-500 bg-amber-50 border-2 border-dashed border-amber-200 p-8 rounded-[3rem] text-center space-y-4 shadow-inner">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-amber-500">
              {diagError.type === 'warning' ? <AlertTriangle size={32} /> : <SearchX size={32} />}
            </div>
            <div>
              <h4 className="text-amber-900 font-black uppercase text-sm tracking-widest">{diagError.title}</h4>
              <p className="text-amber-800/70 text-sm mt-2 font-medium">{diagError.message}</p>
            </div>
          </div>
        )}

        {result && (
          <section className="animate-in slide-in-from-bottom-10 duration-700 space-y-6">
            <div className="bg-white rounded-[3.5rem] p-8 border border-emerald-100 shadow-2xl shadow-emerald-900/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[5rem] -mr-8 -mt-8 opacity-50" />
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#1A2E26] rounded-3xl flex items-center justify-center text-amber-400 shadow-xl rotate-3">
                      <Sparkles size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.3em]">Résultat du Séquençage</p>
                      <h2 className="text-3xl font-serif font-bold text-[#1A2E26] leading-tight">{result.nom}</h2>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Indice de confiance</span>
                      <span className="text-lg font-black text-[#1A2E26]">{result.confidence}%</span>
                    </div>
                    <div className="h-4 bg-white rounded-full p-1 border border-slate-100 shadow-inner">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${result.confidence}%` }} />
                    </div>
                  </div>

                  {actions && (
                    <div className="space-y-4">
                      <div className="p-6 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldCheck className="text-emerald-700" size={16} />
                          <p className="font-black text-emerald-900 text-[10px] uppercase tracking-widest">Protocole Biologique</p>
                        </div>
                        <p className="text-sm leading-relaxed text-emerald-900/70">{actions.actions_bio}</p>
                      </div>
                      <div className="p-6 bg-orange-50/50 rounded-[2.5rem] border border-orange-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Info className="text-orange-700" size={16} />
                          <p className="font-black text-orange-900 text-[10px] uppercase tracking-widest">Prévention Future</p>
                        </div>
                        <p className="text-sm leading-relaxed text-orange-900/70">{actions.prevention}</p>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </section>
        )}

        {/* SECTION 4: HISTORIQUE */}
        <section className="space-y-6 relative group">
          {showGuide && (
            <div className="absolute inset-0 z-20 bg-[#FDFCF9]/90 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300 border-2 border-dashed border-amber-500">
              <History className="text-amber-600 mb-2" size={32} />
              <p className="text-xs font-black uppercase text-amber-600 mb-1">Archives d'analyses</p>
              <p className="text-sm text-slate-600 font-medium italic">Retrouvez tous vos anciens diagnostics. Cliquez sur une fiche pour revoir les solutions préconisées par l'expert.</p>
            </div>
          )}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#1A2E26] rounded-full" />
              <h3 className="text-xl font-serif font-bold text-[#0A261D]">Analyses passées</h3>
            </div>
            <History className="text-slate-300" size={20} />
          </div>

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-16 border-2 border-dashed border-slate-100 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <History className="text-slate-200" size={32} />
                </div>
                <p className="text-sm font-medium text-slate-400 italic">Aucune archive disponible.</p>
              </div>
            ) : (
              history.map(h => (
                <div 
                  key={h.id}
                  onClick={() => h.actions_snapshot && setHistoryActions(h.actions_snapshot)}
                  className="bg-white p-5 rounded-[2.5rem] border border-[#E8E2D9] flex items-center gap-4 hover:shadow-lg transition-all active:scale-[0.98] group cursor-pointer relative overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#1A2E26] group-hover:bg-[#1A2E26] group-hover:text-white transition-colors duration-500">
                    <Microscope size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#1A2E26] truncate">{h.maladie_nom}</h4>
                      {h.synced === 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{h.confidence}% certitude</p>
                      <span className="text-[10px] text-slate-300">•</span>
                      <p className="text-[10px] font-medium text-slate-400">{new Date(h.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                     <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDiagToDelete(h.id);
                        }}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight className="text-slate-200" size={20} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* MODALE DETAILS HISTORIQUE */}
      {historyActions && (
        <div className="fixed inset-0 z-50 bg-[#0A261D]/60 backdrop-blur-xl flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="relative p-8 bg-[#1A2E26] text-white">
                <button onClick={() => setHistoryActions(null)} className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                  <X size={20} />
                </button>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">Rapport d'Expertise</p>
                  <h3 className="text-3xl font-serif font-bold">{historyActions.maladie_nom}</h3>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                      <Sprout size={12} className="text-amber-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{historyActions.culture_nom}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                      <Calendar size={12} className="text-amber-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{new Date(historyActions.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600" />
                    <p className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Action Prioritaire</p>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{historyActions.actions_bio}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="text-slate-600" />
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
              <div className="p-8 pt-0">
                <button 
                  onClick={() => setHistoryActions(null)} 
                  className="w-full py-6 bg-[#1A2E26] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-emerald-950 active:scale-95 transition-all"
                >
                  Fermer le rapport
                </button>
              </div>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION (INFO MODAL) */}
      {diagToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full mx-4 shadow-xl animate-in zoom-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-red-800">Supprimer l'analyse ?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              ⚠️ Cette action est <b>irréversible</b>.<br/>
              L'historique de cette analyse phytosanitaire sera définitivement effacé du cloud.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDiagToDelete(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">
                Annuler
              </button>
              <button onClick={confirmDeleteDiag} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERREUR HORS LIGNE SUPPRESSION */}
      {offlineDeleteError && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full mx-4 shadow-xl animate-in zoom-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-amber-800">Connexion requise</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              La suppression d’une archive nécessite une <b>connexion Internet active</b> pour synchroniser vos données.
            </p>
            <button onClick={() => setOfflineDeleteError(false)} className="w-full py-3 rounded-xl bg-amber-600 text-white font-black hover:bg-amber-700">
              Compris
            </button>
          </div>
        </div>
      )}

    </div>
  )
}