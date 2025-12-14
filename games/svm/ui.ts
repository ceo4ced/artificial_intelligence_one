
import {
    SVMGameState, INITIAL_STATE, CHALLENGES, generateLevelData, calculateScore
} from './engine.js';

// Global State
let appState: SVMGameState = { ...INITIAL_STATE };
let isDrawing = false;

// DOM Elements
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const totalScoreEl = document.getElementById('totalScore')!;
const levelEl = document.getElementById('level')!;
const challengesEl = document.getElementById('challenges')!;
const avgMarginEl = document.getElementById('avgMargin')!;
const bestScoreEl = document.getElementById('bestScore')!;
const progressBar = document.getElementById('progressBar')!;
const feedbackEl = document.getElementById('feedback')!;
const feedbackTitle = document.getElementById('feedbackTitle')!;
const feedbackText = document.getElementById('feedbackText')!;
const challengeTitleEl = document.getElementById('challenge-title')!;

// Rendering

function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Draw Boundary
    if (appState.boundaryPoints.length > 0) {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const first = appState.boundaryPoints[0];
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < appState.boundaryPoints.length; i++) {
            const p = appState.boundaryPoints[i];
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    // Draw Points
    appState.dataPoints.forEach(point => {
        ctx.fillStyle = point.label === 1 ? 'rgba(33, 150, 243, 0.9)' : 'rgba(244, 67, 54, 0.9)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateStatsUI() {
    totalScoreEl.textContent = appState.totalScore.toString();
    levelEl.textContent = (appState.currentLevelIndex + 1).toString();
    challengesEl.textContent = `${appState.completedChallenges}/${CHALLENGES.length}`;
    bestScoreEl.textContent = appState.bestScore.toString();

    if (appState.marginScores.length > 0) {
        const avg = appState.marginScores.reduce((a, b) => a + b, 0) / appState.marginScores.length;
        avgMarginEl.textContent = `${avg.toFixed(1)}%`;
    }

    const progress = (appState.completedChallenges / CHALLENGES.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function initLevel() {
    isDrawing = false;
    appState.boundaryPoints = [];
    appState.currentMode = 'draw';

    // Check if game complete
    if (appState.currentLevelIndex >= CHALLENGES.length) {
        showFinalScore();
        return;
    }

    const challenge = CHALLENGES[appState.currentLevelIndex];
    challengeTitleEl.textContent = challenge.title;

    // Generate Data
    const { dataPoints, solution } = generateLevelData(challenge.type);
    appState.dataPoints = dataPoints;
    appState.solution = solution;

    feedbackEl.classList.remove('show');
    renderCanvas();
    updateStatsUI();
}

// Actions

function handleSubmit() {
    if (appState.boundaryPoints.length < 2) {
        alert('Please draw a decision boundary first!');
        return;
    }

    const res = calculateScore(appState.boundaryPoints, appState.dataPoints);

    appState.totalScore += res.points;
    appState.completedChallenges++;
    appState.marginScores.push(res.score);
    appState.bestScore = Math.max(appState.bestScore, res.points);

    // Feedback
    if (res.score >= 85) {
        feedbackEl.style.background = '#e8f5e9';
        feedbackEl.style.borderLeftColor = '#4CAF50';
        feedbackTitle.style.color = '#2e7d32';
        feedbackTitle.textContent = '🎯 Excellent! Near-Optimal Margin!';
    } else if (res.score >= 70) {
        feedbackEl.style.background = '#fff9c4';
        feedbackEl.style.borderLeftColor = '#FFC107';
        feedbackTitle.style.color = '#f57c00';
        feedbackTitle.textContent = '👍 Good Boundary!';
    } else if (res.score >= 50) {
        feedbackEl.style.background = '#ffe0b2';
        feedbackEl.style.borderLeftColor = '#FF9800';
        feedbackTitle.style.color = '#e65100';
        feedbackTitle.textContent = '📊 Decent Try';
    } else {
        feedbackEl.style.background = '#ffebee';
        feedbackEl.style.borderLeftColor = '#f44336';
        feedbackTitle.style.color = '#c62828';
        feedbackTitle.textContent = '🤔 Keep Practicing';
    }

    feedbackText.textContent = `Margin Score: ${res.score.toFixed(1)}% | Points Earned: ${res.points} | Try to maximize the distance between the boundary and the nearest points from both classes!`;
    feedbackEl.classList.add('show');
    updateStatsUI();
}

function handleShowSolution() {
    const s = appState.solution;
    if (!s) return;

    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);

    if (s.type === 'vertical') {
        const x = s.x || 0;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    } else if (s.type === 'diagonal') {
        ctx.beginPath();
        ctx.moveTo(s.x1 || 0, s.y1 || 0);
        ctx.lineTo(s.x2 || 0, s.y2 || 0);
        ctx.stroke();
    } else if (s.type === 'circle') {
        ctx.beginPath();
        ctx.arc(s.centerX || 0, s.centerY || 0, s.radius || 50, 0, Math.PI * 2);
        ctx.stroke();
    } else if (s.type === 'sine') {
        ctx.beginPath();
        const amp = s.amplitude || 10;
        const freq = s.frequency || 10;
        const off = s.offset || 0;
        for (let x = 0; x <= canvas.width; x += 5) {
            const y = off + Math.sin(x / freq) * amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.fillStyle = '#FF9800';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Optimal Boundary', 20, 30);
}

function handleNextChallenge() {
    appState.currentLevelIndex++;
    initLevel();
}

function handleClear() {
    appState.boundaryPoints = [];
    renderCanvas();
    feedbackEl.classList.remove('show');
}

function handleSetMode(mode: 'draw' | 'erase') {
    appState.currentMode = mode;
    // Update local UI state
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.textContent?.toLowerCase().includes(mode)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function showFinalScore() {
    const avg = appState.marginScores.reduce((a, b) => a + b, 0) / (appState.marginScores.length || 1);
    let grade = '';

    if (avg >= 85) grade = 'S - SVM Master!';
    else if (avg >= 75) grade = 'A - Excellent!';
    else if (avg >= 65) grade = 'B - Great Work!';
    else if (avg >= 55) grade = 'C - Good Effort!';
    else grade = 'Keep Practicing!';

    alert(`Game Complete!\n\nTotal Score: ${appState.totalScore}\nAverage Margin: ${avg.toFixed(1)}%\nGrade: ${grade}\n\nYou've mastered the art of margin maximization!`);
}

// Event Listeners

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    if (appState.currentMode === 'draw') {
        const rect = canvas.getBoundingClientRect();
        appState.boundaryPoints = [{ // Reset on new draw start or append? Original appended only if mouse move?
            // "boundaryPoints = [{...}]" -> resets on mousedown
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }];
        renderCanvas();
    } else if (appState.currentMode === 'erase') {
        // Erase logic? Original code didn't actually implement erase logic inside listeners, 
        // it just had a 'clear boundary' button. 'setMode' ('erase') did nothing really in listeners?
        // Wait, original listener checked `if (currentMode === 'draw')`.
        // So Erase mode just prevents drawing.
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing && appState.currentMode === 'draw') {
        const rect = canvas.getBoundingClientRect();
        appState.boundaryPoints.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        renderCanvas();
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Window Exports
(window as any).submitBoundary = handleSubmit;
(window as any).showSolution = handleShowSolution;
(window as any).nextChallenge = handleNextChallenge;
(window as any).clearBoundary = handleClear;
(window as any).setMode = handleSetMode;

// Init
initLevel();
