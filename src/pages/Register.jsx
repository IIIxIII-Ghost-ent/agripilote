import React from 'react'
import { User, Phone, MapPin, Mail, Lock, ArrowRight, Sprout, Landmark } from 'lucide-react'

export default function Register({ onRegister, onGoLogin }) {

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    onRegister({
      email: formData.get('email'),
      password: formData.get('password'),
      nom: formData.get('name'),
      localisation: formData.get('location'),
      phone: formData.get('phone')
    })
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] font-sans text-[#1A2E26] relative overflow-x-hidden">
      {/* MOTIF DE FOND IDENTIQUE AU DASHBOARD */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative p-6 max-w-2xl mx-auto pt-16 space-y-10">
        
        {/* HEADER STYLE PREMIUM */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-10 text-white shadow-xl text-center">
          <div className="relative z-10 space-y-3">
            <div className="flex justify-center items-center gap-2 mb-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Nouveau Compte</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-3xl font-serif font-medium italic">Bienvenue au champ</h1>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Rejoignez l'agriculture connectée</p>
          </div>
          
          {/* Icône de fond décorative */}
          <Sprout className="absolute right-[-20px] bottom-[-20px] text-white/5 w-40 h-40 -rotate-12" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input icon={<User size={20}/>} name="name" placeholder="Votre nom complet" />
            <Input icon={<Phone size={20}/>} name="phone" placeholder="77 123 45 67" type="tel" />
            <Input icon={<MapPin size={20}/>} name="location" placeholder="Ex: Thiès, Keur Moussa" />
            <div className="h-px bg-[#E8E2D9] my-2 mx-4" />
            <Input icon={<Mail size={20}/>} name="email" placeholder="Email" type="email" />
            <Input icon={<Lock size={20}/>} name="password" placeholder="Mot de passe" type="password" />
          </div>

          <div className="pt-6 space-y-6">
            <button
              type="submit"
              className="group w-full bg-[#1A2E26] text-white py-6 rounded-[2.5rem] font-black text-lg shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-4 active:scale-[0.98] transition-all relative overflow-hidden"
            >
              <span className="relative z-10 uppercase tracking-tight">Créer mon espace</span>
              <div className="bg-amber-500 p-2 rounded-full relative z-10 group-hover:translate-x-2 transition-transform">
                <ArrowRight size={20} strokeWidth={3}/>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>

            <button
              type="button"
              onClick={onGoLogin}
              className="w-full text-center py-2"
            >
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Déjà un compte ? <span className="text-emerald-700 underline underline-offset-4 decoration-amber-400">Se connecter</span>
              </p>
            </button>
          </div>
        </form>

        {/* Petit rappel visuel en bas */}
        <div className="flex justify-center items-center gap-8 opacity-20 grayscale pt-4">
            <Landmark size={24} />
            <Sprout size={24} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#1A2E26]" />
            <MapPin size={24} />
        </div>
      </div>
    </div>
  )
}

function Input({ icon, ...props }) {
  return (
    <div className="relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
        {icon}
      </div>
      <input
        required
        className="w-full bg-white py-5 pl-16 pr-8 rounded-[2rem] outline-none border border-[#E8E2D9] focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold text-[#1A2E26] placeholder:text-slate-300 placeholder:font-medium shadow-sm"
        {...props}
      />
    </div>
  )
}