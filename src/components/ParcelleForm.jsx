import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ParcelleForm({ user, onAdded }) {
  const [nom, setNom] = useState('')
  const [surface, setSurface] = useState('')
  const [localisation, setLocalisation] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('parcelles').insert([
      {
        user_id: user.id,
        nom,
        surface,
        localisation,
      },
    ])

    if (!error) {
      setNom('')
      setSurface('')
      setLocalisation('')
      onAdded()
    } else {
      alert('Erreur lors de la création')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
      <h2>➕ Ajouter une parcelle</h2>

      <input
        placeholder="Nom de la parcelle"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        required
      />

      <input
        placeholder="Surface (ha)"
        type="number"
        value={surface}
        onChange={(e) => setSurface(e.target.value)}
        required
      />

      <input
        placeholder="Localisation"
        value={localisation}
        onChange={(e) => setLocalisation(e.target.value)}
        required
      />

      <button disabled={loading}>
        {loading ? 'Ajout...' : 'Ajouter'}
      </button>
    </form>
  )
}
