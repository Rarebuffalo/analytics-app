import express from 'express';
import Event from '../models/event.js';

const router = express.Router();

// Helper to validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/events
 * Record a new analytics event
 */
router.post('/events', async (req, res) => {
  try {
    const { sessionId, eventType, pageUrl, timestamp, coordinates } = req.body;

    // Strict validations
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required and must be a string' });
    }
    if (!uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId must be a valid UUID v4 string' });
    }

    if (!eventType || !['page_view', 'click'].includes(eventType)) {
      return res.status(400).json({ error: 'eventType must be either "page_view" or "click"' });
    }

    if (!pageUrl || typeof pageUrl !== 'string') {
      return res.status(400).json({ error: 'pageUrl is required and must be a string' });
    }

    // Basic URL validation
    try {
      new URL(pageUrl);
    } catch {
      return res.status(400).json({ error: 'pageUrl must be a valid URL string' });
    }

    let parsedTimestamp = new Date();
    if (timestamp) {
      parsedTimestamp = new Date(timestamp);
      if (isNaN(parsedTimestamp.getTime())) {
        return res.status(400).json({ error: 'timestamp must be a valid date' });
      }
    }

    const eventData = {
      sessionId,
      eventType,
      pageUrl,
      timestamp: parsedTimestamp
    };

    if (eventType === 'click') {
      if (
        !coordinates ||
        typeof coordinates.x !== 'number' ||
        typeof coordinates.y !== 'number' ||
        typeof coordinates.viewportWidth !== 'number' ||
        typeof coordinates.viewportHeight !== 'number'
      ) {
        return res.status(400).json({
          error: 'click event requires coordinates: { x, y, viewportWidth, viewportHeight }'
        });
      }
      eventData.coordinates = {
        x: coordinates.x,
        y: coordinates.y,
        viewportWidth: coordinates.viewportWidth,
        viewportHeight: coordinates.viewportHeight
      };
    }

    const newEvent = new Event(eventData);
    await newEvent.save();

    return res.status(201).json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error saving event:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/sessions
 * List all unique sessions with event count and last activity timestamp
 */
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          lastActive: { $max: '$timestamp' }
        }
      },
      {
        $sort: { lastActive: -1 }
      }
    ]);
    return res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/sessions/:id
 * Retrieve all events for a specific session ID, chronologically
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid session ID format' });
    }

    const events = await Event.find({ sessionId: id }).sort({ timestamp: 1 });
    return res.json(events);
  } catch (error) {
    console.error('Error fetching session events:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/pages
 * Retrieve list of all unique page URLs tracked
 */
router.get('/pages', async (req, res) => {
  try {
    const pages = await Event.distinct('pageUrl');
    return res.json(pages.sort());
  } catch (error) {
    console.error('Error fetching unique pages:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/heatmap
 * Fetch click coordinates and viewport dimensions for a specific page URL
 */
router.get('/heatmap', async (req, res) => {
  try {
    const { pageUrl } = req.query;
    if (!pageUrl) {
      return res.status(400).json({ error: 'pageUrl query parameter is required' });
    }

    const clicks = await Event.find({ pageUrl, eventType: 'click' })
      .select('coordinates timestamp')
      .sort({ timestamp: 1 });

    return res.json(clicks);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
