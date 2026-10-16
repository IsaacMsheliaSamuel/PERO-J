import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ContractsPage from "./pages/ContractsPage";
import ContractPage from "./pages/ContractPage";
import WalletPage from "./pages/WalletPage";
import EventPage from "./pages/EventPage";
import NotFound from "./pages/NotFound";
import BetSlipPage from "./pages/BetSlipPage";
import ReferralsPage from "./pages/ReferralsPage";

export default function App() {
  return (
    <>
      <Nav />
      <ErrorBoundary>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/contract/:id" element={<ContractPage />} />
            <Route path="/wallet/:address" element={<WalletPage />} />
            <Route path="/event/:seq" element={<EventPage />} />
            <Route path="/bet" element={<BetSlipPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </ErrorBoundary>
      <Footer />
    </>
  );
}
