
import {
    GameState, INITIAL_STATE, Color, COLORS,
    startRound, checkAnswer, resetGame
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };

// DOM Elements
const levelEl = document.getElementById('level')!;
const seqLengthEl = document.getElementById('seqLength')!;
const correctEl = document.getElementById('correct')!;
const wrongEl = document.getElementById('wrong')!;
const streakEl = document.getElementById('streak')!;
const scoreEl = document.getElementById('score')!;
const displayArea = document.getElementById('displayArea')!;

function init() {
    (window as any).startRound = handleStartRound;
    (window as any).reset = handleReset;
    (window as any).checkAnswer = handleCheckAnswer;
    updateStats();
}

function handleStartRound() {
    appState = startRound(appState);
    showSequence();
    updateStats();
}

function showSequence() {
    displayArea.innerHTML = '<div class="phase-text">Watch carefully...</div><div class="sequence-items" id="sequenceItems"></div>';

    const itemsContainer = document.getElementById('sequenceItems')!;
    let index = 0;

    const interval = setInterval(() => {
        if (index < appState.currentSequence.length) {
            const item = document.createElement('div');
            item.className = `sequence-item ${appState.currentSequence[index].class}`;
            item.textContent = appState.currentSequence[index].emoji;
            itemsContainer.appendChild(item);
            index++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                showInputPhase();
            }, 1000);
        }
    }, 800);
}

function showInputPhase() {
    appState.phase = 'input';

    displayArea.innerHTML = `
        <div class="phase-text">What comes next in the pattern?</div>
        <div class="sequence-items" id="shownSequence"></div>
        <div class="input-buttons" id="inputButtons"></div>
    `;

    // Show the sequence again (without the last item)
    const shownContainer = document.getElementById('shownSequence')!;
    for (let i = 0; i < appState.currentSequence.length - 1; i++) {
        const item = document.createElement('div');
        item.className = `sequence-item ${appState.currentSequence[i].class}`;
        item.textContent = appState.currentSequence[i].emoji;
        shownContainer.appendChild(item);
    }

    // Add question mark
    const questionMark = document.createElement('div');
    questionMark.className = 'sequence-item';
    questionMark.style.background = '#e0e0e0';
    questionMark.style.color = '#666';
    questionMark.textContent = '?';
    shownContainer.appendChild(questionMark);

    // Create input buttons
    const inputContainer = document.getElementById('inputButtons')!;
    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 6);

    shuffledColors.forEach(color => {
        const btn = document.createElement('button');
        btn.className = `input-btn ${color.class}`;
        btn.textContent = color.emoji;
        btn.onclick = () => handleCheckAnswer(color);
        inputContainer.appendChild(btn);
    });
}

function handleCheckAnswer(selectedColor: Color) {
    if (appState.phase !== 'input') return;

    const { newState, points, isCorrect } = checkAnswer(appState, selectedColor);

    if (isCorrect && newState.level > appState.level) {
        alert(`🎉 Level Up! Now at level ${newState.level}\nSequence length increased to ${newState.sequenceLength}!`);
    }

    appState = newState;
    showFeedback(isCorrect, points);
    updateStats();
}

function showFeedback(isCorrect: boolean, points: number) {
    if (isCorrect) {
        displayArea.innerHTML = `
            <div class="phase-text" style="color: #4CAF50;">✅ Correct! +${points} points</div>
            <div class="sequence-items">
                ${appState.currentSequence.map(c => `<div class="sequence-item ${c.class}">${c.emoji}</div>`).join('')}
            </div>
        `;
    } else {
        displayArea.innerHTML = `
            <div class="phase-text" style="color: #f44336;">❌ Wrong!</div>
            <div class="sequence-items">
                ${appState.currentSequence.map(c => `<div class="sequence-item ${c.class}">${c.emoji}</div>`).join('')}
            </div>
            <p style="margin-top: 20px;">The correct answer was: ${appState.currentSequence[appState.currentSequence.length - 1].emoji}</p>
        `;
    }

    setTimeout(() => {
        displayArea.innerHTML = '<div class="phase-text">Click "Start Round" for next sequence!</div>';
        appState.phase = 'ready';
    }, 2000);
}

function handleReset() {
    appState = resetGame();
    updateStats();
    displayArea.innerHTML = '<div class="phase-text">Click "Start Round" to begin!</div>';
}

function updateStats() {
    levelEl.textContent = appState.level.toString();
    seqLengthEl.textContent = appState.sequenceLength.toString();
    correctEl.textContent = appState.correct.toString();
    wrongEl.textContent = appState.wrong.toString();
    streakEl.textContent = appState.streak.toString();
    scoreEl.textContent = appState.score.toString();
}

init();
