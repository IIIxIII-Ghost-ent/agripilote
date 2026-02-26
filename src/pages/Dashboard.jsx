import React, { useEffect, useMemo, useState } from 'react';
import { 
  Sun, Droplets, MapPin, Calendar, TrendingUp, 
  Plus, Microscope, ChevronRight, AlertTriangle, Clock, CloudRain,
  Leaf, Sprout, ThermometerSun, Waves, Landmark, LayoutGrid, Activity,
  Wind, Navigation, Sunrise, Sunset, Info, HelpCircle, X, ChevronLeft, CheckCircle2
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
  const [guideStep, setGuideStep] = useState(0); 
  
  // Activation automatique au premier lancement
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem(`guide_seen_${user?.id}`);
    if (!hasSeenGuide && user?.id) {
      setGuideStep(1);
    }
  }, [user?.id]);

  const closeGuideForever = () => {
    localStorage.setItem(`guide_seen_${user?.id}`, 'true');
    setGuideStep(0);
  };

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

  // LA BULLE D'AIDE (S'affiche dynamiquement sur l'élément)
  const TutorialPopUp = ({ title, text, position = "bottom" }) => (
    <div className={`absolute left-1/2 -translate-x-1/2 z-[300] w-[280px] animate-in zoom-in-95 duration-300 ${position === 'bottom' ? 'top-full mt-6' : 'bottom-full mb-6'}`}>
      <div className="bg-white border-2 border-amber-400 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center relative">
        <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-amber-400 rotate-45 ${position === 'bottom' ? '-top-2.5' : '-bottom-2.5 rotate-[225deg]'}`} />
        
        <div className="flex justify-center mb-2">
            <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Étape {guideStep} / 5</div>
        </div>

        <h4 className="text-[#1A2E26] font-black text-xs uppercase tracking-widest mb-2">{title}</h4>
        <p className="text-slate-600 text-[13px] font-bold leading-snug mb-5">{text}</p>
        
        <div className="flex gap-2">
            {guideStep > 1 && (
                <button onClick={(e) => {e.stopPropagation(); setGuideStep(p => p-1)}} className="flex-1 py-3 rounded-2xl bg-slate-100 text-[#1A2E26] text-[10px] font-black uppercase">Retour</button>
            )}
            <button 
                onClick={(e) => {e.stopPropagation(); guideStep < 5 ? setGuideStep(p => p+1) : closeGuideForever()}} 
                className="flex-[2] bg-emerald-700 text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform"
            >
                {guideStep === 5 ? "Compris !" : "Suivant"}
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 font-sans text-[#1A2E26]">
      {/* Bouton d'aide flottant permanent */}
      <button 
        onClick={() => setGuideStep(1)}
        className="fixed bottom-24 right-6 z-[400] w-14 h-14 bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all border-4 border-white"
      >
        <HelpCircle size={28} />
      </button>

      {/* Overlay sombre pour le focus */}
      {guideStep > 0 && (
        <div className="fixed inset-0 bg-[#1A2E26]/80 backdrop-blur-[3px] z-[150] transition-opacity duration-500" onClick={() => setGuideStep(0)} />
      )}
      
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2E26' fill-rule='evenodd'%3E%3Cpath d='M30 0h2v10h-2zm0 50h2v10h-2zM0 30h10v2H0zm50 0h10v2H50zM14.5 14.5h2v2h-2zm30 30h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative p-6 space-y-8 max-w-2xl mx-auto pt-10">
        
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center gap-2">
              <Sprout className="text-emerald-700" size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800/50">Dashboard</span>
           </div>
        </div>

        {/* ÉTAPE 1: MÉTÉO */}
        <header className={`relative transition-all duration-500 ${guideStep === 1 ? 'z-[200] scale-[1.02]' : ''}`}>
          {guideStep === 1 && <TutorialPopUp title="Climat en Direct" text="Consultez la météo précise de vos terres pour planifier vos arrosages." />}
          <div className={`bg-gradient-to-br from-[#064e3b] via-[#064e3b] to-[#022c22] rounded-[3rem] p-8 text-white shadow-xl overflow-hidden ${guideStep === 1 ? 'ring-4 ring-amber-400' : ''}`}>
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1 w-8 bg-amber-400 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/80">{weather.city}</span>
                        </div>
                        <h1 className="text-3xl font-serif font-medium tracking-tight">Dalal ak jamm, <br/>
                        <span className="italic font-bold text-white capitalize">{user?.user_metadata?.nom || user?.email?.split('@')[0]}</span>
                        </h1>
                    </div>
                    <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/20 min-w-[90px]">
                        {weather.icon}
                        <span className="text-2xl font-black mt-1 tracking-tighter">{weather.temp}°C</span>
                    </div>
                </div>
                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <WeatherDetail icon={<Waves size={16} />} label="Humidité" value={`${weather.humidity}%`} color="text-blue-300" />
                    <WeatherDetail icon={<CloudRain size={16} />} label="Pluie" value={`${weather.rain}mm`} color="text-cyan-300" />
                    <WeatherDetail icon={<Wind size={16} />} label="Vent" value="12km/h" color="text-emerald-300" />
                </div>
            </div>
          </div>
        </header>

        {/* ÉTAPE 2: STATISTIQUES */}
        <div className={`relative grid grid-cols-2 gap-4 transition-all duration-500 ${guideStep === 2 ? 'z-[200] scale-[1.02]' : ''}`}>
          {guideStep === 2 && <TutorialPopUp title="Indicateurs Clés" text="Gardez un œil sur votre surface totale et vos travaux en cours." />}
          <DataDisplay label="Surface" value={stats.surface.toFixed(1)} unit="Ha" icon={<LayoutGrid size={18} />} color="emerald" />
          <DataDisplay label="Variétés" value={stats.cultures} unit="Types" icon={<Sprout size={18} />} color="amber" />
          <DataDisplay label="Actions" value={stats.aFaire} unit="Tasks" icon={<Activity size={18} />} color={stats.retard > 0 ? "rose" : "orange"} urgent={stats.retard > 0} />
          <DataDisplay label="Parcelles" value={parcelles.length} unit="Unités" icon={<Landmark size={18} />} color="blue" />
        </div>

        {/* ÉTAPE 3: AJOUTER CHAMP */}
        <div className={`relative transition-all duration-500 ${guideStep === 3 ? 'z-[200] scale-[1.02]' : ''}`}>
          {guideStep === 3 && <TutorialPopUp title="Nouvelle Parcelle" text="Enregistrer vos champs pour démarrer votre suivi digital." />}
          <button 
            onClick={openNewFieldForm}
            className={`w-full relative h-28 bg-[#1A2E26] rounded-[2.5rem] flex items-center px-8 text-white transition-all active:scale-[0.98] shadow-xl overflow-hidden ${guideStep === 3 ? 'ring-4 ring-amber-400' : ''}`}
          >
            <div className="absolute right-0 top-0 h-full w-48 bg-emerald-500/5 -skew-x-12 translate-x-10" />
            <div className="flex items-center gap-6 z-10">
              <div className="w-16 h-16 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Plus size={32} strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold tracking-tight uppercase leading-none mb-1">Ajouter un champ</p>
                <p className="text-xs text-emerald-400 font-medium italic underline underline-offset-4">Déclarer une nouvelle Exploitation agricole </p>
              </div>
            </div>
            <Navigation className="absolute right-8 opacity-10" size={40} />
          </button>
        </div>

        {/* ÉTAPE 4: DIAGNOSTIC IA */}
        <div className={`relative transition-all duration-500 ${guideStep === 4 ? 'z-[200] scale-[1.02]' : ''}`}>
          {guideStep === 4 && <TutorialPopUp title="Diagnostic Intelligent" text="Analysez l'état de votre culture : sélectionnez les signes visibles pour identifier la pathologie." />}
          <button 
            onClick={() => setStep('diagnostic')}
            className={`w-full relative h-24 bg-white rounded-[2rem] flex items-center px-8 text-[#1A2E26] border-2 transition-all active:scale-[0.98] shadow-sm ${guideStep === 4 ? 'border-amber-400' : 'border-[#E8E2D9]'}`}
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
            <ChevronRight className="ml-auto text-amber-500" />
          </button>
        </div>

        {/* ÉTAPE 5: AGENDA */}
        <section className={`relative space-y-6 transition-all duration-500 ${guideStep === 5 ? 'z-[200] scale-[1.02]' : ''}`}>
          {guideStep === 5 && <TutorialPopUp title="Votre Agenda" text="Retrouvez ici vos rappels d'arrosage, d'engrais et de récolte." position="top" />}
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
              <h3 className="text-xl font-serif font-bold text-[#0A261D]">Agenda de la Terre</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{stats.aFaire} tâches</span>
          </div>

          <div className={`space-y-4 p-1 rounded-[2.5rem] ${guideStep === 5 ? 'bg-white ring-4 ring-amber-400' : ''}`}>
            {dashboardTasks.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-12 border-2 border-dashed border-emerald-100 text-center flex flex-col items-center">
                    <Leaf size={32} className="text-emerald-500 mb-4 opacity-30" />
                    <p className="text-sm font-serif italic text-slate-400">Aucune tâche prévue aujourd'hui.</p>
                </div>
            ) : (
                dashboardTasks.slice(0, 3).map(t => {
                    const isLate = getStatus(t) === 'late';
                    return (
                        <div key={t.id} onClick={() => setStep('taches')} className={`bg-white p-6 rounded-[2.5rem] border flex items-center gap-5 cursor-pointer hover:border-emerald-200 transition-colors ${isLate ? 'border-rose-100' : 'border-[#E8E2D9]'}`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLate ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'}`}>
                                {isLate ? <AlertTriangle size={24} /> : <Calendar size={24} />}
                            </div>
                            <div className="flex-1">
                                <p className={`text-[9px] font-black uppercase mb-1 ${isLate ? 'text-rose-500' : 'text-emerald-700'}`}>
                                    {isLate ? "⚠️ Retard" : "🕒 Prochaine Action"}
                                </p>
                                <h4 className="font-bold text-lg text-slate-800 leading-tight tracking-tight">{t.titre}</h4>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                        </div>
                    );
                })
            )}
          </div>
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

function DataDisplay({ label, value, unit, icon, color, urgent }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100"
  };

  return (
    <div className={`p-5 rounded-[2rem] bg-white border border-[#E8E2D9] flex flex-col gap-3 relative overflow-hidden`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]} border shadow-sm`}>
        {icon}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 tracking-tighter">{value}</span>
          <span className="text-[10px] font-bold text-slate-400 lowercase">{unit}</span>
        </div>
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">{label}</p>
      </div>
      {urgent && (
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        </div>
      )}
    </div>
  );
}