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
  Map as MapIcon
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

  // ================= LOGIQUE (Inchangée) =================
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

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 font-sans text-[#1A2E26]">
      {/* MOTIF CULTUREL DE FOND (Identique Tâches) */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }} 
      />

      <div className="relative p-6 max-w-2xl mx-auto space-y-8 pt-10">
        
        {/* HEADER HARMONISÉ */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-8 text-white shadow-xl">
          <button 
            onClick={() => setStep('dashboard')}
            className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all z-20"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative z-10 text-center space-y-2 pt-4">
            <div className="flex justify-center items-center gap-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Patrimoine Foncier</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-3xl font-serif font-medium">Mes Parcelles</h1>
            <div className="flex items-center justify-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${navigator.onLine ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                  {navigator.onLine ? 'Cloud Synchronisé' : 'Mode Local'} • {parcelles.length} Unités
                </p>
            </div>
          </div>
          <Landmark className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32 rotate-12" />
        </header>

        {/* SECTION FORMULAIRE (Design Carte Blanche) */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-xl font-serif font-bold text-[#0A261D]">Nouvel Enregistrement</h3>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-[#E8E2D9] space-y-4">
            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/50 group-focus-within:text-emerald-600 transition-colors">
                  <LayoutGrid size={18} />
                </div>
                <input
                  className="w-full bg-slate-50 border border-transparent p-4 pl-12 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  placeholder="Nom du domaine (ex: Keur Mouride)"
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
                    placeholder="Terroir"
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
              {submitting ? "⏳ Validation..." : (
                <>
                  <Plus size={18} strokeWidth={3} className="text-amber-400" />
                  Ajouter au Domaine
                </>
              )}
            </button>
          </form>
        </section>

        {/* LISTE DES PARCELLES (Style Cartes Tâches) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
            <h3 className="text-xl font-serif font-bold text-[#0A261D]">Inventaire Terrestre</h3>
          </div>

          {parcelles.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-16 border-2 border-dashed border-emerald-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mb-4 shadow-inner">
                <MapIcon size={32} />
              </div>
              <p className="text-sm font-medium text-slate-400 font-serif italic">Aucune parcelle dans l'inventaire.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parcelles.map(p => {
                const status = parcelleStatus[p.id] || p.statut || 'en_cours';
                const isDone = status === 'terminee';
                
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedParcelle(p)
                      setStep('parcelle-details')
                    }}
                    className="group bg-white rounded-[2.5rem] border border-[#E8E2D9] hover:border-emerald-200 hover:shadow-xl transition-all duration-300 relative overflow-hidden cursor-pointer"
                  >
                    <div className="p-6 flex items-center gap-5">
                      {/* Icône de gauche - Style Case à cocher Tâches */}
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
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <MapPin size={10} />
                              {p.localisation || 'Terroir non défini'}
                           </div>
                           <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] ${isDone ? 'text-emerald-500' : 'text-orange-500 animate-pulse'}`}>
                              {isDone ? 'Exploité' : 'En cours'}
                           </div>
                        </div>
                      </div>

                      {/* Bouton Action Droite - Style Tâches */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F8F7F3] group-hover:bg-amber-500 group-hover:text-white transition-all border border-[#E8E2D9]">
                        <ChevronRight size={18} strokeWidth={3} />
                      </div>
                    </div>

                    {/* Barre de synchronisation si nécessaire (optionnel visuellement) */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/10">
                       <div className={`h-full bg-emerald-500 transition-all duration-1000 ${isDone ? 'w-full' : 'w-1/3 opacity-30'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}