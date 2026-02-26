import { useState, useEffect } from 'react'
import { db } from '../lib/db' 
import { supabase } from '../lib/supabase'
import { 
  MapPin, 
  Plus, 
  ArrowLeft, 
  LayoutGrid, 
  Maximize2, 
  ChevronRight, 
  Landmark,
  Sprout,
  CheckCircle2,
  Clock,
  Map as MapIcon,
  HelpCircle,
  X,
  Info,
  Pencil,
  Check,
  RotateCcw,
  Trash2,
  AlertTriangle
} from 'lucide-react'

export default function Parcelles({
  parcelles,
  addParcelle,
  setStep,
  setSelectedParcelle
}) {
  const [nom, setNom] = useState('')
  const [surface, setSurface] = useState('')
  const [localisation, setLocalisation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [parcelleStatus, setParcelleStatus] = useState({})
  
  // États pour la modification
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ nom: '', surface: '', localisation: '' })

  // États pour les modales de suppression
  const [parcelleToDelete, setParcelleToDelete] = useState(null)
  const [errorModal, setErrorModal] = useState({ show: false, message: '' })

  // LOGIQUE DU GUIDE
  const [guideStep, setGuideStep] = useState(0);

  // ================= LOGIQUE SYNCHRO STATUT =================
  useEffect(() => {
    const syncAndCalculateStatuses = async () => {
      const statusMap = {}
      for (const p of parcelles) {
        const zones = await db.zones.where('parcelle_id').equals(p.id).toArray()
        let newStatus = 'en_cours'
        if (zones.length > 0) {
          const hasActiveZone = zones.some(z => z.statut === 'en_cours')
          newStatus = hasActiveZone ? 'en_cours' : 'terminee'
        }
        statusMap[p.id] = newStatus
        if (newStatus !== p.statut) {
          try {
            await db.parcelles.update(p.id, { statut: newStatus });
            if (navigator.onLine) {
              await supabase.from('parcelles').update({ statut: newStatus }).eq('id', p.id);
            }
          } catch (err) {
            console.error("Erreur synchro statut parcelle:", err);
          }
        }
      }
      setParcelleStatus(statusMap)
    }
    if (parcelles.length > 0) syncAndCalculateStatuses()
  }, [parcelles])

  // ================= ACTIONS =================

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nom || !surface) return
    setSubmitting(true)
    await addParcelle({
      nom: nom.trim(),
      surface: Number(surface),
      localisation: localisation.trim(),
      statut: 'en_cours'
    })
    setNom(''); setSurface(''); setLocalisation('');
    setSubmitting(false)
  }

  const startEditing = (e, p) => {
    e.stopPropagation(); 
    setEditingId(p.id);
    setEditForm({ nom: p.nom, surface: p.surface, localisation: p.localisation || '' });
  }

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  }

  const handleUpdate = async (e, id) => {
    e.stopPropagation();
    try {
      const updatedData = {
        nom: editForm.nom.trim(),
        surface: Number(editForm.surface),
        localisation: editForm.localisation.trim()
      };
      await db.parcelles.update(id, updatedData);
      if (navigator.onLine) {
        await supabase.from('parcelles').update(updatedData).eq('id', id);
      }
      setEditingId(null);
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      setErrorModal({ 
        show: true, 
        message: "Une erreur est survenue lors de la mise à jour des données." 
      });
    }
  }

  const confirmDelete = async () => {
    const id = parcelleToDelete;
    setParcelleToDelete(null);
    try {
      await db.parcelles.delete(id);
      if (navigator.onLine) {
        const { error } = await supabase.from('parcelles').delete().eq('id', id);
        if (error) throw error;
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      setErrorModal({
        show: true,
        message: "Cette exploitation ne peut pas être supprimée tant que des données (zones, cultures) y sont rattachées."
      });
    }
  }

  // COMPOSANT BULLE D'AIDE - Correction Z-INDEX ici
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

      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }} 
      />

      <div className="relative p-6 max-w-2xl mx-auto space-y-8 pt-10">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center px-2">
           <button 
            onClick={() => setStep('dashboard')}
            className="w-10 h-10 rounded-2xl bg-white border border-[#E8E2D9] flex items-center justify-center text-[#1A2E26] active:scale-90 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
              <Landmark className="text-emerald-700/50" size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-800/50">Gestion foncière</span>
          </div>
        </div>

        {/* HEADER - ÉTAPE 1 DU TUTO */}
        <header className={`relative overflow-visible bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-8 text-white shadow-xl transition-all duration-500 ${guideStep === 1 ? 'z-[200] scale-[1.02] ring-4 ring-amber-400' : 'z-10'}`}>
          {guideStep === 1 && <TutorialPopUp title="Votre Patrimoine" text="C'est ici que vous listez l'ensemble de vos terrains et exploitations agricoles." />}
          <div className="relative z-10 text-center space-y-2">
            <div className="flex justify-center items-center gap-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Mes Terres</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-3xl font-serif font-medium">Exploitations agricoles</h1>
            <div className="flex items-center justify-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${navigator.onLine ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                  {parcelles.length} Exploitations enregistrées
                </p>
            </div>
          </div>
          <Landmark className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32 rotate-12" />
        </header>

        {/* FORMULAIRE - ÉTAPE 2 DU TUTO */}
        <section className={`space-y-4 relative transition-all duration-500 ${guideStep === 2 ? 'z-[200] scale-[1.02]' : 'z-10'}`}>
          {guideStep === 2 && <TutorialPopUp title="Ajout rapide" text="Remplissez le nom, la surface et le lieu pour créer une nouvelle fiche d'exploitation." />}
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-xl font-serif font-bold text-[#0A261D]">Déclarer un terrain</h3>
          </div>

          <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border transition-all ${guideStep === 2 ? 'border-amber-400' : 'border-[#E8E2D9]'} space-y-4`}>
            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/50 group-focus-within:text-emerald-600">
                  <LayoutGrid size={18} />
                </div>
                <input
                  className="w-full bg-slate-50 border border-transparent p-4 pl-12 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  placeholder="Ex: Champ Nord, Ferme Saly..."
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/50 group-focus-within:text-emerald-600">
                    <Maximize2 size={18} />
                  </div>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-transparent p-4 pl-12 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Surface (HA)"
                    value={surface}
                    onChange={e => setSurface(e.target.value)}
                  />
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/50 group-focus-within:text-emerald-600">
                    <MapPin size={18} />
                  </div>
                  <input
                    className="w-full bg-slate-50 border border-transparent p-4 pl-12 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Localisation"
                    value={localisation}
                    onChange={e => setLocalisation(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              disabled={submitting}
              className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all
                ${submitting
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#1A2E26] text-white hover:bg-[#0A261D] active:scale-[0.98] shadow-lg shadow-emerald-900/20'
                }`}
            >
              {submitting ? "⏳ Enregistrement…" : (
                <>
                  <Plus size={18} strokeWidth={3} className="text-amber-400" />
                  Valider l'enregistrement
                </>
              )}
            </button>
          </form>
        </section>

        {/* LISTE - ÉTAPE 3 DU TUTO */}
        <section className={`space-y-6 relative transition-all duration-500 ${guideStep === 3 ? 'z-[200] scale-[1.02]' : 'z-10'}`}>
          {guideStep === 3 && <TutorialPopUp title="Gérer vos Exploitations" text="Cliquez sur une Exploitation pour voir ses cultures, ou utilisez le crayon pour modifier ses informations." position="top" />}
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
              <h3 className="text-xl font-serif font-bold text-[#0A261D]">Inventaire</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{parcelles.length} fiches</span>
          </div>

          {parcelles.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-16 border-2 border-dashed border-emerald-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mb-4 shadow-inner">
                <MapIcon size={32} />
              </div>
              <p className="text-sm font-medium text-slate-400 font-serif italic">Aucune Exploitations à afficher</p>
            </div>
          ) : (
            <div className={`space-y-4 p-1 rounded-[2.5rem] transition-all ${guideStep === 3 ? 'bg-white ring-4 ring-amber-400' : ''}`}>
              {parcelles.map(p => {
                const status = parcelleStatus[p.id] || p.statut || 'en_cours';
                const isDone = status === 'terminee';
                const isEditing = editingId === p.id;
                
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!isEditing) {
                        setSelectedParcelle(p)
                        setStep('parcelle-details')
                      }
                    }}
                    className={`group bg-white rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden ${isEditing ? 'border-amber-400 shadow-lg' : 'border-[#E8E2D9] hover:border-emerald-200 hover:shadow-xl cursor-pointer'}`}
                  >
                    <div className="p-6">
                      {isEditing ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                                <Pencil size={14} className="text-amber-500" />
                                <span className="text-[10px] font-black uppercase text-amber-500 tracking-tighter">Édition en cours</span>
                             </div>
                             <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setParcelleToDelete(p.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[9px] font-black uppercase"
                             >
                               <Trash2 size={12} /> Supprimer
                             </button>
                          </div>
                          <input 
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                            value={editForm.nom}
                            onChange={e => setEditForm({...editForm, nom: e.target.value})}
                            onClick={e => e.stopPropagation()}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="number"
                              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                              value={editForm.surface}
                              onChange={e => setEditForm({...editForm, surface: e.target.value})}
                              onClick={e => e.stopPropagation()}
                            />
                            <input 
                              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                              value={editForm.localisation}
                              onChange={e => setEditForm({...editForm, localisation: e.target.value})}
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => handleUpdate(e, p.id)}
                              className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"
                            >
                              <Check size={14} /> Enregistrer
                            </button>
                            <button 
                              onClick={cancelEditing}
                              className="px-4 bg-slate-100 text-slate-500 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"
                            >
                              <RotateCcw size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all
                            ${isDone 
                              ? 'bg-emerald-600 text-white shadow-emerald-200' 
                              : 'bg-white border-2 border-slate-100 text-slate-300 group-hover:border-emerald-300 group-hover:text-emerald-500 shadow-sm'}
                          `}>
                            {isDone ? <CheckCircle2 size={26} strokeWidth={2.5} /> : <Sprout size={26} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-lg leading-tight truncate text-[#1A2E26]">
                                {p.nom}
                              </h4>
                              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                {p.surface} HA
                              </div>
                              <button 
                                onClick={(e) => startEditing(e, p)}
                                className="p-1.5 rounded-lg text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-3">
                               <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                  <MapPin size={10} />
                                  {p.localisation || 'Secteur libre'}
                               </div>
                               <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] ${isDone ? 'text-emerald-500' : 'text-orange-500'}`}>
                                  {isDone ? 'Terminée' : 'Active'}
                               </div>
                            </div>
                          </div>

                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F8F7F3] group-hover:bg-amber-500 group-hover:text-white transition-all border border-[#E8E2D9]">
                            <ChevronRight size={18} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/10">
                         <div className={`h-full bg-emerald-500 transition-all duration-1000 ${isDone ? 'w-full' : 'w-1/4 opacity-30'}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* MODALES - Z-INDEX TRES HAUT */}
      {parcelleToDelete && (
        <div className="fixed inset-0 z-[600] bg-[#1A2E26]/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl border border-[#E8E2D9]">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-2 shadow-inner">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#1A2E26]">Supprimer ?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Cette action effacera définitivement cette Exploitation et ses données liées.</p>
              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button onClick={() => setParcelleToDelete(null)} className="py-4 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px]">Annuler</button>
                <button onClick={confirmDelete} className="py-4 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg">Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorModal.show && (
        <div className="fixed inset-0 z-[700] bg-[#1A2E26]/80 backdrop-blur-lg flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl border-2 border-amber-100 text-center space-y-4">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1A2E26]">Action impossible</h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border">{errorModal.message}</p>
            <button onClick={() => setErrorModal({ show: false, message: '' })} className="w-full py-5 rounded-[2rem] bg-[#1A2E26] text-white font-black uppercase tracking-[0.1em] text-[11px]">D'accord</button>
          </div>
        </div>
      )}
    </div>
  )
}