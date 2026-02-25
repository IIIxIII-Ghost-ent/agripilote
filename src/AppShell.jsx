import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { fetchUserProfile } from './lib/profile'
import { db } from './lib/db'

import Navigation from './components/Navigation'
import Header from './components/Header'

import Onboarding from './pages/Onboarding'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Parcelles from './pages/Parcelles'
import ParcelleDetails from './pages/ParcelleDetails'
import ZoneDetails from './pages/ZoneDetails'
import Taches from './pages/Taches'
import Diagnostic from './pages/Diagnostic'
import Rapports from './pages/Rapports'
import { syncTable } from './lib/sync'

export default function AppShell() {

  // ===============================
  // CORE STATE
  // ===============================
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState('onboarding')

  const [selectedParcelle, setSelectedParcelle] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)

  // ===============================
  // DATA METIER
  // ===============================
  const [parcelles, setParcelles] = useState([])
  const [taches, setTaches] = useState([])
  const [zoneCultures, setZoneCultures] = useState([])

  // ===============================
  // AUTH SUPABASE
  // ===============================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  // ===============================
  // PROFIL UTILISATEUR
  // ===============================
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    fetchUserProfile(user.id).then(setProfile)
  }, [user])

  // ===============================
  // REDIRECTION AUTO
  // ===============================
  useEffect(() => {
    if (loading) return
    setStep(user ? 'dashboard' : 'onboarding')
  }, [user, loading])

  // ===============================
  // PARCELLES – OFFLINE FIRST + SYNC (FIXED)
  // ===============================
  useEffect(() => {
    if (!user) {
      setParcelles([])
      return
    }

    const loadParcelles = async () => {
      const local = await db.parcelles
        .where('user_id')
        .equals(user.id)
        .sortBy('created_at')

      setParcelles(local)

      if (!navigator.onLine) return

      const { data, error } = await supabase
        .from('parcelles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error || !data) return

      // --- LOGIQUE DE NETTOYAGE PARCELLES ---
      const remoteIds = data.map(p => p.id)
      await db.parcelles
        .where('user_id').equals(user.id)
        .filter(p => p.synced === 1 && !remoteIds.includes(p.id))
        .delete()

      await db.parcelles.bulkPut(
        data.map(p => ({ ...p, synced: 1 }))
      )

      const finalLocal = await db.parcelles.where('user_id').equals(user.id).sortBy('created_at')
      setParcelles(finalLocal)
    }

    loadParcelles()
  }, [user])

  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine || !user) return

      const pending = await db.parcelles
        .where('synced')
        .equals(0)
        .toArray()

      for (const p of pending) {
        const { error } = await supabase
          .from('parcelles')
          .insert([{
            id: p.id,
            user_id: p.user_id,
            nom: p.nom,
            surface: p.surface,
            localisation: p.localisation,
            created_at: p.created_at
          }])

        if (!error) {
          await db.parcelles.update(p.id, { synced: 1 })
        }
      }
    }

    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [user])

  // ===============================
  // CULTURES TYPES
  // ===============================
  useEffect(() => {
    if (!user || !navigator.onLine) return

    const loadCultures = async () => {
      const { data } = await supabase.from('cultures').select('*').order('nom')
      if (data) {
        await db.cultures.bulkPut(data.map(c => ({ ...c, synced: 1 })))
      }
    }
    loadCultures()
  }, [user])

  // ===============================
  // GESTION DES ESPÈCES (ZONE_CULTURES) (FIXED)
  // ===============================
  const syncAndLoadZoneCultures = useCallback(async () => {
    if (!user) return

    const localData = await db.zone_cultures.where('user_id').equals(user.id).toArray()
    setZoneCultures(localData)

    if (navigator.onLine) {
      try {
        const pending = localData.filter(d => d.synced === 0)
        for (const item of pending) {
          const { synced, ...toSend } = item
          const { error } = await supabase.from('zone_cultures').insert([toSend])
          if (!error) await db.zone_cultures.update(item.id, { synced: 1 })
        }

        const { data: remoteData } = await supabase
          .from('zone_cultures')
          .select('*')
          .eq('user_id', user.id)

        if (remoteData) {
          // --- LOGIQUE DE NETTOYAGE ESPÈCES ---
          const remoteIds = remoteData.map(r => r.id)
          await db.zone_cultures
            .where('user_id').equals(user.id)
            .filter(l => l.synced === 1 && !remoteIds.includes(l.id))
            .delete()

          const currentLocal = await db.zone_cultures.where('user_id').equals(user.id).toArray()
          const mergedMap = new Map()
          
          remoteData.forEach(r => mergedMap.set(r.id, { ...r, synced: 1 }))
          currentLocal.forEach(l => {
            if (l.synced === 0) mergedMap.set(l.id, l)
          })

          const finalArray = Array.from(mergedMap.values())
          await db.zone_cultures.bulkPut(finalArray)
          setZoneCultures(finalArray)
        }
      } catch (err) {
        console.error("Erreur sync automatique:", err)
      }
    }
  }, [user])

  useEffect(() => {
    syncAndLoadZoneCultures()
    window.addEventListener('online', syncAndLoadZoneCultures)
    return () => window.removeEventListener('online', syncAndLoadZoneCultures)
  }, [syncAndLoadZoneCultures])

  // ===============================
  // ADD PARCELLE (OFFLINE FIRST)
  // ===============================
  const addParcelle = async ({ nom, surface, localisation }) => {
    if (!user) return

    const id = crypto.randomUUID()
    const parcelle = {
      id,
      user_id: user.id,
      nom,
      surface,
      localisation,
      created_at: new Date().toISOString(),
      synced: 0
    }

    await db.parcelles.add(parcelle)
    setParcelles(prev => [...prev, parcelle])

    if (!navigator.onLine) return

    const { error } = await supabase
      .from('parcelles')
      .insert([{
        id,
        user_id: user.id,
        nom,
        surface,
        localisation,
        created_at: parcelle.created_at
      }])

    if (!error) {
      await db.parcelles.update(id, { synced: 1 })
      setParcelles(prev =>
        prev.map(p => p.id === id ? { ...p, synced: 1 } : p)
      )
    }
  }

  // ===============================
  // SYNC ZONES
  // ===============================
  useEffect(() => {
    const syncAndRefreshZones = async () => {
      if (!user || !navigator.onLine) return;
      await syncTable({ table: 'zones', supabaseTable: 'zones', user_id: user.id });
      const { data, error } = await supabase.from('zones').select('*').eq('user_id', user.id);
      if (!error && data) {
        await db.zones.bulkPut(data.map(z => ({ ...z, synced: 1 })));
      }
    };
    window.addEventListener('online', syncAndRefreshZones);
    syncAndRefreshZones();
    return () => window.removeEventListener('online', syncAndRefreshZones);
  }, [user]);

  // ===============================
  // TACHES (AppShell) (FIXED)
  // ===============================
  useEffect(() => {
    if (!user) {
      setTaches([])
      return
    }

    const loadTaches = async () => {
      const local = await db.taches
        .where('user_id')
        .equals(user.id)
        .sortBy('date_prevue')
      setTaches(local)

      if (!navigator.onLine) return

      const { data, error } = await supabase
        .from('taches')
        .select(`
          *,
          zone_cultures (
            zones ( nom )
          )
        `)
        .eq('user_id', user.id)
        .order('date_prevue', { ascending: true })

      if (!error && data) {
        // --- LOGIQUE DE NETTOYAGE TACHES ---
        const remoteIds = data.map(t => t.id)
        await db.taches
          .where('user_id').equals(user.id)
          .filter(t => t.synced === 1 && !remoteIds.includes(t.id))
          .delete()

        const formattedData = data.map(t => ({
          ...t,
          user_id: user.id,
          synced: 1,
          nom_zone: t.zone_cultures?.zones?.nom || 'Zone inconnue'
        }))
        
        await db.taches.bulkPut(formattedData)
        const finalLocalTaches = await db.taches.where('user_id').equals(user.id).sortBy('date_prevue')
        setTaches(finalLocalTaches)
      }
    }

    loadTaches()
  }, [user])

  // ===============================
  // SYNC DIAGNOSTIC & FINANCE
  // ===============================
  useEffect(() => {
    const syncOthers = async () => {
      if (!user || !navigator.onLine) return
      await syncTable({
        table: 'diagnostic_history',
        supabaseTable: 'historique_diagnostics',
        user_id: user.id,
        mapToSupabase: (d) => ({
          id: d.id, user_id: d.user_id, zone_id: d.zone_id,
          maladie_nom: d.maladie_nom, confidence: d.confidence, created_at: d.created_at
        })
      })
      await syncTable({
        table: 'depenses_campagne', supabaseTable: 'depenses_campagne', user_id: user.id
      })
      await syncTable({
        table: 'revenus_campagne', supabaseTable: 'revenus_campagne', user_id: user.id
      })
    }
    window.addEventListener('online', syncOthers)
    syncOthers()
    return () => window.removeEventListener('online', syncOthers)
  }, [user])
// ===============================
// SYNC DATA RÉFÉRENCE (CERVEAU DU DIAGNOSTIC)
// ===============================
useEffect(() => {
  if (!user || !navigator.onLine) return;

  const syncDiagnosticKnowledge = async () => {
    try {
      // 1. Télécharger les symptômes
      const { data: s } = await supabase.from('symptomes').select('*');
      if (s) await db.symptomes.bulkPut(s);

      // 2. Télécharger les maladies
      const { data: m } = await supabase.from('maladies').select('*');
      if (m) await db.maladies.bulkPut(m);

      // 3. Télécharger les liens Maladie <-> Symptômes
      const { data: ms } = await supabase.from('maladie_symptomes').select('*');
      if (ms) await db.maladie_symptomes.bulkPut(ms);

      // 4. Télécharger les traitements
      const { data: t } = await supabase.from('traitements').select('*');
      if (t) await db.traitements.bulkPut(t);

      console.log("🧠 Cerveau diagnostic synchronisé avec succès");
    } catch (err) {
      console.error("Erreur sync connaissances:", err);
    }
  };

  syncDiagnosticKnowledge();
}, [user]);
  // ===============================
  // AUTH ACTIONS
  // ===============================
// ===============================
  // AUTH ACTIONS
  // ===============================
  const handleRegister = async (payload) => {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: { 
        data: { 
          nom: payload.nom, 
          localisation: payload.localisation, 
          phone: payload.phone 
        } 
      }
    })
    
    if (error) {
      alert(error.message)
    } else if (data?.user) {
      // Si l'utilisateur est créé, on le met dans le state pour rediriger direct
      setUser(data.user)
      setStep('dashboard')
    }
  }

  const handleLogin = (user) => setUser(user)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setStep('onboarding')
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Chargement…</div>

  return (
    <div className="min-h-screen bg-background text-foreground">

      {!user && step === 'onboarding' && (
        <Onboarding onFinish={() => setStep('register')} />
      )}

      {!user && step === 'register' && (
        <Register onRegister={handleRegister} onGoLogin={() => setStep('login')} />
      )}

      {!user && step === 'login' && (
        <Login onLoginSuccess={handleLogin} />
      )}

      {user && (
        <>
          <Header user={user} profile={profile} tasks={taches} setStep={setStep} onLogout={handleLogout} />
          <Navigation currentStep={step} setStep={setStep} />

          {step === 'dashboard' && (
            <Dashboard 
              user={user} profile={profile} parcelles={parcelles} 
              taches={taches} setTaches={setTaches} setStep={setStep} 
              openNewFieldForm={() => setStep('parcelles')} zoneCultures={zoneCultures} 
            />
          )}

          {step === 'parcelles' && (
            <Parcelles 
              parcelles={parcelles} addParcelle={addParcelle} 
              setStep={setStep} setSelectedParcelle={setSelectedParcelle} 
            />
          )}

          {step === 'parcelle-details' && selectedParcelle && (
            <ParcelleDetails 
              parcelle={selectedParcelle} goBack={() => setStep('parcelles')} 
              setStep={setStep} setSelectedZone={setSelectedZone} 
            />
          )}

          {step === 'zone-details' && selectedZone && (
            <ZoneDetails 
              zone={selectedZone} user={user} zoneCultures={zoneCultures} 
              setZoneCultures={setZoneCultures} goBack={() => setStep('parcelle-details')} 
            />
          )}

          {step === 'taches' && <Taches taches={taches} setTaches={setTaches} user={user} />}
          {step === 'diagnostic' && <Diagnostic user={user} />}
          {step === 'rapports' && <Rapports user={user} parcelles={parcelles} />}
        </>
      )}
    </div>
  )
}