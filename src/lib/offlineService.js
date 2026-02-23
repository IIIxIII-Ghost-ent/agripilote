import { supabase } from "./supabase"
import { db } from "./db"

export const isOnline = () => navigator.onLine

export async function smartInsert(table, data) {
  if (isOnline()) {
    const { error } = await supabase.from(table).insert(data)
    if (error) {
      console.error("Supabase error → fallback offline", error)
      await db[table].add({ ...data, synced: 0 })
    }
  } else {
    await db[table].add({ ...data, synced: 0 })
  }
}
