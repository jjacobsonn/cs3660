# Classroom Polling App

A simple web-based polling application that allows users to vote on which programming concepts they struggle with most. Results are displayed live as both a pie chart and a bar graph, with a legend/table for clarity.

## Features
- Dynamic voting options
- Live results with percentage and vote counts
- Toggle between Pie Chart and Bar Graph visualizations
- Persistent vote storage using browser localStorage
- Responsive, modern UI

## How to Run
1. Open a terminal and navigate to the project directory.
2. Start a local server with:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and go to [http://localhost:8000](http://localhost:8000)

## Code Comments
- The code is commented throughout, explaining the purpose of each function and important logic blocks.
- Key sections include vote handling, chart drawing, and UI updates.

## Setup & Execution
- No installation is required beyond Python 3 (for the local server).
- All code runs client-side in the browser.
- No external JavaScript libraries are used; all charting is done with the HTML5 Canvas API.

## Dependencies
- No external dependencies or libraries are required.
- The project uses only standard HTML, CSS, and JavaScript.

## Example Inputs & Outputs
- **Input:** User selects "API Integration" and clicks "Submit Vote".
- **Output:**
  - The vote count for "API Integration" increases by 1.
  - The pie chart and bar graph update to reflect the new vote distribution.
  - The legend/table below the charts updates with the new counts and percentages.

## File Overview
- `index.html` — Main HTML structure for the poll and charts.
- `style.css` — Styling for the poll, charts, and layout.
- `script.js` — Handles voting logic, chart drawing, and UI updates.
- `README.md` — Project documentation (this file).

---

For any questions or issues, please contact Jackson Jacobson.
