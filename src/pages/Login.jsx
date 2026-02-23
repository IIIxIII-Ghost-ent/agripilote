import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock, LogIn, AlertCircle, Sprout, ArrowRight } from 'lucide-react'

export default function Login({ onLoginSuccess, onGoRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError("Identifiants incorrects ou problème de connexion.")
      setLoading(false)
      return
    }

    onLoginSuccess(data.user)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] font-sans text-[#1A2E26] relative overflow-hidden flex flex-col justify-center">
      {/* MOTIF DE FOND IDENTIQUE AUX AUTRES PAGES */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative p-6 max-w-md mx-auto w-full space-y-10">
        
        {/* HEADER DYNAMIQUE */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-10 text-white shadow-xl text-center">
          <div className="relative z-10 space-y-3">
            <div className="flex justify-center items-center gap-2 mb-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Accès Cultivateur</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-3xl font-serif font-medium italic">Content de vous revoir</h1>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Gérez vos terres en un clic</p>
          </div>
          <LogIn className="absolute right-[-10px] top-[-10px] text-white/5 w-32 h-32 rotate-12" />
        </header>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold p-4 rounded-2xl flex items-center gap-3 animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                <Mail size={20} />
              </div>
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white py-5 pl-16 pr-8 rounded-[2rem] outline-none border border-[#E8E2D9] focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold text-[#1A2E26] placeholder:text-slate-300 shadow-sm"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white py-5 pl-16 pr-8 rounded-[2rem] outline-none border border-[#E8E2D9] focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold text-[#1A2E26] placeholder:text-slate-300 shadow-sm"
              />
            </div>
          </div>

          <div className="pt-6 space-y-6">
            <button
              type="submit"
              disabled={loading}
              className="group w-full bg-[#1A2E26] text-white py-6 rounded-[2.5rem] font-black text-lg shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-4 active:scale-[0.98] transition-all relative overflow-hidden disabled:opacity-70"
            >
              <span className="relative z-10 uppercase tracking-tight">
                {loading ? 'Ouverture du portail...' : 'Se connecter'}
              </span>
              {!loading && (
                <div className="bg-amber-500 p-2 rounded-full relative z-10 group-hover:translate-x-2 transition-transform">
                  <ArrowRight size={20} strokeWidth={3}/>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>

            <button
              type="button"
              onClick={onGoRegister}
              className="w-full text-center py-2"
            >
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Pas encore de compte ? <span className="text-emerald-700 underline underline-offset-4 decoration-amber-400 font-black">S'inscrire</span>
              </p>
            </button>
          </div>
        </form>

        <div className="flex justify-center items-center gap-3 opacity-30 pt-4">
            <div className="h-px w-8 bg-slate-400" />
            <Sprout size={20} />
            <div className="h-px w-8 bg-slate-400" />
        </div>
      </div>
    </div>
  )
}