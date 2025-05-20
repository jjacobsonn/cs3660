// --- Presentation Scoring Tool ---
// Handles form submission, slider UI, chart drawing, and feedback display.

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

// --- Data Storage ---
// Each criterion stores an array of submitted scores
let scores = {
  Clarity: [],
  Delivery: [],
  Confidence: []
};
// Stores all submitted feedback strings
let feedbacks = [];

// --- Slider Value Display ---
// Show live value with a star next to each slider
claritySlider.addEventListener('input', () => clarityValue.textContent = `${claritySlider.value} ⭐`);
deliverySlider.addEventListener('input', () => deliveryValue.textContent = `${deliverySlider.value} ⭐`);
confidenceSlider.addEventListener('input', () => confidenceValue.textContent = `${confidenceSlider.value} ⭐`);

// Reset slider values on form reset
form.addEventListener("reset", function() {
  clarityValue.textContent = `${claritySlider.value} ⭐`;
  deliveryValue.textContent = `${deliverySlider.value} ⭐`;
  confidenceValue.textContent = `${confidenceSlider.value} ⭐`;
});

// --- Form Submission ---
// Handles collecting scores, feedback, updating chart, and showing success message
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(form);
  const clarity = parseInt(formData.get("Clarity"));
  const delivery = parseInt(formData.get("Delivery"));
  const confidence = parseInt(formData.get("Confidence"));
  const feedback = formData.get("feedback").trim();

  // Store scores
  scores.Clarity.push(clarity);
  scores.Delivery.push(delivery);
  scores.Confidence.push(confidence);

  // Store feedback if provided
  if (feedback) feedbacks.push(feedback);

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
});

// --- Utility: Calculate Average ---
function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b) / arr.length;
}

// --- Draw Bar Chart ---
// Draws a color-coded, centered bar chart of average scores for each criterion
function drawChart() {
  const ctx = chartCanvas.getContext("2d");
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

  const data = [
    average(scores.Clarity),
    average(scores.Delivery),
    average(scores.Confidence)
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
  feedbacks.forEach((fb, i) => {
    const div = document.createElement("div");
    div.className = "feedback-card";
    div.textContent = fb;
    feedbackList.appendChild(div);
  });
}

// --- Initial Render ---
drawChart();
displayFeedbacks();
