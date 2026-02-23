import Dexie from 'dexie'

export const db = new Dexie('agripilote_db')

db.version(1).stores({
  parcelles: 'id, user_id, synced, created_at',
zones: 'id, parcelle_id, user_id, synced, created_at, [user_id+synced]',
  cultures: 'id,nom,synced',
  zone_cultures: 'id,zone_id,culture_id,date_debut,user_id,created_at,synced,[zone_id+culture_id+user_id]',
// ✅ UNE SEULE TABLE tasks
  tasks: `
    id,
    user_id,
    zone_culture_id,
    date_prevue,
    termine,
    sync_status
  `,
// ✅ AJOUT DES TABLES POUR LES RAPPORTS
  depenses_campagne: 'id, user_id, parcelle_id, type, synced, [user_id+synced]',
  revenus_campagne: 'id, user_id, parcelle_id, synced, [user_id+synced]', 
  
  symptomes: 'id, libelle, categorie, organe',
  maladies: 'id, culture_id, nom, gravite',
  maladie_symptomes: '++id, maladie_id, symptome_id, poids',
  traitements: '++id, maladie_id, type, produit, dose',
  actions_prioritaires: 'id, culture_id, maladie_id, [culture_id+maladie_id]',
  diagnostic_history: 'id, user_id, zone_id, maladie_nom, confidence, created_at, synced, [user_id+synced]'
})
