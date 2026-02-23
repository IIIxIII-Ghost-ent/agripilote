import React, { useState, useEffect } from 'react';

const CULTURES = [
  { id: 'mil', name: 'Mil', emoji: '🌾', color: '#E9C46A' },
  { id: 'riz', name: 'Riz', emoji: '🍚', color: '#2A9D8F' },
  { id: 'arachide', name: 'Arachide', emoji: '🥜', color: '#F4A261' },
  { id: 'oignon', name: 'Oignon', emoji: '🧅', color: '#8E9AAF' },
];

export default function Mapping({ onNext, onBack, initialData }) {
  const [step, setStep] = useState('infos');
  const [field, setField] = useState({
    nom: '', localite: '', surfaceTotale: '', zones: []
  });

  useEffect(() => {
    if (initialData) setField(initialData);
  }, [initialData]);

  const totalAttribue = field.zones.reduce((acc, z) => acc + Number(z.area), 0);
  const reste = Number(field.surfaceTotale || 0) - totalAttribue;

  const addZone = (culture) => {
    if (reste <= 0) return;
    const char = String.fromCharCode(65 + field.zones.length);
    setField({
      ...field,
      zones: [...field.zones, { id: Date.now(), name: `Zone ${char}`, culture, area: reste }]
    });
  };

  const updateZoneArea = (id, val) => {
    const updated = field.zones.map(z => {
      if (z.id === id) {
        const newVal = Math.max(0.1, z.area + val);
        return { ...z, area: newVal };
      }
      return z;
    });
    setField({ ...field, zones: updated });
  };

  return (
    <div className="p-6 pb-32 animate-in slide-in-from-bottom duration-500 bg-[#FAF6F0] min-h-screen">
      <header className="flex justify-between items-center mb-10">
        <button onClick={onBack} className="text-2xl">✕</button>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#2D5A27]">
          {initialData ? 'Modification' : 'Nouveau Champ'}
        </p>
        <div className="w-8"></div>
      </header>

      {step === 'infos' ? (
        <div className="space-y-8">
          <h2 className="text-3xl font-black text-slate-800 leading-tight">Détails de la<br/>Parcelle</h2>
          <div className="space-y-4">
            <input className="w-full bg-white p-5 rounded-2xl shadow-sm outline-none font-bold" placeholder="Nom du champ" value={field.nom} onChange={e => setField({...field, nom: e.target.value})} />
            <input className="w-full bg-white p-5 rounded-2xl shadow-sm outline-none font-bold" placeholder="Localité" value={field.localite} onChange={e => setField({...field, localite: e.target.value})} />
            <div className="bg-[#2D5A27] p-8 rounded-[2.5rem] text-center shadow-lg">
              <input type="number" className="bg-transparent text-white text-6xl font-black w-full text-center outline-none" placeholder="0.0" value={field.surfaceTotale} onChange={e => setField({...field, surfaceTotale: e.target.value})} />
              <p className="text-white/40 text-[10px] font-black uppercase mt-2 tracking-widest">Hectares Totaux</p>
            </div>
          </div>
          <button onClick={() => setStep('zones')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest">Configurer les zones →</button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm">
            <div className="flex justify-between text-[10px] font-black uppercase mb-2">
              <span>Répartition</span>
              <span className={reste < 0 ? 'text-red-500' : 'text-[#2D5A27]'}>{reste.toFixed(1)} HA RESTANT</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full flex overflow-hidden shadow-inner">
              {field.zones.map((z, i) => (
                <div key={i} style={{ width: `${(z.area / field.surfaceTotale) * 100}%`, backgroundColor: z.culture.color }} className="border-r border-white/20" />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {field.zones.map((z) => (
              <div key={z.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{z.culture.emoji}</span>
                  <p className="text-[10px] font-black uppercase">{z.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => updateZoneArea(z.id, -0.1)} className="w-8 h-8 bg-gray-100 rounded-lg font-bold">-</button>
                  <span className="font-black text-sm">{z.area.toFixed(1)}</span>
                  <button onClick={() => updateZoneArea(z.id, 0.1)} className="w-8 h-8 bg-gray-100 rounded-lg font-bold">+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {CULTURES.map(c => (
              <button key={c.id} onClick={() => addZone(c)} className="bg-white p-3 rounded-xl flex flex-col items-center shadow-sm active:scale-95 transition-all">
                <span className="text-xl">{c.emoji}</span>
                <span className="text-[8px] font-black uppercase mt-1">{c.name}</span>
              </button>
            ))}
          </div>

          <button onClick={() => onNext(field)} className="w-full bg-[#2D5A27] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">Enregistrer la parcelle</button>
        </div>
      )}
    </div>
  );
}