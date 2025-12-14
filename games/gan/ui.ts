
import {
    GameState, INITIAL_STATE, startGameState, nextRoundState, processChoice, tickTimer,
    Difficulty, PatternParams
} from './engine.js';

// Global State
let appState: GameState = { ...INITIAL_STATE };
let timerInterval: number | null = null;

// DOM Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const timerEl = document.getElementById('timer')!;
const roundEl = document.getElementById('round')!;
const correctEl = document.getElementById('correct')!;
const wrongEl = document.getElementById('wrong')!;
const accuracyEl = document.getElementById('accuracy')!;
const scoreEl = document.getElementById('score')!;
const feedbackEl = document.getElementById('feedback')!;
const diffBtns = document.querySelectorAll('.diff-btn');

// Drawing Functions

function drawPattern(params: PatternParams | null) {
    if (!params) {
        // Draw welcome screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Start Game" to begin!', canvas.width / 2, canvas.height / 2);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (params.type) {
        case 'circle':
            drawCirclePattern(params);
            break;
        case 'grid':
            drawGridPattern(params);
            break;
        case 'wave':
            drawWavePattern(params);
            break;
        case 'dots':
            drawDotsPattern(params);
            break;
    }

    // Add title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Is this REAL or FAKE?', canvas.width / 2, 40);
}

function drawCirclePattern(params: PatternParams) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 150;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        const art = params.artifacts[i] || { x: 0, y: 0 };

        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(x + (art.x || 0), y + (art.y || 0), 30, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGridPattern(params: PatternParams) {
    const cellSize = 60;
    const startX = 100;
    const startY = 80;

    let idx = 0;
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 6; j++) {
            let x = startX + i * cellSize;
            let y = startY + j * cellSize;

            const art = params.artifacts[idx++] || { x: 0, y: 0 };
            x += (art.x || 0);
            y += (art.y || 0);

            if ((i + j) % 2 === 0) {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            }
        }
    }
}

function drawWavePattern(params: PatternParams) {
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 4;

    let idx = 0;
    for (let wave = 0; wave < 5; wave++) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 5) {
            let y = canvas.height / 2 + Math.sin((x + wave * 100) / 30) * 50 + wave * 40 - 100;

            const art = params.artifacts[idx++] || { x: 0, y: 0 }; // We consume artifacts rapidly here
            // In original code, it was per point. Our artifact buffer is 200. 
            // 800 width / 5 step = 160 points per wave. 5 waves = 800 points.
            // We need more artifacts or reuse them. Modulo is fine.
            const safeArt = params.artifacts[idx % params.artifacts.length] || { x: 0, y: 0 };

            y += (safeArt.y || 0) + (art.y || 0);

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

function drawDotsPattern(params: PatternParams) {
    const spacing = 50;
    const startX = 100;
    const startY = 100;

    let idx = 0;
    for (let i = 0; i < 14; i++) {
        for (let j = 0; j < 8; j++) {
            let x = startX + i * spacing;
            let y = startY + j * spacing;
            let radius = 8;

            const art = params.artifacts[idx++] || { x: 0, y: 0, radius: 0 };
            x += (art.x || 0);
            y += (art.y || 0);
            radius += (art.radius || 0);

            if (radius < 0) radius = 1;

            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// UI Updates

function render() {
    drawPattern(appState.currentPatternParams);
    updateStatsUI();

    // Timer
    timerEl.textContent = `Time: ${appState.timeLeft}s`;
}

function updateStatsUI() {
    roundEl.textContent = appState.round.toString();
    correctEl.textContent = appState.correct.toString();
    wrongEl.textContent = appState.wrong.toString();
    scoreEl.textContent = appState.score.toString();

    const total = appState.correct + appState.wrong;
    const acc = total > 0 ? Math.round((appState.correct / total) * 100) : 0;
    accuracyEl.textContent = acc + '%';

    // Highlight difficulty
    diffBtns.forEach(btn => {
        if (btn.textContent?.toLowerCase() === appState.difficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Actions

function handleStart() {
    if (appState.gameActive) return;

    appState = startGameState(appState.difficulty); // keep selected difficulty
    handleNextRound();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
        appState = tickTimer(appState);
        render();

        if (!appState.gameActive && appState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    render();
}

function handleNextRound() {
    if (!appState.gameActive) {
        alert('Please start the game first!');
        return;
    }
    appState = nextRoundState(appState);
    feedbackEl.textContent = 'Make your choice: Real or Fake?';
    feedbackEl.style.color = '#666';
    render();
}

function handleChoice(choice: 'real' | 'fake') {
    if (!appState.gameActive || appState.answered) return;

    appState = processChoice(appState, choice);

    // Feedback
    // We can check correctness by comparing choice vs currentAnswer stored in state (though hidden from pattern params)
    // Wait, processChoice updates score/correct/wrong so we can just check if score increased?
    // Or we can check state.currentAnswer directly since we are in UI shell.
    const isCorrect = choice === appState.currentAnswer;

    if (isCorrect) {
        feedbackEl.textContent = '✅ Correct! Well done, Discriminator!';
        feedbackEl.style.color = '#4CAF50';
    } else {
        feedbackEl.textContent = `❌ Wrong! It was ${appState.currentAnswer?.toUpperCase()}`;
        feedbackEl.style.color = '#f44336';
    }

    render();

    // Auto advance
    setTimeout(() => {
        if (appState.gameActive) {
            handleNextRound();
        }
    }, 1500);
}

function handleReset() {
    if (timerInterval) clearInterval(timerInterval);
    appState = { ...INITIAL_STATE, difficulty: appState.difficulty };
    feedbackEl.textContent = 'Make your choice: Real or Fake?';
    feedbackEl.style.color = '#666';
    render();
}

function handleClientReset() {
    // Wrapper for button click
    handleReset();
}

function setDifficulty(diff: Difficulty) {
    appState.difficulty = diff;
    render();
}

function endGame() {
    if (timerInterval) clearInterval(timerInterval);

    const accuracy = Math.round((appState.correct / (appState.correct + appState.wrong)) * 100) || 0;
    let message = `⏱️ Time's Up!\n\n`;
    message += `Final Score: ${appState.score}\n`;
    message += `Correct: ${appState.correct}\n`;
    message += `Wrong: ${appState.wrong}\n`;
    message += `Accuracy: ${accuracy}%\n\n`;

    if (accuracy >= 80) {
        message += '🏆 Excellent! You\'re as good as a trained GAN Discriminator!';
    } else if (accuracy >= 60) {
        message += '👍 Good job! You can spot most fakes!';
    } else {
        message += '💪 Keep practicing! The Generator is fooling you!';
    }

    alert(message);
}

// Window exports
(window as any).startGame = handleStart;
(window as any).nextRound = handleNextRound;
(window as any).reset = handleClientReset;
(window as any).makeChoice = handleChoice;
(window as any).setDifficulty = setDifficulty;

// Init
render();
