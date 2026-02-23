import { supabase } from "./supabase"
import { db } from "./db"

/* ================= PARCELLES ================= */

export async function getParcelles(userId) {
  if (navigator.onLine) {
    const { data } = await supabase
      .from("parcelles")
      .select("*")
      .eq("user_id", userId)

    return data || []
  } else {
    return await db.parcelles
      .where("user_id")
      .equals(userId)
      .toArray()
  }
}

export async function addParcelle(parcelle, userId) {

  const newItem = {
    ...parcelle,
    id: crypto.randomUUID(),
    user_id: userId,
    synced: navigator.onLine ? 1 : 0
  }

  if (navigator.onLine) {
    await supabase.from("parcelles").insert(newItem)
  } else {
    await db.parcelles.add(newItem)
  }

  return newItem
}
