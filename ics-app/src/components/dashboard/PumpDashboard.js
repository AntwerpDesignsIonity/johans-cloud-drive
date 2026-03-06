import React, { useState } from "react";
import "./dashboard.css";

export default function PumpDashboard() {
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [salinityInput, setSalinityInput] = useState(35000);

  return (
    <div className="pump-dashboard">
      {/* Top Header */}
      <header className="dash-header">
        <div className="dash-brand">
          <span className="logo-icon">≈</span>
          <h1>Pump <span>Dashboard</span></h1>
          <span className="status-badge">FIREBASE CONNECTED</span>
        </div>
        <div className="dash-actions">
          <button className="sync-btn">● CLOUD SYNC</button>
          <button className="ai-btn">⚙ AI ACTIVE</button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="dash-grid">
        
        {/* Left Column: Pump Control */}
        <aside className="panel pump-control-panel">
          <div className="panel-header">
            <h3>⏻ PUMP CONTROL</h3>
          </div>
          <div className="pump-power-section">
            <button 
              className={`power-btn ${isPumpOn ? 'active' : ''}`}
              onClick={() => setIsPumpOn(!isPumpOn)}
            >
              {isPumpOn ? 'ON' : 'OFF'}
            </button>
            <div className="pump-status-display">
              <span className="label">STATUS</span>
              <h2>{isPumpOn ? "RUNNING" : "STANDBY"}</h2>
            </div>
          </div>

          <div className="pump-stats">
            <div className="stat-box">
              <span className="label">UPTIME</span>
              <span className="value">00:00:00</span>
            </div>
            <div className="stat-box">
              <span className="label">POWER USED</span>
              <span className="value">0.0000 kWh</span>
            </div>
          </div>

          <div className="pump-details">
            <div className="detail-row">
              <span className="label">🏷 PUMP NAME</span>
              <span className="value text-blue">Lake Pump 1</span>
            </div>
            <div className="detail-row">
              <span className="label">⚡ RATING (KW)</span>
              <span className="value text-blue">1.5</span>
            </div>
            <div className="detail-row">
              <span className="label">⍜ SALINITY (PPM)</span>
              <span className="value text-blue">{salinityInput}</span>
            </div>
          </div>
        </aside>

        {/* Middle & Right Column: Weather & AI */}
        <main className="main-panels">
          <div className="panel top-row-panel">
            <div className="panel-header">
              <h3>☁ WEATHER & LOCATION</h3>
              <button className="locate-btn">⊕ LOCATE</button>
            </div>
            
            <div className="weather-grid">
              <div className="weather-card">
                <div className="label">Awaiting Signal...</div>
                <h2>--°C</h2>
                <div className="sub-label">Weather Offline</div>
              </div>
              
              <div className="weather-mini-cards">
                <div className="weather-card mini">
                  <span className="label">💧 Humidity</span>
                  <h4>--%</h4>
                </div>
                <div className="weather-card mini">
                  <span className="label">🌬 Wind</span>
                  <h4>-- km/h</h4>
                </div>
              </div>
              
              <div className="salinity-control weather-card">
                <span className="label">≈ LAKE SALINITY LEVEL</span>
                <div className="salinity-input-row">
                  <h2>35,000<br/><small>PPM</small></h2>
                  <button className="manual-input-btn">MANUAL INPUT</button>
                </div>
              </div>
            </div>
          </div>

          <div className="panel ai-advice-panel">
            <div className="panel-header">
              <h3>✧ AI ADVICE</h3>
            </div>
            <div className="ai-content">
              <p>System ready. Awaiting location data to provide advice...</p>
            </div>
            <div className="ai-footer">
               <button className="auto-exec-btn">✓ AUTO-EXECUTE</button>
            </div>
          </div>
        </main>
      </div>

      <div className="dash-grid bottom">
        <div className="panel system-logs">
           <div className="panel-header">
              <h3>📋 SYSTEM LOGS</h3>
            </div>
            <div className="logs-content">
              <p>{">>"} SYSTEM STARTED</p>
              <p>{">>"} READY</p>
            </div>
        </div>
        <div className="panel power-history">
           <div className="panel-header">
              <h3>⚡ POWER HISTORY</h3>
            </div>
            {/* Chart placeholder */}
            <div className="chart-placeholder">
              <div className="chart-grid"></div>
            </div>
        </div>
      </div>
    </div>
  );
}
