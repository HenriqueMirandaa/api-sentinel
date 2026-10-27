import React, { StrictMode, useState } from "react";
import * as ReactDOMClient from "react-dom/client";
import "./styles.css";

function App() {
  const [incidentActive, setIncidentActive] = useState(true);
  const [checkoutDown, setCheckoutDown] = useState(false);

  const simulateOutage = () => {
    setIncidentActive(true);
    setCheckoutDown(true);
  };

  const recover = () => {
    setIncidentActive(false);
    setCheckoutDown(false);
  };

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">●</span><span>API Sentinel</span></div>
        <nav><a className="active" href="#overview">Overview</a><a href="#monitors">Monitors</a><a href="#incidents">Incidents</a></nav>
        <div className="demo-note"><strong>Demo workspace</strong><span>Dados simulados para exploração pública</span></div>
      </aside>
      <section className="content">
        <header className="topbar"><div><p className="eyebrow">PUBLIC DEMO / SIMULATION MODE</p><h1>Service overview</h1></div><span className="live-pill"><i /> Simulation running</span></header>
        <div className="notice"><span>i</span>Esta demonstração não envia requests para serviços externos. Usa dados locais para mostrar como o produto reage a estados operacionais.</div>
        <section className="metrics" id="overview">
          <Metric label="Uptime (30 days)" value="99.94%" detail="+0.12% vs last period" good />
          <Metric label="Active monitors" value="8" detail="7 operational · 1 degraded" />
          <Metric label="Open incidents" value={incidentActive ? "1" : "0"} detail={incidentActive ? "Last updated just now" : "All services operational"} warn={incidentActive} good={!incidentActive} />
          <Metric label="Avg. response time" value="184 ms" detail="-16 ms vs last period" good />
        </section>
        <section className="panel" id="monitors">
          <div className="panel-heading"><div><p className="eyebrow">MONITORING</p><h2>Monitors</h2></div><button className="ghost-button" type="button">+ Add monitor</button></div>
          <div className="monitor-list">
            <Monitor name="Public API" url="api.example.dev/health" status="Operational" response="142 ms" />
            <Monitor name="Checkout service" url="checkout.example.dev/health" status={checkoutDown ? "Down" : "Degraded"} response={checkoutDown ? "Timeout" : "812 ms"} degraded={checkoutDown || true} />
            <Monitor name="Documentation" url="docs.example.dev" status="Operational" response="96 ms" />
          </div>
        </section>
        <section className="panel incident-panel" id="incidents">
          <div className="panel-heading"><div><p className="eyebrow">SIMULATION CONTROLS</p><h2>Test an incident workflow</h2></div><span className={`incident-status ${incidentActive ? "" : "recovered"}`}>{incidentActive ? "1 active incident" : "No active incidents"}</span></div>
          <p className="muted">Usa os controlos para simular uma falha, observar a alteração do estado e recuperar o serviço.</p>
          <div className="actions"><button className="danger-button" type="button" onClick={simulateOutage}>Simulate outage</button><button className="success-button" type="button" onClick={recover}>Mark as recovered</button></div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, detail, good, warn }: { label: string; value: string; detail: string; good?: boolean; warn?: boolean }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small className={good ? "good" : warn ? "warn" : ""}>{detail}</small></article>;
}

function Monitor({ name, url, status, response, degraded }: { name: string; url: string; status: string; response: string; degraded?: boolean }) {
  return <div className="monitor-row"><div className={`status-dot ${degraded ? "degraded" : ""}`} /><div className="monitor-name"><strong>{name}</strong><span>{url}</span></div><span className={`status ${degraded ? "status-warn" : ""}`}>{status}</span><span className="response">{response}</span><button className="row-button" type="button">View</button></div>;
}

ReactDOMClient.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
