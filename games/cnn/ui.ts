import {
    GameState, INITIAL_STATE, Pattern,
    checkAnswer, getRandomPattern, calculateAccuracy
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let timerInterval: number | null = null;
let selectedFilter: string | null = null;

// DOM Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scoreEl = document.getElementById('score')!;
const correctEl = document.getElementById('correct')!;
const wrongEl = document.getElementById('wrong')!;
const accuracyEl = document.getElementById('accuracy')!;
const streakEl = document.getElementById('streak')!;
const timerEl = document.getElementById('timer')!;
const challengeTextEl = document.getElementById('challengeText')!;
const feedbackEl = document.getElementById('feedback')!;
const filterBtns = document.querySelectorAll('.filter-btn');

function init() {
    resetGame();
}

function startGame() {
    if (appState.isActive) return;

    appState.isActive = true;
    appState.timeLeft = 60;
    nextPattern();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
        appState.timeLeft--;
        timerEl.textContent = `Time: ${appState.timeLeft} s`;

        if (appState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function nextPattern() {
    appState.currentPattern = getRandomPattern();
    drawPattern(appState.currentPattern);
    selectedFilter = null;
    filterBtns.forEach(btn => btn.classList.remove('selected'));
    challengeTextEl.textContent = 'Select the best filter for this pattern!';
    feedbackEl.textContent = 'Select a filter and check your answer!';
    feedbackEl.style.color = '#666';
}

function handleSelectFilter(filter: string) {
    if (!appState.isActive) return;

    selectedFilter = filter;
    filterBtns.forEach(btn => btn.classList.remove('selected'));

    // Find button to select (approximate match or passed event target logic in HTML wrapper)
    // We'll trust the wrapper to handle UI class, or we do it here:
    const typeMap: { [key: string]: string } = {
        'vertical': 'Vertical Edge',
        'horizontal': 'Horizontal Edge',
        'blur': 'Blur',
        'sharpen': 'Sharpen'
    };

    // Simple way: find button by text
    const btn = Array.from(filterBtns).find(b => b.textContent?.includes(typeMap[filter]));
    if (btn) btn.classList.add('selected');
}

function handleCheckAnswer() {
    if (!appState.isActive || !selectedFilter || !appState.currentPattern) {
        alert('Please start the game and select a filter!');
        return;
    }

    const { newState, isCorrect, points } = checkAnswer(appState, selectedFilter);
    appState = newState;

    if (isCorrect) {
        feedbackEl.textContent = `✅ Correct! + ${points} points`;
        feedbackEl.style.color = '#4CAF50';
    } else {
        feedbackEl.textContent = `❌ Wrong! The correct filter was: ${appState.currentPattern?.filter}`;
        feedbackEl.style.color = '#f44336';
    }

    updateStatsUI();

    setTimeout(() => {
        if (appState.isActive) {
            nextPattern();
        }
    }, 1500);
}

function resetGame() {
    appState = { ...INITIAL_STATE };
    if (timerInterval) clearInterval(timerInterval);
    selectedFilter = null;

    drawWelcomeScreen();

    challengeTextEl.textContent = 'Click "Start Game" to begin!';
    timerEl.textContent = 'Time: 60s';
    feedbackEl.textContent = 'Select a filter and check your answer!';
    feedbackEl.style.color = '#666';
    filterBtns.forEach(btn => btn.classList.remove('selected'));

    updateStatsUI();
}

function endGame() {
    appState.isActive = false;
    if (timerInterval) clearInterval(timerInterval);
    const accuracy = calculateAccuracy(appState.correct, appState.wrong);
    alert(`⏱️ Time's Up!\n\nFinal Score: ${appState.score}\nCorrect: ${appState.correct}\nWrong: ${appState.wrong}\nAccuracy: ${accuracy}%`);
}

function updateStatsUI() {
    correctEl.textContent = appState.correct.toString();
    wrongEl.textContent = appState.wrong.toString();
    const accuracy = calculateAccuracy(appState.correct, appState.wrong);
    accuracyEl.textContent = `${accuracy}%`;
    streakEl.textContent = appState.streak.toString();
    scoreEl.textContent = appState.score.toString();
}

function drawWelcomeScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click "Start Game" to begin!', canvas.width / 2, canvas.height / 2);
}

function drawPattern(pattern: Pattern) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 300;

    switch (pattern.type) {
        case 'vertical':
            ctx.fillStyle = '#333';
            for (let i = 0; i < 10; i++) {
                ctx.fillRect(centerX - size / 2 + i * 30, centerY - size / 2, 15, size);
            }
            break;

        case 'horizontal':
            ctx.fillStyle = '#333';
            for (let i = 0; i < 10; i++) {
                ctx.fillRect(centerX - size / 2, centerY - size / 2 + i * 30, size, 15);
            }
            break;

        case 'diagonal':
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 15;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(centerX - size / 2 + i * 40, centerY - size / 2);
                ctx.lineTo(centerX - size / 2 + i * 40 + size, centerY + size / 2);
                ctx.stroke();
            }
            break;

        case 'checkerboard':
            const cellSize = 30;
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if ((i + j) % 2 === 0) {
                        ctx.fillStyle = '#333';
                        ctx.fillRect(centerX - size / 2 + i * cellSize, centerY - size / 2 + j * cellSize, cellSize, cellSize);
                    }
                }
            }
            break;

        case 'noise':
            for (let i = 0; i < 5000; i++) {
                const x = centerX - size / 2 + Math.random() * size;
                const y = centerY - size / 2 + Math.random() * size;
                const brightness = Math.random() * 255;
                ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
                ctx.fillRect(x, y, 2, 2);
            }
            break;

        case 'grid':
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            for (let i = 0; i <= 10; i++) {
                ctx.beginPath();
                ctx.moveTo(centerX - size / 2 + i * 30, centerY - size / 2);
                ctx.lineTo(centerX - size / 2 + i * 30, centerY + size / 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(centerX - size / 2, centerY - size / 2 + i * 30);
                ctx.lineTo(centerX + size / 2, centerY - size / 2 + i * 30);
                ctx.stroke();
            }
            break;
    }

    // Draw pattern name
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Pattern: ' + pattern.name, canvas.width / 2, 50);

    ctx.font = '18px Arial';
    ctx.fillText('Which filter would best detect this pattern?', canvas.width / 2, 560);
}

// Global Exports
(window as any).startGame = startGame;
(window as any).checkAnswer = handleCheckAnswer;
(window as any).reset = resetGame;
(window as any).selectFilter = handleSelectFilter;

// Initialize
init();
