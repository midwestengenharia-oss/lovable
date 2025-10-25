import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import logoMoreiraLight from "@/assets/logo-moreira.png"; // logo clara
import logoMoreiraDark from "@/assets/logo-moreira-branco.png"; // logo escura

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme } = useTheme();

  // alterna automaticamente conforme o tema
  const logo = theme === "dark" ? logoMoreiraDark : logoMoreiraLight;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background text-foreground transition-colors">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-6 transition-colors">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <img
                src={logo}
                alt="Moreira Solar"
                className="h-8 w-auto select-none transition-all duration-300"
              />
            </div>

            <ThemeToggle />
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
