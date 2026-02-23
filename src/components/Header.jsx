import React, { useState, useEffect, useRef } from 'react'
import { Bell, User, LogOut, Settings, ShieldCheck, Calendar, ChevronDown, Sprout } from 'lucide-react'

export default function Header({ user, profile, tasks = [], setStep, onLogout }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const headerRef = useRef(null)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Tâches passées ou aujourd’hui
  const pendingTasks = tasks.filter(t => {
    const d = new Date(t.date_prevue)
    d.setHours(0, 0, 0, 0)
    return !t.termine && d <= today
  })

  const hasNotifications = pendingTasks.length > 0

  const handleTaskClick = () => {
    setShowNotifications(false)
    setStep('taches')
  }

  // Fermer dropdowns si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setShowNotifications(false)
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setShowNotifications(false)
    setShowProfileMenu(false)
  }, [setStep])

  const displayName = profile?.nom || user?.user_metadata?.nom || user?.email?.split('@')[0] || 'Cultivateur'

  return (
    <header 
      ref={headerRef} 
      className="sticky top-0 z-[100] bg-[#FDFCF9]/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 flex items-center justify-between shadow-sm"
    >
      {/* LOGO & SALUTATION */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setStep('dashboard')}
      >
         <div className="bg-[#1A2E26] p-2 rounded-2xl shadow-lg shadow-emerald-900/20 group-hover:rotate-12 transition-transform overflow-hidden flex items-center justify-center w-12 h-12">
  <img 
    src="/assets/logo2.png" 
    alt="Logo AgriPilote" 
    className="w-full h-full object-contain"
  />
</div>
        <div className="hidden sm:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mon Domaine</p>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-[#1A2E26]">{displayName}</span>
            <ChevronDown size={14} className="text-amber-500" />
          </div>
        </div>
      </div>

      {/* ACTIONS DROITE */}
      <div className="flex items-center gap-3 relative">
        
        {/* 🔔 CLOCHE NOTIFICATIONS */}
        <button
          onClick={() => {
            setShowNotifications(!showNotifications)
            setShowProfileMenu(false)
          }}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 relative
            ${showNotifications ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border border-[#E8E2D9] text-slate-400 hover:border-emerald-200'}
          `}
        >
          <Bell size={20} />
          {hasNotifications && (
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
          )}
        </button>

        {/* 👤 AVATAR PROFIL */}
        <button
          onClick={() => {
            setShowProfileMenu(!showProfileMenu)
            setShowNotifications(false)
          }}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 overflow-hidden
            ${showProfileMenu ? 'ring-2 ring-emerald-600 ring-offset-2' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}
          `}
        >
          <User size={20} />
        </button>

        {/* --- DROPDOWN NOTIFICATIONS (Style Dashboard) --- */}
        {showNotifications && (
          <div className="absolute right-0 top-14 w-80 bg-white rounded-[2.5rem] shadow-2xl border border-[#E8E2D9] overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
            <div className="p-6 bg-[#1A2E26] text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg">Alertes Travaux</h3>
                <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-full">{pendingTasks.length}</span>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto p-4 space-y-2">
              {pendingTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tout est à jour !</p>
                </div>
              ) : (
                pendingTasks.map((t) => {
                  const d = new Date(t.date_prevue)
                  d.setHours(0, 0, 0, 0)
                  const isLate = d < today
                  return (
                    <div
                      key={t.id}
                      onClick={handleTaskClick}
                      className="group cursor-pointer p-4 rounded-2xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all flex gap-3 items-center"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLate ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Calendar size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A2E26] truncate group-hover:text-emerald-700 transition-colors">{t.titre}</p>
                        <p className={`text-[10px] font-black uppercase tracking-tight ${isLate ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {isLate ? '⚠️ En retard' : '🕒 Aujourd’hui'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <button 
              onClick={() => setStep('taches')}
              className="w-full p-4 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-t hover:text-emerald-600 transition-colors"
            >
              Voir tout le journal
            </button>
          </div>
        )}

        {/* --- DROPDOWN PROFIL (Style Premium) --- */}
        {showProfileMenu && (
          <div className="absolute right-0 top-14 w-64 bg-white rounded-[2.5rem] shadow-2xl border border-[#E8E2D9] overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
            <div className="p-6 border-b border-slate-50">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Exploitant</p>
              <p className="font-serif font-bold text-lg text-[#1A2E26] leading-none">{displayName}</p>
              <p className="text-[10px] text-slate-400 mt-2 truncate font-medium">{user?.email}</p>
            </div>

            <div className="p-3 space-y-1">
              <MenuLink icon={<Settings size={18} />} label="Paramètres" />
              <MenuLink icon={<ShieldCheck size={18} />} label="Abonnement Pro" color="text-amber-600" />
              
              <div className="h-px bg-slate-100 my-2 mx-3" />

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-rose-600 hover:bg-rose-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                    <LogOut size={16} />
                </div>
                <span className="text-sm font-black uppercase tracking-tight">Déconnexion</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  )
}

function MenuLink({ icon, label, color = "text-[#1A2E26]" }) {
  return (
    <button className={`w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 transition-all group ${color}`}>
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-slate-400 group-hover:text-inherit">
        {icon}
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
  )
}