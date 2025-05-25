# Presentation Scoring Tool

A real-time web-based application for evaluating presentations with customizable criteria. Users can score presentations on Clarity, Delivery, and Confidence metrics, provide anonymous feedback, and see live-updating average scores. The application uses MQTT for real-time data synchronization with other applications.

## Features

- Customizable scoring criteria (Clarity, Delivery, Confidence)
- Sliders for 1–10 scoring
- Optional anonymous feedback
- Live-updating bar chart of average scores
- All feedback displayed below the chart
- Real-time data synchronization via MQTT
- Student ID and name input
- Duplicate submission prevention by Student ID
- Comprehensive scoring summary

## Setup & Execution

1. Download or clone this repository.
2. Open a terminal and navigate to the project directory.
3. Install dependencies:
   ```powershell
   npm init -y
   npm install mqtt
   ```
4. Configure your MQTT broker URL in `data-manager.js` (default: `ws://localhost:9001`)
5. Start a local server (Python 3 recommended):
   ```powershell
   python -m http.server 8000
   ```
6. Open your browser and go to [http://localhost:8000](http://localhost:8000)
7. Enter your Student ID and full name, then submit your scores. The chart and feedback update in real-time.

## Dependencies

- MQTT.js for real-time data synchronization
- Modern web browser with WebSocket support
- MQTT broker (e.g., Mosquitto, HiveMQ, or any WebSocket-enabled MQTT broker)

## MQTT Integration

### Topics

- `presentation/scores` - Individual score submissions
- `presentation/summary` - Aggregated scoring data

### Data Format

#### Individual Score Submission

```json
{
  "studentId": 12345,
  "studentName": "John Smith",
  "timestamp": "2025-05-24T10:30:00.000Z",
  "clarity": 8,
  "delivery": 7,
  "confidence": 9,
  "feedback": "Great presentation! Clear and well-structured."
}
```

#### Summary Data

```json
{
  "submittedCount": 5,
  "averages": {
    "clarity": 7.8,
    "delivery": 8.2,
    "confidence": 7.5
  },
  "submissions": [
    // Array of individual submissions with student IDs and names
  ]
}
```

## Example Inputs & Outputs

- **Input:**
  - Student ID: 12345
  - Full Name: John Smith
  - Clarity: 8
  - Delivery: 7
  - Confidence: 9
  - Feedback: "Great job!"
- **Output:**
  - The bar chart updates to show the new averages for each criterion
  - The feedback appears in the feedback section below the chart
  - MQTT messages are published with both the individual submission and updated summary data
  - Other connected applications receive real-time updates
  - Duplicate submissions with the same Student ID are prevented

## Data Persistence

The application maintains the following data:

- Individual student submissions (prevents duplicates)
- Running averages for each scoring criterion
- Complete submission history with timestamps
- Total student count and submission count

## File Overview

- `index.html` — Main HTML structure and form components
- `style.css` — Modern, responsive styling
- `script.js` — UI interaction and chart rendering
- `data-manager.js` — MQTT integration and data management
- `README.md` — Project documentation (this file)

## Technical Implementation

- Real-time data synchronization using MQTT over WebSocket
- Manual student ID and name entry with validation
- Canvas-based bar chart visualization
- Form validation and duplicate submission prevention by Student ID
- Modular code structure with separate data management
- Responsive design with mobile support

## Integration Guide

1. Connect to the MQTT broker using WebSocket protocol
2. Subscribe to `presentation/scores` and `presentation/summary` topics
3. Parse incoming JSON messages for individual scores or summary data
4. Use the data format specified above for publishing messages
5. Handle connection errors and message parsing gracefully

## Recommended MQTT Broker Setup

1. Enable WebSocket support (default port 9001)
2. Configure CORS if needed for web browser access
3. Set up appropriate security measures for production use

For any questions or issues, please contact Jackson Jacobson.
