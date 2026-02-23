import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  MapPin, Calendar, Camera, Users, 
  ShoppingBag, Wallet, CloudSun, Bell,
  ArrowRight, Sprout, Leaf, ChevronRight
} from "lucide-react";

export default function Landing() {
 const [deferredPrompt, setDeferredPrompt] = useState(null);

useEffect(() => {
  const handler = (e) => {
    e.preventDefault();
    console.log("PWA install disponible");
    setDeferredPrompt(e);
  };

  window.addEventListener("beforeinstallprompt", handler);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
  };
}, []);

const handleInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  } else {
    alert("Sur PC : cliquez sur les 3 points du navigateur puis 'Installer AgriPilote'.");
  }
};
  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A2E26] font-sans selection:bg-amber-200">
      
      {/* NOUVEAU MOTIF DE FOND (Points subtils) */}
      <div 
        className="fixed inset-0 opacity-[0.1] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%231A2E26'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 1. Header (Navbar Premium) */}
      <header className="flex justify-between items-center px-6 md:px-12 py-6 bg-[#FDFCF9]/70 backdrop-blur-md sticky top-0 z-[100] border-b border-[#E8E2D9]">
        <div className="flex items-center gap-3 group cursor-pointer">
         <div className="bg-[#1A2E26] p-2 rounded-2xl shadow-lg shadow-emerald-900/20 group-hover:rotate-12 transition-transform overflow-hidden flex items-center justify-center w-12 h-12">
  <img 
    src="/assets/logo2.png" 
    alt="Logo AgriPilote" 
    className="w-full h-full object-contain"
  />
</div>
          <h1 className="text-2xl font-serif font-bold tracking-tighter">Agri<span className="text-emerald-700 italic">Pilote</span></h1>
        </div>
        
        <nav className="hidden lg:flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A2E26]">
          <a href="#" className="hover:opacity-60 transition-opacity">Accueil</a>
          <Link to="/marketplace" className="hover:opacity-60 transition-opacity">Marché</Link>
          <a href="#" className="hover:opacity-60 transition-opacity">Partenaires</a>
          <a href="#" className="hover:opacity-60 transition-opacity">À Propos</a>
        </nav>

        <div className="flex items-center gap-6">
          <Link 
            to="/app" 
            className="bg-[#1A2E26] text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
          >
            Ouvrir l'App
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 py-20 overflow-hidden">
        {/* Background Image Haute Visibilité */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            className="w-full h-full object-cover opacity-[0.50]" 
            alt="Nature"
          />
          {/* Overlay ajusté : Moins de blanc en haut pour voir l'image */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FDFCF9]/30 via-transparent to-[#FDFCF9]"></div>
        </div>

        <div className="relative z-10 max-w-5xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in shadow-sm">
            <Leaf size={14} className="animate-pulse" />
            L'agriculture au Sénégal
          </div>

          <h2 className="text-6xl md:text-8xl font-serif font-medium leading-[0.9] tracking-tighter drop-shadow-sm">
            Cultivez <span className="text-emerald-800 italic">l'excellence</span> <br /> 
            <span className="relative">
              de vos terres
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-500 opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
          </h2>

          <p className="text-lg md:text-xl text-[#1A2E26] max-w-2xl mx-auto leading-relaxed font-bold drop-shadow-md">
            AgriPilote fusionne tradition et technologie pour digitaliser votre exploitation. 
            Précision, rentabilité et communauté au creux de votre main.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link 
              to="/app" 
              className="group bg-[#1A2E26] text-white px-10 py-6 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-emerald-900/40"
            >
              Lancer mon exploitation
              <div className="bg-amber-500 p-2 rounded-full text-[#1A2E26] group-hover:rotate-45 transition-transform">
                <ArrowRight size={20} />
              </div>
            </Link>
           <button
  onClick={handleInstall}
  className="bg-white/90 backdrop-blur-sm border-2 border-[#E8E2D9] text-[#1A2E26] px-10 py-6 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-white transition shadow-sm flex items-center justify-center gap-2"
>
  Installer l'application
</button>
          </div>
        </div>
      </section>

      {/* 3. Les Services (Grid Premium) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-xl">
            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] mb-4 text-center md:text-left">Écosystème</h3>
            <h4 className="text-4xl md:text-5xl font-serif font-medium leading-tight text-center md:text-left">
              Une intelligence <br /> dédiée à vos récoltes
            </h4>
          </div>
          <p className="text-slate-800 font-bold max-w-xs text-center md:text-left">
            Huit modules experts conçus pour répondre aux réalités climatiques et économiques locales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard 
            icon={<MapPin />} 
            title="Parcelles" 
            desc="Cartographie précise et historique cultural."
            delay="0"
          />
          <FeatureCard 
            icon={<Calendar />} 
            title="Calendrier" 
            desc="Planification intelligente de l'arrosage."
            delay="100"
          />
          <FeatureCard 
            icon={<Camera />} 
            title="Diagnostic IA" 
            desc="Détection instantanée des maladies par photo."
            delay="200"
          />
          <FeatureCard 
            icon={<Users />} 
            title="Réseau Experts" 
            desc="Conseils directs via WhatsApp certifié."
            delay="300"
          />
          <FeatureCard 
            icon={<ShoppingBag />} 
            title="Le Marché" 
            desc="Vente directe et achat d'intrants groupés."
            delay="400"
          />
          <FeatureCard 
            icon={<Wallet />} 
            title="Rentabilité" 
            desc="Suivi analytique de vos coûts et profits."
            delay="500"
          />
          <FeatureCard 
            icon={<CloudSun />} 
            title="Météo" 
            desc="Prévisions ultra-locales par satellite."
            delay="600"
          />
          <FeatureCard 
            icon={<Bell />} 
            title="Alertes" 
            desc="Notifications de risques phytosanitaires."
            delay="700"
          />
        </div>
      </section>

      {/* Footer simple */}
      <footer className="py-20 border-t border-[#E8E2D9] text-center bg-white/70 backdrop-blur-sm relative z-10">
        <div className="flex justify-center items-center gap-3 opacity-30 mb-8">
            <div className="h-px w-12 bg-[#1A2E26]" />
            <Sprout size={24} />
            <div className="h-px w-12 bg-[#1A2E26]" />
        </div>
        
        <p className="text-[10px] font-black text-[#1A2E26] uppercase tracking-[0.5em]">
          Sénégal • AgriPilote 2026 • Technologie Rurale
        </p>
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          IIIxIII • V0-2026
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div 
      className="group bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-[#E8E2D9] hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 cursor-pointer flex flex-col h-full"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="bg-[#FDFCF9] w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-[#E8E2D9] group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-[10deg] transition-all duration-500 text-emerald-700">
        {icon}
      </div>
      <h4 className="font-bold text-lg mb-3 flex items-center justify-between text-[#1A2E26]">
        {title}
        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </h4>
      <p className="text-slate-700 text-sm leading-relaxed font-bold">{desc}</p>
    </div>
  );
}