import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

/**
 * Reads the stored or system theme preference.
 * Priority: localStorage → system prefers-color-scheme → "light"
 */
function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme") as "light" | "dark" | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Applies the theme to the document root and persists to localStorage.
 */
function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

export default function Nav() {
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const nav = useNavigate();

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Keep in sync with system preference changes (e.g. user changes OS theme)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only follow system if user hasn't overridden it
      const stored = localStorage.getItem("theme");
      if (!stored) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    if (v.startsWith("G") && v.length === 56) nav(`/wallet/${v}`);
    else nav(`/contract/${v}`);
    setQ("");
  }

  return (
    <header
      className="nav-root"
      role="banner"
    >
      <NavLink
        to="/"
        style={({ isActive }) => ({
          fontWeight: 700,
          fontSize: 16,
          whiteSpace: "nowrap",
          color: isActive ? "var(--accent)" : "inherit",
          borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
          paddingBottom: 4,
        })}
      >
        ⬡ Soroban Explorer
      </NavLink>

      <NavLink
        to="/contracts"
        style={({ isActive }) => ({
          fontWeight: 600,
          fontSize: 15,
          whiteSpace: "nowrap",
          color: isActive ? "var(--accent)" : "inherit",
          borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
          paddingBottom: 4,
        })}
      >
        Contracts
      </NavLink>

      <NavLink
        to="/referrals"
        style={({ isActive }) => ({
          fontWeight: 600,
          fontSize: 15,
          whiteSpace: "nowrap",
          color: isActive ? "var(--accent)" : "inherit",
          borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
          paddingBottom: 4,
        })}
      >
        Referrals
      </NavLink>

      <form onSubmit={search} style={{ display: "flex", gap: 8, flex: 1, maxWidth: 600 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search contract ID or wallet address…"
          style={{ flex: 1 }}
          aria-label="Search contract ID or wallet address"
        />
        <button type="submit" aria-label="Search">Search</button>
      </form>

      {/* Theme toggle (#1004) */}
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        style={{ marginLeft: "auto" }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </header>
  );
}
