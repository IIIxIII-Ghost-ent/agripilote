import React from 'react';

export default function Welcome({ onNext }) {
  return (
    <div className="h-screen relative flex flex-col items-center justify-between p-8 text-center overflow-hidden bg-agri-green">
      <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000')] bg-cover bg-center"></div>
      
      <div className="relative z-10 mt-10">
        <div className="bg-white inline-block p-4 rounded-[2rem] shadow-xl mb-4">
          <span className="text-5xl">🌱</span>
        </div>
        <h1 className="text-4xl font-black text-white italic tracking-tighter">AgriPilote</h1>
        <p className="text-white/90 font-medium mt-2 px-4 italic">Votre assistant agricole intelligent 100% contextualisé 🇸🇳</p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4 w-full px-4">
        {[
          { i: '🗺️', t: 'Carte satellite' },
          { i: '📊', t: 'Suivi cultures' },
          { i: '🔔', t: 'Alertes vocales' },
          { i: '📋', t: 'Rapport PDF' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl">
            <div className="text-2xl mb-1">{item.i}</div>
            <p className="text-[10px] text-white font-black uppercase tracking-tighter">{item.t}</p>
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full pb-10">
        <button onClick={onNext} className="w-full bg-white text-agri-green py-5 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3">
          Commencer <span className="text-2xl">→</span>
        </button>
        <p className="text-[9px] text-white/60 font-bold uppercase mt-6 tracking-[0.2em]">Recommandations ISRA/ANCAR intégrées</p>
      </div>
    </div>
  );
}