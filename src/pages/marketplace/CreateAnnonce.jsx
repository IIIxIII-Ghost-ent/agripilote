import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  ArrowLeft, Camera, CheckCircle2, Loader2, 
  User, MapPin, Tag, Smartphone, Info, Sprout
} from "lucide-react";

export default function CreateAnnonce() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [formData, setFormData] = useState({
    titre: "", description: "", categorie: "Céréales",
    prix: "", unite: "kg", localisation: "",
    telephone: "", nom_vendeur: ""
  });

  useEffect(() => {
    const unitMap = { "Matériel": "Unité", "Légumes": "kg", "Fruits": "kg", "Fertilisants": "Sac", "Céréales": "Sac" };
    if (unitMap[formData.categorie]) {
      setFormData(prev => ({ ...prev, unite: unitMap[formData.categorie] }));
    }
  }, [formData.categorie]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let image_url = "https://via.placeholder.com/400";
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        const { error: upError } = await supabase.storage.from('marketplace').upload(fileName, imageFile);
        if (upError) throw upError;
        const { data } = supabase.storage.from('marketplace').getPublicUrl(fileName);
        image_url = data.publicUrl;
      }

      const { error } = await supabase.from("marketplace_annonces").insert([{
        ...formData,
        image_url,
        prix: parseFloat(formData.prix),
        statut: 'active'
      }]);

      if (error) throw error;
      navigate("/marketplace");
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A2E26] font-sans selection:bg-amber-200 pb-12">
      
      {/* BACKGROUND TEXTURE */}
      <div className="fixed inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%231A2E26'/%3E%3C/svg%3E")` }} />

      {/* HEADER ÉLÉGANT */}
      <header className="px-6 py-8 flex items-center justify-between sticky top-0 z-[100] bg-[#FDFCF9]/80 backdrop-blur-md border-b border-[#E8E2D9]">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white border border-[#E8E2D9] rounded-2xl text-[#1A2E26] hover:bg-white/50 transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-xl font-serif font-bold tracking-tight">Nouvelle Annonce</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-700">Mettre en vente</p>
        </div>
        <div className="w-10" /> {/* Spacer pour centrer le titre */}
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 pt-10 space-y-12 relative z-10">
        
        {/* SECTION 1: VISUEL */}
        <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-2">
                <Camera size={14} className="text-amber-500" /> Image de présentation
            </p>
            <label className="relative block w-full aspect-[4/3] rounded-[2.5rem] border-2 border-dashed border-[#E8E2D9] overflow-hidden cursor-pointer hover:border-emerald-400 bg-white transition-all group shadow-sm">
            {previewUrl ? (
                <div className="relative h-full w-full">
                    <img src={previewUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Preview" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-black uppercase">Modifier l'image</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
                    <div className="p-6 bg-slate-50 rounded-full group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                        <Camera size={32} />
                    </div>
                    <div className="text-center">
                        <span className="block text-[11px] font-black uppercase tracking-widest text-slate-500">Ajouter une photo</span>
                        <span className="text-[9px] text-slate-400">Haute qualité recommandée (JPG, PNG)</span>
                    </div>
                </div>
            )}
            <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
            </label>
        </div>

        {/* SECTION 2: INFOS PRINCIPALES */}
        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-[#E8E2D9] shadow-[0_20px_50px_rgba(26,46,38,0.05)] space-y-8">
          
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-emerald-800 ml-1 italic">Ce que vous vendez</label>
            <input 
              required 
              placeholder="Ex: Sac de Riz de la Vallée 50kg" 
              className="w-full text-2xl font-serif font-bold border-b border-slate-100 py-2 outline-none focus:border-amber-400 transition-all placeholder:text-slate-200"
              value={formData.titre} 
              onChange={e => setFormData({...formData, titre: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Catégorie</label>
              <select 
                className="w-full p-5 bg-[#FDFCF9] border border-[#E8E2D9] rounded-2xl outline-none font-bold text-[10px] uppercase tracking-widest focus:border-emerald-700 transition-all appearance-none cursor-pointer"
                value={formData.categorie} 
                onChange={e => setFormData({...formData, categorie: e.target.value})}
              >
                {["Céréales", "Légumes", "Fruits", "Matériel", "Fertilisants", "Semences"].map(cat => (
                    <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Prix & Unité</label>
              <div className="relative">
                <input 
                  required 
                  placeholder="0.00" 
                  type="number" 
                  className="w-full p-5 bg-emerald-50 border border-emerald-100 rounded-2xl outline-none font-black text-emerald-800 focus:border-emerald-700 transition-all"
                  value={formData.prix} 
                  onChange={e => setFormData({...formData, prix: e.target.value})} 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 uppercase tracking-tighter">
                    CFA / {formData.unite}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Info size={14} /> Détails logistiques
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-700 transition-colors" size={18} />
                    <input required placeholder="Nom du Vendeur / Ferme" className="w-full p-5 pl-14 bg-[#FDFCF9] border border-[#E8E2D9] rounded-2xl outline-none focus:border-[#1A2E26] transition-all text-sm font-bold"
                        value={formData.nom_vendeur} onChange={e => setFormData({...formData, nom_vendeur: e.target.value})} />
                </div>
                <div className="relative group">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} />
                    <input required placeholder="Localisation (ex: Saint-Louis)" className="w-full p-5 pl-14 bg-[#FDFCF9] border border-[#E8E2D9] rounded-2xl outline-none focus:border-[#1A2E26] transition-all text-sm font-bold"
                        value={formData.localisation} onChange={e => setFormData({...formData, localisation: e.target.value})} />
                </div>
            </div>

            <div className="relative group">
                <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input required placeholder="Numéro WhatsApp (77xxxxxxx)" className="w-full p-5 pl-14 bg-[#FDFCF9] border border-[#E8E2D9] rounded-2xl outline-none focus:border-[#1A2E26] transition-all text-sm font-black text-emerald-700"
                    value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
            </div>

            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Présentation du produit</label>
                <textarea placeholder="Décrivez la qualité, l'origine, les conditions de vente..." className="w-full p-6 bg-[#FDFCF9] border border-[#E8E2D9] rounded-3xl outline-none h-40 focus:border-[#1A2E26] transition-all text-sm leading-relaxed"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>
        </div>

        {/* BOUTON DE VALIDATION */}
        <div className="pt-6">
            <button 
                disabled={loading} 
                className="w-full py-6 bg-[#1A2E26] text-white rounded-full font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
            {loading ? (
                <Loader2 className="animate-spin" size={24} />
            ) : (
                <>
                    <CheckCircle2 size={22} className="text-amber-400" /> 
                    <span>Certifier et publier</span>
                </>
            )}
            </button>
            <p className="text-center text-[9px] text-slate-400 mt-6 font-bold uppercase tracking-widest">
                En publiant, vous acceptez les conditions de vente d'AgriPilote
            </p>
        </div>
      </form>

      {/* FOOTER DISCRET */}
      <footer className="mt-20 py-12 border-t border-[#E8E2D9] text-center opacity-30">
        <Sprout size={20} className="mx-auto mb-4" />
 <p className="text-[8px] font-black text-[#1A2E26]/40 uppercase tracking-[0.6em]">
          AgriPilote Marketplace 2026
        </p>
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          IIIxIII • V0-2026
        </p>      </footer>
    </div>
  );
}