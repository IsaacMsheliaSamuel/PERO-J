import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import NetworkStatusChip from "./NetworkStatusChip";

export default function Nav() {
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const nav = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

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
    setMenuOpen(false);
  }

  const linkStyle = (isActive: boolean) => ({
    fontWeight: 600,
    fontSize: 15,
    whiteSpace: "nowrap" as const,
    color: isActive ? "var(--accent)" : "inherit",
    borderBottom: isActive ? "2px solid var(--accent)" : "none",
    paddingBottom: isActive ? "4px" : "0px",
  });

  return (
    <header className="nav-header">
      <div className="nav-bar">
        <NavLink
          to="/"
          onClick={() => setMenuOpen(false)}
          aria-label="Soroban Explorer home"
          style={({ isActive }) => ({
            fontWeight: 700,
            fontSize: 16,
            whiteSpace: "nowrap",
            color: isActive ? "var(--accent)" : "inherit",
            borderBottom: isActive ? "2px solid var(--accent)" : "none",
            paddingBottom: isActive ? "4px" : "0px",
          })}
        >
          <span aria-hidden="true">⬡</span> Soroban Explorer
        </NavLink>
        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <nav id="primary-navigation" aria-label="Primary" className={`nav-links${menuOpen ? " open" : ""}`}>
          <NavLink to="/contracts" onClick={() => setMenuOpen(false)} style={({ isActive }) => linkStyle(isActive)}>
            Contracts
          </NavLink>
          <form onSubmit={search} className="nav-search" role="search">
            <label htmlFor="nav-search-input" className="sr-only">
              Search contract ID or wallet address
            </label>
            <input
              id="nav-search-input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search contract ID or wallet address…"
              style={{ flex: 1, minWidth: 0 }}
            />
            <button type="submit">Search</button>
          </form>
          <NetworkStatusChip sseUrl="/api/events/stream" />
          <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" className="nav-theme">
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </nav>
      </div>
    </header>
  );
}
