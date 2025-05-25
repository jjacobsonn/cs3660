/**
 * ScoringManager Class
 * 
 * Handles direct MQTT peer-to-peer communication for the presentation scoring application.
 */
class ScoringManager {
    /**
     * Initialize the ScoringManager
     * Sets up data structures and establishes MQTT connection
     */
    constructor() {
        // Store submitted scores using Map for O(1) lookup performance
        this.submittedScores = new Map();
        
        // Initialize summary data structure
        this.summaryData = {
            submittedCount: 0,
            averages: {
                clarity: 0,
                delivery: 0,
                confidence: 0
            },
            submissions: []
        };

        this.peerId = 'peer_' + Math.random().toString(16).substr(2, 8);
        this.setupMQTTClient();
    }    setupMQTTClient() {
        // Connect to local MQTT broker over WebSocket
        const brokerUrl = 'ws://localhost:9001';
        this.client = mqtt.connect(brokerUrl, {
            clientId: 'presentation_scorer_' + Math.random().toString(16).substr(2, 8),
            clean: true,
            reconnectPeriod: 1000,
            connectTimeout: 30 * 1000
        });
        
        this.client.on('connect', () => {
            console.log('MQTT P2P client ready');
            this.client.subscribe('scores/' + this.peerId);
            this.client.subscribe('summary/' + this.peerId);
            this.broadcastPresence();
        });

        this.client.on('message', (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                if (topic.startsWith('scores/')) {
                    this.handleNewScore(data);
                } else if (topic.startsWith('summary/')) {
                    this.handleSummaryUpdate(data);
                } else if (topic === 'presence') {
                    this.handlePeerPresence(data);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        // Connect to all peers in the network
        this.peers = new Set();
        this.client.subscribe('presence');
    }

    broadcastPresence() {
        this.client.publish('presence', JSON.stringify({
            peerId: this.peerId,
            timestamp: new Date().toISOString()
        }));
    }

    handlePeerPresence(data) {
        if (data.peerId !== this.peerId) {
            this.peers.add(data.peerId);
            // Share our current state with the new peer
            this.client.publish('scores/' + data.peerId, JSON.stringify({
                type: 'state_sync',
                scores: Array.from(this.submittedScores.entries()),
                source: this.peerId
            }));
        }
    }

    handleNewScore(data) {
        if (data.type === 'state_sync') {
            // Merge state from another peer
            data.scores.forEach(([id, score]) => {
                if (!this.submittedScores.has(id)) {
                    this.submittedScores.set(id, score);
                    this.summaryData.submissions.push(score);
                }
            });
            this.updateSummary();
        } else {
            // Handle individual score
            const { studentId } = data;
            if (!this.submittedScores.has(studentId)) {
                this.submittedScores.set(studentId, data);
                this.summaryData.submissions.push(data);
                this.updateSummary();
            }
        }
    }

    handleSummaryUpdate(data) {
        // Only update if the received summary has more submissions
        if (data.submittedCount > this.summaryData.submittedCount) {
            this.summaryData = data;
        }
    }

    /**
     * Processes a new score submission
     * Validates input, updates storage, and broadcasts via MQTT
     * @param {string|number} studentId - The student's ID
     * @param {Object} scoreData - The submission data
     * @returns {Object} Success/failure status and message
     */
    submitScore(studentId, scoreData) {
        if (!this.client) {
            return {
                success: false,
                message: 'MQTT client not initialized'
            };
        }

        if (this.submittedScores.has(studentId)) {
            return {
                success: false,
                message: 'A submission has already been recorded for this Student ID'
            };
        }

        const submission = {
            ...scoreData,
            timestamp: new Date().toISOString()
        };

        // Store locally
        this.submittedScores.set(studentId, submission);
        this.summaryData.submissions.push(submission);
        this.updateSummary();

        // Broadcast to all peers
        this.peers.forEach(peerId => {
            this.client.publish('scores/' + peerId, JSON.stringify(submission));
        });

        return {
            success: true,
            message: 'Score submitted successfully'
        };
    }

    /**
     * Updates summary statistics
     * Recalculates averages and publishes updated summary to MQTT
     * Uses running totals for efficient average calculation
     */
    updateSummary() {
        const submissions = Array.from(this.submittedScores.values());
        this.summaryData.submittedCount = submissions.length;

        // Calculate averages
        const totals = submissions.reduce((acc, sub) => {
            acc.clarity += sub.clarity;
            acc.delivery += sub.delivery;
            acc.confidence += sub.confidence;
            return acc;
        }, { clarity: 0, delivery: 0, confidence: 0 });

        const count = Math.max(submissions.length, 1); // Avoid division by zero
        this.summaryData.averages = {
            clarity: totals.clarity / count,
            delivery: totals.delivery / count,
            confidence: totals.confidence / count
        };

        // Broadcast summary to all peers
        this.peers.forEach(peerId => {
            this.client.publish('summary/' + peerId, JSON.stringify(this.summaryData));
        });
    }

    /**
     * Checks if a student has already submitted a score
     * @param {string|number} studentId - The student's ID
     * @returns {boolean} True if the student has already submitted
     */
    hasSubmitted(studentId) {
        return this.submittedScores.has(studentId);
    }

    /**
     * Retrieves current summary data
     * @returns {Object} Current summary statistics and submissions
     */
    getSummary() {
        return this.summaryData;
    }
}

// Make ScoringManager available globally for script.js
window.ScoringManager = ScoringManager;
