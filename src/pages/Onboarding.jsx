import React from 'react';
import { 
  MapPin, 
  Microscope, 
  Waves, 
  ArrowRight,
  UserCheck,
  Zap,
  Leaf
} from 'lucide-react';

export default function OnboardingOriginal({ onFinish }) {
  return (
    /* CONTENEUR FIXE : Empêche le scroll, occupe tout l'écran, centré */
    <div className="fixed inset-0 bg-[#FDFCF9] font-sans text-[#1A2E26] flex flex-col items-center justify-between overflow-hidden">
      
      {/* MOTIF MANJAK IDENTIQUE AU DASHBOARD */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* 1. TOP : Header Style Dashboard */}
      <div className="relative z-10 w-full p-6 pt-10 max-w-2xl">
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1A2E26] to-[#0A261D] rounded-[3rem] p-10 text-white shadow-xl text-center">
          <div className="relative z-10 space-y-3">
            <div className="flex justify-center items-center gap-2 mb-2">
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Na nga def ! (Bienvenue)</span>
              <div className="h-1 w-6 bg-amber-400 rounded-full" />
            </div>
            <h1 className="text-4xl font-serif font-medium tracking-tight">
              Agri<span className="italic text-amber-400">Pilote</span>
            </h1>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Le compagnon de vos récoltes.</p>
          </div>
          <Leaf className="absolute right-[-20px] bottom-[-20px] text-white/5 w-40 h-40 rotate-12" />
        </header>
      </div>

      {/* 2. CENTRE : La Roue des Outils (Harmonisée) */}
      <div className="relative w-full aspect-square max-w-[380px] flex items-center justify-center flex-1">
        {/* Cercles de croissance (style Dashboard) */}
        <div className="absolute w-72 h-72 border-2 border-emerald-100/50 rounded-full animate-[ping_4s_infinite]" />
        <div className="absolute w-56 h-56 bg-emerald-50/50 rounded-full blur-xl" />

        {/* Cœur du Soleil - LOGO */}
        <div className="relative z-20 w-32 h-32 bg-[#1A2E26] rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-[#FDFCF9] group overflow-hidden">
            <img 
              src="/assets/logo2.png" 
              alt="Logo AgriPilote" 
              className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500" 
            />
        </div>

        {/* Les 4 outils orbitaux */}
        <OrbitalTool 
            icon={<MapPin size={24} className="text-emerald-600" />} 
            label="Parcelles" 
            color="bg-white" 
            pos="top-0 left-1/2" 
            delay="0s"
            isVertical={true}
        />
        <OrbitalTool 
            icon={<Waves size={24} className="text-blue-500" />} 
            label="Irrigation" 
            color="bg-white" 
            pos="bottom-0 left-1/2" 
            delay="0.5s"
            isVertical={true}
        />
        <OrbitalTool 
            icon={<Microscope size={24} className="text-rose-500" />} 
            label="Analyse" 
            color="bg-white" 
            pos="left-0 top-1/2 -translate-y-1/2" 
            delay="1s"
        />
        <OrbitalTool 
            icon={<Zap size={24} className="text-amber-500" />} 
            label="Alertes" 
            color="bg-white" 
            pos="right-0 top-1/2 -translate-y-1/2" 
            delay="1.5s"
        />
      </div>

      {/* 3. BOTTOM : L'action instinctive */}
      <div className="relative z-10 w-full px-8 pb-10 space-y-6 max-w-2xl">
        <div className="flex justify-center gap-10 items-center">
            <div className="flex flex-col items-center gap-2 opacity-40">
                <UserCheck size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">Simplifié</span>
            </div>
            <div className="h-6 w-px bg-[#E8E2D9]" />
            <div className="flex flex-col items-center gap-2 opacity-40">
                <Zap size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">Instantané</span>
            </div>
        </div>

        <button 
          onClick={onFinish}
          className="group relative w-full h-24 bg-[#1A2E26] rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(26,46,38,0.25)] active:scale-95 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
          
          <div className="flex items-center justify-between px-10 relative z-10">
            <span className="text-white text-xl font-black uppercase tracking-tighter">Commencer l'aventure</span>
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-[#1A2E26] shadow-lg rotate-[-5deg] group-hover:rotate-0 group-hover:scale-110 transition-all">
              <ArrowRight size={28} strokeWidth={3} />
            </div>
          </div>
        </button>
        
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          IIIxIII • V0-2026
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
        @keyframes floatCentered {
          0%, 100% { transform: translateX(-50%) translateY(0px) scale(1); }
          50% { transform: translateX(-50%) translateY(-12px) scale(1.05); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-centered {
          animation: floatCentered 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function OrbitalTool({ icon, label, color, pos, delay, isVertical = false }) {
  return (
    <div 
      className={`absolute ${pos} flex flex-col items-center gap-2 ${isVertical ? 'animate-float-centered' : 'animate-float'}`}
      style={{ animationDelay: delay }}
    >
      <div className={`${color} w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-md border border-[#E8E2D9] transition-transform`}>
        {icon}
      </div>
      <div className="bg-[#1A2E26] px-3 py-1 rounded-full shadow-sm">
        <span className="text-[8px] font-black uppercase tracking-widest text-white">
          {label}
        </span>
      </div>
    </div>
  );
}