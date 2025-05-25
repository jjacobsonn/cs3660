// --- Presentation Scoring Tool ---
// Handles form submission, slider UI, chart drawing, and feedback display.

// --- Student Data ---
const studentData = {
  "students": [
    {"id": 1,"name": "Tyler Babbel"},
    {"id": 2,"name": "Caleb Beazel"},
    {"id": 3,"name": "Limhi Canton"},
    {"id": 4,"name": "Sean Davis"},
    {"id": 5,"name": "Tyler Driggs"},
    {"id": 6,"name": "Joshua Dutton"},
    {"id": 7,"name": "Charles Garrison"},
    {"id": 8,"name": "Asher Grey"},
    {"id": 9,"name": "Aria Hassanzadeh"},
    {"id": 10,"name": "Jackson Jacobson"},
    {"id": 11,"name": "Tiare Jorquera Munoz"},
    {"id": 12,"name": "Marlon Sebastian Osorio"},
    {"id": 13,"name": "Jordan Paxman"},
    {"id": 14,"name": "Tyler Perkins"},
    {"id": 15,"name": "Spencer Rohwer"},
    {"id": 16,"name": "Connor Scott"},
    {"id": 17,"name": "Matt Scott"},
    {"id": 18,"name": "Aaron Scroggins"},
    {"id": 19,"name": "Carissa Seidel"},
    {"id": 20,"name": "Jarek Smith"},
    {"id": 21,"name": "Jess Smith"},
    {"id": 22,"name": "Zachary Stout"},
    {"id": 23,"name": "MacKayla Whitehead"}
  ]
};

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
const studentInput = document.getElementById('studentInput');
const studentName = document.getElementById('studentName');
const studentList = document.getElementById('studentList');
const anonymousToggle = document.getElementById('anonymousToggle');

// --- Data Storage ---
// Each criterion stores an array of submitted scores
let scores = {
  Clarity: [],
  Delivery: [],
  Confidence: []
};
// Stores all submitted feedback with metadata
let feedbacks = [];
// Stores all submission JSON objects
let submissions = [];

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

// --- Aggregate Function ---
function aggregateSubmissions() {
  if (submissions.length === 0) return null;
  let claritySum = 0, deliverySum = 0, confidenceSum = 0;
  let userIds = [];
  let comments = [];
  submissions.forEach(sub => {
    claritySum += sub.clarity;
    deliverySum += sub.delivery;
    confidenceSum += sub.confidence;
    userIds.push(sub.userId);
    if (sub.feedback) comments.push(sub.feedback);
  });
  return {
    average: {
      clarity: +(claritySum / submissions.length).toFixed(2),
      delivery: +(deliverySum / submissions.length).toFixed(2),
      confidence: +(confidenceSum / submissions.length).toFixed(2)
    },
    userIds,
    comments
  };
}

// --- Form Submission ---
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(form);
  const clarity = parseInt(formData.get("Clarity"));
  const delivery = parseInt(formData.get("Delivery"));
  const confidence = parseInt(formData.get("Confidence"));
  const feedback = formData.get("feedback").trim();
  const isAnonymous = formData.get("anonymous") === "on";
  
  // Get student info by ID
  const inputId = parseInt(document.getElementById('studentInput').value, 10);
  const student = studentData.students.find(s => s.id === inputId);

  if (!student) {
    alert("Please enter a valid student ID (1-23)");
    return;
  }

  // Store scores
  scores.Clarity.push(clarity);
  scores.Delivery.push(delivery);
  scores.Confidence.push(confidence);

  // Store feedback with metadata
  if (feedback) {
    feedbacks.push({
      text: feedback,
      studentId: student.id,
      studentName: isAnonymous ? "Anonymous" : student.name,
      timestamp: new Date().toISOString()
    });
  }

  // Create submission JSON object
  const submission = {
    userId: student.id,
    anonymous: isAnonymous,
    clarity,
    delivery,
    confidence,
    feedback
  };
  submissions.push(submission);

  // Log individual submission JSON
  console.log('Submission JSON:', JSON.stringify(submission, null, 2));

  // Aggregate and log
  const aggregate = aggregateSubmissions();
  console.log('Aggregate JSON:', JSON.stringify(aggregate, null, 2));

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

// --- Display Feedback ---
function displayFeedbacks() {
  feedbackList.innerHTML = "<h3>Feedback</h3>";
  feedbacks.forEach((fb) => {
    const div = document.createElement("div");
    div.className = "feedback-card";
    div.innerHTML = `
      <div class="feedback-text">${fb.text}</div>
      <div class="feedback-meta">From: ${fb.studentName}</div>
    `;
    feedbackList.appendChild(div);
  });
}

// --- Initialize ---
drawChart();
displayFeedbacks();
const resultsSection = document.getElementById('results');
resultsSection.style.display = 'none';
