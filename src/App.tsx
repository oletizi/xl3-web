import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LCXL3Provider } from "@/contexts/LCXL3Context";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Editor from "./pages/Editor";
import Library from "./pages/Library";
import Catalog from "./pages/Catalog";
import ModeDetail from "./pages/ModeDetail";
import Profile from "./pages/Profile";
import { Login } from "./pages/Login";
import { AuthCallback } from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LCXL3Provider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Authentication routes (no Layout wrapper) */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected application routes */}
            <Route path="/" element={<ProtectedRoute><Layout><Editor /></Layout></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Layout><Library /></Layout></ProtectedRoute>} />
            <Route path="/catalog" element={<ProtectedRoute><Layout><Catalog /></Layout></ProtectedRoute>} />
            <Route path="/modes/:id" element={<ProtectedRoute><Layout><ModeDetail /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </LCXL3Provider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
