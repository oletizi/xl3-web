import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </AuthProvider>
);
