import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  MapPin, Calendar, Camera, Users, 
  ShoppingBag, Wallet, CloudSun, Bell,
  ArrowRight, Sprout, Leaf, ChevronRight,
  Menu, X, Share, PlusSquare, Store, Monitor, Smartphone, Download, Info
} from "lucide-react";

export default function Landing() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Détection iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else if (isIos) {
      document.getElementById('install-guide').scrollIntoView({ behavior: 'smooth' });
    } else {
      alert("Utilisez l'icône d'installation dans la barre d'adresse de votre navigateur.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A2E26] font-sans selection:bg-amber-200 overflow-x-hidden">
      
      {/* MOTIF DE FOND */}
      <div 
        className="fixed inset-0 opacity-[0.1] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%231A2E26'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 1. Header */}
      <header className="flex justify-between items-center px-6 md:px-12 py-6 bg-[#FDFCF9]/90 backdrop-blur-xl sticky top-0 z-[100] border-b border-[#E8E2D9]">
        <div className="flex items-center gap-3 group cursor-pointer relative z-[110]">
          <div className="bg-[#1A2E26] p-2 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform w-10 h-10 md:w-12 md:h-12 flex items-center justify-center overflow-hidden">
            <img src="/assets/logo2.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tighter">Agri<span className="text-emerald-700 italic">Pilote</span></h1>
        </div>
        
        <nav className="hidden lg:flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A2E26]">
          <a href="#" className="hover:text-emerald-700 transition-colors">Accueil</a>
          <Link to="/marketplace" className="hover:text-emerald-700 transition-colors">Marché</Link>
          <a href="#" className="hover:text-emerald-700 transition-colors">Partenaires</a>
          <a href="#" className="hover:text-emerald-700 transition-colors">À Propos</a>
        </nav>

        <div className="flex items-center gap-4 relative z-[110]">
          <Link 
            to="/app" 
            className="hidden sm:block bg-[#1A2E26] text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
          >
            Ouvrir l'App
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-3 bg-[#1A2E26] rounded-xl text-white shadow-lg active:scale-90 transition-transform"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`fixed inset-0 bg-[#FDFCF9] z-[105] flex flex-col transition-all duration-500 lg:hidden ${isMenuOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-full opacity-0 invisible'}`}>
            <nav className="flex-grow flex flex-col items-center justify-center gap-8 text-2xl font-serif font-bold italic">
                <a href="#" onClick={() => setIsMenuOpen(false)} className="hover:text-emerald-700">Accueil</a>
                <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className="hover:text-emerald-700">Le Marché</Link>
                <a href="#" onClick={() => setIsMenuOpen(false)} className="hover:text-emerald-700">Partenaires</a>
                <div className="w-12 h-1 bg-emerald-100 rounded-full my-4"></div>
                <Link to="/app" onClick={() => setIsMenuOpen(false)} className="bg-[#1A2E26] text-white px-10 py-5 rounded-[2rem] text-xs font-black uppercase not-italic tracking-[0.3em]">
                  Lancer l'App
                </Link>
            </nav>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 py-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            className="w-full h-full object-cover opacity-[0.40]" 
            alt="Nature"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FDFCF9]/30 via-transparent to-[#FDFCF9]"></div>
        </div>

        <div className="relative z-10 max-w-5xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Leaf size={14} className="animate-pulse" />
            L'agriculture au Sénégal
          </div>

          <h2 className="text-5xl md:text-8xl font-serif font-medium leading-[1] tracking-tighter">
            Cultivez <span className="text-emerald-800 italic">l'excellence</span> <br /> 
            <span className="relative">
              de vos terres
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-500 opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
          </h2>

          <p className="text-lg md:text-xl text-[#1A2E26] max-w-2xl mx-auto leading-relaxed font-bold drop-shadow-sm">
            AgriPilote fusionne tradition et technologie pour digitaliser votre exploitation. 
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link 
              to="/app" 
              className="group bg-[#1A2E26] text-white px-10 py-6 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-emerald-900/40"
            >
              Démarrer
              <div className="bg-amber-500 p-2 rounded-full text-[#1A2E26] group-hover:rotate-45 transition-transform">
                <ArrowRight size={20} />
              </div>
            </Link>
            
            <button
              onClick={handleInstall}
              className="group bg-emerald-700 text-white px-10 py-6 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-emerald-900/20"
            >
              <Download size={22} className="text-emerald-200" />
              Installer l'App
            </button>
          </div>
        </div>
      </section>

      {/* 2.5 Section Installation (Améliorée) */}
      <section id="install-guide" className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-[3rem] p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-emerald-100 flex-shrink-0">
               {isIos ? (
                 <div className="relative">
                   <div className="bg-blue-500 text-white p-3 rounded-xl mb-4 animate-bounce flex justify-center">
                     <Share size={32} />
                   </div>
                   <div className="space-y-2">
                     <div className="w-32 h-2 bg-slate-100 rounded-full"></div>
                     <div className="w-24 h-2 bg-slate-100 rounded-full"></div>
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center gap-4">
                    <Monitor size={48} className="text-emerald-700" />
                    <PlusSquare size={24} className="text-amber-500" />
                 </div>
               )}
            </div>

            <div className="text-center md:text-left space-y-4">
              <h3 className="text-2xl font-serif font-bold italic">
                {isIos ? "Installer sur votre iPhone" : "Accès Rapide sur Mobile & PC"}
              </h3>
              <p className="text-slate-700 font-bold leading-relaxed">
                {isIos 
                  ? "Appuyez sur le bouton 'Partager' en bas de votre navigateur Safari, puis faites défiler pour choisir 'Sur l'écran d'accueil'." 
                  : "Pour une meilleure expérience, installez AgriPilote directement sur votre écran d'accueil via le bouton 'Installer' de votre navigateur."
                }
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                <span className="px-3 py-1 bg-white border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
                  <Info size={14} className="text-emerald-600" /> Sans téléchargement Store
                </span>
                <span className="px-3 py-1 bg-white border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
                  <Smartphone size={14} className="text-emerald-600" /> Utilisation Hors-Ligne
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Les Services */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-xl">
            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] mb-4">Écosystème</h3>
            <h4 className="text-4xl md:text-5xl font-serif font-medium leading-tight">
              Une intelligence <br /> dédiée à vos récoltes
            </h4>
          </div>
          <p className="text-slate-800 font-bold max-w-xs">
            Huit modules experts conçus pour répondre aux réalités locales.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard icon={<MapPin />} title="Parcelles" desc="Cartographie précise et historique cultural." delay="0" />
          <FeatureCard icon={<Calendar />} title="Calendrier" desc="Planification intelligente de l'arrosage." delay="100" />
          <FeatureCard icon={<Camera />} title="Diagnostic IA" desc="Détection instantanée des maladies par photo." delay="200" />
          <FeatureCard icon={<Users />} title="Réseau Experts" desc="Conseils directs via WhatsApp certifié." delay="300" />
          <FeatureCard icon={<ShoppingBag />} title="Le Marché" desc="Vente directe et achat d'intrants groupés." delay="400" />
          <FeatureCard icon={<Wallet />} title="Rentabilité" desc="Suivi analytique de vos coûts et profits." delay="500" />
          <FeatureCard icon={<CloudSun />} title="Météo" desc="Prévisions ultra-locales par satellite." delay="600" />
          <FeatureCard icon={<Bell />} title="Alertes" desc="Notifications de risques phytosanitaires." delay="700" />
        </div>
      </section>

      <footer className="py-20 border-t border-[#E8E2D9] text-center bg-white/70 backdrop-blur-sm relative z-10">
        <div className="flex justify-center items-center gap-3 opacity-30 mb-8">
            <div className="h-px w-12 bg-[#1A2E26]" />
            <Sprout size={24} />
            <div className="h-px w-12 bg-[#1A2E26]" />
        </div>
        
        <p className="text-[10px] font-black text-[#1A2E26] uppercase tracking-[0.5em] px-4">
          Sénégal • AgriPilote 2026 • Technologie Rurale
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div 
      className="group bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-[#E8E2D9] hover:border-emerald-200 hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col h-full"
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