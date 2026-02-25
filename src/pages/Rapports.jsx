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
  Trash2,
  Edit3,
  Sprout,
  FlaskConical,
  ShieldCheck,
  HardHat,
  Tractor,
  Package
} from 'lucide-react'

// Mise à jour des catégories avec des composants d'icônes au lieu d'emojis
const EXPENSE_CATEGORIES = [
  { id: 'semences', label: 'Semences', icon: Sprout, color: 'text-emerald-500' },
  { id: 'engrais', label: 'Engrais', icon: FlaskConical, color: 'text-blue-500' },
  { id: 'traitement', label: 'Traitement', icon: ShieldCheck, color: 'text-purple-500' },
  { id: 'main_oeuvre', label: 'Main d’œuvre', icon: HardHat, color: 'text-amber-600' },
  { id: 'equipement', label: 'Équipement', icon: Tractor, color: 'text-slate-600' },
  { id: 'autre', label: 'Autre', icon: Package, color: 'text-gray-400' }
]

export default function Rapports({ user, setStep, parcelles = [] }) {
  const [depenses, setDepenses] = useState([])
  const [revenus, setRevenus] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterParcelle, setFilterParcelle] = useState('all')
  
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showRevenueForm, setShowRevenueForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
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

  const deleteItem = async (id, type) => {
    if (!confirm("Voulez-vous vraiment supprimer cette opération ?")) return;
    const table = type === 'revenue' ? 'revenus_campagne' : 'depenses_campagne';
    try {
      if (type === 'revenue') {
        await db.revenus_campagne.delete(id);
        setRevenus(prev => prev.filter(item => item.id !== id));
      } else {
        await db.depenses_campagne.delete(id);
        setDepenses(prev => prev.filter(item => item.id !== id));
      }
      if (navigator.onLine) {
        await supabase.from(table).delete().eq('id', id);
      }
    } catch (err) { console.error(err) }
  }

  const startEdit = (item) => {
    setEditingItem(item);
    if (item.source) {
      setRevenueForm({
        parcelle_id: item.parcelle_id,
        quantite: item.source.match(/\((.*)kg\)/)?.[1] || '',
        prix: (item.montant / (parseFloat(item.source.match(/\((.*)kg\)/)?.[1]) || 1)).toString()
      });
      setShowRevenueForm(true);
      setShowExpenseForm(false);
    } else {
      setExpenseForm({
        type: item.type,
        parcelle_id: item.parcelle_id,
        montant: item.montant.toString(),
        description: item.description || ''
      });
      setShowExpenseForm(true);
      setShowRevenueForm(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const addExpense = async () => {
    if (!expenseForm.parcelle_id) return setFormError('Veuillez sélectionner une parcelle');
    if (!expenseForm.montant) return setFormError('Veuillez saisir un montant');
    
    setFormError(null)
    const docId = editingItem ? editingItem.id : crypto.randomUUID();
    const newDoc = {
      id: docId,
      user_id: user.id,
      parcelle_id: expenseForm.parcelle_id,
      type: expenseForm.type,
      montant: Number(expenseForm.montant),
      description: expenseForm.description,
      created_at: editingItem ? editingItem.created_at : new Date().toISOString(),
      synced: 0 
    }
    try {
      await db.depenses_campagne.put(newDoc)
      setDepenses(prev => editingItem ? prev.map(x => x.id === docId ? newDoc : x) : [newDoc, ...prev])
      if (navigator.onLine) {
        const { synced, ...toSupabase } = newDoc
        const { error } = await supabase.from('depenses_campagne').upsert([toSupabase])
        if (!error) await db.depenses_campagne.update(newDoc.id, { synced: 1 })
      }
      setExpenseForm({ type: 'semences', parcelle_id: '', montant: '', description: '' })
      setShowExpenseForm(false); setEditingItem(null);
    } catch (err) { console.error(err) }
  }

  const addRevenue = async () => {
    if (!revenueForm.parcelle_id) return setFormError('Veuillez sélectionner une parcelle');
    if (!revenueForm.quantite || !revenueForm.prix) return setFormError('Saisissez la quantité et le prix');

    setFormError(null)
    const docId = editingItem ? editingItem.id : crypto.randomUUID();
    const montantTotal = Number(revenueForm.quantite) * Number(revenueForm.prix)
    const newDoc = {
      id: docId,
      user_id: user.id,
      parcelle_id: revenueForm.parcelle_id,
      source: `Vente (${revenueForm.quantite}kg)`,
      montant: montantTotal,
      created_at: editingItem ? editingItem.created_at : new Date().toISOString(),
      synced: 0
    }
    try {
      await db.revenus_campagne.put(newDoc)
      setRevenus(prev => editingItem ? prev.map(x => x.id === docId ? newDoc : x) : [newDoc, ...prev])
      if (navigator.onLine) {
        const { synced, ...toSupabase } = newDoc
        const { error } = await supabase.from('revenus_campagne').upsert([toSupabase])
        if (!error) await db.revenus_campagne.update(newDoc.id, { synced: 1 })
      }
      setRevenueForm({ parcelle_id: '', quantite: '', prix: '' })
      setShowRevenueForm(false); setEditingItem(null);
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
          
          <button 
            onClick={() => { setShowExpenseForm(!showExpenseForm); setShowRevenueForm(false); setFormError(null); setEditingItem(null); }}
            className={`w-full p-4 rounded-[2rem] border transition-all flex items-center justify-between group active:scale-[0.98] ${showExpenseForm ? 'bg-orange-50 border-orange-200 shadow-inner' : 'bg-white border-[#E8E2D9] shadow-sm'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${showExpenseForm ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600'}`}>
                {editingItem ? <Edit3 size={20}/> : <TrendingDown size={20} />}
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#1A2E26]">{editingItem ? "Modifier la Dépense" : "Nouvelle Dépense"}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{editingItem ? "Mise à jour d'un achat" : "Enregistrer un achat"}</p>
              </div>
            </div>
            <ChevronRight className={`text-slate-300 transition-transform ${showExpenseForm ? 'rotate-90' : ''}`} size={20} />
          </button>

          {showExpenseForm && (
            <div className="bg-white p-8 rounded-[3rem] border-2 border-orange-100 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-3 gap-2">
                  {EXPENSE_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setExpenseForm(f => ({ ...f, type: c.id }))} className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all flex flex-col items-center gap-2 ${expenseForm.type === c.id ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                      <c.icon size={20} className={expenseForm.type === c.id ? 'text-white' : c.color} />
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-slate-400 px-1">1. Parcelle concernée</label>
                   <div className="grid grid-cols-2 gap-2 p-1">
                     {parcelles.map(p => (
                       <button 
                         key={p.id} 
                         onClick={() => setExpenseForm(f => ({ ...f, parcelle_id: p.id }))} 
                         className={`p-3 rounded-2xl text-[10px] font-bold border transition-all flex items-center gap-3 relative overflow-hidden ${expenseForm.parcelle_id === p.id ? 'bg-[#1A2E26] border-[#1A2E26] text-white shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                       >
                         <MapPin size={14} className={expenseForm.parcelle_id === p.id ? 'text-amber-400' : 'text-slate-300'} />
                         <span className="truncate">{p.nom}</span>
                       </button>
                     ))}
                   </div>
                   <input type="number" placeholder="Montant en FCFA *" value={expenseForm.montant} onChange={e => setExpenseForm(f => ({ ...f, montant: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-5 text-2xl font-black outline-none focus:ring-2 ring-orange-100" />
                   <textarea placeholder="Petit mémo (facultatif)" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold outline-none ring-1 ring-slate-100 h-20 resize-none" />
                   {formError && <p className="text-orange-600 text-[10px] font-black uppercase text-center font-bold tracking-tighter">{formError}</p>}
                </div>
                <div className="flex gap-2">
                  {editingItem && <button onClick={() => {setShowExpenseForm(false); setEditingItem(null)}} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs">Annuler</button>}
                  <button onClick={addExpense} className="flex-[2] bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all">
                    {editingItem ? "Mettre à jour" : "Enregistrer la dépense"}
                  </button>
                </div>
            </div>
          )}

          <button 
            onClick={() => { setShowRevenueForm(!showRevenueForm); setShowExpenseForm(false); setFormError(null); setEditingItem(null); }}
            className={`w-full p-4 rounded-[2rem] border transition-all flex items-center justify-between group active:scale-[0.98] ${showRevenueForm ? 'bg-emerald-50 border-emerald-200 shadow-inner' : 'bg-white border-[#E8E2D9] shadow-sm'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${showRevenueForm ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                {editingItem ? <Edit3 size={20}/> : <TrendingUp size={20} />}
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#1A2E26]">{editingItem ? "Modifier la Vente" : "Vente de Récolte"}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{editingItem ? "Mise à jour d'un gain" : "Enregistrer un gain"}</p>
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
                         <MapPin size={14} className={revenueForm.parcelle_id === p.id ? 'text-white' : 'text-slate-300'} />
                         <span className="truncate">{p.nom}</span>
                       </button>
                     ))}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="Kilos (kg) *" value={revenueForm.quantite} onChange={e => setRevenueForm(f => ({ ...f, quantite: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-lg font-black outline-none ring-1 ring-slate-100" />
                      <input type="number" placeholder="Prix / Kg *" value={revenueForm.prix} onChange={e => setRevenueForm(f => ({ ...f, prix: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-lg font-black outline-none ring-1 ring-slate-100" />
                   </div>
                   {formError && <p className="text-emerald-600 text-[10px] font-black uppercase text-center font-bold">{formError}</p>}
                </div>
                <div className="flex gap-2">
                  {editingItem && <button onClick={() => {setShowRevenueForm(false); setEditingItem(null)}} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs">Annuler</button>}
                  <button onClick={addRevenue} className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all">
                    {editingItem ? "Mettre à jour" : "Enregistrer le revenu"}
                  </button>
                </div>
            </div>
          )}

          <button 
            onClick={generatePDF}
            className="w-full bg-[#1A2E26] p-5 rounded-[2rem] text-white flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all group"
          >
            <Download size={18} className="text-amber-400" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Télécharger le Rapport PDF</span>
          </button>
        </div>

        {/* HISTORIQUE AVEC ACTIONS DE MODIF/SUPPR */}
        <section className="relative space-y-4">
          <div className="flex items-center gap-2 px-1">
             <Clock size={14} className="text-slate-400" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dernières opérations</span>
          </div>
          
          {[...revenusFiltres, ...depensesFiltrees].length === 0 ? (
            <div className="bg-white rounded-[3rem] p-12 border-2 border-dashed border-emerald-100 text-center flex flex-col items-center">
              <Receipt size={32} className="text-emerald-300 mb-4" />
              <p className="text-sm font-medium text-slate-400 font-serif italic">Aucune transaction enregistrée.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...revenusFiltres, ...depensesFiltrees]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 15)
                .map(item => {
                  const category = EXPENSE_CATEGORIES.find(c => c.id === item.type);
                  return (
                    <div key={item.id} className="bg-white rounded-[2rem] p-4 border border-[#E8E2D9] flex items-center gap-3 group relative overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.source ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                        {item.source ? <TrendingUp size={18} /> : (category ? <category.icon size={18} /> : <TrendingDown size={18} />)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#1A2E26] text-sm truncate">
                          {item.source ? 'Vente de récolte' : category?.label || 'Dépense'}
                        </h4>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-0.5">
                              <MapPin size={8} /> {parcelles.find(p => p.id === item.parcelle_id)?.nom || 'Général'}
                           </span>
                           <span className="text-[8px] font-bold text-slate-300 uppercase flex items-center gap-0.5">
                              <Calendar size={8} /> {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                           </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className={`text-xs font-black ${item.source ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {item.source ? '+' : '-'}{formatMoney(item.montant)}
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => startEdit(item)} className="p-1.5 text-slate-300 hover:text-emerald-600 transition-colors">
                              <Edit3 size={14} />
                           </button>
                           <button onClick={() => deleteItem(item.id, item.source ? 'revenue' : 'expense')} className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors">
                              <Trash2 size={14} />
                           </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}