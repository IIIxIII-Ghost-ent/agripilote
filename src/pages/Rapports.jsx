import React, { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/db'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  TrendingDown,
  TrendingUp,
  PieChart,
  Download,
  Plus,
  X,
  Filter,
  ArrowLeft,
  Calendar,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Clock,
  Wallet,
  Receipt,
  Map as MapIcon,
  HelpCircle,
  Info
} from 'lucide-react'

const EXPENSE_CATEGORIES = [
  { id: 'semences', label: 'Semences', emoji: '🌱' },
  { id: 'engrais', label: 'Engrais', emoji: '🧪' },
  { id: 'traitement', label: 'Traitement', emoji: '🛡️' },
  { id: 'main_oeuvre', label: 'Main d’œuvre', emoji: '👷' },
  { id: 'equipement', label: 'Équipement', emoji: '🚜' },
  { id: 'autre', label: 'Autre', emoji: '📦' }
]

export default function Rapports({ user, setStep, parcelles = [] }) {
  const [depenses, setDepenses] = useState([])
  const [revenus, setRevenus] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterParcelle, setFilterParcelle] = useState('all')
  
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showRevenueForm, setShowRevenueForm] = useState(false)
  const [formError, setFormError] = useState(null)
  const [showGuide, setShowGuide] = useState(false)

  const [expenseForm, setExpenseForm] = useState({ type: 'semences', parcelle_id: '', montant: '', description: '' })
  const [revenueForm, setRevenueForm] = useState({ parcelle_id: '', quantite: '', prix: '' })

  useEffect(() => {
    localStorage.setItem('currentStep', 'rapports');
  }, []);

  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      setLoading(true)
      try {
        const dLocal = await db.depenses_campagne.where('user_id').equals(user.id).toArray()
        const rLocal = await db.revenus_campagne.where('user_id').equals(user.id).toArray()
        setDepenses(dLocal)
        setRevenus(rLocal)

        if (navigator.onLine) {
          const { data: dOnline } = await supabase.from('depenses_campagne').select('*').eq('user_id', user.id)
          const { data: rOnline } = await supabase.from('revenus_campagne').select('*').eq('user_id', user.id)
          if (dOnline) {
            await db.depenses_campagne.bulkPut(dOnline.map(x => ({ ...x, synced: 1 })))
            setDepenses(dOnline)
          }
          if (rOnline) {
            await db.revenus_campagne.bulkPut(rOnline.map(x => ({ ...x, synced: 1 })))
            setRevenus(rOnline)
          }
        }
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    loadData()
  }, [user])

  const addExpense = async () => {
    if (!expenseForm.parcelle_id) return setFormError('Veuillez sélectionner une parcelle');
    if (!expenseForm.montant) return setFormError('Veuillez saisir un montant');
    
    setFormError(null)
    const newDoc = {
      id: crypto.randomUUID(),
      user_id: user.id,
      parcelle_id: expenseForm.parcelle_id,
      type: expenseForm.type,
      montant: Number(expenseForm.montant),
      description: expenseForm.description,
      created_at: new Date().toISOString(),
      synced: 0 
    }
    try {
      await db.depenses_campagne.add(newDoc)
      setDepenses(prev => [newDoc, ...prev])
      if (navigator.onLine) {
        const { synced, ...toSupabase } = newDoc
        const { error } = await supabase.from('depenses_campagne').insert([toSupabase])
        if (!error) await db.depenses_campagne.update(newDoc.id, { synced: 1 })
      }
      setExpenseForm({ type: 'semences', parcelle_id: '', montant: '', description: '' })
      setShowExpenseForm(false)
    } catch (err) { console.error(err) }
  }

  const addRevenue = async () => {
    if (!revenueForm.parcelle_id) return setFormError('Veuillez sélectionner une parcelle');
    if (!revenueForm.quantite || !revenueForm.prix) return setFormError('Saisissez la quantité et le prix');

    setFormError(null)
    const montantTotal = Number(revenueForm.quantite) * Number(revenueForm.prix)
    const newDoc = {
      id: crypto.randomUUID(),
      user_id: user.id,
      parcelle_id: revenueForm.parcelle_id,
      source: `Vente (${revenueForm.quantite}kg)`,
      montant: montantTotal,
      created_at: new Date().toISOString(),
      synced: 0
    }
    try {
      await db.revenus_campagne.add(newDoc)
      setRevenus(prev => [newDoc, ...prev])
      if (navigator.onLine) {
        const { synced, ...toSupabase } = newDoc
        const { error } = await supabase.from('revenus_campagne').insert([toSupabase])
        if (!error) await db.revenus_campagne.update(newDoc.id, { synced: 1 })
      }
      setRevenueForm({ parcelle_id: '', quantite: '', prix: '' })
      setShowRevenueForm(false)
    } catch (err) { console.error(err) }
  }

  const depensesFiltrees = useMemo(() => depenses.filter(d => filterParcelle === 'all' || d.parcelle_id === filterParcelle), [depenses, filterParcelle])
  const revenusFiltres = useMemo(() => revenus.filter(r => filterParcelle === 'all' || r.parcelle_id === filterParcelle), [revenus, filterParcelle])
  const totalDepenses = depensesFiltrees.reduce((sum, d) => sum + Number(d.montant || 0), 0)
  const totalRevenus = revenusFiltres.reduce((sum, r) => sum + Number(r.montant || 0), 0)
  const marge = totalRevenus - totalDepenses
  
  const formatMoney = (n) => new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n || 0)

  const generatePDF = () => {
    if (depensesFiltrees.length === 0 && revenusFiltres.length === 0) return alert("Aucune donnée disponible.")
    try {
      const doc = new jsPDF()
      const cleanFormat = (val) => {
        let formatted = new Intl.NumberFormat('fr-FR').format(val || 0);
        formatted = formatted.replace(/\s/g, ' '); 
        return formatted + " FCFA";
      }
      doc.setFillColor(26, 46, 38)
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.text("AGRIPILOTE - RAPPORT DE GESTION", 14, 25)
      doc.setFontSize(10)
      doc.text(`Edité le : ${new Date().toLocaleDateString('fr-FR')} | Propriétaire : ${user.email}`, 14, 33)
      doc.setTextColor(26, 46, 38)
      doc.setFontSize(14)
      doc.text("1. RÉSUMÉ DE LA PÉRIODE", 14, 55)
      autoTable(doc, {
        startY: 60,
        head: [['Catégorie', 'Valeur Totale']],
        body: [
          ['Total des Ventes (Entrées)', cleanFormat(totalRevenus)],
          ['Total des Dépenses (Sorties)', cleanFormat(totalDepenses)],
          [{ content: 'SOLDE NET (MARGE)', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }, 
           { content: cleanFormat(marge), styles: { fontStyle: 'bold', textColor: marge >= 0 ? [16, 185, 129] : [127, 29, 29] } }]
        ],
        theme: 'striped',
        headStyles: { fillColor: [26, 46, 38] }
      })
      doc.text("2. DÉTAIL DES OPÉRATIONS", 14, doc.lastAutoTable.finalY + 15)
      const allFlux = [...revenusFiltres, ...depensesFiltrees]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(item => [
          new Date(item.created_at).toLocaleDateString('fr-FR'),
          item.source ? "VENTE / RECOLTE" : (EXPENSE_CATEGORIES.find(c => c.id === item.type)?.label.toUpperCase() || "AUTRE"),
          parcelles.find(p => p.id === item.parcelle_id)?.nom || 'Général',
          item.source ? `+ ${cleanFormat(item.montant)}` : `- ${cleanFormat(item.montant)}`
        ])
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Date', 'Type d\'opération', 'Parcelle', 'Montant']],
        body: allFlux,
        headStyles: { fillColor: [71, 85, 105] },
        columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } }
      })
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text("Ce document est un relevé électronique certifié par l'application AgriPilote.", 14, doc.internal.pageSize.height - 10)
      doc.save(`Rapport_AgriPilote_${Date.now()}.pdf`)
    } catch (err) { console.error(err) }
  }

  if (!user) return <div className="p-10 text-center font-serif">Chargement du compte...</div>

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 font-sans text-[#1A2E26]">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '80px 80px' }} />

      <div className="relative p-6 max-w-2xl mx-auto space-y-8 pt-10">
        
        {/* TOP BAR AVEC GUIDE */}
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center gap-2">
              <Wallet className="text-[#1A2E26]/50" size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1A2E26]/50">Finance</span>
           </div>
           <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${showGuide ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-[#1A2E26] border border-[#E8E2D9]'}`}
           >
             {showGuide ? <X size={16} /> : <HelpCircle size={16} />}
             <span className="text-[10px] font-black uppercase tracking-widest">{showGuide ? "Fermer" : "Guide"}</span>
           </button>
        </div>

        {/* HEADER */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-8 text-white shadow-xl">
          <button 
            onClick={() => {
              localStorage.setItem('currentStep', 'dashboard');
              setStep('dashboard');
            }}
            className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all z-20"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative z-10 text-center space-y-2 pt-4">
            <div className="flex justify-center items-center gap-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Gestion Financière</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-3xl font-serif font-medium">Mes Comptes</h1>
            <div className="flex items-center justify-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${navigator.onLine ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`} />
               <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">{navigator.onLine ? 'Cloud Synchronisé' : 'Mode Local'}</p>
            </div>
          </div>
          <PieChart className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32 rotate-12" />
        </header>

        {/* RÉSUMÉ DYNAMIQUE */}
        <div className="relative grid grid-cols-2 gap-4">
          {showGuide && (
            <div className="absolute inset-0 z-20 bg-[#1A2E26]/95 backdrop-blur-md rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 border-2 border-amber-400/50">
              <TrendingUp className="text-amber-400 mb-2" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Santé Financière</p>
              <p className="text-sm font-serif italic text-white max-w-[240px]">Suivez votre bénéfice net en temps réel. Le vert indique un profit, le orange une perte.</p>
            </div>
          )}
          <div className={`p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden group transition-all duration-500 col-span-2 ${marge >= 0 ? 'bg-emerald-600' : 'bg-orange-700'}`}>
              <div className="relative z-10 flex flex-col items-center">
                 <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em]">Solde de Campagne</p>
                 <div className="flex items-baseline gap-1 mt-1">
                   <span className="text-4xl font-black tracking-tighter">{formatMoney(marge)}</span>
                 </div>
              </div>
              <Wallet className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700" size={100} />
          </div>
          
          <div className="bg-white p-6 rounded-[2.5rem] border border-[#E8E2D9] text-[#1A2E26] shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Entrées</p>
                 <p className="text-xl font-black mt-1 text-emerald-600">+{formatMoney(totalRevenus)}</p>
              </div>
              <TrendingUp className="absolute -right-2 -bottom-2 opacity-5" size={60} />
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-[#E8E2D9] text-[#1A2E26] shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sorties</p>
                 <p className="text-xl font-black mt-1 text-orange-600">-{formatMoney(totalDepenses)}</p>
              </div>
              <TrendingDown className="absolute -right-2 -bottom-2 opacity-5" size={60} />
          </div>
        </div>

        {/* FILTRES PARCELLES */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
              <MapIcon size={14} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vue par parcelle</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
            <button 
              onClick={() => setFilterParcelle('all')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap transition-all border flex items-center gap-2 ${filterParcelle === 'all' ? 'bg-[#1A2E26] text-white border-[#1A2E26] shadow-lg scale-105' : 'bg-white text-slate-400 border-[#E8E2D9]'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filterParcelle === 'all' ? 'bg-amber-400' : 'bg-slate-200'}`} />
              Toutes les zones
            </button>
            {parcelles.map(p => (
              <button 
                key={p.id}
                onClick={() => setFilterParcelle(p.id)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap transition-all border flex items-center gap-2 ${filterParcelle === p.id ? 'bg-[#1A2E26] text-white border-[#1A2E26] shadow-lg scale-105' : 'bg-white text-slate-400 border-[#E8E2D9]'}`}
              >
                <MapPin size={12} className={filterParcelle === p.id ? 'text-amber-400' : 'text-slate-300'} />
                {p.nom}
              </button>
            ))}
          </div>
        </div>

        {/* ACTIONS PRINCIPALES */}
        <div className="relative space-y-4">
          {showGuide && (
            <div className="absolute inset-0 z-20 bg-emerald-900/95 backdrop-blur-md rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 border-2 border-amber-400/50">
              <Plus className="text-amber-400 mb-2" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Nouvelle Saisie</p>
              <p className="text-sm font-serif italic text-white max-w-[240px]">Ajoutez vos achats ou vos ventes ici. Générez ensuite un PDF pro pour vos archives.</p>
            </div>
          )}
          <button 
            onClick={() => { setShowExpenseForm(!showExpenseForm); setShowRevenueForm(false); setFormError(null); }}
            className={`w-full p-4 rounded-[2rem] border transition-all flex items-center justify-between group active:scale-[0.98] ${showExpenseForm ? 'bg-orange-50 border-orange-200 shadow-inner' : 'bg-white border-[#E8E2D9] shadow-sm'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${showExpenseForm ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600'}`}>
                <TrendingDown size={20} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#1A2E26]">Nouvelle Dépense</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enregistrer un achat</p>
              </div>
            </div>
            <ChevronRight className={`text-slate-300 transition-transform ${showExpenseForm ? 'rotate-90' : ''}`} size={20} />
          </button>

          {showExpenseForm && (
            <div className="bg-white p-8 rounded-[3rem] border-2 border-orange-100 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
               <div className="grid grid-cols-3 gap-2">
                 {EXPENSE_CATEGORIES.map(c => (
                   <button key={c.id} onClick={() => setExpenseForm(f => ({ ...f, type: c.id }))} className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all flex flex-col items-center gap-1 ${expenseForm.type === c.id ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                     <span className="text-lg">{c.emoji}</span>
                     {c.label}
                   </button>
                 ))}
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">1. Parcelle concernée</label>
                  <div className={`grid grid-cols-2 gap-2 p-1 ${!expenseForm.parcelle_id && formError ? 'animate-shake' : ''}`}>
                    {parcelles.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setExpenseForm(f => ({ ...f, parcelle_id: p.id }))} 
                        className={`p-3 rounded-2xl text-[10px] font-bold border transition-all flex items-center gap-3 relative overflow-hidden ${expenseForm.parcelle_id === p.id ? 'bg-[#1A2E26] border-[#1A2E26] text-white shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                      >
                        <MapPin size={14} className={expenseForm.parcelle_id === p.id ? 'text-amber-400' : 'text-slate-300'} />
                        <span className="truncate">{p.nom}</span>
                        {expenseForm.parcelle_id === p.id && <CheckCircle2 size={12} className="absolute right-2 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                  <input type="number" placeholder="Montant en FCFA *" value={expenseForm.montant} onChange={e => setExpenseForm(f => ({ ...f, montant: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-5 text-2xl font-black outline-none focus:ring-2 ring-orange-100" />
                  <textarea placeholder="Petit mémo (facultatif)" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold outline-none ring-1 ring-slate-100 h-20 resize-none" />
                  {formError && <p className="text-orange-600 text-[10px] font-black uppercase text-center font-bold tracking-tighter">{formError}</p>}
               </div>
               <button onClick={addExpense} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all">Enregistrer la dépense</button>
            </div>
          )}

          <button 
            onClick={() => { setShowRevenueForm(!showRevenueForm); setShowExpenseForm(false); setFormError(null); }}
            className={`w-full p-4 rounded-[2rem] border transition-all flex items-center justify-between group active:scale-[0.98] ${showRevenueForm ? 'bg-emerald-50 border-emerald-200 shadow-inner' : 'bg-white border-[#E8E2D9] shadow-sm'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${showRevenueForm ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                <TrendingUp size={20} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#1A2E26]">Vente de Récolte</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enregistrer un gain</p>
              </div>
            </div>
            <ChevronRight className={`text-slate-300 transition-transform ${showRevenueForm ? 'rotate-90' : ''}`} size={20} />
          </button>

          {showRevenueForm && (
            <div className="bg-white p-8 rounded-[3rem] border-2 border-emerald-100 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">1. Parcelle de provenance</label>
                  <div className="grid grid-cols-2 gap-2">
                    {parcelles.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setRevenueForm(f => ({ ...f, parcelle_id: p.id }))} 
                        className={`p-3 rounded-2xl text-[10px] font-bold border transition-all flex items-center gap-3 relative ${revenueForm.parcelle_id === p.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${revenueForm.parcelle_id === p.id ? 'bg-white/20' : 'bg-emerald-50'}`}>
                          <span className="text-[12px]">🚜</span>
                        </div>
                        <span className="truncate">{p.nom}</span>
                        {revenueForm.parcelle_id === p.id && <CheckCircle2 size={12} className="absolute right-2 text-white" />}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <input type="number" placeholder="Kilos (kg) *" value={revenueForm.quantite} onChange={e => setRevenueForm(f => ({ ...f, quantite: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-lg font-black outline-none ring-1 ring-slate-100" />
                     <input type="number" placeholder="Prix / Kg *" value={revenueForm.prix} onChange={e => setRevenueForm(f => ({ ...f, prix: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-lg font-black outline-none ring-1 ring-slate-100" />
                  </div>
                  {formError && <p className="text-emerald-600 text-[10px] font-black uppercase text-center font-bold">{formError}</p>}
               </div>
               <button onClick={addRevenue} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all">Enregistrer le revenu</button>
            </div>
          )}

          <button 
            onClick={generatePDF}
            className="w-full bg-[#1A2E26] p-5 rounded-[2rem] text-white flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all group"
          >
            <Download size={18} className="text-amber-400 group-hover:bounce" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Télécharger le Rapport PDF</span>
          </button>
        </div>

        {/* HISTORIQUE */}
        <section className="relative space-y-4">
          {showGuide && (
            <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-md rounded-[2rem] p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 border-2 border-amber-400/50">
              <Clock className="text-amber-400 mb-2" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Journal de Bord</p>
              <p className="text-sm font-serif italic text-white max-w-[240px]">Retrouvez ici vos 10 dernières transactions pour un contrôle rapide.</p>
            </div>
          )}
          <div className="flex items-center gap-2 px-1">
             <Clock size={14} className="text-slate-400" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dernières opérations</span>
          </div>
          
          {[...revenusFiltres, ...depensesFiltrees].length === 0 ? (
            <div className="bg-white rounded-[3rem] p-12 border-2 border-dashed border-emerald-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mb-4">
                <Receipt size={32} />
              </div>
              <p className="text-sm font-medium text-slate-400 font-serif italic">Aucune transaction enregistrée.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...revenusFiltres, ...depensesFiltrees]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map(item => (
                <div key={item.id} className="bg-white rounded-[2rem] p-5 border border-[#E8E2D9] flex items-center gap-4 group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.source ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    {item.source ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#1A2E26] truncate">
                      {item.source ? 'Vente de récolte' : EXPENSE_CATEGORIES.find(c => c.id === item.type)?.label || 'Dépense'}
                    </h4>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          <MapPin size={8} />
                          {parcelles.find(p => p.id === item.parcelle_id)?.nom || 'Général'}
                       </div>
                       <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase">
                          <Calendar size={8} />
                          {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                       </div>
                    </div>
                  </div>
                  <div className={`text-sm font-black ${item.source ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {item.source ? '+' : '-'}{formatMoney(item.montant)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}