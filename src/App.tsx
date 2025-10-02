import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LCXL3Provider } from "@/contexts/LCXL3Context";
import Layout from "@/components/Layout";
import Editor from "./pages/Editor";
import Library from "./pages/Library";
import Catalog from "./pages/Catalog";
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
            <Route path="/" element={<Layout><Editor /></Layout>} />
            <Route path="/library" element={<Layout><Library /></Layout>} />
            <Route path="/catalog" element={<Layout><Catalog /></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </LCXL3Provider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
