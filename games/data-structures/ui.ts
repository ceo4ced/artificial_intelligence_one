
import {
    GameState, INITIAL_STATE, SCENARIOS, STRUCTURE_DEFINITIONS,
    checkAnswer
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let selectedStructureId: string | null = null;
let hasAnsweredCurrent = false;

// DOM Elements
const scoreEl = document.getElementById('score')!;
const perfectEl = document.getElementById('perfect')!;
const solvedEl = document.getElementById('solved')!;
const accuracyEl = document.getElementById('accuracy')!;
const bonusEl = document.getElementById('bonus')!;
const progressBar = document.getElementById('progressBar')!;
const scenarioTitleEl = document.getElementById('scenarioTitle')!;
const scenarioDescriptionEl = document.getElementById('scenarioDescription')!;
const dataItemsEl = document.getElementById('dataItems')!;
const structureOptionsEl = document.getElementById('structureOptions')!;
const feedbackEl = document.getElementById('feedback')!;
const feedbackTitleEl = document.getElementById('feedbackTitle')!;
const feedbackTextEl = document.getElementById('feedbackText')!;
const previewEl = document.getElementById('preview')!;

function init() {
    loadScenario();
    updateStatsUI();

    // Expose global functions for button clicks
    (window as any).checkAnswer = handleCheckAnswer;
    (window as any).nextScenario = handleNextScenario;
}

function loadScenario() {
    if (appState.currentScenarioIndex >= SCENARIOS.length) {
        showFinalScore();
        return;
    }

    const scenario = SCENARIOS[appState.currentScenarioIndex];
    hasAnsweredCurrent = false;
    selectedStructureId = null;

    scenarioTitleEl.textContent = `Scenario ${appState.currentScenarioIndex + 1}: ${scenario.title}`;
    scenarioDescriptionEl.textContent = scenario.description;
    feedbackEl.classList.remove('show');

    // Load data items
    let dataHTML = '<h4>The Messy Data:</h4>';
    scenario.data.forEach(item => {
        dataHTML += `<div class="data-item">${item}</div>`;
    });
    dataItemsEl.innerHTML = dataHTML;

    // Load structure options
    structureOptionsEl.innerHTML = '';

    // Filter structures - hide dictionary if not acceptable (as per original logic logic: if not acceptable, hide it? 
    // Wait, original code: if (!scenario.acceptableAnswers.includes('dictionary')) structuresToShow = ...filter(s => s.id !== 'dictionary');
    // So if dictionary is NOT acceptable, hide it? This implies dictionary is only shown when it IS acceptable?
    // Let's keep that logic.

    let structuresToShow = STRUCTURE_DEFINITIONS;
    if (!scenario.acceptableAnswers.includes('dictionary')) {
        structuresToShow = STRUCTURE_DEFINITIONS.filter(s => s.id !== 'dictionary');
    }

    structuresToShow.forEach(structure => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'structure-option';
        optionDiv.innerHTML = `
            <h4>${structure.icon} ${structure.name}</h4>
            <p>${structure.description}</p>
        `;
        optionDiv.onclick = () => selectStructure(structure.id, optionDiv);
        structureOptionsEl.appendChild(optionDiv);
    });

    updateProgressUI();
}

function selectStructure(structureId: string, element: HTMLElement) {
    if (hasAnsweredCurrent) return;

    // Remove previous selection
    document.querySelectorAll('.structure-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // Add new selection
    element.classList.add('selected');
    selectedStructureId = structureId;
}

function handleCheckAnswer() {
    if (hasAnsweredCurrent) {
        alert('Already answered! Click "Next Scenario" to continue.');
        return;
    }

    if (!selectedStructureId) {
        alert('Please select a data structure first!');
        return;
    }

    hasAnsweredCurrent = true;
    const scenario = SCENARIOS[appState.currentScenarioIndex];

    const result = checkAnswer(appState, scenario, selectedStructureId);
    appState = result.newState;

    // UI Updates based on result
    const options = document.querySelectorAll('.structure-option');
    options.forEach(option => {
        option.classList.add('disabled');
        const optionId = STRUCTURE_DEFINITIONS.find(s =>
            option.textContent?.includes(s.name)
        )?.id;

        if (optionId === scenario.bestAnswer) {
            option.classList.add('correct');
        } else if (optionId === selectedStructureId && !result.isAcceptable) {
            option.classList.add('incorrect');
        }
    });

    if (result.isBest) {
        feedbackTitleEl.textContent = '✅ Perfect Choice!';
        feedbackTitleEl.style.color = '#4CAF50';
        feedbackTextEl.innerHTML = `<strong>${scenario.explanation}</strong>`;
    } else if (result.isAcceptable) {
        feedbackTitleEl.textContent = '👍 Acceptable, but not optimal';
        feedbackTitleEl.style.color = '#ff9800';
        feedbackTextEl.innerHTML = `The best answer is <strong>${scenario.bestAnswer}</strong>. ${scenario.explanation}`;
    } else {
        feedbackTitleEl.textContent = '❌ Not the best choice';
        feedbackTitleEl.style.color = '#f44336';
        const reason = scenario.whyNotOthers[selectedStructureId!] || "";
        feedbackTextEl.innerHTML = `<strong>Why not ${selectedStructureId}?</strong> ${reason}<br><br>${scenario.explanation}`;
    }

    previewEl.innerHTML = `<strong>How it looks as a ${scenario.bestAnswer}:</strong><br><pre style="margin-top: 10px; font-family: monospace; color: #2d3748;">${scenario.preview}</pre>`;
    feedbackEl.classList.add('show');

    updateStatsUI();
}

function handleNextScenario() {
    if (!hasAnsweredCurrent) {
        alert('Please check your answer first!');
        return;
    }

    appState.currentScenarioIndex++;
    loadScenario();
}

function updateStatsUI() {
    scoreEl.textContent = appState.score.toString();
    perfectEl.textContent = appState.perfectAnswers.toString();

    const played = appState.currentScenarioIndex + (hasAnsweredCurrent ? 1 : 0);
    solvedEl.textContent = `${played}/${SCENARIOS.length}`;

    const acc = played > 0 ? Math.round((appState.correctAnswers / played) * 100) : 0;
    accuracyEl.textContent = `${acc}%`;

    bonusEl.textContent = `+${appState.perfectAnswers * 10}`;
}

function updateProgressUI() {
    const played = appState.currentScenarioIndex + (hasAnsweredCurrent ? 1 : 0);
    const progress = (played / SCENARIOS.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function showFinalScore() {
    const accuracy = Math.round((appState.correctAnswers / SCENARIOS.length) * 100);
    const totalScore = appState.score; // In new logic, score includes bonuses if applied directly, but original added perfectAnswers * 10 at end.
    // My checkAnswer logic: points = 100 (best) or 60. 
    // Original logic: score += 100 or 60. Then at end showFinalScore: totalScore = score + (perfectAnswers * 10).
    // I should replicate that calculation for the alert.

    const displayScore = totalScore + (appState.perfectAnswers * 10);

    let message = '';
    if (appState.perfectAnswers === SCENARIOS.length) {
        message = '🏆 Perfect! You\'re a Data Structure Master!';
    } else if (accuracy === 100) {
        message = '⭐ Excellent! You understand data structures well!';
    } else if (accuracy >= 80) {
        message = '👍 Great job! You have a solid grasp of data structures.';
    } else if (accuracy >= 60) {
        message = '📚 Good start! Review the lesson to improve your understanding.';
    } else {
        message = '💡 Keep learning! Data structures take practice to master.';
    }

    alert(`Game Complete!\n\nFinal Score: ${displayScore}\nPerfect Answers: ${appState.perfectAnswers}/${SCENARIOS.length}\nAccuracy: ${accuracy}%\n\n${message}`);
    // Optionally reset or disable buttons
}

init();
