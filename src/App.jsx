import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import AppShell from "./AppShell";

// Marketplace
import MarketplaceHome from "./pages/marketplace/MarketplaceHome";
import CreateAnnonce from "./pages/marketplace/CreateAnnonce";
import AnnonceDetails from "./pages/marketplace/AnnonceDetails";

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}