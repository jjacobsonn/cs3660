/**
 * ScoringManager Class
 * 
 * Handles direct MQTT peer-to-peer communication for the presentation scoring application.
 * Now includes support for team reset signals from the presentation tool.
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
    }

    setupMQTTClient() {
        // Connect to local MQTT broker over WebSocket
        //const brokerUrl = 'ws://localhost:9001';
        const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
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
            this.client.subscribe('presence');
            this.client.subscribe('team_reset'); // Subscribe to team reset signals
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
                } else if (topic === 'team_reset') {
                    // Handle team reset signals from presentation tool
                    this.handleTeamReset(data);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        // Connect to all peers in the network
        this.peers = new Set();
    }

    /**
     * Handle team reset signal from presentation tool
     * Clears all stored scores and resets summary data for new team
     * @param {Object} resetData - Reset notification data
     */
    handleTeamReset(resetData) {
        console.log('📨 Received team reset signal:', resetData);
        
        if (resetData.type === 'team_reset' && resetData.action === 'clear_scores') {
            console.log(`🔄 Resetting scores for ${resetData.teamName}`);
            
            // Clear all stored scores
            this.submittedScores.clear();
            
            // Reset summary data
            this.summaryData = {
                submittedCount: 0,
                averages: {
                    clarity: 0,
                    delivery: 0,
                    confidence: 0
                },
                submissions: []
            };
            
            console.log(`✅ Successfully reset all data for ${resetData.teamName}`);
            
            // Optionally broadcast the reset summary to presentation tool
            this.broadcastSummaryUpdate();
            
            // Update UI to show reset (if you have a UI update method)
            if (typeof this.updateUI === 'function') {
                this.updateUI();
            }
            
            // Show reset confirmation to user
            this.showResetNotification(resetData.teamName);
        }
    }

    /**
     * Show reset notification to user
     * @param {string} teamName - Name of the team that's starting
     */
    showResetNotification(teamName) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            transition: opacity 0.3s;
        `;
        notification.textContent = `🔄 Reset for ${teamName} - Ready for new evaluations`;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
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
        this.broadcastSummaryUpdate();
    }

    /**
     * Broadcast summary update to all connected peers
     */
    broadcastSummaryUpdate() {
        this.peers.forEach(peerId => {
            this.client.publish('summary/' + peerId, JSON.stringify(this.summaryData));
        });
    }

    /**
     * Manually reset all scores (for testing or admin use)
     * @param {string} reason - Reason for the reset
     */
    manualReset(reason = 'Manual reset') {
        console.log(`🔄 Manual reset triggered: ${reason}`);
        
        this.submittedScores.clear();
        this.summaryData = {
            submittedCount: 0,
            averages: {
                clarity: 0,
                delivery: 0,
                confidence: 0
            },
            submissions: []
        };
        
        // Broadcast the reset
        this.broadcastSummaryUpdate();
        
        console.log('✅ Manual reset complete');
        
        // Show notification
        this.showResetNotification('Manual Reset');
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

    /**
     * Get current connection status
     * @returns {Object} Connection and scoring status
     */
    getStatus() {
        return {
            connected: this.client && this.client.connected,
            peerId: this.peerId,
            totalSubmissions: this.summaryData.submittedCount,
            connectedPeers: this.peers.size,
            lastUpdate: new Date().toISOString()
        };
    }
}

// Make ScoringManager available globally for script.js
window.ScoringManager = ScoringManager;