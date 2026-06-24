# User Analytics Application

This is a full-stack user analytics application that tracks user interactions (page views and clicks) on a website and displays them in a dashboard containing a session timeline and a click density heatmap.

## Architecture

The project is split into four directories:
- tracker: Contains the client-side JavaScript tracking script.
- backend: Contains the Node.js and Express API, which uses MongoDB for storage.
- frontend: Contains the React and Vite dashboard application.
- demo: Contains a simple HTML page to load the tracker script and test click interactions.

## Technology Stack

- Tracker: Native JavaScript (no external libraries or dependencies).
- Backend: Node.js, Express, Mongoose.
- Database: MongoDB.
- Frontend: React, Vite, Vanilla CSS.
- Containerization: Docker and Docker Compose.

## Setup and Run Instructions

You can run the application either using Docker Compose or by starting the services locally.

### Running with Docker Compose

1. Clone or navigate to the project root:
   ```bash
   cd analytics-app
   ```
2. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```
3. Open the services in your browser:
   - Dashboard: http://localhost:5173
   - Backend API: http://localhost:5000
   - Demo sandbox page: Open the local file `demo/index.html` in your browser.

### Running Locally

Ensure you have Node.js and a local MongoDB instance running at mongodb://localhost:27017.

#### 1. Start Backend API
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The backend API will run on http://localhost:5000.

#### 2. Start Frontend Dashboard
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The dashboard UI will run on http://localhost:5173.

#### 3. Test with the Demo Page
- Open `demo/index.html` in your web browser.
- Click different sections of the page, buttons, and links to generate tracking events.
- Navigate to the dashboard at http://localhost:5173 to view the logged sessions, their timelines, and the click heatmap.

## API Documentation

### POST /api/events
Stores a new event.
Payload format:
```json
{
  "sessionId": "4955b255-a130-4e50-bd12-70b92df860cc",
  "eventType": "click",
  "pageUrl": "http://localhost:5000/demo/index.html",
  "timestamp": "2026-06-24T01:40:00.000Z",
  "coordinates": {
    "x": 350,
    "y": 420,
    "viewportWidth": 1440,
    "viewportHeight": 900
  }
}
```

### GET /api/sessions
Returns a list of all unique sessions with event counts and their last active timestamps.

### GET /api/sessions/:id
Returns a chronological list of events for the specified session ID.

### GET /api/pages
Returns an array of all unique page URLs tracked.

### GET /api/heatmap?pageUrl=<url>
Returns click coordinates and viewport dimensions for click events on the specified URL.

## Assumptions and Technical Trade-offs

1. Viewport-Relative Scaling for Heatmaps
A click at specific coordinates (e.g. x: 300) represents a different layout element on a mobile screen compared to a desktop viewport. To handle this without loading the page inside an iframe (which has cross-origin security issues and layout issues), the tracking script logs client coordinates alongside the viewport dimensions (innerWidth and innerHeight). The frontend then scales these coordinates onto a fixed 800x600 canvas container:
scaledX = (x / viewportWidth) * 800
scaledY = (y / viewportHeight) * 600
This normalizes click indicators so they scale uniformly regardless of what screen resolution was used to click the elements.

2. Zero-Dependency Tracker Script
The client-side tracker.js script does not load any external libraries:
- Session IDs are generated using browser-native crypto.randomUUID() with a custom fallback for older environments.
- Clicks and page views are sent via fetch with keepalive: true, ensuring requests complete even if the browser window is closed or navigating away.
- Events are buffered in localStorage when offline or if the backend API is unreachable, and automatically retried when connection is restored.

3. Input Validation
To protect the database and ensure query consistency, the POST /api/events endpoint strictly validates payloads. It validates that sessionId matches a standard UUID v4 format, eventType is either page_view or click, and coordinates are numerical with valid viewport dimensions.

4. UI Design
The UI dashboard uses a clean, high-contrast, dark theme layout modeled after standard SaaS dashboards (like Linear or Vercel) instead of complex gaming UI details. Thin gray borders, grid layouts, and custom-styled scrollbars make the data dashboard clean and readable.
