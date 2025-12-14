
import {
    LogisticState, INITIAL_STATE, updateClassifier, predict,
    pickRandomEmail, Email, SPAM_INDICATORS
} from './engine.js';

// 🏠 State
let appState: LogisticState = { ...INITIAL_STATE };
let currentEmail: Email | null = null;

// 🖥️ UI References
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// 🎨 Rendering
function renderUI() {
    // Stats
    document.getElementById('totalEmails')!.textContent = appState.metrics.totalEmails.toString();
    document.getElementById('accuracy')!.textContent = appState.metrics.accuracy + '%';
    document.getElementById('spamCount')!.textContent = appState.metrics.spamCount.toString();
    document.getElementById('hamCount')!.textContent = appState.metrics.hamCount.toString();
    document.getElementById('precisionValue')!.textContent = appState.metrics.precision.toFixed(0) + '%';
    document.getElementById('recallValue')!.textContent = appState.metrics.recall.toFixed(0) + '%';

    const progress = Math.min(100, (appState.trainingData.length / 20) * 100);
    document.getElementById('progressFill')!.style.width = progress + '%';
    document.getElementById('progressText')!.textContent = appState.trainingData.length + '/20';

    // Top Features
    const sortedWeights = Object.entries(appState.weights)
        .sort((a, b) => b[1] - a[1]) // Highest positive weights first (spam)
        .slice(0, 5);

    let html = '';
    sortedWeights.forEach(([word, weight]) => {
        if (weight > 0) {
            html += `
                <div class="feature-item">
                    <span>${word}</span>
                    <span style="color: #f44336; font-weight: bold;">+${weight.toFixed(1)}</span>
                </div>
            `;
        }
    });
    if (html === '') html = '<p style="color: #999; font-size: 0.9em;">Classify emails to see spam indicators</p>';
    document.getElementById('spamFeatures')!.innerHTML = html;

    drawDecisionBoundary();
}

function drawDecisionBoundary() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 350);
    ctx.lineTo(850, 350);
    ctx.moveTo(50, 50);
    ctx.lineTo(50, 350);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Spam Word Count', 450, 380);

    ctx.save();
    ctx.translate(20, 200);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Urgency Score (Visualization)', 0, 0);
    ctx.restore();

    if (appState.trainingData.length === 0) return;

    // Draw decision boundary (Simulated diagonal)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 350);
    ctx.lineTo(850, 50);
    ctx.stroke();

    // Draw data points
    appState.trainingData.forEach(item => {
        // We visualize based on "Spam Words" vs "Urgency" just for the chart
        // even though the engine uses full bag-of-words
        const text = item.email.body.toLowerCase();
        const spamWordCount = SPAM_INDICATORS.filter(w => text.includes(w)).length;
        const urgencyScore = (item.email.body.match(/!/g) || []).length +
            (item.email.body.toUpperCase() === item.email.body ? 5 : 0);

        // Normalize for display
        const x = 50 + Math.min(800, spamWordCount * 100 + Math.random() * 50);
        const y = 350 - Math.min(300, urgencyScore * 30 + Math.random() * 20);

        ctx.fillStyle = item.userLabel === 'spam' ? '#F44336' : '#4CAF50';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// 🕹️ Actions
function nextEmail() {
    if (appState.trainingPhase && appState.trainingData.length >= 20) {
        finishTraining();
        return;
    }

    currentEmail = pickRandomEmail();

    document.getElementById('emailFrom')!.textContent = currentEmail.from;
    document.getElementById('emailSubject')!.textContent = currentEmail.subject;
    document.getElementById('emailBody')!.textContent = currentEmail.body;
    document.getElementById('feedbackBadge')!.innerHTML = '';

    // In Test Phase, AI predicts immediately
    if (!appState.trainingPhase) {
        const score = predict(currentEmail, appState);
        const prediction = score > 0.5 ? 'spam' : 'ham'; // 0.5 threshold
        const isCorrect = prediction === currentEmail.type;

        const badge = document.getElementById('feedbackBadge')!;
        badge.className = 'feedback-badge ' + (isCorrect ? 'correct' : 'incorrect');
        badge.textContent = `🤖 AI: ${prediction.toUpperCase()} (${(score * 100).toFixed(1)}%) ${isCorrect ? '✓' : '✗'}`;
    }
}

function handleClassify(label: 'spam' | 'ham') {
    if (!currentEmail || !appState.trainingPhase) return;

    const correct = label === currentEmail.type;

    // Feedback
    const badge = document.getElementById('feedbackBadge')!;
    badge.className = 'feedback-badge ' + (correct ? 'correct' : 'incorrect');
    badge.textContent = correct ? '✓ Correct!' : '✗ Wrong - It was ' + currentEmail.type.toUpperCase();

    appState = updateClassifier(appState, currentEmail, label);
    renderUI();

    setTimeout(nextEmail, 1500);
}

function startTraining() {
    appState = { ...INITIAL_STATE };
    currentEmail = null;
    document.getElementById('phaseIndicator')!.innerHTML = '<h3>Phase 1: Training</h3><p>Label 20 emails to train the classifier</p>';
    document.getElementById('classificationButtons')!.style.display = 'flex';
    nextEmail();
    renderUI();
}

function finishTraining() {
    appState.trainingPhase = false;
    document.getElementById('phaseIndicator')!.innerHTML = '<h3>✅ Training Complete!</h3><p>Click "Test Classifier" to evaluate performance</p>';
    document.getElementById('classificationButtons')!.style.display = 'none';
    document.getElementById('emailBody')!.textContent = 'Training complete! The classifier has learned from your labels. Click "Test Classifier" to see how well it performs.';
    document.getElementById('feedbackBadge')!.innerHTML = '';
}

function testClassifier() {
    if (appState.trainingData.length === 0) {
        alert("Please complete training first!");
        return;
    }
    nextEmail();
}

function reset() {
    if (confirm('Reset all training?')) {
        startTraining();
    }
}

// 🌐 Bindings
(window as any).startTraining = startTraining;
(window as any).testClassifier = testClassifier;
(window as any).reset = reset;
(window as any).classify = handleClassify;

// Init
renderUI();
