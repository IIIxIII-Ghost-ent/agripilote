import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { 
  Search, MapPin, Plus, ArrowLeft, 
  ChevronRight, Loader2, Sprout, 
  ShoppingBag, SlidersHorizontal, User2,
  Package, CheckCircle2, ArrowUpRight
} from "lucide-react";

export default function MarketplaceHome() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("Tous");
  const navigate = useNavigate();

  const categories = ["Tous", "Céréales", "Légumes", "Fruits", "Semences", "Fertilisants", "Matériel"];

  useEffect(() => {
    fetchAnnonces();
  }, []);

  async function fetchAnnonces() {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_annonces")
      .select("*")
      .eq("statut", "active")
      .order("created_at", { ascending: false });
    
    if (!error) setAnnonces(data);
    setLoading(false);
  }

  const filteredAnnonces = annonces.filter(a => {
    const matchSearch = a.titre.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === "Tous" || a.categorie === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A2E26] font-sans selection:bg-amber-200">
      
      {/* BACKGROUND TEXTURE */}
      <div className="fixed inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%231A2E26'/%3E%3C/svg%3E")` }} />

      {/* --- NAV BAR PREMIUM --- */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-5 bg-[#FDFCF9]/90 backdrop-blur-xl sticky top-0 z-[100] border-b border-[#E8E2D9]">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-[#1A2E26] p-2 rounded-2xl shadow-lg shadow-emerald-900/20 group-hover:rotate-12 transition-transform overflow-hidden flex items-center justify-center w-12 h-12">
  <img 
    src="/assets/logo2.png" 
    alt="Logo AgriPilote" 
    className="w-full h-full object-contain"
  />
</div>
          <h1 className="text-xl font-serif font-bold tracking-tighter">Agri<span className="text-emerald-700 italic">Pilote</span></h1>
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A2E26]/60">
            <Link to="/" className="hover:text-emerald-700 transition-colors">Accueil</Link>
            <span className="text-emerald-700">Marché</span>
            <Link to="/app" className="hover:text-emerald-700 transition-colors">Dashboard</Link>
          </div>
          <button 
            onClick={() => navigate("/marketplace/new")}
            className="group flex items-center gap-3 bg-[#1A2E26] text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-900/20"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform text-amber-400" />
            Vendre
          </button>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        
        {/* --- SIDEBAR FILTERS --- */}
        <aside className="w-full lg:w-80 p-6 md:p-12 border-b lg:border-b-0 lg:border-r border-[#E8E2D9] space-y-8 bg-[#FDFCF9]/50">
          <div className="space-y-6">
            <h2 className="text-3xl font-serif font-medium leading-none">Découvrir</h2>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-700 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..."
                className="w-full bg-white border border-[#E8E2D9] p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-700/5 transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-800 flex items-center gap-2">
              <SlidersHorizontal size={12} /> Catégories
            </p>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-bold transition-all border
                    ${selectedCat === cat 
                      ? 'bg-amber-100/50 border-amber-200 text-[#1A2E26]' 
                      : 'bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-[#E8E2D9]'}`}
                >
                  {cat}
                  {selectedCat === cat && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* --- MAIN FEED --- */}
        <main className="flex-1 p-6 md:p-12">
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2 italic">Marché Sénégal</p>
              <h3 className="text-3xl md:text-4xl font-serif font-medium italic underline decoration-amber-400/30 underline-offset-8">
                {selectedCat === "Tous" ? "Toutes les pépites" : selectedCat}
              </h3>
            </div>
            <p className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-300">
              {filteredAnnonces.length} articles
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 opacity-20">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">Sourcing en cours...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
              {filteredAnnonces.map((annonce) => (
                <div 
                  key={annonce.id}
                  onClick={() => navigate(`/marketplace/${annonce.id}`)}
                  className="group cursor-pointer flex flex-col"
                >
                  {/* Image Frame - TAILLE RÉDUITE ICI */}
                  <div className="relative aspect-video md:aspect-[16/10] max-h-64 rounded-[2rem] overflow-hidden bg-[#F3F4F1] mb-5 shadow-sm border border-[#E8E2D9]">
                    <img 
                      src={annonce.image_url} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                      alt={annonce.titre} 
                    />
                    
                    <div className="absolute top-4 left-4">
                      <div className="bg-[#1A2E26] text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                         <CheckCircle2 size={10} className="text-amber-400" />
                         Vérifié
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                       <div className="bg-white text-[#1A2E26] w-12 h-12 rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                          <ArrowUpRight size={20} />
                       </div>
                    </div>
                  </div>

                  {/* Info Block */}
                  <div className="space-y-3 px-1">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-800">{annonce.categorie}</p>
                        <h4 className="text-xl font-serif font-medium tracking-tight text-[#1A2E26] truncate">
                          {annonce.titre}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-[#1A2E26]">
                          {Number(annonce.prix).toLocaleString()}
                        </p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic">FCFA / {annonce.unite || 'U'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-[#E8E2D9]">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin size={10} className="text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.05em]">{annonce.localisation}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <User2 size={10} />
                        <span className="text-[9px] font-black uppercase tracking-[0.05em] truncate max-w-[70px]">
                          {annonce.nom_vendeur || 'Producteur'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredAnnonces.length === 0 && !loading && (
            <div className="py-32 text-center space-y-4">
              <Package size={40} className="mx-auto text-slate-200" />
              <p className="font-serif italic text-slate-400 text-lg">Aucun produit trouvé.</p>
            </div>
          )}
        </main>
      </div>

      <footer className="py-10 border-t border-[#E8E2D9] text-center bg-white/50">
        <p className="text-[8px] font-black text-[#1A2E26]/40 uppercase tracking-[0.6em]">
          AgriPilote Marketplace 2026
        </p>
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          IIIxIII • V0-2026
        </p>
      </footer>
    </div>
  );
}