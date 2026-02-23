import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Bancabilite() {
  const [campagnes, setCampagnes] = useState([])
  const [montant, setMontant] = useState("")
  const [type, setType] = useState("depense")
  const [campagneId, setCampagneId] = useState("")

  useEffect(() => {
    fetchCampagnes()
  }, [])

  async function fetchCampagnes() {
    const { data: user } = await supabase.auth.getUser()

    const { data } = await supabase
      .from("campagnes")
      .select("id")
      .eq("user_id", user.user.id)

    setCampagnes(data)
    setCampagneId(data?.[0]?.id || "")
  }

  async function save() {
    const { data: user } = await supabase.auth.getUser()

    const table =
      type === "depense" ? "depenses_campagne" : "revenus_campagne"

    await supabase.from(table).insert({
      campagne_id: campagneId,
      user_id: user.user.id,
      montant
    })

    setMontant("")
    alert("Enregistré")
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Bancabilité</h1>

      <select
        value={campagneId}
        onChange={e => setCampagneId(e.target.value)}
        className="border p-2 w-full"
      >
        {campagnes.map(c => (
          <option key={c.id} value={c.id}>
            Campagne {c.id.slice(0, 6)}
          </option>
        ))}
      </select>

      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="border p-2 w-full"
      >
        <option value="depense">💸 Dépense</option>
        <option value="revenu">💰 Revenu</option>
      </select>

      <input
        type="number"
        placeholder="Montant FCFA"
        value={montant}
        onChange={e => setMontant(e.target.value)}
        className="border p-2 w-full"
      />

      <button
        onClick={save}
        className="bg-green-600 text-white p-2 rounded w-full"
      >
        Enregistrer
      </button>
    </div>
  )
}
