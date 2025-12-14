
import {
    GameState, INITIAL_STATE, CHALLENGES,
    calculateReduction
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let selectedDimensions = new Set<number>();

// DOM Elements
const gameContentEl = document.getElementById('gameContent')!;
const totalScoreEl = document.getElementById('totalScore')!;
const levelEl = document.getElementById('level')!;
const challengesEl = document.getElementById('challenges')!;
const avgVarianceEl = document.getElementById('avgVariance')!;
const bestScoreEl = document.getElementById('bestScore')!;
const progressBarEl = document.getElementById('progressBar')!;

// Stats from localStorage
const storedBest = localStorage.getItem('dimensionReductionBest');
if (storedBest) {
    bestScoreEl.textContent = storedBest;
}

function init() {
    (window as any).applyReduction = handleApplyReduction;
    (window as any).showHint = handleShowHint;
    (window as any).nextChallenge = handleNextChallenge;
    (window as any).resetGame = handleResetGame;
    (window as any).toggleDimension = handleToggleDimension; // exposed for checkboxes

    loadChallenge();
    updateStats();
}

function loadChallenge() {
    if (appState.currentChallengeIndex >= CHALLENGES.length) {
        showGameComplete();
        return;
    }

    const challenge = CHALLENGES[appState.currentChallengeIndex];
    selectedDimensions.clear();

    gameContentEl.innerHTML = `
        <div class="challenge-card">
            <h3>Challenge ${appState.currentChallengeIndex + 1}: ${challenge.title}</h3>
            <p style="line-height: 1.6; color: #4a5568; margin-top: 10px;">${challenge.description}</p>
            <p style="margin-top: 10px; font-weight: 600; color: #667eea;">
                Reduce from ${challenge.dimensions.length} dimensions to ${challenge.targetDims} dimensions
            </p>
        </div>

        <div class="canvas-container">
            <h3 style="color: #2d3748; margin-bottom: 15px;">Original Data Dimensions</h3>
            <canvas id="dimensionCanvas" width="900" height="400"></canvas>
            <p style="margin-top: 15px; color: #666; font-style: italic;">
                Each bar shows the variance (spread) of data in that dimension
            </p>
        </div>

        <div style="background: #fff; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #2d3748; margin-bottom: 20px;">Select ${challenge.targetDims} Dimensions to Keep:</h3>
            <div id="dimensionCheckboxes"></div>
        </div>

        <div class="feedback-panel" id="feedbackPanel"></div>
    `;

    drawDimensionChart();
    createCheckboxes();
    updateProgress();
}

function drawDimensionChart() {
    const challenge = CHALLENGES[appState.currentChallengeIndex];
    const canvas = document.getElementById('dimensionCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = 80;
    const spacing = 10;
    const maxHeight = 300;
    const startX = (canvas.width - (challenge.dimensions.length * (barWidth + spacing))) / 2;
    const startY = 50;

    // Draw bars
    challenge.dimensions.forEach((dim, i) => {
        const importance = challenge.importance[i];
        const barHeight = (importance / 100) * maxHeight;
        const x = startX + i * (barWidth + spacing);
        const y = startY + maxHeight - barHeight;

        // Bar
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Border
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Label
        ctx.fillStyle = '#2d3748';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(dim, x + barWidth / 2, startY + maxHeight + 20);

        // Variance percentage
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${importance}%`, x + barWidth / 2, y - 10);
    });
}

function createCheckboxes() {
    const challenge = CHALLENGES[appState.currentChallengeIndex];
    const container = document.getElementById('dimensionCheckboxes');
    if (!container) return;

    container.innerHTML = challenge.dimensions.map((dim, i) => `
        <label style="display: flex; align-items: center; padding: 12px; margin: 8px 0; background: #f8f9fa; border-radius: 8px; cursor: pointer; transition: all 0.3s;" id="dimLabel${i}">
            <input type="checkbox" id="dim${i}" onchange="toggleDimension(${i})" style="width: 20px; height: 20px; margin-right: 12px; cursor: pointer;">
            <span style="font-weight: 600; color: #2d3748; flex: 1;">${dim}</span>
            <span style="color: #667eea; font-weight: 600;">${challenge.importance[i]}% variance</span>
        </label>
    `).join('');
}

function handleToggleDimension(index: number) {
    const challenge = CHALLENGES[appState.currentChallengeIndex];
    const checkbox = document.getElementById(`dim${index}`) as HTMLInputElement;
    const label = document.getElementById(`dimLabel${index}`)!;

    if (checkbox.checked) {
        if (selectedDimensions.size >= challenge.targetDims) {
            checkbox.checked = false;
            alert(`You can only select ${challenge.targetDims} dimensions!`);
            return;
        }
        selectedDimensions.add(index);
        label.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)';
        label.style.borderLeft = '4px solid #4CAF50';
    } else {
        selectedDimensions.delete(index);
        label.style.background = '#f8f9fa';
        label.style.borderLeft = 'none';
    }
}

function handleApplyReduction() {
    const challenge = CHALLENGES[appState.currentChallengeIndex];

    if (selectedDimensions.size !== challenge.targetDims) {
        alert(`Please select exactly ${challenge.targetDims} dimensions!`);
        return;
    }

    const result = calculateReduction(challenge, selectedDimensions);

    appState.score += result.points;
    appState.totalVarianceAccumulated += result.percentagePreserved;
    appState.challengesCompleted++;

    showFeedback(result, challenge);
    updateStats();
}

function showFeedback(result: any, challenge: any) {
    const panel = document.getElementById('feedbackPanel')!;
    const percentage = result.percentagePreserved;
    const optimal = result.optimalPercentage;
    const points = result.points;
    const sortedImportance = result.sortedImportance;

    let message = '';
    if (percentage >= optimal - 5) {
        message = '🎉 Perfect! You found the optimal dimensions!';
    } else if (percentage >= optimal - 10) {
        message = '✨ Great job! Very close to optimal!';
    } else if (percentage >= optimal - 20) {
        message = '👍 Good work! You preserved most of the information.';
    } else {
        message = '💪 Keep learning! Try to identify dimensions with highest variance.';
    }

    const optimalDimNames = sortedImportance.map((d: any) => challenge.dimensions[d.i]).join(', ');

    panel.innerHTML = `
        <h4 style="color: #2e7d32; margin-bottom: 15px;">${message}</h4>
        <div style="line-height: 1.8;">
            <p><strong>Your Selection:</strong> Preserved ${percentage}% of total variance</p>
            <p><strong>Optimal Selection:</strong> ${optimal}% (${optimalDimNames})</p>
            <p style="font-weight: bold; margin-top: 15px; font-size: 1.2em; color: #667eea;">Points Earned: +${points}</p>
        </div>
        <p style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #4CAF50; color: #4a5568;">
            <strong>Why it matters:</strong> In real ML, keeping dimensions with high variance preserves the most information
            while reducing computational cost. This is the core principle of PCA (Principal Component Analysis)!
        </p>
    `;

    panel.classList.add('show');
}

function handleShowHint() {
    const challenge = CHALLENGES[appState.currentChallengeIndex];
    alert('💡 Hint: ' + challenge.hint);
}

function handleNextChallenge() {
    appState.currentChallengeIndex++;
    levelEl.textContent = (appState.currentChallengeIndex + 1).toString();

    if (appState.currentChallengeIndex >= CHALLENGES.length) {
        showGameComplete();
    } else {
        loadChallenge();
    }
}

function showGameComplete() {
    gameContentEl.innerHTML = `
        <div style="text-align: center; padding: 40px; background: #fff; border-radius: 10px;">
            <h2 style="color: #4CAF50; font-size: 2.5em; margin-bottom: 20px;">🎉 All Challenges Complete!</h2>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 30px; border-radius: 15px; margin: 30px 0;">
                <div style="font-size: 4em; font-weight: bold; margin-bottom: 10px;">${appState.score}</div>
                <div style="font-size: 1.5em;">Total Points</div>
                <div style="margin-top: 20px; font-size: 1.2em;">
                    Average Variance Preserved: ${Math.round(appState.totalVarianceAccumulated / CHALLENGES.length)}%
                </div>
            </div>

            <div style="background: #e3f2fd; padding: 25px; border-radius: 10px; margin: 20px 0; text-align: left;">
                <h3 style="color: #1976d2; margin-bottom: 15px;">🎓 What You've Learned:</h3>
                <ul style="line-height: 1.8; margin-left: 20px; color: #4a5568;">
                    <li>Dimension reduction preserves the most important information while reducing complexity</li>
                    <li>High variance dimensions contain more useful information</li>
                    <li>PCA (Principal Component Analysis) automatically finds optimal dimensions</li>
                    <li>Real applications: image compression, data visualization, faster ML training</li>
                    <li>Trade-off: compression vs. information preservation</li>
                </ul>
            </div>

            <button class="btn-primary" style="max-width: 300px; margin: 20px auto;" onclick="resetGame()">Play Again</button>
        </div>
    `;

    // Save high score
    const currentBest = parseInt(localStorage.getItem('dimensionReductionBest') || '0');
    if (appState.score > currentBest) {
        localStorage.setItem('dimensionReductionBest', appState.score.toString());
        bestScoreEl.textContent = appState.score.toString();
    }
}

function handleResetGame() {
    appState = { ...INITIAL_STATE };
    selectedDimensions.clear();
    levelEl.textContent = '1';
    loadChallenge();
    updateStats();
}

function updateProgress() {
    const progress = (appState.currentChallengeIndex / CHALLENGES.length) * 100;
    progressBarEl.style.width = progress + '%';
    challengesEl.textContent = `${appState.currentChallengeIndex}/${CHALLENGES.length}`;
}

function updateStats() {
    totalScoreEl.textContent = appState.score.toString();
    const count = appState.currentChallengeIndex;
    // Note: totalVarianceAccumulated is sum of percentages.
    const avg = count > 0 ? Math.round(appState.totalVarianceAccumulated / count) : 0;
    avgVarianceEl.textContent = avg + '%';
}

init();
