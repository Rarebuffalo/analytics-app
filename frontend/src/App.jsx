import React, { useState } from 'react';
import SessionsView from './components/SessionsView';
import HeatmapView from './components/HeatmapView';

const API_BASE = 'http://127.0.0.1:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('sessions');

  return (
    <div style={styles.container}>
      {/* SaaS Dashboard Header */}
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          <span style={styles.logoText}>CausalFunnel</span>
          <span style={styles.logoBadge}>Analytics HUD</span>
        </div>
        <div style={styles.nav}>
          <button 
            onClick={() => setActiveTab('sessions')}
            style={{
              ...styles.navTab,
              ...(activeTab === 'sessions' ? styles.activeTab : {})
            }}
          >
            Sessions Journey
          </button>
          <button 
            onClick={() => setActiveTab('heatmap')}
            style={{
              ...styles.navTab,
              ...(activeTab === 'heatmap' ? styles.activeTab : {})
            }}
          >
            Click Heatmap
          </button>
        </div>
      </header>

      {/* Primary Dashboard Content Area */}
      <main style={styles.mainContent}>
        {activeTab === 'sessions' ? (
          <SessionsView apiBase={API_BASE} />
        ) : (
          <HeatmapView apiBase={API_BASE} />
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)'
  },
  header: {
    height: '60px',
    borderBottom: '1px solid var(--border-primary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    backgroundColor: '#0c0c0e'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  logoText: {
    fontWeight: '700',
    fontSize: '1rem',
    letterSpacing: '-0.02em'
  },
  logoBadge: {
    fontSize: '0.7rem',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: 'var(--accent-blue)',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '8px',
    fontWeight: '500',
    border: '1px solid rgba(59, 130, 246, 0.2)'
  },
  nav: {
    display: 'flex',
    gap: '4px'
  },
  navTab: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  activeTab: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-primary)'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }
};

export default App;
