import { supabase } from '../lib/supabase'

export default function ParcelleList({ parcelles, onRefresh }) {
  async function deleteParcelle(id) {
    const confirm = window.confirm('Supprimer cette parcelle ?')
    if (!confirm) return

    const { error } = await supabase
      .from('parcelles')
      .delete()
      .eq('id', id)

    if (!error) {
      onRefresh()
    }
  }

  if (parcelles.length === 0) {
    return <p>Aucune parcelle enregistrée</p>
  }

  return (
    <div>
      <h2>📋 Liste des parcelles</h2>

      {parcelles.map((p) => (
        <div
          key={p.id}
          style={{
            border: '1px solid #ccc',
            padding: 10,
            marginBottom: 10,
          }}
        >
          <strong>{p.nom}</strong>
          <p>Surface : {p.surface} ha</p>
          <p>Localisation : {p.localisation}</p>

          <button onClick={() => deleteParcelle(p.id)}>
            ❌ Supprimer
          </button>
        </div>
      ))}
    </div>
  )
}
