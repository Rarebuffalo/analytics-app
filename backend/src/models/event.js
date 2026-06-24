import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    trim: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: ['page_view', 'click'],
  },
  pageUrl: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  coordinates: {
    x: { type: Number },
    y: { type: Number },
    viewportWidth: { type: Number },
    viewportHeight: { type: Number }
  }
});

// Configure indexes for fast aggregation, filtering, and sorted journey queries
eventSchema.index({ sessionId: 1 });
eventSchema.index({ pageUrl: 1 });
eventSchema.index({ timestamp: -1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
