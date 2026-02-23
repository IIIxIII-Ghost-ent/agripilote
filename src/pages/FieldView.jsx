import React, { useState } from 'react';

export default function FieldView({ fieldData, onBack }) {
  // Simule des données météo basées sur la localisation
  const weather = { temp: 32, condition: 'Ensoleillé', humidity: 45 };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* Header avec bouton retour et météo */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <button onClick={onBack} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">←</button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-[#1A2E1A]">{fieldData.nom}</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{fieldData.localite || 'Sénégal'}</p>
          </div>
        </div>

        {/* Widget Météo Rapide */}
        <div className="flex gap-4">
          <div className="flex-1 bg-[#2D5A27]/5 p-4 rounded-3xl flex items-center gap-3">
            <span className="text-3xl">☀️</span>
            <div>
              <p className="text-[10px] font-black uppercase opacity-40">Météo</p>
              <p className="font-bold">{weather.temp}°C</p>
            </div>
          </div>
          <div className="flex-1 bg-[#2D5A27]/5 p-4 rounded-3xl flex items-center gap-3">
            <span className="text-3xl">💧</span>
            <div>
              <p className="text-[10px] font-black uppercase opacity-40">Humidité</p>
              <p className="font-bold">{weather.humidity}%</p>
            </div>
          </div>
        </div>
      </div>

      <main className="p-6 space-y-8">
        {/* Section 1 : Ma Carte de Zones */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-black uppercase text-xs tracking-widest text-gray-400">Occupation du sol</h3>
            <span className="text-xs font-bold text-[#2D5A27]">{fieldData.surfaceTotale} HA Total</span>
          </div>
          <div className="flex h-16 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
            {fieldData.zones.map((zone, i) => (
              <div 
                key={i} 
                style={{ 
                  width: `${(zone.area / fieldData.surfaceTotale) * 100}%`,
                  backgroundColor: zone.culture?.color || '#2D5A27' 
                }}
                className="h-full border-r border-white/20 flex items-center justify-center text-white text-xl shadow-inner"
              >
                {zone.culture?.emoji}
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 : État de santé des cultures */}
        <section className="space-y-4">
          <h3 className="font-black uppercase text-xs tracking-widest text-gray-400">Progression des Zones</h3>
          {fieldData.zones.map((zone, i) => (
            <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm" style={{ backgroundColor: `${zone.culture?.color}20` }}>
                {zone.culture?.emoji}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-black text-sm">{zone.culture?.name}</h4>
                  <span className="text-[10px] font-bold text-gray-400">{zone.area} ha</span>
                </div>
                {/* Barre de progression de la culture (simulée) */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2D5A27] w-1/3 rounded-full"></div>
                </div>
                <p className="text-[9px] font-bold text-[#2D5A27] mt-2 uppercase tracking-tighter">Phase : Croissance (Jour 12/90)</p>
              </div>
            </div>
          ))}
        </section>

        {/* Section 3 : Tâches du jour */}
        <section className="bg-[#1A2E1A] p-8 rounded-[3rem] text-white">
          <h3 className="font-black uppercase text-[10px] tracking-[0.2em] opacity-50 mb-6">Conseils IA AgriPilote</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-2 h-12 bg-[#2D5A27] rounded-full"></div>
              <div>
                <p className="font-bold text-sm">Irrigation recommandée</p>
                <p className="text-xs opacity-60">Forte chaleur prévue à 14h. Activez les pompes en zone A.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-12 bg-orange-400 rounded-full"></div>
              <div>
                <p className="font-bold text-sm">Alerte Fertilisation</p>
                <p className="text-xs opacity-60">Le cycle de l'oignon demande un apport en Urée demain.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Menu de navigation bas */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 border-t border-gray-100 flex justify-around items-center z-50">
        <button className="flex flex-col items-center gap-1">
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase">Dashboard</span>
        </button>
        <button className="w-14 h-14 bg-[#2D5A27] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#2D5A27]/30 -translate-y-4">
          <span className="text-2xl">+</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-30">
          <span className="text-xl">⚙️</span>
          <span className="text-[8px] font-black uppercase">Réglages</span>
        </button>
      </nav>
    </div>
  );
}