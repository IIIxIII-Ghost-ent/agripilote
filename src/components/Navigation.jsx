import React from 'react';
import { Home, Map, ListTodo, Stethoscope, BarChart3 } from 'lucide-react';

export default function Navigation({ currentStep, setStep }) {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Accueil' },
    { id: 'parcelles', icon: Map, label: 'Champs' },
    { id: 'taches', icon: ListTodo, label: 'Tâches' },
    { id: 'diagnostic', icon: Stethoscope, label: 'Santé' },
    { id: 'rapports', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none">
      {/* Conteneur de navigation flottant */}
      <nav className="max-w-md mx-auto bg-[#1A2E26]/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 p-2 flex justify-around items-center pointer-events-auto relative overflow-hidden">
        
        {/* Effet de lueur subtile en fond */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {tabs.map((tab) => {
          const isActive = currentStep === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setStep(tab.id)}
              className="relative flex flex-col items-center py-2 min-w-[64px] transition-all group active:scale-90"
            >
              {/* Indicateur de sélection (Point Ambre) */}
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_10px_#F59E0B]" />
              )}

              <div className={`
                relative z-10 p-2.5 rounded-2xl transition-all duration-300
                ${isActive 
                  ? 'text-amber-400 scale-110' 
                  : 'text-emerald-100/40 group-hover:text-emerald-100'
                }
              `}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : ''}
                />
              </div>

              <span className={`
                text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300
                ${isActive ? 'text-white opacity-100' : 'text-white/30 opacity-0 h-0 overflow-hidden group-hover:opacity-100 group-hover:h-auto'}
              `}>
                {tab.label}
              </span>

              {/* Halo de sélection derrière l'icône */}
              {isActive && (
                <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}