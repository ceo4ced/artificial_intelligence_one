
import {
    GameState, INITIAL_STATE, SCENARIOS,
    processAnswer, advanceScenario, calculateAccuracy
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let hasAnsweredCurrent = false;

// DOM Elements
const scenarioTitleEl = document.getElementById('scenarioTitle')!;
const scenarioTextEl = document.getElementById('scenarioText')!;
const biasOptionsEl = document.getElementById('biasOptions')!;
const feedbackEl = document.getElementById('feedback')!;
const feedbackTitleEl = document.getElementById('feedbackTitle')!;
const feedbackTextEl = document.getElementById('feedbackText')!;
const scoreEl = document.getElementById('score')!;
const streakEl = document.getElementById('streak')!;
const bestStreakEl = document.getElementById('bestStreak')!;
const solvedEl = document.getElementById('solved')!;
const accuracyEl = document.getElementById('accuracy')!;
const progressBarEl = document.getElementById('progressBar')!;
const achievementEl = document.getElementById('achievement')!;
const achievementTextEl = document.getElementById('achievementText')!;

// Initialization
function init() {
    renderScenario();
    updateStatsUI();
}

function renderScenario() {
    if (appState.isGameComplete) return;

    const scenario = SCENARIOS[appState.currentScenarioIndex];
    hasAnsweredCurrent = false;

    scenarioTitleEl.textContent = `Scenario ${appState.currentScenarioIndex + 1}: ${scenario.title}`;
    scenarioTextEl.textContent = scenario.text;

    feedbackEl.classList.remove('show');
    biasOptionsEl.innerHTML = '';

    scenario.options.forEach(option => {
        const div = document.createElement('div');
        div.className = 'bias-option';
        div.innerHTML = `
            <h4>${option.type}</h4>
            <p>${option.description}</p>
        `;
        div.onclick = () => handleAnswer(option.type);
        biasOptionsEl.appendChild(div);
    });

    updateProgressUI();
}

function handleAnswer(selectedType: string) {
    if (hasAnsweredCurrent) return;

    const scenario = SCENARIOS[appState.currentScenarioIndex];
    const result = processAnswer(appState, selectedType, scenario);

    appState = result.newState;
    hasAnsweredCurrent = true;
    const isCorrect = result.isCorrect;

    // UI Updates for options
    const options = document.querySelectorAll('.bias-option');
    options.forEach(opt => {
        const type = opt.querySelector('h4')?.textContent;
        opt.classList.add('disabled');

        if (type === scenario.correctAnswer) {
            opt.classList.add('correct');
        } else if (type === selectedType && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });

    // Feedback UI
    if (isCorrect) {
        feedbackTitleEl.textContent = '✅ Correct!';
        feedbackTitleEl.style.color = '#4CAF50';
        checkAchievements();
    } else {
        feedbackTitleEl.textContent = '❌ Not Quite';
        feedbackTitleEl.style.color = '#f44336';
    }
    feedbackTextEl.textContent = scenario.explanation;
    feedbackEl.classList.add('show');

    updateStatsUI();
    updateProgressUI();
}

function handleNextScenario() {
    if (!hasAnsweredCurrent) {
        alert('Please select an answer first!');
        return;
    }

    if (appState.currentScenarioIndex < SCENARIOS.length - 1) {
        appState = advanceScenario(appState, SCENARIOS.length);
        renderScenario();
    } else {
        // End game logic
        showFinalScore();
    }
}

function handleResetGame() {
    appState = { ...INITIAL_STATE };
    hasAnsweredCurrent = false;
    renderScenario();
    updateStatsUI();
}

function updateStatsUI() {
    scoreEl.textContent = appState.score.toString();
    streakEl.textContent = appState.streak.toString();
    bestStreakEl.textContent = appState.bestStreak.toString();

    const questionsSeen = appState.currentScenarioIndex + (hasAnsweredCurrent ? 1 : 0);
    solvedEl.textContent = `${questionsSeen}/${SCENARIOS.length}`;

    const accuracy = calculateAccuracy(appState.correctCount, Math.max(questionsSeen, 1));
    accuracyEl.textContent = `${accuracy}%`;
}

function updateProgressUI() {
    const questionsSeen = appState.currentScenarioIndex + (hasAnsweredCurrent ? 1 : 0);
    const progress = (questionsSeen / SCENARIOS.length) * 100;
    progressBarEl.style.width = `${progress}%`;
}

function checkAchievements() {
    let message = '';
    if (appState.streak === 3) message = "🔥 3 in a row! You're on fire!";
    else if (appState.streak === 5) message = "⭐ 5 streak! Bias Detective Master!";
    else if (appState.correctCount === SCENARIOS.length && appState.currentScenarioIndex === SCENARIOS.length - 1) {
        message = "👑 Perfect Score! Ultimate Detective!";
    }

    if (message) {
        achievementTextEl.textContent = message;
        achievementEl.classList.add('show');
        setTimeout(() => achievementEl.classList.remove('show'), 3000);
    }
}

function showFinalScore() {
    const accuracy = calculateAccuracy(appState.correctCount, SCENARIOS.length);
    let message = '';

    if (accuracy === 100) message = "👑 Perfect! You're a Bias Detection Expert!";
    else if (accuracy >= 80) message = "⭐ Excellent work! You have a strong understanding of AI bias.";
    else if (accuracy >= 60) message = "👍 Good job! Keep learning about AI bias.";
    else message = "📚 Review the lesson and try again!";

    alert(`Game Complete!\n\nFinal Score: ${appState.score}\nAccuracy: ${accuracy}%\nBest Streak: ${appState.bestStreak}\n\n${message}`);
}

// Global Exports
(window as any).nextScenario = handleNextScenario;
(window as any).resetGame = handleResetGame;

// Start
init();
