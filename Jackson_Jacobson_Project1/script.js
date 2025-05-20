const form = document.getElementById("scoreForm");
const chartCanvas = document.getElementById("chart");
const feedbackList = document.getElementById("feedbackList");

// --- DOM Elements ---
const claritySlider = document.querySelector('input[name="Clarity"]');
const deliverySlider = document.querySelector('input[name="Delivery"]');
const confidenceSlider = document.querySelector('input[name="Confidence"]');
const clarityValue = document.getElementById('clarity-value');
const deliveryValue = document.getElementById('delivery-value');
const confidenceValue = document.getElementById('confidence-value');

let scores = {
  Clarity: [],
  Delivery: [],
  Confidence: []
};
let feedbacks = [];

// Update slider value display with stars
claritySlider.addEventListener('input', () => clarityValue.textContent = `${claritySlider.value} ⭐`);
deliverySlider.addEventListener('input', () => deliveryValue.textContent = `${deliverySlider.value} ⭐`);
confidenceSlider.addEventListener('input', () => confidenceValue.textContent = `${confidenceSlider.value} ⭐`);

// On form reset, reset the values
form.addEventListener("reset", function() {
  clarityValue.textContent = `${claritySlider.value} ⭐`;
  deliveryValue.textContent = `${deliverySlider.value} ⭐`;
  confidenceValue.textContent = `${confidenceSlider.value} ⭐`;
});

// Visual feedback on submit
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(form);
  const clarity = parseInt(formData.get("Clarity"));
  const delivery = parseInt(formData.get("Delivery"));
  const confidence = parseInt(formData.get("Confidence"));
  const feedback = formData.get("feedback").trim();

  scores.Clarity.push(clarity);
  scores.Delivery.push(delivery);
  scores.Confidence.push(confidence);

  if (feedback) feedbacks.push(feedback);

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

function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b) / arr.length;
}

function drawChart() {
  const ctx = chartCanvas.getContext("2d");
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

  const data = [
    average(scores.Clarity),
    average(scores.Delivery),
    average(scores.Confidence)
  ];
  const labels = ["Clarity", "Delivery", "Confidence"];
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
    ctx.fillStyle = color;
    ctx.fillRect(x, chartHeight - height - 20, barWidth, height);
    ctx.fillStyle = "#222";
    ctx.textAlign = "center";
    ctx.font = "15px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(score.toFixed(1), x + barWidth / 2, chartHeight - height - 30);
    ctx.font = "13px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(labels[index], x + barWidth / 2, chartHeight - 5);
  });
}

function displayFeedbacks() {
  feedbackList.innerHTML = "<h3>Anonymous Feedback</h3>";
  feedbacks.forEach((fb, i) => {
    const div = document.createElement("div");
    div.className = "feedback-card";
    div.textContent = fb;
    feedbackList.appendChild(div);
  });
}
