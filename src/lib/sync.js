import { supabase } from './supabase'
import { db } from './db'

/**
 * Synchronise une table Dexie vers Supabase
 * OFFLINE → ONLINE
 */
export async function syncTable({
  table,          // ex: 'parcelles'
  supabaseTable,  // ex: 'parcelles'
  user_id,
  mapToSupabase   // fonction optionnelle de mapping
}) {
  if (!navigator.onLine || !user_id) return

  // 🔹 récupérer uniquement les données non synchronisées de l'utilisateur
  const unsynced = await db[table]
    .where('[user_id+synced]')
    .equals([user_id, 0])
    .toArray()

  for (const item of unsynced) {
    // 🔹 retirer le champ local-only
    const { synced, ...localData } = item

    // 🔹 mapping propre vers Supabase (important)
    const payload = mapToSupabase
      ? mapToSupabase(localData)
      : localData

    const { error } = await supabase
      .from(supabaseTable)
      .insert(payload)

    if (!error) {
      await db[table].update(item.id, { synced: 1 })
    } else {
      console.error(`SYNC ERROR [${table}]`, error.message)
    }
  }
}
