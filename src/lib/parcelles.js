import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ParcelleForm from '../components/ParcelleForm'
import ParcelleList from '../components/ParcelleList'

export default function Parcelles() {
  const [user, setUser] = useState(null)
  const [parcelles, setParcelles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUser()
  }, [])

  async function getUser() {
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      setUser(data.user)
      fetchParcelles(data.user.id)
    }
  }

  async function fetchParcelles(userId) {
    setLoading(true)
    const { data, error } = await supabase
      .from('parcelles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error) {
      setParcelles(data)
    }
    setLoading(false)
  }

  if (!user) return <p>Chargement...</p>

  return (
    <div style={{ padding: 20 }}>
      <h1>🌾 Mes parcelles</h1>

      <ParcelleForm user={user} onAdded={() => fetchParcelles(user.id)} />

      {loading ? (
        <p>Chargement des parcelles...</p>
      ) : (
        <ParcelleList
          parcelles={parcelles}
          onRefresh={() => fetchParcelles(user.id)}
        />
      )}
    </div>
  )
}
