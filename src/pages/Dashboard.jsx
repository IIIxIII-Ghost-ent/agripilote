import React, { useEffect, useMemo, useState } from 'react';
import { 
  Sun, Droplets, MapPin, Calendar, TrendingUp, 
  Plus, Microscope, ChevronRight, AlertTriangle, Clock, CloudRain,
  Leaf, Sprout, ThermometerSun, Waves, Landmark, LayoutGrid, Activity,
  Wind, Navigation, Sunrise, Sunset 
} from 'lucide-react';
import { db } from '../lib/db';

export default function Dashboard({
  user,
  parcelles = [],
  zoneCultures = [],
  setStep,
  openNewFieldForm
}) {
  const [taches, setTaches] = useState([]);
  
  // Logique pour choisir l'icône de soleil dynamique (style iPhone)
  const getSunIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return <Sunrise size={40} strokeWidth={1.5} className="text-amber-400" />;
    if (hour >= 14 && hour < 19) return <Sunset size={40} strokeWidth={1.5} className="text-orange-400" />;
    return <Sun size={40} strokeWidth={1.5} className="text-amber-200 opacity-80" />;
  };

  const [weather, setWeather] = useState({
    temp: '--',
    humidity: '--',
    rain: '--',
    city: 'Chargement...',
    icon: getSunIcon()
  });

  // --- LOGIQUE (Inchangée) ---
  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      const local = await db.tasks.where('user_id').equals(user.id).toArray();
      setTaches(local);
    };
    loadData();
  }, [user?.id]);

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto`);
        const data = await res.json();
        
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          humidity: data.current.relative_humidity_2m,
          rain: data.current.precipitation,
          city: "Ma Terre",
          icon: data.current.precipitation > 0 
            ? <CloudRain size={40} strokeWidth={1.5} className="text-blue-400" /> 
            : getSunIcon()
        });
      } catch (err) { console.error(err); }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(14.69, -17.44)
      );
    }
  }, []);

  const getStatus = (t) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(t.date_prevue);
    d.setHours(0, 0, 0, 0);
    if (t.termine) return 'done';
    if (d.getTime() === today.getTime()) return 'today';
    if (d < today) return 'late';
    return 'future';
  };

  const dashboardTasks = useMemo(() => {
    return taches
      .filter(t => !t.termine && getStatus(t) !== 'future')
      .sort((a, b) => new Date(a.date_prevue) - new Date(b.date_prevue));
  }, [taches]);

  const stats = useMemo(() => {
    return {
      surface: parcelles.reduce((acc, p) => acc + Number(p.surface || 0), 0),
      cultures: new Set(zoneCultures.map(zc => zc.culture_id).filter(Boolean)).size,
      aFaire: taches.filter(t => !t.termine && getStatus(t) !== 'future').length,
      retard: taches.filter(t => getStatus(t) === 'late').length
    };
  }, [taches, parcelles, zoneCultures]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 font-sans text-[#1A2E26]">
     {/* MOTIF CULTUREL - Minimalisme Africain (Style Tissage Manjak) */}
<div 
  className="fixed inset-0 opacity-[0.03] pointer-events-none" 
  style={{ 
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: '80px 80px'
  }}
>
</div>
      <div className="relative p-6 space-y-8 max-w-2xl mx-auto pt-10">
        
        {/* PREMIUM WEATHER BANNER */}
        <header className="relative group overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#064e3b] to-[#022c22] rounded-[3rem] p-8 text-white shadow-[0_20px_50px_rgba(6,78,59,0.3)]">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-amber-400/10 rounded-full blur-3xl group-hover:bg-amber-400/20 transition-colors duration-700" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-8 bg-amber-400 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/80">Sénégal • {weather.city}</span>
                </div>
                <h1 className="text-3xl font-serif font-medium tracking-tight">
                  Dalal ak jamm, <br/>
                  <span className="italic font-bold text-white capitalize">{user?.user_metadata?.nom || user?.email?.split('@')[0]}</span>
                </h1>
              </div>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/20 min-w-[90px]">
                {weather.icon}
                <span className="text-2xl font-black mt-1 tracking-tighter">{weather.temp}°C</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/10">
              <WeatherDetail icon={<Waves size={16} />} label="Eau" value={`${weather.humidity}%`} color="text-blue-300" />
              <WeatherDetail icon={<CloudRain size={16} />} label="Pluie" value={`${weather.rain}mm`} color="text-cyan-300" />
              <WeatherDetail icon={<Wind size={16} />} label="Vent" value="12km/h" color="text-emerald-300" />
            </div>
          </div>
        </header>

        {/* ELEGANT STATS GRID */}
        <div className="grid grid-cols-2 gap-4">
          <StatBox 
            label="Ma Terre" 
            value={stats.surface.toFixed(1)} 
            unit="HA" 
            icon={<LayoutGrid className="text-emerald-600" size={24} />} 
            circleColor="bg-emerald-50"
          />
          <StatBox 
            label="Mes Espèces" 
            value={stats.cultures} 
            unit="TYPES" 
            icon={<Sprout className="text-amber-600" size={24} />} 
            circleColor="bg-amber-50"
          />
          <StatBox 
            label="Travail" 
            value={stats.aFaire} 
            unit="ACTIONS" 
            icon={<Activity className={stats.retard > 0 ? "text-rose-600" : "text-orange-600"} size={24} />} 
            circleColor={stats.retard > 0 ? "bg-rose-50" : "bg-orange-50"}
            isUrgent={stats.retard > 0}
          />
          <StatBox 
            label="Mes Champs" 
            value={parcelles.length} 
            unit="UNITÉS" 
            icon={<Landmark className="text-blue-600" size={24} />} 
            circleColor="bg-blue-50"
          />
        </div>

        {/* ACTIONS MAJEURES */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={openNewFieldForm}
            className="group relative h-28 bg-[#1A2E26] rounded-[2.5rem] flex items-center px-8 text-white transition-all active:scale-[0.98] shadow-xl overflow-hidden"
          >
            <div className="absolute right-0 top-0 h-full w-48 bg-emerald-500/5 -skew-x-12 translate-x-10 group-hover:translate-x-0 transition-transform duration-700" />
            <div className="flex items-center gap-6 z-10">
              <div className="w-16 h-16 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-[0_10px_20px_rgba(245,158,11,0.3)] group-hover:rotate-90 transition-transform">
                <Plus size={32} strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold tracking-tight uppercase">Ajouter un champ</p>
                <p className="text-xs text-emerald-400 font-medium opacity-80 italic underline underline-offset-4">Déclarer une nouvelle parcelle</p>
              </div>
            </div>
            <Navigation className="absolute right-8 opacity-10 group-hover:translate-x-2 transition-transform" size={40} />
          </button>

          <button 
            onClick={() => setStep('diagnostic')}
            className="group relative h-24 bg-white rounded-[2rem] flex items-center px-8 text-[#1A2E26] border border-[#E8E2D9] transition-all active:scale-[0.98] shadow-sm hover:border-amber-200"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <Microscope size={28} strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold tracking-tight uppercase">Docteur Plantes IA</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Analyse & Santé</p>
              </div>
            </div>
            <ChevronRight className="ml-auto text-amber-500 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        {/* SECTION AGENDA */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
              <h3 className="text-xl font-serif font-bold text-[#0A261D]">Agenda de la Terre</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{stats.aFaire} tâches</span>
          </div>

          {dashboardTasks.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-12 border-2 border-dashed border-emerald-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 shadow-inner">
                <Leaf size={32} />
              </div>
              <p className="text-sm font-medium text-slate-500 font-serif italic max-w-[200px]">Votre jardin repose en paix. Tout est à jour.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardTasks.slice(0, 3).map(t => {
                const isLate = getStatus(t) === 'late';
                return (
                  <div 
                    key={t.id} 
                    onClick={() => setStep('taches')}
                    className={`group bg-white p-6 rounded-[2.5rem] border transition-all hover:shadow-xl flex items-center gap-5 cursor-pointer ${isLate ? 'border-rose-100 bg-rose-50/10' : 'border-[#E8E2D9] hover:border-emerald-200'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isLate ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-emerald-600 text-white shadow-emerald-200'}`}>
                      {isLate ? <AlertTriangle size={24} /> : <Calendar size={24} />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isLate ? 'text-rose-500' : 'text-emerald-700'}`}>
                        {isLate ? "⚠️ Retard Critique" : "🕒 Action Requise"}
                      </p>
                      <h4 className="font-bold text-lg text-slate-800 leading-tight tracking-tight">{t.titre}</h4>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function WeatherDetail({ icon, label, value, color }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center gap-1.5 ${color}`}>
        {icon}
        <span className="text-[10px] font-black uppercase opacity-60 tracking-tighter">{label}</span>
      </div>
      <span className="text-sm font-bold pl-5">{value}</span>
    </div>
  );
}

function StatBox({ label, value, unit, icon, circleColor, isUrgent }) {
  return (
    <div className={`relative overflow-hidden bg-white p-6 rounded-[2.5rem] border border-[#E8E2D9] shadow-sm transition-all hover:shadow-md group ${isUrgent ? 'ring-2 ring-rose-500/10' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${circleColor}`}>
        {icon}
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black tracking-tighter text-slate-900">{value}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight opacity-60 italic">{label}</p>
      </div>
      {isUrgent && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
    </div>
  );
}