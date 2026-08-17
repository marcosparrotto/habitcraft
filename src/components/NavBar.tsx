import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { PixelButton } from "./ui/PixelButton";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { to: "/", label: "Hoje", icon: "⭐" },
  { to: "/week", label: "Semana", icon: "🗓️" },
  { to: "/habits", label: "Hábitos", icon: "📦" },
  { to: "/history", label: "Histórico", icon: "📊" },
];

export function NavBar() {
  const { signOut } = useAuth();

  return (
    <nav className="bg-panel border-b-4 border-edge sticky top-0 z-20 theme-fade">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-3 py-2 gap-2">
        <span className="font-pixel text-xs text-accent shrink-0 hidden lg:inline">HabitCraft</span>
        <div className="flex gap-1.5 overflow-x-auto">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `font-pixel text-[0.6rem] px-2.5 py-2 border-4 whitespace-nowrap theme-fade ${
                  isActive
                    ? "bg-grass-dark border-edge text-white"
                    : "bg-panel-light border-panel-light text-ink-dim hover:border-stone"
                }`
              }
            >
              <span>{link.icon}</span>
              <span className="hidden sm:inline"> {link.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <PixelButton
            color="redstone"
            variant="ghost"
            className="text-[0.55rem] px-2 py-2"
            onClick={() => signOut()}
          >
            Sair
          </PixelButton>
        </div>
      </div>
    </nav>
  );
}
