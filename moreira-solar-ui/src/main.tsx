import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import App from "./App";
import "./index.css";

// Dark mode por padrão
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
        <AuthProvider>
            <App />
        </AuthProvider>
    </ThemeProvider>
);
