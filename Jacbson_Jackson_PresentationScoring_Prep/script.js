// --- Presentation Scoring Tool ---
// Handles form submission, slider UI, chart drawing, and feedback display.

// --- Data Management ---
const scoringManager = new ScoringManager();

// --- DOM Elements ---
const form = document.getElementById("scoreForm");
const chartCanvas = document.getElementById("chart");
const feedbackList = document.getElementById("feedbackList");
const claritySlider = document.querySelector('input[name="Clarity"]');
const deliverySlider = document.querySelector('input[name="Delivery"]');
const confidenceSlider = document.querySelector('input[name="Confidence"]');
const clarityValue = document.getElementById('clarity-value');
const deliveryValue = document.getElementById('delivery-value');
const confidenceValue = document.getElementById('confidence-value');
const studentIdInput = document.getElementById('studentId');
const studentNameInput = document.getElementById('studentName');

// --- Slider Value Display ---
// Show live value with a star next to each slider
function updateSliderValue(slider, valueElement) {
    if (!slider || !valueElement) return;
    const currentValue = slider.value || '5';
    valueElement.textContent = `${currentValue} ⭐`;
}

// Define slider pairs
const sliderPairs = [
    { slider: claritySlider, valueElement: clarityValue },
    { slider: deliverySlider, valueElement: deliveryValue },
    { slider: confidenceSlider, valueElement: confidenceValue }
];

// Initialize slider values and attach event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Validate DOM elements
    sliderPairs.forEach(({ slider, valueElement }) => {
        if (!slider || !valueElement) return;
        
        // Add both input and change event listeners
        ['input', 'change'].forEach(eventType => {
            slider.addEventListener(eventType, () => {
                updateSliderValue(slider, valueElement);
            });
        });

        // Set initial value
        updateSliderValue(slider, valueElement);
    });
});

// Reset slider values on form reset
form.addEventListener("reset", function() {
  // Use requestAnimationFrame to ensure this runs after the form reset
  requestAnimationFrame(() => {
    // Reset all sliders to default value
    [
      { slider: claritySlider, value: clarityValue },
      { slider: deliverySlider, value: deliveryValue },
      { slider: confidenceSlider, value: confidenceValue }
    ].forEach(({ slider, value }) => {
      slider.value = 5;
      updateSliderValue(slider, value);
    });
  });
});

// --- Form Submission ---
// Handles collecting scores, feedback, updating chart, and showing success message
form.addEventListener("submit", function (e) {
  e.preventDefault();
    const formData = new FormData(form);
  const studentId = formData.get("studentId");
  const studentName = formData.get("studentName");
  
  if (!studentId || !studentName) {
    alert('Please enter both your Student ID and Name');
    return;
  }

  if (scoringManager.hasSubmitted(studentId)) {
    alert('A submission has already been recorded for this Student ID');
    return;
  }
  const scoreData = {
    studentId: parseInt(studentId),
    studentName: studentName,
    clarity: parseInt(formData.get("Clarity")),
    delivery: parseInt(formData.get("Delivery")),
    confidence: parseInt(formData.get("Confidence")),
    feedback: formData.get("feedback").trim(),
    isAnonymous: formData.get("isAnonymous") === "on"
  };

  const result = scoringManager.submitScore(studentId, scoreData);
  if (result.success) {
    // Reset form and update UI
    form.reset();
    drawChart();
    displayFeedbacks();
    // Show success message and disable form briefly
    document.getElementById('success-message').style.display = 'block';
    Array.from(form.elements).forEach(el => el.disabled = true);
    setTimeout(() => {
      document.getElementById('success-message').style.display = 'none';
      Array.from(form.elements).forEach(el => el.disabled = false);
    }, 2000);
  } else {
    alert(result.message);
  }

  // Show results after first submit
  const resultsSection = document.getElementById('results');
  resultsSection.style.display = 'block';
});

// --- Draw Bar Chart ---
// Draws a color-coded, centered bar chart of average scores for each criterion
function drawChart() {
  const ctx = chartCanvas.getContext("2d");
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

  const summary = scoringManager.getSummary();
  const data = [
    summary.averages.clarity,
    summary.averages.delivery,
    summary.averages.confidence
  ];
  const labels = ["Clarity", "Delivery", "Confidence"];
  // Distinct color for each bar
  const barColors = ["#3182ce", "#38a169", "#ed8936"];
  const maxScore = 10;
  const barWidth = 60;
  const spacing = 20;
  const chartHeight = chartCanvas.height;
  const numBars = data.length;
  const totalChartWidth = (numBars - 1) * spacing + numBars * barWidth;
  const startX = (chartCanvas.width - totalChartWidth) / 2;

  data.forEach((score, index) => {
    const color = barColors[index % barColors.length];
    const height = (score / maxScore) * (chartHeight - 40);
    const x = startX + index * (barWidth + spacing);
    // Draw bar
    ctx.fillStyle = color;
    ctx.fillRect(x, chartHeight - height - 20, barWidth, height);
    // Draw value above bar
    ctx.fillStyle = "#222";
    ctx.textAlign = "center";
    ctx.font = "15px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(score.toFixed(1), x + barWidth / 2, chartHeight - height - 30);
    // Draw label under bar
    ctx.font = "13px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(labels[index], x + barWidth / 2, chartHeight - 5);
  });
}

// --- Display Feedback ---
// Renders all feedback as centered cards below the chart
function displayFeedbacks() {
  feedbackList.innerHTML = "<h3>Anonymous Feedback</h3>";
  const summary = scoringManager.getSummary();
  summary.submissions.forEach(submission => {
    if (submission.feedback) {
      const div = document.createElement("div");
      div.className = "feedback-card";
      div.textContent = submission.feedback;
      feedbackList.appendChild(div);
    }
  });
}

// --- Initial Render ---
drawChart();
displayFeedbacks();
// Hide results section until first submit
const resultsSection = document.getElementById('results');
resultsSection.style.display = 'none';
