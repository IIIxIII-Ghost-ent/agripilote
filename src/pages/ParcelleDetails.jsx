import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import ZoneForm from '../components/ZoneForm'
import { 
  ArrowLeft, 
  Trash2, 
  Map as MapIcon, 
  Sprout,
  Maximize2,
  CheckCircle2,
  Clock,
  Layers,
  PlusCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react'

export default function ParcelleDetails({
  parcelle,
  goBack,
  setStep,
  setSelectedZone,
}) {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [guideStep, setGuideStep] = useState(0) // Nouvelle logique tuto
  const [zoneToDelete, setZoneToDelete] = useState(null)
  const [offlineDeleteError, setOfflineDeleteError] = useState(false)
  const [surfaceError, setSurfaceError] = useState(null)

  // --- LOGIQUE D'AFFICHAGE DES ICONES SVG ---
  const getCropStyle = (cultureNom) => {
    if (!cultureNom) return { icon: '/assets/cultures/default.svg', color: 'bg-emerald-50' };
    
    const nom = cultureNom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const mapping = {
      'mil': 'mil.svg', 'riz': 'riz.svg', 'mais': 'mais.svg', 'sorgho': 'sorgho.svg', 'fonio': 'fonio.svg', 'ble': 'ble.svg', 'orge': 'orge.svg',
      'arachide': 'arachide.svg', 'niebe': 'niebe.svg', 'pois d\'angole': 'pois-angole.svg', 'soja': 'soja.svg', 'pois bambara': 'pois-bambara.svg',
      'manioc': 'manioc.svg', 'patate douce': 'patate-douce.svg', 'igname': 'igname.svg',
      'oignon': 'oignon.svg', 'tomate': 'tomate.svg', 'gombo': 'gombo.svg', 'chou': 'chou.svg', 'laitue': 'laitue.svg', 'pasteque': 'pasteque.svg',
      'mangue': 'mangue.svg', 'banane': 'banane.svg', 'papaye': 'papaye.svg', 'fraise': 'fraise.svg', 'ananas': 'ananas.svg', 'avocat': 'avocat.svg', 'goyave': 'goyave.svg', 'citron': 'citron.svg',
      'coton': 'coton.svg', 'anacardier': 'anacardier.svg', 'canne a sucre': 'canne-sucre.svg', 'sesame': 'sesame.svg', 'curcuma': 'curcuma.svg', 'bissap': 'bissap.svg', 'gingembre': 'gingembre.svg',
      'brachiaria': 'brachiaria.svg', 'panicum': 'panicum.svg', 'neem': 'neem.svg', 'moringa': 'moringa.svg'
    };

    const fileName = Object.keys(mapping).find(k => nom.includes(k));
    const iconPath = fileName ? `/assets/cultures/${mapping[fileName]}` : '/assets/cultures/default.svg';

    return { 
      icon: iconPath, 
      color: 'bg-white' 
    };
  }

  // ================= LOGIQUE CHARGEMENT =================
  const loadZones = useCallback(async () => {
    if (!parcelle?.id) return
    setLoading(true)
    try {
      const localZones = await db.zones
        .where('parcelle_id')
        .equals(parcelle.id)
        .and(z => z.synced !== -1)
        .toArray()

      const enrichWithCulture = async (zonesList) => {
        return await Promise.all(zonesList.map(async (z) => {
          const zc = await db.zone_cultures
            .where('zone_id')
            .equals(z.id)
            .and(zc => zc.synced !== -1)
            .first()
          if (zc) {
            const cult = await db.cultures.get(zc.culture_id);
            return { ...z, culture_nom: cult?.nom };
          }
          return z;
        }));
      };

      const localEnriched = await enrichWithCulture(localZones);
      setZones(localEnriched.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));

      if (navigator.onLine) {
        setIsSyncing(true)
        const { data: remoteData, error } = await supabase
          .from('zones')
          .select(`*, zone_cultures ( cultures ( nom ) )`)
          .eq('parcelle_id', parcelle.id)

        if (!error && remoteData) {
          const formattedRemote = remoteData.map(z => ({
            ...z,
            synced: 1,
            culture_nom: z.zone_cultures?.[0]?.cultures?.nom 
          }));

          await db.zones.bulkPut(formattedRemote.map(({zone_cultures, ...rest}) => ({...rest, synced: 1})));
          
          const finalMap = new Map();
          formattedRemote.forEach(z => finalMap.set(z.id, z));
          localZones.forEach(lz => { if (lz.synced === 0) finalMap.set(lz.id, lz) });
          
          setZones(Array.from(finalMap.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
        }
        setIsSyncing(false)
      }
    } catch (err) { 
      console.error("Erreur chargement zones:", err) 
    } finally { 
      setLoading(false) 
    }
  }, [parcelle?.id])

  useEffect(() => {
    loadZones()
  }, [loadZones])

  const updateZoneStatus = async (e, zoneId, newStatus) => {
    e.stopPropagation(); 
    await db.zones.update(zoneId, { statut: newStatus, synced: 0 });
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, statut: newStatus, synced: 0 } : z));
    
    if (navigator.onLine) {
      const { error } = await supabase.from('zones').update({ statut: newStatus }).eq('id', zoneId);
      if (!error) {
        await db.zones.update(zoneId, { synced: 1 });
        setZones(prev => prev.map(z => z.id === zoneId ? { ...z, statut: newStatus, synced: 1 } : z));
      }
    }
  };

  const addZone = async ({ nom, surface }) => {
    const surfaceUtiliseeActuelle = zones.reduce(
      (total, z) => total + Number(z.surface),
      0
    )

    const surfaceRestanteActuelle =
      Number(parcelle.surface) - surfaceUtiliseeActuelle

    if (surface > surfaceRestanteActuelle) {
      setSurfaceError({
        demande: surface,
        restante: surfaceRestanteActuelle
      })
      return false
    }

    const id = crypto.randomUUID()

    const newZone = {
      id,
      parcelle_id: parcelle.id,
      user_id: parcelle.user_id,
      nom,
      surface: Number(surface),
      statut: 'en_cours',
      created_at: new Date().toISOString(),
      synced: 0
    }

    await db.zones.add(newZone)

    setZones(prev =>
      [...prev, newZone].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )
    )

    if (navigator.onLine) {
      const { synced, culture_nom, ...dataToSend } = newZone
      const { error } = await supabase.from('zones').insert([dataToSend])

      if (!error) {
        await db.zones.update(id, { synced: 1 })
        setZones(prev =>
          prev.map(z => z.id === id ? { ...z, synced: 1 } : z)
        )
      }
    }

    return true
  }

  const confirmDeleteZone = async () => {
    if (!navigator.onLine) {
      setOfflineDeleteError(true)
      setZoneToDelete(null)
      return
    }

    if (!zoneToDelete) return
    const zoneId = zoneToDelete

    setZones(prev => prev.filter(z => z.id !== zoneId))
    await db.zones.update(zoneId, { synced: -1 })

    if (navigator.onLine) {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', zoneId)

      if (!error) {
        await db.zones.delete(zoneId)
      }
    }

    setZoneToDelete(null)
  }

  const surfaceUtilisee = zones.reduce((total, z) => total + Number(z.surface), 0)
  const surfaceRestante = Math.max(0, Number(parcelle.surface) - surfaceUtilisee)
  const isFull = surfaceRestante < 0.01

  // COMPOSANT BULLE D'AIDE (Logique identique à Dashboard/Parcelles)
  const TutorialPopUp = ({ title, text, position = "bottom", step, total }) => (
    <div className={`absolute left-1/2 -translate-x-1/2 z-[500] w-[280px] animate-in zoom-in-95 duration-300 ${position === 'bottom' ? 'top-full mt-6' : 'bottom-full mb-6'}`}>
      <div className="bg-white border-2 border-amber-400 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] text-center relative">
        <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-amber-400 rotate-45 ${position === 'bottom' ? '-top-2.5' : '-bottom-2.5 rotate-[225deg]'}`} />
        <div className="flex justify-center mb-2">
            <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Guide • {step}/{total}</div>
        </div>
        <h4 className="text-[#1A2E26] font-black text-xs uppercase tracking-widest mb-2">{title}</h4>
        <p className="text-slate-600 text-[13px] font-bold leading-snug mb-5">{text}</p>
        <div className="flex gap-2">
            {step > 1 && (
                <button onClick={(e) => {e.stopPropagation(); setGuideStep(p => p-1)}} className="flex-1 py-3 rounded-2xl bg-slate-100 text-[#1A2E26] text-[10px] font-black uppercase">Retour</button>
            )}
            <button 
                onClick={(e) => {e.stopPropagation(); step < total ? setGuideStep(p => p+1) : setGuideStep(0)}} 
                className="flex-[2] bg-emerald-700 text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform"
            >
                {step === total ? "Terminer" : "Suivant"}
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

      <div className="relative p-6 max-w-2xl mx-auto space-y-8 pt-10">
        
        <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
               <MapIcon className="text-emerald-700" size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800/50">Fiche parcellaire</span>
            </div>
        </div>

        {/* ÉTAPE 1 : HEADER */}
        <header className={`relative overflow-visible bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-8 text-white shadow-xl shadow-emerald-900/20 transition-all duration-500 ${guideStep === 1 ? 'z-[200] scale-[1.02] ring-4 ring-amber-400' : 'z-10'}`}>
          {guideStep === 1 && (
            <TutorialPopUp 
              step={1} total={4}
              title="Identité de l Exploitation " 
              text="Retrouvez ici le nom de votre Exploitation et l'état de synchronisation avec le cloud." 
            />
          )}
          <button onClick={goBack} className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all z-20">
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative z-10 text-center space-y-2 pt-4">
            <div className="flex justify-center items-center gap-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Géométrie du Domaine</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-medium leading-snug px-4 break-words">
              {parcelle.nom}
            </h1>
            <div className="flex items-center justify-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                  {isSyncing ? 'Synchronisation des données' : 'Données à jour'}
                </p>
            </div>
          </div>
          <MapIcon className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32 rotate-12" />
        </header>

        {/* ÉTAPE 2 : SURFACES */}
        <div className={`grid grid-cols-2 gap-4 transition-all duration-500 ${guideStep === 2 ? 'z-[200] relative scale-[1.02]' : 'z-10'}`}>
          {guideStep === 2 && (
            <TutorialPopUp 
              step={2} total={4}
              title="Gestion des surfaces" 
              text="Suivez en temps réel la surface totale et l'espace qu'il vous reste à affecter à vos cultures." 
            />
          )}
          <div className="bg-emerald-700 p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden h-full">
              <div className="relative z-10">
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Surface Totale</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black tracking-tighter">{parcelle.surface}</span>
                  <span className="text-[10px] font-bold opacity-60 uppercase">HA</span>
                </div>
              </div>
              <Maximize2 className="absolute -right-4 -bottom-4 opacity-10 size-24" />
          </div>
          
          <div className={`p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden h-full transition-all duration-500 ${isFull ? 'bg-red-800' : 'bg-orange-600'}`}>
              <div className="relative z-10">
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Superficie non affectée</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black tracking-tighter">{surfaceRestante.toFixed(1)}</span>
                  <span className="text-[10px] font-bold opacity-60 uppercase">HA</span>
                </div>
              </div>
              <Sprout className="absolute -right-4 -bottom-4 opacity-10 size-24" />
          </div>
        </div>

        {/* ÉTAPE 3 : AJOUT UNITÉ */}
        <section className={`transition-all duration-500 ${guideStep === 3 ? 'z-[200] relative scale-[1.02]' : 'z-10'}`}>
          {guideStep === 3 && (
            <TutorialPopUp 
              step={3} total={4}
              title="Découpage cultural" 
              text="Créez des unités culturales (blocs) pour diversifier vos cultures sur cette même Exploitation." 
            />
          )}
          <div className="bg-white p-8 rounded-[3rem] border border-[#E8E2D9] shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 ${isFull ? 'bg-red-50 text-red-800 scale-110' : 'bg-orange-50 text-orange-600'}`}>
                {isFull ? <AlertCircle size={24} /> : <PlusCircle size={24} />}
              </div>
              <div>
                <h3 className={`text-xl font-serif font-bold transition-colors ${isFull ? 'text-red-900' : 'text-[#0A261D]'}`}>
                  {isFull ? 'Capacité foncière atteinte' : 'Ajouter une unité culturale'}
                </h3>
              </div>
            </div>
            
            {isFull ? (
              <div className="relative z-10 bg-gradient-to-br from-red-50 to-white border-2 border-dashed border-red-200 p-8 rounded-[2rem] flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-800 rounded-full flex items-center justify-center text-white mb-4 shadow-lg ring-4 ring-red-50">
                    <XCircle size={28} className="animate-pulse" />
                </div>
                <h4 className="text-red-900 font-black text-lg uppercase">Superficie entièrement affectée</h4>
                <p className="text-red-800/60 text-xs mt-1">Aucune superficie disponible.</p>
              </div>
            ) : (
              <div className="relative z-10 bg-[#FDFCF9] p-6 rounded-[2rem] border border-dashed border-orange-200">
                <ZoneForm surfaceParcelle={parcelle.surface} surfaceUtilisee={surfaceUtilisee} onAdd={addZone} />
              </div>
            )}
          </div>
        </section>

        {/* ÉTAPE 4 : LISTE UNITÉS */}
        <section className={`space-y-6 transition-all duration-500 ${guideStep === 4 ? 'z-[200] relative scale-[1.02]' : 'z-10'}`}>
          {guideStep === 4 && (
            <TutorialPopUp 
              step={4} total={4} position="top"
              title="Gestion des unités" 
              text="Cliquez sur une unité pour voir ses détails ou changez son statut (en place, achevé, jachère) directement." 
            />
          )}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
              <h3 className="text-xl font-serif font-bold text-[#0A261D]">Unités culturales actives</h3>
            </div>
            <span className="text-[10px] font-black text-slate-500 bg-white border border-[#E8E2D9] px-4 py-1.5 rounded-full shadow-sm uppercase tracking-widest">
              {zones.length} Unités
            </span>
          </div>

          <div className="space-y-4 relative">
            {zones.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-16 border-2 border-dashed border-emerald-100 text-center flex flex-col items-center">
                <Layers className="text-emerald-100 mb-4" size={48} />
                <p className="text-sm font-medium text-slate-400 italic">Aucune unité culturale déclarée.</p>
              </div>
            ) : (
              zones.map(zone => {
                const style = getCropStyle(zone.culture_nom);
                return (
                  <div
                    key={zone.id}
                    onClick={() => { setSelectedZone(zone); setStep('zone-details'); }}
                    className="group bg-white rounded-[2.5rem] border border-[#E8E2D9] hover:border-orange-200 hover:shadow-xl transition-all duration-300 relative overflow-hidden cursor-pointer"
                  >
                    <div className="p-5 flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 transition-transform group-hover:scale-110 duration-500 ${zone.culture_nom ? 'bg-white p-2' : 'bg-slate-100'}`}>
                          {zone.culture_nom ? (
                            <img
                              src={style.icon}
                              alt={zone.culture_nom}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.src = '/assets/cultures/default.svg' }}
                            />
                          ) : (
                            <HelpCircle size={28} className="text-amber-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <h4 className={`font-bold text-lg leading-tight truncate ${zone.statut === 'annulee' ? 'line-through text-slate-400' : 'text-[#1A2E26]'}`}>
                                {zone.nom}
                                </h4>
                                {zone.synced === 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                            </div>
                            
                           <button
                             onClick={(e) => {
                               e.stopPropagation()
                               if (!navigator.onLine) { setOfflineDeleteError(true); return; }
                               setZoneToDelete(zone.id)
                             }}
                             className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                           >
                             <Trash2 size={18} />
                           </button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                             <div className="flex items-center gap-1 text-[9px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase">
                                <Maximize2 size={10} />
                                {zone.surface} HA
                             </div>

                             {zone.culture_nom ? (
                               <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-700 bg-orange-50/80 border border-orange-100 px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                                 <Sprout size={10} className="text-orange-500" />
                                 {zone.culture_nom}
                               </div>
                             ) : (
                               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg uppercase italic border border-slate-100">
                                 <AlertCircle size={10} />
                                 Planifier l’assolement
                               </div>
                             )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-50" onClick={e => e.stopPropagation()}>
                        <StatusBtn 
                          active={zone.statut === 'en_cours'} 
                          onClick={(e) => updateZoneStatus(e, zone.id, 'en_cours')}
                          color="orange"
                          icon={<Clock size={14} />}
                          label="Culture en place"
                        />
                        <StatusBtn 
                          active={zone.statut === 'terminee'} 
                          onClick={(e) => updateZoneStatus(e, zone.id, 'terminee')}
                          color="emerald"
                          icon={<CheckCircle2 size={14} />}
                          label="Cycle achevé"
                        />
                        <StatusBtn 
                          active={zone.statut === 'annulee'} 
                          onClick={(e) => updateZoneStatus(e, zone.id, 'annulee')}
                          color="red"
                          icon={<XCircle size={14} />}
                          label="Jachère"
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      {/* MODALES DE CONFIRMATION ET ERREUR (Inchangées) */}
      {zoneToDelete && (
        <div className="fixed inset-0 z-[600] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full mx-4 shadow-xl animate-in zoom-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-red-800">Supprimer cette unité ?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              ⚠️ Cette action est <b>irréversible</b>.<br/>
              Toutes les données liées seront supprimées (tâches, diagnostics, cultures).
            </p>
            <div className="flex gap-3">
              <button onClick={() => setZoneToDelete(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold">Annuler</button>
              <button onClick={confirmDeleteZone} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {offlineDeleteError && (
        <div className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full mx-4 shadow-xl animate-in zoom-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-amber-800">Connexion requise</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              La suppression nécessite une <b>connexion Internet active</b>.
            </p>
            <button onClick={() => setOfflineDeleteError(false)} className="w-full py-3 rounded-xl bg-amber-600 text-white font-black">Compris</button>
          </div>
        </div>
      )}

      {surfaceError && (
        <div className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full mx-4 shadow-xl animate-in zoom-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-red-800">Superficie insuffisante</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              ⚠️ La surface demandée dépasse la superficie disponible.<br/><br/>
              <b>Demandé :</b> {surfaceError.demande} HA<br/>
              <b>Restant :</b> {surfaceError.restante.toFixed(2)} HA
            </p>
            <button onClick={() => setSurfaceError(null)} className="w-full py-3 rounded-xl bg-red-600 text-white font-black">Compris</button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBtn({ active, onClick, color, icon, label }) {
  const colors = {
    orange: active ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-600',
    emerald: active ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600',
    red: active ? 'bg-red-800 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-800',
  }

  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border border-transparent ${active ? 'border-white/20' : 'border-slate-100'} ${colors[color]}`}
    >
      {icon}
      {label}
    </button>
  )
}