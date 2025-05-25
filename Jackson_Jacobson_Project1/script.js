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

// --- Student List and Submission Tracking ---
const students = [
  { id: 1, name: "Tyler Babbel" },
  { id: 2, name: "Caleb Beazel" },
  { id: 3, name: "Limhi Canton" },
  { id: 4, name: "Sean Davis" },
  { id: 5, name: "Tyler Driggs" },
  { id: 6, name: "Joshua Dutton" },
  { id: 7, name: "Charles Garrison" },
  { id: 8, name: "Asher Grey" },
  { id: 9, name: "Aria Hassanzadeh" },
  { id: 10, name: "Jackson Jacobson" },
  { id: 11, name: "Tiare Jorquera Munoz" },
  { id: 12, name: "Marlon Sebastian Osorio" },
  { id: 13, name: "Jordan Paxman" },
  { id: 14, name: "Tyler Perkins" },
  { id: 15, name: "Spencer Rohwer" },
  { id: 16, name: "Connor Scott" },
  { id: 17, name: "Matt Scott" },
  { id: 18, name: "Aaron Scroggins" },
  { id: 19, name: "Carissa Seidel" },
  { id: 20, name: "Jarek Smith" },
  { id: 21, name: "Jess Smith" },
  { id: 22, name: "Zachary Stout" },
  { id: 23, name: "MacKayla Whitehead" }
];
// Track submissions by student id
let submissions = {};
students.forEach(s => { submissions[s.id] = null; });

// --- MQTT Setup ---
const MQTT_BROKER = "wss://test.mosquitto.org:8081/mqtt"; // Example public broker
const MQTT_CLIENT_ID = "prescore-" + Math.random().toString(16).substr(2, 8);
const MQTT_TOPIC_SUBMIT = "presentation/score/submit";
const MQTT_TOPIC_SUMMARY = "presentation/score/summary";
let mqttClient = null;

function connectMQTT() {
  mqttClient = new Paho.MQTT.Client(MQTT_BROKER, MQTT_CLIENT_ID);
  mqttClient.onConnectionLost = function() { console.warn("MQTT connection lost"); };
  mqttClient.connect({
    onSuccess: () => { console.log("Connected to MQTT broker"); },
    useSSL: true
  });
}
connectMQTT();

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
  // --- New: Get student id ---
  const studentName = formData.get("studentName");
  const student = students.find(s => s.name === studentName);
  if (!student) {
    alert("Invalid student name. Please select your name from the list.");
    return;
  }
  if (submissions[student.id]) {
    alert("You have already submitted for this presentation.");
    return;
  }
  const clarity = parseInt(formData.get("Clarity"));
  const delivery = parseInt(formData.get("Delivery"));
  const confidence = parseInt(formData.get("Confidence"));
  const feedback = formData.get("feedback").trim();

  // Store scores
  scores.Clarity.push(clarity);
  scores.Delivery.push(delivery);
  scores.Confidence.push(confidence);
  if (feedback) feedbacks.push(feedback);
  submissions[student.id] = {
    id: student.id,
    name: student.name,
    Clarity: clarity,
    Delivery: delivery,
    Confidence: confidence,
    feedback: feedback
  };

  // --- MQTT: Send submission JSON ---
  const submissionObj = {
    id: student.id,
    name: student.name,
    Clarity: clarity,
    Delivery: delivery,
    Confidence: confidence,
    feedback: feedback,
    timestamp: new Date().toISOString()
  };
  if (mqttClient && mqttClient.isConnected()) {
    mqttClient.send(MQTT_TOPIC_SUBMIT, JSON.stringify(submissionObj));
  }

  // --- MQTT: Send summary JSON ---
  const summaryObj = {
    totalStudents: students.length,
    submitted: Object.values(submissions).filter(Boolean).map(s => ({ id: s.id, name: s.name })),
    notSubmitted: students.filter(s => !submissions[s.id]),
    average: {
      Clarity: average(scores.Clarity),
      Delivery: average(scores.Delivery),
      Confidence: average(scores.Confidence)
    },
    timestamp: new Date().toISOString()
  };
  if (mqttClient && mqttClient.isConnected()) {
    mqttClient.send(MQTT_TOPIC_SUMMARY, JSON.stringify(summaryObj));
  }

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

  // Show results after first submit
  const resultsSection = document.getElementById('results');
  resultsSection.style.display = 'block';
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
// Hide results section until first submit
const resultsSection = document.getElementById('results');
resultsSection.style.display = 'none';
