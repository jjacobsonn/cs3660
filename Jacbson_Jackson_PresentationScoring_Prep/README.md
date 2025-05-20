# Presentation Scoring Tool

A simple web-based app for evaluating presentations using customizable criteria. Users can score Clarity, Delivery, and Confidence, leave anonymous feedback, and see live average scores and all feedback. No backend or external libraries required.

## Features
- Customizable scoring criteria (Clarity, Delivery, Confidence)
- Sliders for 1–10 scoring
- Optional anonymous feedback
- Live-updating bar chart of average scores
- All feedback displayed below the chart
- Data stored in-memory (page refresh clears data)

## Setup & Execution
1. Download or clone this repository.
2. Open a terminal and navigate to the project directory.
3. Start a local server (Python 3 recommended):
   ```bash
   python3 -m http.server 8000
   ```
4. Open your browser and go to [http://localhost:8000](http://localhost:8000)
5. Use the form to submit scores and feedback. The chart and feedback list update live.

## Dependencies
- No external dependencies or libraries are used.
- The project uses only standard HTML, CSS, and JavaScript.

## Example Inputs & Outputs
- **Input:**
  - Clarity: 8
  - Delivery: 7
  - Confidence: 9
  - Feedback: "Great job!"
- **Output:**
  - The bar chart updates to show the new averages for each criterion.
  - The feedback "Great job!" appears in the feedback section below the chart.

## File Overview
- `index.html` — Main HTML structure for the form, chart, and feedback.
- `style.css` — Styling for the form, chart, and layout.
- `script.js` — Handles form logic, chart drawing, and feedback display.
- `README.md` — Project documentation (this file).

## Assets
The project includes an `assets` directory containing:
- **docs/**
  - `Preliminary Design.png` - Visual representation of the initial system design
  - `Project 1 User Requirements Document - Jackson Jacobson.pdf` - Detailed user requirements specification
  - `Project 1 Tool Analysis - Jackson Jacobson.pdf` - Analysis of tools and technologies used in the project
- **images/** - Directory containing project-related images

---

For any questions or issues, please contact Jackson Jacobson.