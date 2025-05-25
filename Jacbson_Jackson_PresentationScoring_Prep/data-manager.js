// MQTT client setup and data management
class ScoringManager {  constructor() {
    this.submittedScores = new Map(); // studentId -> score data
    this.summaryData = {
      submittedCount: 0,
      averages: {
        clarity: 0,
        delivery: 0,
        confidence: 0
      },
      submissions: []
    };

    // Setup MQTT client
    this.setupMQTT();
  }

  setupMQTT() {
    // Connect to MQTT broker (you'll need to replace with your broker URL)
    const brokerUrl = 'ws://localhost:9001'; // Example WebSocket URL
    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      this.client.subscribe('presentation/scores');
    });

    this.client.on('message', (topic, message) => {
      if (topic === 'presentation/scores') {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received score data:', data);
        } catch (error) {
          console.error('Error parsing MQTT message:', error);
        }
      }
    });
  }

  hasSubmitted(studentId) {
    return this.submittedScores.has(studentId);
  }  submitScore(studentId, scoreData) {
    if (this.hasSubmitted(studentId)) {
      return {
        success: false,
        message: 'A submission has already been recorded for this Student ID'
      };
    }

    const submission = {
      ...scoreData,
      timestamp: new Date().toISOString()
    };

    console.log('New submission:', JSON.stringify(submission, null, 2));

    // Store the submission
    this.submittedScores.set(studentId, submission);
    this.summaryData.submissions.push(submission);
    this.updateSummary();

    // Log current state
    console.log('Current summary data:', JSON.stringify(this.summaryData, null, 2));

    // Publish to MQTT
    this.client.publish('presentation/scores', JSON.stringify(submission));

    return {
      success: true,
      message: 'Score submitted successfully'
    };
  }

  updateSummary() {
    const submissions = Array.from(this.submittedScores.values());
    this.summaryData.submittedCount = submissions.length;

    // Calculate averages
    const totals = {
      clarity: 0,
      delivery: 0,
      confidence: 0
    };

    submissions.forEach(sub => {
      totals.clarity += sub.clarity;
      totals.delivery += sub.delivery;
      totals.confidence += sub.confidence;
    });

    const count = Math.max(submissions.length, 1); // Avoid division by zero
    this.summaryData.averages = {
      clarity: totals.clarity / count,
      delivery: totals.delivery / count,
      confidence: totals.confidence / count
    };

    // Publish summary to MQTT
    this.client.publish('presentation/summary', JSON.stringify(this.summaryData));
  }
  getSummary() {
    return this.summaryData;
  }
}

// Export for use in main script
window.ScoringManager = ScoringManager;
