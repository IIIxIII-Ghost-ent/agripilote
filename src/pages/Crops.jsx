import React, { useState } from 'react';

const CULTURES_SENEGAL = [
  { id: 'oignon', name: 'Oignon Galmi', emoji: '🧅' },
  { id: 'papaye', name: 'Papaye', emoji: '🥭' },
  { id: 'mil', name: 'Mil', emoji: '🌾' },
  { id: 'arachide', name: 'Arachide', emoji: '🥜' },
  { id: 'niebe', name: 'Niébé', emoji: '🍲' }
];

export default function Crops({ onNext, parcelleSurface }) {
  const [zones, setZones] = useState([]);
  const [selectedCulture, setSelectedCulture] = useState('');
  const [zoneSurface, setZoneSurface] = useState('');

  // Calcul de la surface déjà attribuée
  const surfaceUtilisee = zones.reduce((sum, z) => sum + parseFloat(z.surface || 0), 0);
  const surfaceRestante = parcelleSurface - surfaceUtilisee;

  const ajouterZone = () => {
    if (!selectedCulture || !zoneSurface) return alert("Choisissez une culture et une surface");
    if (parseFloat(zoneSurface) > surfaceRestante) return alert("Surface insuffisante !");

    const nouvelleZone = {
      id: Date.now(),
      culture: CULTURES_SENEGAL.find(c => c.id === selectedCulture),
      surface: parseFloat(zoneSurface)
    };

    setZones([...zones, nouvelleZone]);
    setSelectedCulture('');
    setZoneSurface('');
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-green-800">Délimiter les zones</h2>
      
      <div className="bg-green-100 p-4 rounded-xl">
        <p className="text-sm">Surface totale : <b>{parcelleSurface} ha</b></p>
        <p className="text-sm">Restant à attribuer : <b className="text-green-700">{surfaceRestante.toFixed(2)} ha</b></p>
      </div>

      {/* Formulaire d'ajout de zone */}
      <div className="space-y-3 border-p-4 rounded-xl border-dashed border-2 border-gray-300 p-4">
        <select 
          className="w-full p-2 border rounded"
          value={selectedCulture}
          onChange={(e) => setSelectedCulture(e.target.value)}
        >
          <option value="">Choisir une culture...</option>
          {CULTURES_SENEGAL.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
        
        <input 
          type="number" 
          placeholder="Surface de cette zone (ha)" 
          className="w-full p-2 border rounded"
          value={zoneSurface}
          onChange={(e) => setZoneSurface(e.target.value)}
        />
        
        <button onClick={ajouterZone} className="w-full bg-green-600 text-white p-2 rounded font-bold text-sm">
          + Ajouter la zone
        </button>
      </div>

      {/* Liste des zones ajoutées */}
      <div className="space-y-2">
        {zones.map(z => (
          <div key={z.id} className="flex justify-between p-3 bg-white shadow-sm rounded-lg border">
            <span>{z.culture.emoji} {z.culture.name}</span>
            <span className="font-bold">{z.surface} ha</span>
          </div>
        ))}
      </div>

      <button 
        onClick={() => onNext(zones)}
        disabled={zones.length === 0}
        className={`w-full p-4 rounded-xl font-bold ${zones.length > 0 ? 'bg-slate-800 text-white' : 'bg-gray-300 text-gray-500'}`}
      >
        Valider mes cultures
      </button>
    </div>
  );
}