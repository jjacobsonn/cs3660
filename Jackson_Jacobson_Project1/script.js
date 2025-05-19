// Initialize vote counts from localStorage or set to zero
const defaultVoteCounts = {
  "Dynamic Programming": 0,
  "Pointers and Memory Management": 0,
  "API Integration": 0,
  "Concurrency / Multithreading": 0,
  "Time vs. Space Trade-offs": 0
};

// Load from localStorage if available, otherwise use default
let voteCounts = {};
const storedVotes = JSON.parse(localStorage.getItem("votes") || "null");
if (storedVotes) {
  // Cleanup: remove any keys that don't match current options
  Object.keys(storedVotes).forEach(key => {
    if (defaultVoteCounts.hasOwnProperty(key)) {
      voteCounts[key] = storedVotes[key];
    }
  });
  // Add any missing keys
  Object.keys(defaultVoteCounts).forEach(key => {
    if (!voteCounts.hasOwnProperty(key)) {
      voteCounts[key] = 0;
    }
  });
} else {
  voteCounts = { ...defaultVoteCounts };
  localStorage.setItem("votes", JSON.stringify(voteCounts));
}

const pollForm = document.getElementById("pollForm");
const resultsDiv = document.getElementById("results");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const pieChartBtn = document.getElementById("pieChartBtn");
const barGraphBtn = document.getElementById("barGraphBtn");
const pieChartCanvas = document.getElementById("pieChart");
const barGraphCanvas = document.getElementById("barGraph");
let chartContext = pieChartCanvas.getContext("2d");
let barContext = barGraphCanvas.getContext("2d");

// Function to enable smooth transitions
function fadeIn(element) {
  element.style.opacity = 0;
  element.style.display = 'block';
  setTimeout(() => {
    element.style.transition = 'opacity 0.5s ease-in-out';
    element.style.opacity = 1;
  }, 10);
}

// Handle vote submission
pollForm.addEventListener("submit", function (event) {
  event.preventDefault();
  
  const selectedOption = document.querySelector('input[name="option"]:checked');
  if (!selectedOption) {
    alert("Please select an option before voting.");
    return;
  }

  const vote = selectedOption.value;
  voteCounts[vote]++;
  
  try {
    localStorage.setItem("votes", JSON.stringify(voteCounts));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
  
  // Disable voting with smooth transition
  submitBtn.style.transition = 'opacity 0.3s ease-in-out';
  submitBtn.style.opacity = 0.5;
  submitBtn.disabled = true;
  
  Array.from(document.getElementsByName("option")).forEach(input => {
    input.disabled = true;
    input.parentElement.style.opacity = 0.7;
  });

  displayResults();
  fadeIn(resetBtn);
});

// Allow voting again
resetBtn.addEventListener("click", () => {
  // Enable form with smooth transition
  submitBtn.style.opacity = 1;
  submitBtn.disabled = false;
  
  Array.from(document.getElementsByName("option")).forEach(input => {
    input.disabled = false;
    input.checked = false;
    input.parentElement.style.opacity = 1;
  });

  resetBtn.style.display = 'none';
  
  // Smoothly update the display
  displayResults();
});

// Clear all votes
clearAllBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to reset all votes? This cannot be undone.")) {
    // Reset all vote counts
    Object.keys(voteCounts).forEach(key => {
      voteCounts[key] = 0;
    });
    
    // Clear localStorage
    localStorage.removeItem("votes");
    localStorage.setItem("votes", JSON.stringify(voteCounts));
    
    // Enable form
    submitBtn.style.opacity = 1;
    submitBtn.disabled = false;
    
    Array.from(document.getElementsByName("option")).forEach(input => {
      input.disabled = false;
      input.checked = false;
      input.parentElement.style.opacity = 1;
    });
    
    // Hide reset vote button
    resetBtn.style.display = "none";
    
    // Update display
    displayResults();
    
    // Show confirmation
    alert("All votes have been reset!");
  }
});

// Display results and draw pie chart
function displayResults() {
  let output = "<h2>📈 Live Results:</h2><ul>";
  const total = Object.values(voteCounts).reduce((a, b) => a + b, 0);
  
  for (const option in voteCounts) {
    const percentage = total > 0 ? ((voteCounts[option] / total) * 100).toFixed(1) : 0;
    output += `<li>${option}: ${voteCounts[option]} vote${voteCounts[option] !== 1 ? 's' : ''} (${percentage}%)</li>`;
  }
  output += "</ul>";
  
  // Smooth transition for results
  resultsDiv.style.opacity = 0;
  resultsDiv.innerHTML = output;
  fadeIn(resultsDiv);
  
  // Update the correct chart
  if (pieChartCanvas.style.display !== "none") {
    drawPieChart();
  } else {
    drawBarGraph();
  }
}

function updateLegend() {
  const data = Object.values(voteCounts);
  const labels = Object.keys(voteCounts);
  const total = data.reduce((a, b) => a + b, 0);
  const colors = [
    "#4299e1", // Blue for Dynamic Programming
    "#48bb78", // Green for Pointers
    "#ecc94b", // Yellow for API
    "#9f7aea", // Purple for Concurrency
    "#ed64a6"  // Pink for Time/Space
  ];
  const legendContainer = document.querySelector('.legend-container');
  let legendHTML = '<table class="legend-table">';
  labels.forEach((label, index) => {
    const percentage = total > 0 ? ((data[index] / total) * 100).toFixed(1) : 0;
    const votes = data[index];
    legendHTML += `
      <tr>
        <td>
          <span class="legend-dot" style="background-color: ${colors[index]}"></span>
          ${label}
        </td>
        <td>${votes} vote${votes !== 1 ? 's' : ''} (${percentage}%)</td>
      </tr>
    `;
  });
  legendHTML += '</table>';
  legendContainer.innerHTML = legendHTML;
}

// Draw pie chart using canvas
function drawPieChart() {
  const data = Object.values(voteCounts);
  const labels = Object.keys(voteCounts);
  const total = data.reduce((a, b) => a + b, 0);
  const colors = [
    "#4299e1", // Blue for Dynamic Programming
    "#48bb78", // Green for Pointers
    "#ecc94b", // Yellow for API
    "#9f7aea", // Purple for Concurrency
    "#ed64a6"  // Pink for Time/Space
  ];
  
  // Clear canvas
  chartContext.clearRect(0, 0, pieChartCanvas.width, pieChartCanvas.height);
  
  if (total === 0) {
    // Draw "No votes yet" message
    chartContext.font = "20px 'Segoe UI'";
    chartContext.fillStyle = "#718096";
    chartContext.textAlign = "center";
    chartContext.fillText("No votes yet", pieChartCanvas.width / 2, pieChartCanvas.height / 2);
    document.querySelector('.legend-container').innerHTML = '';
    return;
  }

  let startAngle = -0.5 * Math.PI; // Start at top
  
  // Draw the pie slices
  data.forEach((count, index) => {
    const sliceAngle = (count / total) * 2 * Math.PI;
    
    // Draw slice
    chartContext.beginPath();
    chartContext.fillStyle = colors[index];
    chartContext.moveTo(200, 150);
    chartContext.arc(200, 150, 120, startAngle, startAngle + sliceAngle);
    chartContext.closePath();
    chartContext.fill();
    
    // Add white border
    chartContext.strokeStyle = '#ffffff';
    chartContext.lineWidth = 2;
    chartContext.stroke();

    // Draw percentage label in the middle of the slice
    if (count > 0) {
      const midAngle = startAngle + sliceAngle / 2;
      const labelX = 200 + Math.cos(midAngle) * 80;
      const labelY = 150 + Math.sin(midAngle) * 80;
      chartContext.font = "16px 'Segoe UI', Arial, sans-serif";
      chartContext.fillStyle = "#222";
      chartContext.textAlign = "center";
      chartContext.textBaseline = "middle";
      const percent = ((count / total) * 100).toFixed(1) + "%";
      chartContext.fillText(percent, labelX, labelY);
    }
    
    startAngle += sliceAngle;
  });

  updateLegend();
}

// Toggle between Pie Chart and Bar Graph
pieChartBtn.addEventListener("click", () => {
  pieChartCanvas.style.display = "block";
  barGraphCanvas.style.display = "none";
  pieChartBtn.classList.add("active");
  barGraphBtn.classList.remove("active");
  drawPieChart();
});

barGraphBtn.addEventListener("click", () => {
  pieChartCanvas.style.display = "none";
  barGraphCanvas.style.display = "block";
  barGraphBtn.classList.add("active");
  pieChartBtn.classList.remove("active");
  drawBarGraph();
});

// Draw bar graph using canvas
function drawBarGraph() {
  const data = Object.values(voteCounts);
  const labels = Object.keys(voteCounts);
  const total = data.reduce((a, b) => a + b, 0);
  const colors = [
    "#4299e1", // Blue for Dynamic Programming
    "#48bb78", // Green for Pointers
    "#ecc94b", // Yellow for API
    "#9f7aea", // Purple for Concurrency
    "#ed64a6"  // Pink for Time/Space
  ];

  // Clear canvas
  barContext.clearRect(0, 0, barGraphCanvas.width, barGraphCanvas.height);

  if (total === 0) {
    // Draw "No votes yet" message
    barContext.font = "20px 'Segoe UI'";
    barContext.fillStyle = "#718096";
    barContext.textAlign = "center";
    barContext.fillText("No votes yet", barGraphCanvas.width / 2, barGraphCanvas.height / 2);
    document.querySelector('.legend-container').innerHTML = '';
    return;
  }

  // Chart dimensions
  const padding = 40;
  const chartWidth = barGraphCanvas.width - 2 * padding;
  const chartHeight = barGraphCanvas.height - 2 * padding - 40; // leave space for labels
  const barCount = data.length;
  const barWidth = Math.min(50, chartWidth / (barCount * 1.5));
  const barSpacing = (chartWidth - barWidth * barCount) / (barCount - 1);
  const startX = padding;
  const baseY = barGraphCanvas.height - padding - 20;

  // Find max value for scaling
  const maxValue = Math.max(...data, 1);

  data.forEach((count, index) => {
    const barHeight = (count / maxValue) * chartHeight;
    const x = startX + index * (barWidth + barSpacing);
    const y = baseY - barHeight;

    // Draw bar
    barContext.fillStyle = colors[index];
    barContext.fillRect(x, y, barWidth, barHeight);

    // Draw value above bar
    barContext.fillStyle = "#222";
    barContext.font = "14px 'Segoe UI', system-ui, -apple-system, sans-serif";
    barContext.textAlign = "center";
    barContext.fillText(count, x + barWidth / 2, y - 6);
    // No x-axis label drawn
  });

  updateLegend();
}

// Initialize display
displayResults();
