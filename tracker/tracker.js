(function () {
  const API_ENDPOINT = 'http://127.0.0.1:5000/api/events';

  // Retrieve or generate unique Session ID using native browser crypto
  function getSessionId() {
    let sessionId = localStorage.getItem('causalfunnel_session_id');
    if (!sessionId) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        sessionId = crypto.randomUUID();
      } else {
        // Fallback for environments lacking crypto.randomUUID support
        sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      localStorage.setItem('causalfunnel_session_id', sessionId);
    }
    return sessionId;
  }

  // Get pending events from local storage queue
  function getQueuedEvents() {
    try {
      return JSON.parse(localStorage.getItem('causalfunnel_pending_events') || '[]');
    } catch {
      return [];
    }
  }

  // Save pending events to local storage queue
  function saveQueuedEvents(events) {
    try {
      localStorage.setItem('causalfunnel_pending_events', JSON.stringify(events));
    } catch (err) {
      console.error('[Tracker] Failed to cache events offline:', err);
    }
  }

  // Make POST fetch request with keepalive option to guarantee execution
  async function sendPayload(payload) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: true
      });
      return response.ok;
    } catch (err) {
      console.warn('[Tracker] Analytics endpoint unreachable. Queued event locally.', err);
      return false;
    }
  }

  // Track event structure and orchestrate delivery
  async function trackEvent(eventType, extraData = {}) {
    const payload = {
      sessionId: getSessionId(),
      eventType,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
      ...extraData
    };

    const success = await sendPayload(payload);
    if (!success) {
      const queue = getQueuedEvents();
      queue.push(payload);
      saveQueuedEvents(queue);
    } else {
      // Trigger background processing of queued events
      flushQueue();
    }
  }

  // Flush queued events when network connectivity is established
  let isFlushing = false;
  async function flushQueue() {
    if (isFlushing) return;
    const queue = getQueuedEvents();
    if (queue.length === 0) return;

    isFlushing = true;
    const failedToDeliver = [];

    for (const payload of queue) {
      const success = await sendPayload(payload);
      if (!success) {
        failedToDeliver.push(payload);
      }
    }

    saveQueuedEvents(failedToDeliver);
    isFlushing = false;
  }

  // Record initial page_view on script execution/window load
  if (document.readyState === 'complete') {
    trackEvent('page_view');
    setTimeout(flushQueue, 1000);
  } else {
    window.addEventListener('load', () => {
      trackEvent('page_view');
      setTimeout(flushQueue, 1000);
    });
  }

  // Listen for global user click events
  document.addEventListener('click', (e) => {
    // Exclude clicks on UI/dashboard elements if script is embedded there by mistake
    if (e.target.closest('#analytics-dashboard-root')) return;

    const clickData = {
      coordinates: {
        x: e.clientX,
        y: e.clientY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }
    };
    trackEvent('click', clickData);
  });
})();
