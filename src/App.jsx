import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import Landing from "./pages/Landing";
import AppShell from "./AppShell";

// Marketplace
import MarketplaceHome from "./pages/marketplace/MarketplaceHome";
import CreateAnnonce from "./pages/marketplace/CreateAnnonce";
import AnnonceDetails from "./pages/marketplace/AnnonceDetails";

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    // Si l'app est ouverte depuis l'icône installée
    if (isStandalone && window.location.pathname === "/") {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  return (
    <Routes>
      {/* Landing publique */}
      <Route path="/" element={<Landing />} />

      {/* Marketplace public */}
      <Route path="/marketplace" element={<MarketplaceHome />} />
      <Route path="/marketplace/new" element={<CreateAnnonce />} />
      <Route path="/marketplace/:id" element={<AnnonceDetails />} />

      {/* Application privée */}
      <Route path="/app/*" element={<AppShell />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}