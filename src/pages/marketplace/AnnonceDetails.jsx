import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  ArrowLeft, MapPin, Phone, MessageCircle, 
  Calendar, Tag, ShieldCheck, Share2, 
  User, CheckCircle2, Sprout, ChevronRight,
  Loader2
} from "lucide-react";

export default function AnnonceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [annonce, setAnnonce] = useState(null);

  useEffect(() => {
    fetchAnnonce();
  }, [id]);

  async function fetchAnnonce() {
    const { data } = await supabase
      .from("marketplace_annonces")
      .select("*")
      .eq("id", id)
      .single();
    if (data) setAnnonce(data);
  }

  if (!annonce) return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center">
      <Sprout size={32} className="animate-bounce text-emerald-800" />
    </div>
  );

  const contactWhatsApp = () => {
    const msg = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce "${annonce.titre}" sur AgriPilote.`);
    window.open(`https://wa.me/${annonce.telephone}?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A2E26] font-sans">
      
      {/* 1. NAVBAR MINIMALISTE */}
      <nav className="flex justify-between items-center px-6 py-6 sticky top-0 z-[100] bg-[#FDFCF9]/90 backdrop-blur-md border-b border-[#E8E2D9]">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Retour</span>
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <Share2 size={18} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start">
        
        {/* 2. SECTION IMAGE (Taille réduite : w-40% -> w-30%, aspect square sur desktop) */}
        <section className="w-full lg:w-[30%] p-6 lg:p-10 lg:sticky lg:top-24">
          <div className="relative aspect-video lg:aspect-square w-full rounded-[2.5rem] overflow-hidden border border-[#E8E2D9] shadow-sm bg-white">
            <img 
              src={annonce.image_url} 
              className="w-full h-full object-cover" 
              alt={annonce.titre} 
            />
            {/* Badge flottant discret */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm rounded-xl border border-[#E8E2D9]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest">Disponible</span>
            </div>
          </div>
        </section>

        {/* 3. SECTION DÉTAILS (Largeur ajustée : w-60% -> w-70%) */}
        <section className="w-full lg:w-[70%] p-6 lg:p-10 space-y-10">
          
          {/* Entête */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg">
                {annonce.categorie}
              </span>
              <div className="h-px w-8 bg-[#E8E2D9]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Réf: #00{annonce.id.slice(0,3)}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif font-medium leading-tight tracking-tighter">
              {annonce.titre}
            </h1>

            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-[#1A2E26] tracking-tighter">
                {Number(annonce.prix).toLocaleString()} 
              </p>
              <p className="text-xs font-black uppercase text-slate-400 italic tracking-widest">
                CFA / {annonce.unite}
              </p>
            </div>
          </div>

          {/* Points Clés (Grid) */}
          <div className="grid grid-cols-2 gap-4 border-y border-[#E8E2D9] py-8">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Localisation</p>
              <div className="flex items-center gap-2 font-bold text-sm">
                <MapPin size={14} className="text-amber-500" />
                {annonce.localisation}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vendeur</p>
              <div className="flex items-center gap-2 font-bold text-sm">
                <User size={14} className="text-emerald-700" />
                {annonce.nom_vendeur}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800">L'histoire du produit</h3>
            <p className="text-lg text-slate-600 leading-relaxed italic font-medium serif">
              "{annonce.description || "Un produit d'exception cultivé avec soin dans le respect des traditions locales."}"
            </p>
          </div>

          {/* Garantie de confiance */}
          <div className="p-6 bg-emerald-900 rounded-[2rem] text-white flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Protection AgriPilote</p>
              <h4 className="text-base font-serif italic">Achat direct & sécurisé</h4>
            </div>
            <ShieldCheck size={32} className="opacity-20" />
          </div>

          <div className="h-24 md:h-0" />
        </section>
      </main>

      {/* 4. ACTIONS DE CONTACT (BARRE BASSE FLOATING) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-[110] pointer-events-none">
        <div className="max-w-md mx-auto bg-[#1A2E26] p-3 rounded-full shadow-2xl flex gap-3 pointer-events-auto border border-white/10">
          <a 
            href={`tel:${annonce.telephone}`}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-full font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
          >
            <Phone size={16} /> Appeler
          </a>
          <button 
            onClick={contactWhatsApp}
            className="flex-[1.5] bg-amber-500 hover:bg-amber-400 text-[#1A2E26] py-4 rounded-full font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <MessageCircle size={18} /> WhatsApp
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}