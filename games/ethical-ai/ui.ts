
import {
    GameState, INITIAL_STATE, SCENARIOS,
    calculateRatingResult, updateGameState, advanceScenario, getRiskLabelColor
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let hasAnsweredCurrent = false;

// DOM Elements
const scenarioTitleEl = document.getElementById('scenarioTitle')!;
const scenarioTextEl = document.getElementById('scenarioText')!;
const sliderEl = document.getElementById('riskSlider') as HTMLInputElement;
const riskDisplayEl = document.getElementById('riskDisplay')!;
const feedbackEl = document.getElementById('feedback')!;
const feedbackTitleEl = document.getElementById('feedbackTitle')!;
const feedbackTextEl = document.getElementById('feedbackText')!;
const expertRatingEl = document.getElementById('expertRating')!;

const totalScoreEl = document.getElementById('totalScore')!;
const scenarioCountEl = document.getElementById('scenarioCount')!;
const avgAccuracyEl = document.getElementById('avgAccuracy')!;
const bestRatingEl = document.getElementById('bestRating')!;
const progressBarEl = document.getElementById('progressBar')!;

// Initialization
function init() {
    renderScenario();
    updateStatsUI();

    // Slider listener
    sliderEl.addEventListener('input', handleSliderInput);
}

function handleSliderInput() {
    const value = parseInt(sliderEl.value);
    const { text, color } = getRiskLabelColor(value);

    riskDisplayEl.textContent = text;
    riskDisplayEl.style.background = color;
}

function renderScenario() {
    if (appState.isGameComplete) return;

    const scenario = SCENARIOS[appState.currentScenarioIndex];
    hasAnsweredCurrent = false;

    scenarioTitleEl.textContent = `Scenario ${appState.currentScenarioIndex + 1}: ${scenario.title}`;
    scenarioTextEl.textContent = scenario.text;
    feedbackEl.classList.remove('show');

    // Reset slider
    sliderEl.value = '50';
    handleSliderInput(); // Trigger visual update

    updateProgressUI();
}

function handleSubmitRating() {
    if (hasAnsweredCurrent) return;
    hasAnsweredCurrent = true;

    const scenario = SCENARIOS[appState.currentScenarioIndex];
    const userRating = parseInt(sliderEl.value);

    const result = calculateRatingResult(userRating, scenario.expertRating);
    appState = updateGameState(appState, result);

    // Show Feedback
    renderFeedback(result, scenario);
    updateStatsUI();
}

function renderFeedback(result: any, scenario: any) {
    const { accuracy, points } = result;

    if (accuracy >= 90) {
        feedbackEl.style.background = '#e8f5e9';
        feedbackEl.style.borderLeft = '4px solid #4CAF50';
        feedbackTitleEl.style.color = '#2e7d32';
        feedbackTitleEl.textContent = '🎯 Excellent! Almost perfect!';
    } else if (accuracy >= 70) {
        feedbackEl.style.background = '#fff9c4';
        feedbackEl.style.borderLeft = '4px solid #FFC107';
        feedbackTitleEl.style.color = '#f57c00';
        feedbackTitleEl.textContent = '👍 Good judgment!';
    } else {
        feedbackEl.style.background = '#ffebee';
        feedbackEl.style.borderLeft = '4px solid #f44336';
        feedbackTitleEl.style.color = '#c62828';
        feedbackTitleEl.textContent = '🤔 Consider this perspective...';
    }

    feedbackTextEl.textContent = scenario.explanation;
    expertRatingEl.innerHTML = `<strong>Expert Rating:</strong> ${scenario.expertRating}/100 (${scenario.expertRating < 33 ? 'Low' : scenario.expertRating < 67 ? 'Medium' : 'High'} Risk)<br><br><strong>Key Principles:</strong> ${scenario.principles}<br><br><strong>Your Score:</strong> +${points} points (${accuracy.toFixed(0)}% accuracy)`;

    feedbackEl.classList.add('show');
}

function handleNextScenario() {
    if (!hasAnsweredCurrent) {
        alert('Please submit your rating first!');
        return;
    }

    if (appState.currentScenarioIndex < SCENARIOS.length - 1) {
        appState = advanceScenario(appState);
        renderScenario();
    } else {
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
    totalScoreEl.textContent = appState.totalScore.toString();
    const count = appState.currentScenarioIndex + (hasAnsweredCurrent ? 1 : 0);
    scenarioCountEl.textContent = `${count}/${SCENARIOS.length}`;

    const avg = count > 0 ? appState.accuracySum / count : 0;
    avgAccuracyEl.textContent = `${avg.toFixed(0)}%`;
    bestRatingEl.textContent = `${appState.bestRating.toFixed(0)}%`;
}

function updateProgressUI() {
    const count = appState.currentScenarioIndex + (hasAnsweredCurrent ? 1 : 0);
    const progress = (count / SCENARIOS.length) * 100;
    progressBarEl.style.width = `${progress}%`;
}

function showFinalScore() {
    const avgAcc = appState.accuracySum / SCENARIOS.length;
    let message = '';

    if (avgAcc >= 85) message = '👑 Outstanding! You have exceptional ethical judgment!';
    else if (avgAcc >= 70) message = '⭐ Great work! You understand AI ethics well.';
    else if (avgAcc >= 55) message = '👍 Good effort! Keep learning about AI ethics.';
    else message = '📚 Review the lesson and try again!';

    alert(`Game Complete!\n\nFinal Score: ${appState.totalScore}\nAverage Accuracy: ${avgAcc.toFixed(0)}%\nBest Rating: ${appState.bestRating.toFixed(0)}%\n\n${message}`);
}

// Global Exports
(window as any).submitRating = handleSubmitRating;
(window as any).nextScenario = handleNextScenario;
(window as any).resetGame = handleResetGame;

// Start
init();
