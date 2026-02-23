import { useState } from 'react'

export default function ZoneForm({
  onAdd,
  surfaceParcelle,
  surfaceUtilisee
}) {
  const [nom, setNom] = useState('')
  const [surface, setSurface] = useState('')

  const surfaceRestante = surfaceParcelle - surfaceUtilisee

  function submit(e) {
    e.preventDefault()

    const surfaceNum = Number(surface)

    if (!nom || !surfaceNum) return

    if (surfaceNum > surfaceRestante) {
      alert('Surface insuffisante dans la parcelle')
      return
    }

    onAdd({ nom, surface: surfaceNum })

    setNom('')
    setSurface('')
  }

  return (
    <form onSubmit={submit} style={{ marginBottom: 20 }}>
      <input
        placeholder="Nom de la zone"
        value={nom}
        onChange={e => setNom(e.target.value)}
      />

      <input
        type="number"
        placeholder={`Surface (max ${surfaceRestante} ha)`}
        value={surface}
        onChange={e => setSurface(e.target.value)}
        disabled={surfaceRestante <= 0}
      />

      <button disabled={surfaceRestante <= 0}>
        ➕ Ajouter zone
      </button>

      {surfaceRestante <= 0 && (
        <p style={{ color: 'red', marginTop: 8 }}>
          ❌ Surface totale atteinte
        </p>
      )}
    </form>
  )
}
