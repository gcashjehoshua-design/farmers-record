import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LogoHeader from "@/components/LogoHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import MenuToggle from "@/components/MenuToggle";
import { BackButton } from "@/components/BackButton";
import { RequireAuth } from "@/components/RequireAuth";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import Dashboard from "@/pages/Dashboard";
import FarmersList from "@/pages/FarmersList";
import AddFarmer from "@/pages/AddFarmer";
import ImportFarmers from "@/pages/ImportFarmers";
import RecordTransaction from "@/pages/RecordTransaction";
import TransactionHistory from "@/pages/TransactionHistory";
import ViewFarmer from "@/pages/ViewFarmer";
import EditFarmer from "@/pages/EditFarmer";
import UserManagement from "@/pages/UserManagement";
import UserProfile from "@/pages/UserProfile";
import InactiveFarmers from "@/pages/InactiveFarmers";
import Projects from "@/pages/Projects";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";

// Tailwind will provide global theming and styles.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

// Single layout: menu state lives here so it persists across navigation (menu never auto-closes)
function AppLayout() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDashboard = location.pathname === "/" || location.pathname === "";

  let directPath = "/";
  if (location.pathname.startsWith("/farmers") && !location.pathname.includes("/farmers/")) directPath = "/";
  else if (location.pathname.startsWith("/farmers/")) directPath = "/farmers";
  else if (
    location.pathname.startsWith("/record-transaction") ||
    location.pathname.startsWith("/transaction-history") ||
    location.pathname.startsWith("/projects")
  ) directPath = "/";
  else if (location.pathname.startsWith("/add-farmer")) directPath = "/farmers";

  const isFarmerProfilePage = location.pathname.match(/^\/farmers\/[^/]+(\/edit)?$/);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f0]">
      <MenuToggle isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div
        className="flex-grow flex flex-col transition-[margin] duration-300 ease-in-out"
        style={{ marginLeft: isMenuOpen ? "20rem" : 0 }}
      >
        <div className="container mx-auto px-4 py-6">
          {isDashboard && <LogoHeader />}
          {!isDashboard && !isFarmerProfilePage && (
            <BackButton label="Back to Dashboard" directPath={directPath} fallbackPath="/" />
          )}
        </div>
        <main className="container mx-auto px-4 pb-8 flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-farmer" element={<AddFarmer />} />
            <Route path="/import-farmers" element={<ImportFarmers />} />
            <Route path="/record-transaction" element={<RecordTransaction />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/farmers/:id/edit" element={<EditFarmer />} />
            <Route path="/farmers/:id" element={<ViewFarmer />} />
            <Route path="/farmers" element={<FarmersList />} />
            <Route path="/inactive-farmers" element={<InactiveFarmers />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/users/:id" element={<UserProfile />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
