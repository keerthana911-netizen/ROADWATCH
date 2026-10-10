import Link from "next/link";
import {
  LayoutDashboard,
  MapPinned,
  ClipboardList,
  ChartNoAxesCombined,
  ShieldCheck,
  ArrowUpRight,
  Route,
  LogOut,
  Bell,
  Images,
} from "lucide-react";
import { logout } from "@/lib/auth-actions";
import type { Dataset } from "@/lib/types";
export function Shell({
  d,
  active = "dashboard",
  children,
}: {
  d: Dataset;
  active?: string;
  children: React.ReactNode;
}) {
  const suffix = d.demo && d.role !== "officer" ? `?view=${d.role}` : "";
  const items = [
    ["dashboard", "Overview", "/", LayoutDashboard],
    [
      "tickets",
      d.role === "citizen" ? "My tickets" : "Citizen reports",
      "/tickets",
      ClipboardList,
    ],
    ["memory", "Repair memory", "/?filter=repeat", Route],
    ["roads", "Real road network", "/roads", MapPinned],
    ["evidence", "Dataset evidence", "/evidence", Images],
    ["analytics", "Insights & audit", "/analytics", ChartNoAxesCombined],
    ["try", "Try the complete flow", "/try", ShieldCheck],
    ["presentation", "Presentation & Q&A", "/presentation", ClipboardList],
  ] as const;
  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <aside className="sidebar">
        <div>
          <Link href={"/" + suffix} className="brand">
            <span className="brand-icon">
              <Route size={22} />
            </span>
            RoadWatch
          </Link>
          <div className="tagline">EVERY REPAIR REMEMBERED</div>
        </div>
        <div>
          <span className="eyebrow" style={{ paddingLeft: 14 }}>
            WORKSPACE
          </span>
          <nav className="nav" style={{ marginTop: 14 }}>
            {items.map(([key, label, url, Icon]) => (
              <Link
                key={key}
                className={active === key ? "active" : ""}
                aria-current={active === key ? "page" : undefined}
                href={
                  url + (url.includes("?") ? suffix.replace("?", "&") : suffix)
                }
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="governance">
            <ShieldCheck size={20} />
            <b style={{ display: "block", marginTop: 8 }}>
              Rules lead. AI assists.
            </b>
            Every suggestion needs a human decision. Every repair leaves a
            trail.
            <Link
              href={"/analytics" + suffix}
              className="mini-link"
              style={{ display: "block", marginTop: 10 }}
            >
              View governance log ↗
            </Link>
          </div>
          <div className="user">
            <span className="avatar">
              {d.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <div>
              <b style={{ fontSize: 12 }}>{d.name}</b>
              <small
                style={{
                  display: "block",
                  color: "#85917f",
                  marginTop: 4,
                  textTransform: "capitalize",
                }}
              >
                {d.role === "officer" ? "Ward Officer" : d.role}
              </small>
            </div>
          </div>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <b>{active === "roads" ? "Road network" : "Ward 12"}</b>
            <span style={{ color: "#bdc4b6", margin: "0 12px" }}>/</span>
            <small>Central · Chennai</small>
          </div>
          <div className="actions" style={{ alignItems: "center" }}>
            <span className="badge green">
              <span className="dot" />
              {d.demo ? "DEMO DATA · READ ONLY" : "LIVE WORKSPACE"}
            </span>
            <Bell
              size={16}
              aria-label="Unresolved repair notes appear in the dashboard"
            />
            {d.demo ? (
              <Link className="mini-link" href="/login">
                Demo options{" "}
                <ArrowUpRight size={12} style={{ display: "inline" }} />
              </Link>
            ) : (
              <form action={logout}>
                <button
                  className="button secondary small"
                  aria-label="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </form>
            )}
          </div>
        </header>
        {d.demo && (
          <div
            style={{
              padding: "9px 36px",
              background: "#edf1e4",
              fontSize: 11,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span>
              Demo data · Illustrative records. Connect Supabase to enable saved
              changes.
            </span>
            <div className="actions">
              {["officer", "citizen", "reviewer"].map((role) => (
                <Link
                  key={role}
                  style={{
                    fontWeight: d.role === role ? 800 : 400,
                    textTransform: "capitalize",
                  }}
                  href={`/?view=${role}`}
                >
                  {role} view
                </Link>
              ))}
            </div>
          </div>
        )}
        <main className="main" id="main-content" tabIndex={-1}>
          {children}
          <footer className="footer">
            <span>ROADWATCH · BUILT FOR ACCOUNTABLE ROADS</span>
            <span>Deterministic rules. Human decisions. Lasting memory.</span>
          </footer>
        </main>
      </section>
    </div>
  );
}
