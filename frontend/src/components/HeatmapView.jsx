import React, { useState, useEffect } from 'react';

function HeatmapView({ apiBase }) {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [hoveredClick, setHoveredClick] = useState(null);
  const [mapMode, setMapMode] = useState('dots'); // 'dots' or 'grid'

  // Fetch unique tracked pages
  const fetchPages = async () => {
    setLoadingPages(true);
    try {
      const response = await fetch(`${apiBase}/pages`);
      if (!response.ok) throw new Error('Failed to fetch pages');
      const data = await response.json();
      setPages(data);
      if (data.length > 0) {
        setSelectedPage(data[0]); // Select first URL by default
      }
    } catch (err) {
      console.error('Error fetching pages list:', err);
    } finally {
      setLoadingPages(false);
    }
  };

  // Fetch click data for selected page URL
  const fetchClicks = async (pageUrl) => {
    if (!pageUrl) return;
    setLoadingClicks(true);
    try {
      const response = await fetch(`${apiBase}/heatmap?pageUrl=${encodeURIComponent(pageUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch heatmap clicks');
      const data = await response.json();
      setClicks(data);
    } catch (err) {
      console.error('Error fetching heatmap:', err);
    } finally {
      setLoadingClicks(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [apiBase]);

  useEffect(() => {
    if (selectedPage) {
      fetchClicks(selectedPage);
    }
  }, [selectedPage]);

  // Aggregate clicks in grid cells for density visualization
  const getGridCells = () => {
    const cols = 20; // 40px width per cell
    const rows = 15; // 40px height per cell
    const grid = Array(cols * rows).fill(0).map((_, i) => ({
      index: i,
      x: (i % cols) * 40,
      y: Math.floor(i / cols) * 40,
      count: 0
    }));

    clicks.forEach(click => {
      if (!click.coordinates) return;
      const { x, y, viewportWidth, viewportHeight } = click.coordinates;
      if (!viewportWidth || !viewportHeight) return;

      const normX = (x / viewportWidth) * 800;
      const normY = (y / viewportHeight) * 600;

      const colIdx = Math.min(Math.floor(normX / 40), cols - 1);
      const rowIdx = Math.min(Math.floor(normY / 40), rows - 1);
      
      if (colIdx >= 0 && rowIdx >= 0) {
        grid[rowIdx * cols + colIdx].count += 1;
      }
    });

    return grid.filter(cell => cell.count > 0);
  };

  // Normalization scaling function for dot rendering
  const getScaledCoordinates = (click) => {
    if (!click.coordinates) return { x: 0, y: 0 };
    const { x, y, viewportWidth, viewportHeight } = click.coordinates;
    if (!viewportWidth || !viewportHeight) {
      // Direct absolute position fallback capped at dimensions
      return {
        x: Math.min(x, 800),
        y: Math.min(y, 600),
        rawX: x,
        rawY: y,
        vw: viewportWidth || 'Unknown',
        vh: viewportHeight || 'Unknown'
      };
    }
    return {
      x: (x / viewportWidth) * 800,
      y: (y / viewportHeight) * 600,
      rawX: x,
      rawY: y,
      vw: viewportWidth,
      vh: viewportHeight
    };
  };

  const gridCells = getGridCells();
  const maxGridCount = gridCells.length > 0 ? Math.max(...gridCells.map(c => c.count)) : 1;

  return (
    <div style={styles.container}>
      {/* Configuration Header Panel */}
      <div style={styles.controlsBar}>
        <div style={styles.controlGroup}>
          <label style={styles.label}>Tracked Page URL:</label>
          <select 
            value={selectedPage} 
            onChange={(e) => setSelectedPage(e.target.value)}
            style={styles.select}
            disabled={loadingPages || pages.length === 0}
          >
            {pages.length === 0 ? (
              <option>No pages tracked yet</option>
            ) : (
              pages.map(url => (
                <option key={url} value={url}>{url}</option>
              ))
            )}
          </select>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>Visualization Mode:</label>
          <div style={styles.toggleContainer}>
            <button 
              onClick={() => setMapMode('dots')}
              style={{
                ...styles.toggleBtn,
                ...(mapMode === 'dots' ? styles.activeToggle : {})
              }}
            >
              Individual Clicks
            </button>
            <button 
              onClick={() => setMapMode('grid')}
              style={{
                ...styles.toggleBtn,
                ...(mapMode === 'grid' ? styles.activeToggle : {})
              }}
            >
              Density Grid
            </button>
          </div>
        </div>

        <button 
          onClick={() => fetchClicks(selectedPage)}
          style={styles.refreshBtn}
          disabled={!selectedPage || loadingClicks}
        >
          {loadingClicks ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={styles.workspace}>
        {/* Statistics panel */}
        <div style={styles.statsCard}>
          <h4 style={styles.statsTitle}>Heatmap Stats</h4>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Total clicks:</span>
            <span style={styles.statVal}>{clicks.length}</span>
          </div>
          {mapMode === 'grid' && (
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Highest density cell:</span>
              <span style={styles.statVal}>{maxGridCount} clicks</span>
            </div>
          )}
          {hoveredClick && (
            <div style={styles.hoverDetail}>
              <h5 style={styles.hoverTitle}>Selected Point</h5>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Scaled Coords:</span>
                <span style={styles.statVal}>X: {Math.round(hoveredClick.x)}px, Y: {Math.round(hoveredClick.y)}px</span>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Original Coords:</span>
                <span style={styles.statVal}>X: {hoveredClick.rawX}px, Y: {hoveredClick.rawY}px</span>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Original Viewport:</span>
                <span style={styles.statVal}>{hoveredClick.vw} &times; {hoveredClick.vh}</span>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Timestamp:</span>
                <span style={{...styles.statVal, fontSize: '0.7rem'}}>{new Date(hoveredClick.time).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* 800x600 Canvas Area */}
        <div style={styles.canvasWrapper}>
          <div style={styles.canvasTitle}>
            Normalized Viewport (800 &times; 600 virtual resolution)
          </div>
          
          <div style={styles.canvasContainer}>
            {loadingClicks ? (
              <div style={styles.canvasOverlay}>Loading Click Data...</div>
            ) : clicks.length === 0 ? (
              <div style={styles.canvasOverlay}>No click coordinates recorded for this URL</div>
            ) : (
              <>
                {/* Dots Map Mode */}
                {mapMode === 'dots' && clicks.map((click, index) => {
                  const pos = getScaledCoordinates(click);
                  return (
                    <div
                      key={click._id || index}
                      onMouseEnter={() => setHoveredClick({
                        x: pos.x,
                        y: pos.y,
                        rawX: pos.rawX,
                        rawY: pos.rawY,
                        vw: pos.vw,
                        vh: pos.vh,
                        time: click.timestamp
                      })}
                      onMouseLeave={() => setHoveredClick(null)}
                      style={{
                        ...styles.clickDot,
                        left: `${pos.x}px`,
                        top: `${pos.y}px`
                      }}
                    />
                  );
                })}

                {/* Density Grid Mode */}
                {mapMode === 'grid' && gridCells.map((cell) => {
                  const intensity = cell.count / maxGridCount;
                  return (
                    <div
                      key={cell.index}
                      style={{
                        ...styles.gridCell,
                        left: `${cell.x}px`,
                        top: `${cell.y}px`,
                        backgroundColor: `rgba(239, 68, 68, ${intensity * 0.7 + 0.1})`, // opacity based on clicks
                        border: `1px solid rgba(239, 68, 68, ${intensity * 0.3})`
                      }}
                      title={`${cell.count} clicks in this zone`}
                    >
                      <span style={styles.gridCount}>{cell.count}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    height: '100%',
    overflow: 'hidden'
  },
  controlsBar: {
    backgroundColor: '#0c0c0e',
    borderBottom: '1px solid var(--border-primary)',
    padding: '16px 24px',
    display: 'flex',
    gap: '24px',
    alignItems: 'center'
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: '600',
    letterSpacing: '0.05em'
  },
  select: {
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.85rem',
    width: '260px',
    outline: 'none'
  },
  toggleContainer: {
    display: 'flex',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    padding: '2px'
  },
  toggleBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeToggle: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)'
  },
  refreshBtn: {
    backgroundColor: 'var(--text-primary)',
    color: 'var(--bg-app)',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    transition: 'opacity 0.2s'
  },
  workspace: {
    flex: 1,
    padding: '32px',
    display: 'flex',
    gap: '32px',
    overflowY: 'auto',
    backgroundColor: 'var(--bg-app)'
  },
  statsCard: {
    width: '240px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    padding: '16px',
    alignSelf: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  statsTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-primary)',
    paddingBottom: '8px',
    marginBottom: '4px'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    alignItems: 'center'
  },
  statLabel: {
    color: 'var(--text-secondary)'
  },
  statVal: {
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  hoverDetail: {
    borderTop: '1px solid var(--border-primary)',
    paddingTop: '12px',
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  hoverTitle: {
    fontSize: '0.75rem',
    color: 'var(--accent-blue)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.05em'
  },
  canvasWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  canvasTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontFamily: 'monospace'
  },
  canvasContainer: {
    width: '800px',
    height: '600px',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    position: 'relative',
    backgroundColor: '#0c0c0e',
    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.5)',
    backgroundImage: 'radial-gradient(var(--border-primary) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    overflow: 'hidden'
  },
  canvasOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    backgroundColor: 'rgba(9, 9, 11, 0.8)',
    zIndex: 10
  },
  clickDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    border: '1px solid #ffffff',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 6px 1px #ef4444',
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
    zIndex: 5,
    ':hover': {
      transform: 'translate(-50%, -50%) scale(1.5)',
      zIndex: 6
    }
  },
  gridCell: {
    width: '40px',
    height: '40px',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    transition: 'background-color 0.2s'
  },
  gridCount: {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700'
  }
};

export default HeatmapView;
