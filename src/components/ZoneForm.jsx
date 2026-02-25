import { useState } from 'react'
import { PlusCircle, Maximize2, Type } from 'lucide-react'

export default function ZoneForm({
  onAdd,
  surfaceParcelle, // Toujours en HA
  surfaceUtilisee  // Toujours en HA
}) {
  const [nom, setNom] = useState('')
  const [surface, setSurface] = useState('')
  const [unit, setUnit] = useState('HA') // HA ou m2

  const surfaceRestanteHA = surfaceParcelle - surfaceUtilisee
  
  // Calcul de la limite dynamique selon l'unité choisie pour l'affichage
  const displayLimit = unit === 'HA' ? surfaceRestanteHA : surfaceRestanteHA * 10000

async function submit(e) {
  e.preventDefault()
  if (!nom || !surface) return

  const surfaceNumHA = unit === 'm2'
    ? Number(surface) / 10000
    : Number(surface)



  const success = await onAdd({ nom, surface: surfaceNumHA })

  if (success) {
    setNom('')
    setSurface('')
  }
}

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
          <Type size={16} />
        </div>
        <input
          placeholder="Ex: Bloc Nord-A"
          value={nom}
          onChange={e => setNom(e.target.value)}
          className="w-full bg-white border border-orange-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[#1A2E26] focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-slate-300 placeholder:font-medium"
        />
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
          <Maximize2 size={16} />
        </div>
        <input
          type="number"
          step="any"
          placeholder={`Surface (max ${displayLimit.toFixed(unit === 'HA' ? 2 : 0)} ${unit})`}
          value={surface}
          onChange={e => setSurface(e.target.value)}
          disabled={surfaceRestanteHA <= 0}
          className="w-full bg-white border border-orange-100 rounded-2xl py-4 pl-12 pr-16 text-sm font-bold text-[#1A2E26] focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 placeholder:text-slate-300"
        />
        <button 
          type="button"
          onClick={() => setUnit(unit === 'HA' ? 'm2' : 'HA')}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-1.5 rounded-lg hover:bg-orange-200 transition-colors"
        >
          {unit}
        </button>
      </div>

      <button 
        disabled={surfaceRestanteHA <= 0 || !nom || !surface}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-2xl shadow-lg shadow-orange-900/10 transition-all active:scale-95 flex items-center justify-center gap-3"
      >
        <PlusCircle size={16} />
        Enregistrer l'unité
      </button>

      {surfaceRestanteHA <= 0 && (
        <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 py-3 rounded-xl animate-pulse">
          <span className="text-[10px] font-black uppercase tracking-widest">Surface totale atteinte</span>
        </div>
      )}
    </form>
  )
}