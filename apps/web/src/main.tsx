import React, { StrictMode, useMemo, useState } from "react";
import * as ReactDOMClient from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CircleHelp,
  Command,
  ExternalLink,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Terminal,
  X,
} from "lucide-react";
import "./styles.css";

type MonitorState = "Operational" | "Degraded" | "Down";

type Monitor = {
  name: string;
  url: string;
  state: MonitorState;
  latency: string;
  uptime: string;
  checks: number;
};

const initialMonitors: Monitor[] = [
  { name: "Public API", url: "api.example.dev/health", state: "Operational", latency: "142 ms", uptime: "99.99%", checks: 12480 },
  { name: "Checkout service", url: "checkout.example.dev/health", state: "Degraded", latency: "812 ms", uptime: "98.41%", checks: 12390 },
  { name: "Documentation", url: "docs.example.dev", state: "Operational", latency: "96 ms", uptime: "100.00%", checks: 12480 },
  { name: "Auth gateway", url: "auth.example.dev/status", state: "Operational", latency: "118 ms", uptime: "99.97%", checks: 12411 },
];

function App() {
  const [railOpen, setRailOpen] = useState(false);
  const [activePage, setActivePage] = useState("Overview");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [incidentActive, setIncidentActive] = useState(true);
  const [monitors, setMonitors] = useState(initialMonitors);
  const [selectedName, setSelectedName] = useState("Checkout service");
  const [showLogin, setShowLogin] = useState(false);

  const selectedMonitor = monitors.find((monitor) => monitor.name === selectedName) ?? monitors[0];
  const openIncident = incidentActive ? 1 : 0;

  const simulateOutage = () => {
    setIncidentActive(true);
    setMonitors((current) => current.map((monitor) => monitor.name === "Checkout service"
      ? { ...monitor, state: "Down", latency: "Timeout" }
      : monitor));
  };

  const recover = () => {
    setIncidentActive(false);
    setMonitors((current) => current.map((monitor) => monitor.name === "Checkout service"
      ? { ...monitor, state: "Operational", latency: "164 ms" }
      : monitor));
  };

  if (showLogin) {
    return <Login onBack={() => setShowLogin(false)} />;
  }

  return (
    <div className={`app-shell ${theme === "light" ? "light-theme" : ""}`}>
      <aside className={`rail ${railOpen ? "rail-open" : ""}`}>
        <div className="rail-top">
          <button className="brand" type="button" onClick={() => setRailOpen((value) => !value)} aria-label="Toggle navigation">
            <span className="brand-mark"><Activity size={17} /></span>
            <span className="brand-name">API Sentinel</span>
          </button>
          <button className="rail-toggle" type="button" onClick={() => setRailOpen((value) => !value)} aria-label="Expand navigation">
            {railOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
        <div className="workspace-switch"><span className="workspace-dot" /><span className="workspace-label">Personal workspace</span><ChevronRight size={14} /></div>
        <nav className="nav-list" aria-label="Main navigation">
          <NavItem icon={<LayoutDashboard size={17} />} label="Overview" active={activePage === "Overview"} open={railOpen} onClick={() => setActivePage("Overview")} />
          <NavItem icon={<Gauge size={17} />} label="Monitors" active={activePage === "Monitors"} open={railOpen} onClick={() => setActivePage("Monitors")} />
          <NavItem icon={<AlertTriangle size={17} />} label="Incidents" count={openIncident} active={activePage === "Incidents"} open={railOpen} onClick={() => setActivePage("Incidents")} />
        </nav>
        <div className="nav-section-label">Workspace</div>
        <nav className="nav-list">
          <NavItem icon={<FileText size={17} />} label="Activity log" open={railOpen} onClick={() => setActivePage("Activity log")} />
          <NavItem icon={<Settings size={17} />} label="Settings" open={railOpen} onClick={() => setActivePage("Settings")} />
        </nav>
        <div className="rail-bottom">
          <button className="nav-item" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}<span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <button className="nav-item" type="button" onClick={() => setShowLogin(true)} title="Open login preview">
            <ShieldCheck size={17} /><span>Auth preview</span>
          </button>
          <div className="user-chip"><span className="avatar">HM</span><span className="user-copy"><strong>Henrique M.</strong><small>Developer</small></span><ChevronRight size={14} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{activePage}</strong></div>
          <div className="header-actions">
            <span className="demo-label"><span className="pulse" /> Public simulation</span>
            <button className="icon-button" type="button" title="Search"><Search size={17} /></button>
            <button className="icon-button" type="button" title="Notifications"><Bell size={17} /><i className="notification-dot" /></button>
            <button className="icon-button" type="button" title="Help"><CircleHelp size={17} /></button>
          </div>
        </header>

        <div className="page-heading">
          <div><p className="kicker">COMMAND CENTER / OCT 27, 2026</p><h1>Operational overview</h1><p className="subtitle">A live picture of your services, incidents and response health.</p></div>
          <button className="primary-button" type="button"><Plus size={16} /> Add monitor</button>
        </div>

        <div className="simulation-banner"><Terminal size={16} /><span><strong>Simulation mode</strong> — sample data only. No external requests are sent.</span><button type="button" onClick={() => setShowLogin(true)}>View real setup <ArrowUpRight size={14} /></button></div>

        <section className="hero-grid">
          <article className="health-panel panel">
            <div className="panel-topline"><span className="kicker">SYSTEM HEALTH</span><span className="status-tag success"><span className="status-dot" /> 87.5% operational</span></div>
            <div className="health-body"><div className="health-ring"><div><strong>99.94</strong><span>uptime</span></div></div><div className="health-copy"><h2>Most systems are healthy.</h2><p>One service needs attention. Review the active incident before it impacts users.</p><div className="health-meta"><span><i className="legend-dot green" /> 7 operational</span><span><i className="legend-dot amber" /> 1 degraded</span></div></div></div>
          </article>
          <article className="timeline-panel panel">
            <div className="panel-topline"><span className="kicker">INCIDENT TIMELINE</span><button className="text-button" type="button" onClick={() => setActivePage("Incidents")}>View all <ArrowUpRight size={14} /></button></div>
            {incidentActive ? <div className="timeline"><TimelineItem color="red" time="12:21:04" title="Checkout service is down" detail="3 consecutive failures · timeout after 10s" /><TimelineItem color="amber" time="12:20:47" title="Latency threshold exceeded" detail="812 ms response · expected under 500 ms" /><TimelineItem color="muted" time="11:00:00" title="Scheduled check completed" detail="8 monitors checked successfully" last /></div> : <div className="empty-state"><ShieldCheck size={23} /><strong>No active incidents</strong><span>All monitored services are responding.</span></div>}
          </article>
        </section>

        <section className="metric-strip">
          <Metric icon={<Gauge size={16} />} label="Active monitors" value="8" detail="7 operational" />
          <Metric icon={<AlertTriangle size={16} />} label="Open incidents" value={String(openIncident)} detail={openIncident ? "Needs attention" : "All clear"} warning={openIncident > 0} />
          <Metric icon={<Activity size={16} />} label="Avg. response" value="184 ms" detail="-16 ms vs last period" good />
          <Metric icon={<GitBranch size={16} />} label="Checks today" value="12,480" detail="+8.2% vs yesterday" good />
        </section>

        <section className="panel monitors-panel">
          <div className="panel-heading"><div><span className="kicker">MONITOR REGISTRY</span><h2>Services</h2></div><div className="panel-tools"><button className="filter-button" type="button"><Search size={14} /> Filter</button><button className="filter-button" type="button">Last 24 hours <ChevronRight size={14} /></button></div></div>
          <div className="service-layout">
            <div className="service-table">
              <div className="table-head"><span>Service</span><span>Status</span><span>Latency</span><span>Uptime</span><span /></div>
              {monitors.map((monitor) => <button className={`service-row ${selectedName === monitor.name ? "selected" : ""}`} type="button" key={monitor.name} onClick={() => setSelectedName(monitor.name)}><span className="service-title"><span className={`service-signal ${monitor.state.toLowerCase()}`} /><span><strong>{monitor.name}</strong><small>{monitor.url}</small></span></span><Status state={monitor.state} /><span className="table-mono">{monitor.latency}</span><span className="table-mono">{monitor.uptime}</span><ChevronRight size={15} /></button>)}
            </div>
            <aside className="detail-pane"><div className="detail-header"><div><span className="kicker">SELECTED SERVICE</span><h3>{selectedMonitor.name}</h3></div><ExternalLink size={16} /></div><div className="detail-url">{selectedMonitor.url}</div><Status state={selectedMonitor.state} /><div className="sparkline-wrap"><div className="sparkline-label"><span>Response time</span><strong>{selectedMonitor.latency}</strong></div><Sparkline /></div><div className="detail-stats"><span><small>Uptime</small><strong>{selectedMonitor.uptime}</strong></span><span><small>Total checks</small><strong>{selectedMonitor.checks.toLocaleString()}</strong></span></div><button className="outline-button" type="button">Open monitor details <ArrowUpRight size={14} /></button></aside>
          </div>
        </section>

        <section className="panel controls-panel">
          <div><span className="kicker">INTERACTIVE DEMO</span><h2>Test the incident workflow</h2><p>Trigger a simulated outage, inspect the state change, then recover the service.</p></div>
          <div className="control-actions"><button className="danger-button" type="button" onClick={simulateOutage}><AlertTriangle size={15} /> Simulate outage</button><button className="success-button" type="button" onClick={recover}><ShieldCheck size={15} /> Mark as recovered</button></div>
        </section>

        <footer className="page-footer"><span>API Sentinel <span className="footer-muted">· Public simulation</span></span><span>Built for backend observability <Activity size={13} /></span></footer>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, count, open, onClick }: { icon: React.ReactNode; label: string; active?: boolean; count?: number; open: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? "active" : ""}`} type="button" onClick={onClick} title={open ? undefined : label}>{icon}<span>{label}</span>{count ? <b>{count}</b> : null}</button>;
}

function Metric({ icon, label, value, detail, warning, good }: { icon: React.ReactNode; label: string; value: string; detail: string; warning?: boolean; good?: boolean }) {
  return <article className="metric"><div className={`metric-icon ${warning ? "warning" : good ? "good" : ""}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small className={warning ? "text-warning" : good ? "text-good" : ""}>{detail}</small></div></article>;
}

function TimelineItem({ color, time, title, detail, last }: { color: string; time: string; title: string; detail: string; last?: boolean }) {
  return <div className={`timeline-item ${last ? "last" : ""}`}><div className={`timeline-line ${color}`} /><div className="timeline-content"><span>{time}</span><strong>{title}</strong><small>{detail}</small></div></div>;
}

function Status({ state }: { state: MonitorState }) {
  return <span className={`status-tag ${state === "Operational" ? "success" : state === "Degraded" ? "warning" : "danger"}`}><span className="status-dot" />{state}</span>;
}

function Sparkline() {
  return <svg className="sparkline" viewBox="0 0 360 86" role="img" aria-label="Response time sparkline"><path d="M0 64 C16 60 22 66 36 58 S60 54 74 61 S92 48 110 52 S132 62 148 45 S170 42 184 48 S204 42 220 49 S238 31 254 38 S272 28 286 34 S306 24 322 31 S342 20 360 25" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M0 64 C16 60 22 66 36 58 S60 54 74 61 S92 48 110 52 S132 62 148 45 S170 42 184 48 S204 42 220 49 S238 31 254 38 S272 28 286 34 S306 24 322 31 S342 20 360 25 V86 H0Z" fill="url(#spark-fill)" opacity=".18" /><defs><linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#b8f34a" /><stop offset="1" stopColor="#b8f34a" stopOpacity="0" /></linearGradient></defs></svg>;
}

function Login({ onBack }: { onBack: () => void }) {
  return <div className="login-shell"><div className="login-visual"><div className="login-grid" /><div className="login-visual-content"><div className="brand"><span className="brand-mark"><Activity size={17} /></span><span className="brand-name">API Sentinel</span></div><div><span className="kicker">BACKEND OBSERVABILITY</span><h1>Know before your users do.</h1><p>Monitor endpoints, understand incidents and keep your services accountable.</p></div><div className="terminal-card"><div><span className="terminal-dot red" /><span className="terminal-dot amber" /><span className="terminal-dot green" /></div><p><span className="terminal-muted">$ sentinel check</span><br /><span className="terminal-green">✓</span> api.example.dev/health <span className="terminal-muted">142ms</span><br /><span className="terminal-green">✓</span> docs.example.dev <span className="terminal-muted">96ms</span><br /><span className="terminal-amber">!</span> checkout.example.dev <span className="terminal-muted">timeout</span></p></div></div></div><div className="login-form"><button className="back-button" type="button" onClick={onBack}>← Back to demo</button><div className="form-content"><span className="kicker">PRIVATE WORKSPACE</span><h2>Sign in to Sentinel</h2><p>Access your monitors and incident history.</p><label>Email address<input type="email" placeholder="you@company.com" /></label><label>Password<input type="password" placeholder="••••••••" /></label><button className="primary-button full" type="button">Continue <ArrowUpRight size={15} /></button><div className="form-divider"><span>or</span></div><button className="outline-button full" type="button"><Command size={15} /> Continue with GitHub</button></div></div></div>;
}

ReactDOMClient.createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
