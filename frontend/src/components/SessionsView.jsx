import React, { useState, useEffect } from 'react';

function SessionsView({ apiBase }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Fetch session aggregation list
  const fetchSessions = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch chronological events for active session
  const fetchSessionEvents = async (sessionId) => {
    setLoadingJourney(true);
    try {
      const response = await fetch(`${apiBase}/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to load session events');
      const data = await response.json();
      setSessionEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJourney(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [apiBase]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionEvents(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Formatter for time elapsed
  const formatTimeAgo = (dateString) => {
    const diff = new Date() - new Date(dateString);
    const secs = Math.floor(diff / 1000);
    if (secs < 5) return 'Just now';
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const filteredSessions = sessions.filter(s => 
    s._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Sidebar - Sessions list */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>Active Sessions ({filteredSessions.length})</h3>
          <button onClick={fetchSessions} style={styles.refreshBtn} title="Refresh Sessions">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          </button>
        </div>

        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Filter by Session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.sessionList} className="custom-scrollbar">
          {loadingList ? (
            <div style={styles.message}>Loading sessions...</div>
          ) : error ? (
            <div style={{ ...styles.message, color: '#ef4444' }}>{error}</div>
          ) : filteredSessions.length === 0 ? (
            <div style={styles.message}>No sessions recorded yet.</div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session._id}
                onClick={() => setSelectedSessionId(session._id)}
                style={{
                  ...styles.sessionItem,
                  ...(selectedSessionId === session._id ? styles.activeSessionItem : {})
                }}
              >
                <div style={styles.sessionMeta}>
                  <span style={styles.sessionId}>
                    {session._id.substring(0, 18)}...
                  </span>
                  <span style={styles.badge}>{session.totalEvents} events</span>
                </div>
                <div style={styles.sessionTime}>
                  Last active: {formatTimeAgo(session.lastActive)}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main timeline pane */}
      <section style={styles.timelineContainer} className="custom-scrollbar">
        {!selectedSessionId ? (
          <div style={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: 16}}><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
            <p style={{fontWeight: '500'}}>No Session Selected</p>
            <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4}}>
              Select an active session from the left sidebar to analyze the user's journey.
            </p>
          </div>
        ) : loadingJourney ? (
          <div style={styles.emptyState}>
            <p>Loading journey details...</p>
          </div>
        ) : (
          <div style={styles.journeyContent}>
            <div style={styles.journeyHeader}>
              <div>
                <h2 style={styles.journeyTitle}>User Journey</h2>
                <div style={styles.journeySub}>Session ID: <span style={{fontFamily: 'monospace', color: 'var(--text-primary)'}}>{selectedSessionId}</span></div>
              </div>
              <span style={styles.journeyCounter}>{sessionEvents.length} events logged</span>
            </div>

            <div style={styles.timeline}>
              {sessionEvents.map((event, index) => (
                <div key={event._id || index} style={styles.timelineItem}>
                  {/* Timeline node icon */}
                  <div style={styles.timelineLine} />
                  <div 
                    style={{
                      ...styles.timelineNode,
                      backgroundColor: event.eventType === 'page_view' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      borderColor: event.eventType === 'page_view' ? 'var(--accent-blue)' : 'var(--accent-emerald)'
                    }}
                  >
                    {event.eventType === 'page_view' ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="2.5"><path d="m5 12 5 5L20 7"/></svg>
                    )}
                  </div>

                  {/* Timeline content block */}
                  <div style={styles.timelineCard}>
                    <div style={styles.cardHeader}>
                      <span style={{
                        ...styles.cardType,
                        color: event.eventType === 'page_view' ? 'var(--accent-blue)' : 'var(--accent-emerald)'
                      }}>
                        {event.eventType === 'page_view' ? 'Page View' : 'Click Event'}
                      </span>
                      <span style={styles.cardTime}>
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div style={styles.cardUrl}>
                      <span style={styles.urlLabel}>URL:</span>
                      <a href={event.pageUrl} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>{event.pageUrl}</a>
                    </div>
                    
                    {event.eventType === 'click' && event.coordinates && (
                      <div style={styles.coordinatesPanel}>
                        <div style={styles.coordItem}>
                          <span style={styles.coordLabel}>Coords:</span>
                          <span style={styles.coordVal}>X: {event.coordinates.x}px, Y: {event.coordinates.y}px</span>
                        </div>
                        <div style={styles.coordItem}>
                          <span style={styles.coordLabel}>Viewport:</span>
                          <span style={styles.coordVal}>{event.coordinates.viewportWidth} &times; {event.coordinates.viewportHeight}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flex: 1,
    height: '100%',
    overflow: 'hidden'
  },
  sidebar: {
    width: '320px',
    borderRight: '1px solid var(--border-primary)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0c0c0e'
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid var(--border-primary)'
  },
  sidebarTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  refreshBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s'
  },
  searchContainer: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-primary)'
  },
  searchInput: {
    width: '100%',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  sessionList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0'
  },
  sessionItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(39, 39, 42, 0.5)',
    transition: 'background-color 0.2s'
  },
  activeSessionItem: {
    backgroundColor: 'var(--bg-card)',
    borderRight: '2px solid var(--accent-blue)'
  },
  sessionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  sessionId: {
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  badge: {
    fontSize: '0.7rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-secondary)',
    padding: '2px 6px',
    borderRadius: '12px',
    border: '1px solid var(--border-primary)'
  },
  sessionTime: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  message: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    padding: '24px'
  },
  timelineContainer: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: 'var(--bg-app)'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '32px'
  },
  journeyContent: {
    padding: '32px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  journeyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-primary)',
    paddingBottom: '20px',
    marginBottom: '24px'
  },
  journeyTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    marginBottom: '4px'
  },
  journeySub: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)'
  },
  journeyCounter: {
    fontSize: '0.75rem',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    color: 'var(--accent-blue)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: '500'
  },
  timeline: {
    position: 'relative',
    paddingLeft: '32px'
  },
  timelineItem: {
    position: 'relative',
    marginBottom: '24px'
  },
  timelineLine: {
    position: 'absolute',
    left: '-21px',
    top: '24px',
    bottom: '-24px',
    width: '2px',
    backgroundColor: 'var(--border-primary)',
    zIndex: 1
  },
  timelineNode: {
    position: 'absolute',
    left: '-27px',
    top: '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  timelineCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    padding: '16px',
    transition: 'border-color 0.2s'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  cardType: {
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  cardTime: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  cardUrl: {
    fontSize: '0.8rem',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    marginBottom: '10px'
  },
  urlLabel: {
    color: 'var(--text-muted)',
    fontWeight: '500'
  },
  urlLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid transparent',
    transition: 'all 0.2s'
  },
  coordinatesPanel: {
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '10px',
    display: 'flex',
    gap: '24px'
  },
  coordItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  coordLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  coordVal: {
    fontSize: '0.75rem',
    color: 'var(--text-primary)',
    fontWeight: '500'
  }
};

export default SessionsView;
