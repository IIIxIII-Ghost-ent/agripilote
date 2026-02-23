import { supabase } from './supabase'

export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}
