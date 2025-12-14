
import {
    GameState, INITIAL_STATE, Sentence,
    initGame, getNextSentence, checkPrediction, shuffle
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let answered = false;

// DOM Elements
const textDisplay = document.getElementById('textDisplay')!;
const predictionButtons = document.getElementById('predictionButtons')!;
const correctEl = document.getElementById('correct')!;
const totalEl = document.getElementById('total')!;
const accuracyEl = document.getElementById('accuracy')!;
const streakEl = document.getElementById('streak')!;
const scoreEl = document.getElementById('score')!;

function init() {
    (window as any).nextSentence = handleNextSentence;
    (window as any).reset = handleReset;

    handleReset();
}

function handleNextSentence() {
    appState = getNextSentence(appState);
    renderSentence(appState.currentSentence!);
    answered = false;
}

function handleReset() {
    appState = initGame();
    updateStats();
    textDisplay.innerHTML = '<p style="color: #999; text-align: center; margin-top: 80px;">Click "Next Sentence" to begin!</p>';
    predictionButtons.innerHTML = '';
    answered = false;
}

function renderSentence(sentence: Sentence) {
    textDisplay.innerHTML = `<p style="font-size: 1.2em;">${sentence.text} <span class="current-word">____</span></p>`;
    predictionButtons.innerHTML = '';

    const shuffledOptions = shuffle([...sentence.options]);
    shuffledOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'predict-btn';
        btn.textContent = option;
        btn.onclick = () => handleCheckAnswer(option, sentence.answer);
        predictionButtons.appendChild(btn);
    });
}

function handleCheckAnswer(selected: string, correct: string) {
    if (answered) return;
    answered = true;

    const { newState, points, isCorrect } = checkPrediction(appState, selected, correct);
    appState = newState;

    // UI Feedback
    const buttons = document.querySelectorAll('.predict-btn');
    buttons.forEach((b: any) => {
        b.onclick = null;
        if (b.textContent === correct) {
            b.classList.add('correct');
        } else if (b.textContent === selected && !isCorrect) {
            b.classList.add('wrong');
        }
    });

    if (isCorrect) {
        setTimeout(() => {
            alert(`✅ Correct! +${points} points`);
        }, 300);
    } else {
        setTimeout(() => {
            alert(`❌ Wrong! The correct answer was "${correct}"`);
        }, 300);
    }

    updateStats();
}

function updateStats() {
    correctEl.textContent = appState.correctCount.toString();
    totalEl.textContent = appState.totalCount.toString();
    accuracyEl.textContent = appState.totalCount > 0
        ? Math.round((appState.correctCount / appState.totalCount) * 100) + '%'
        : '0%';
    streakEl.textContent = appState.streak.toString();
    scoreEl.textContent = appState.score.toString();
}

init();
