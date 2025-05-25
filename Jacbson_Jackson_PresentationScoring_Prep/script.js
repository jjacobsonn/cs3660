/**
 * Presentation Scoring Tool
 * 
 * This script handles the client-side functionality of the presentation scoring application.
 * It manages form interactions, real-time slider updates, data visualization through charts,
 * and feedback display. The application uses MQTT for real-time data synchronization.
 */

// Initialize the scoring manager for handling data persistence and MQTT communication
const scoringManager = new ScoringManager();

// --- DOM Element References ---
// Cache DOM elements to avoid repeated queries and improve performance
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

/**
 * Updates the display value of a slider with a star emoji
 * This provides immediate visual feedback to users as they adjust scores
 * @param {HTMLInputElement} slider - The range input element
 * @param {HTMLElement} valueElement - The element to display the value
 */
function updateSliderValue(slider, valueElement) {
    if (!slider || !valueElement) return;
    const currentValue = slider.value || '5';
    valueElement.textContent = `${currentValue} ⭐`;
}

// Group slider elements with their corresponding value displays for easier management
const sliderPairs = [
    { slider: claritySlider, valueElement: clarityValue },
    { slider: deliverySlider, valueElement: deliveryValue },
    { slider: confidenceSlider, valueElement: confidenceValue }
];

/**
 * Initialize the application when the DOM is fully loaded
 * Sets up event listeners and initial values for all sliders
 */
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

/**
 * Handle form reset events
 * Uses requestAnimationFrame to ensure the reset happens after the form's native reset
 * This prevents visual glitches and ensures proper state reset
 */
form.addEventListener("reset", function() {
    // Use requestAnimationFrame to ensure this runs after the form reset
    requestAnimationFrame(() => {
        // Reset all sliders to default value
        sliderPairs.forEach(({ slider, valueElement }) => {
            if (slider) slider.value = '5';
            updateSliderValue(slider, valueElement);
        });
    });
});

/**
 * Handle form submissions
 * Validates input, prevents duplicates, and manages the submission process
 * Updates the UI with success/failure feedback and refreshes the visualization
 */
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
        
        // Show success message
        const successMsg = document.getElementById('success-message');
        successMsg.style.display = 'block';
        
        // Temporarily disable form
        Array.from(form.elements).forEach(el => el.disabled = true);
        
        // Re-enable form after 2 seconds
        setTimeout(() => {
            successMsg.style.display = 'none';
            Array.from(form.elements).forEach(el => el.disabled = false);
        }, 2000);
    } else {
        alert(result.message);
    }

    // Show results section
    const resultsSection = document.getElementById('results');
    resultsSection.style.display = 'block';
});

/**
 * Draws the bar chart visualization
 * Uses HTML5 Canvas to create a responsive chart showing average scores
 * Includes scale lines, gradients, and clear labeling for better readability
 */
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
    const barColors = ["#3182ce", "#38a169", "#ed8936"];
    const maxScore = 10;
    const barWidth = 60;
    const spacing = 20;
    const chartHeight = chartCanvas.height - 40; // Leave room for labels
    const numBars = data.length;
    const totalChartWidth = (numBars - 1) * spacing + numBars * barWidth;
    const startX = (chartCanvas.width - totalChartWidth) / 2;

    // Draw scale lines and numbers
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= maxScore; i += 2) {
        const y = chartCanvas.height - (i / maxScore * chartHeight) - 30;
        ctx.beginPath();
        ctx.moveTo(startX - 10, y);
        ctx.lineTo(startX + totalChartWidth + 10, y);
        ctx.stroke();
        
        ctx.fillStyle = "#718096";
        ctx.font = "12px 'Segoe UI'";
        ctx.textAlign = "right";
        ctx.fillText(i.toString(), startX - 15, y + 4);
    }

    // Draw bars
    data.forEach((score, index) => {
        const x = startX + index * (barWidth + spacing);
        const normalizedHeight = (score / maxScore) * chartHeight;
        const y = chartCanvas.height - normalizedHeight - 30;

        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(x, y, x, chartCanvas.height - 30);
        gradient.addColorStop(0, barColors[index]);
        gradient.addColorStop(1, barColors[index] + "88");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, normalizedHeight);

        // Draw score value
        ctx.fillStyle = "#2d3748";
        ctx.font = "bold 14px 'Segoe UI'";
        ctx.textAlign = "center";
        ctx.fillText(score.toFixed(1), x + barWidth / 2, y - 5);

        // Draw label
        ctx.fillStyle = "#4a5568";
        ctx.font = "12px 'Segoe UI'";
        ctx.fillText(labels[index], x + barWidth / 2, chartCanvas.height - 10);
    });
}

/**
 * Displays feedback cards
 * Creates and updates the feedback section, handling anonymous submissions
 * Ensures proper ordering and styling of feedback elements
 */
function displayFeedbacks() {
    feedbackList.innerHTML = "<h3>Feedback</h3>";
    const summary = scoringManager.getSummary();
    summary.submissions.forEach(submission => {
        if (submission.feedback) {
            const feedbackCard = document.createElement('div');
            feedbackCard.className = 'feedback-card';
            
            const feedbackText = document.createElement('div');
            feedbackText.className = 'feedback-text';
            feedbackText.textContent = submission.feedback;
            
            const feedbackMeta = document.createElement('div');
            feedbackMeta.className = 'feedback-meta';
            feedbackMeta.textContent = submission.isAnonymous ? 
                'Anonymous feedback' : 
                `Feedback from ${submission.studentName}`;
            
            feedbackCard.appendChild(feedbackText);
            feedbackCard.appendChild(feedbackMeta);
            feedbackList.appendChild(feedbackCard);
        }
    });
}

// --- Initialize the Application ---
// Draw the initial empty chart and hide the results section until first submission
drawChart();
displayFeedbacks();
const resultsSection = document.getElementById('results');
resultsSection.style.display = 'none';
