
import {
    GameState, INITIAL_STATE, SCENARIOS,
    checkJudgment, nextScenario, resetGame
} from './engine.js';

let appState: GameState = { ...INITIAL_STATE };

// DOM Elements
const scoreEl = document.getElementById('score')!;
const streakEl = document.getElementById('streak')!;
const bestStreakEl = document.getElementById('bestStreak')!;
const solvedEl = document.getElementById('solved')!;
const accuracyEl = document.getElementById('accuracy')!;
const progressBar = document.getElementById('progressBar')!;
const scenarioTitle = document.getElementById('scenarioTitle')!;
const scenarioText = document.getElementById('scenarioText')!;
const feedback = document.getElementById('feedback')!;
const feedbackTitle = document.getElementById('feedbackTitle')!;
const feedbackText = document.getElementById('feedbackText')!;
const optionsContainer = document.getElementById('judgmentOptions')!;
const achievementDiv = document.getElementById('achievement')!;
const achievementText = document.getElementById('achievementText')!;


const judgmentTypes = [
    {
        type: "Responsible Use",
        description: "Enhances learning and builds skills",
        color: "green"
    },
    {
        type: "Gray Area",
        description: "Depends on context and disclosure",
        color: "yellow"
    },
    {
        type: "Unsafe/Cheating",
        description: "Undermines learning or violates integrity",
        color: "red"
    }
];

function init() {
    (window as any).nextScenario = handleNextScenario;
    (window as any).resetGame = handleReset;

    loadScenario();
    updateStats();
}

function loadScenario() {
    if (appState.currentScenarioIndex >= SCENARIOS.length) {
        showFinalScore();
        return;
    }

    const scenario = SCENARIOS[appState.currentScenarioIndex];

    scenarioTitle.textContent = `Scenario ${appState.currentScenarioIndex + 1}: ${scenario.title}`;
    scenarioText.textContent = scenario.text;
    feedback.classList.remove('show');

    optionsContainer.innerHTML = '';

    judgmentTypes.forEach(judgment => {
        const optionDiv = document.createElement('div');
        optionDiv.className = `judgment-option ${judgment.color}`;
        optionDiv.innerHTML = `
            <h4>${judgment.type}</h4>
            <p>${judgment.description}</p>
        `;
        optionDiv.onclick = () => handleJudgment(judgment.type);
        optionsContainer.appendChild(optionDiv);
    });

    updateProgress();
}

function handleJudgment(selectedType: string) {
    if (appState.answered) return;

    const { newState, isCorrect, explanation } = checkJudgment(appState, selectedType);
    appState = newState;

    const currentScenario = SCENARIOS[appState.currentScenarioIndex];
    const options = document.querySelectorAll('.judgment-option');

    options.forEach(option => {
        const optionType = option.querySelector('h4')!.textContent;
        option.classList.add('disabled');

        if (optionType === currentScenario.correctAnswer) {
            option.classList.add('correct');
        } else if (optionType === selectedType && !isCorrect) {
            option.classList.add('incorrect');
        }
    });

    if (isCorrect) {
        feedbackTitle.textContent = '✅ Correct Judgment!';
        feedbackTitle.style.color = '#4CAF50';
        checkAchievements();
    } else {
        feedbackTitle.textContent = '❌ Different Perspective';
        feedbackTitle.style.color = '#f44336';
    }

    feedbackText.textContent = explanation;
    feedback.classList.add('show');
    updateStats();
}

function handleNextScenario() {
    if (!appState.answered) {
        alert('Please make a judgment first!');
        return;
    }

    if (appState.currentScenarioIndex >= SCENARIOS.length - 1) {
        showFinalScore();
        return;
    }

    appState = nextScenario(appState);
    loadScenario();
}

function handleReset() {
    appState = resetGame();
    loadScenario();
    updateStats();
}

function updateStats() {
    scoreEl.textContent = appState.score.toString();
    streakEl.textContent = appState.streak.toString();
    bestStreakEl.textContent = appState.bestStreak.toString();
    solvedEl.textContent = `${appState.currentScenarioIndex + (appState.answered ? 1 : 0)}/${SCENARIOS.length}`;

    const count = Math.max(appState.currentScenarioIndex + (appState.answered ? 1 : 0), 1);
    const accuracy = Math.round((appState.correctCount / count) * 100);
    accuracyEl.textContent = `${accuracy}%`;
}

function updateProgress() {
    const progress = ((appState.currentScenarioIndex + (appState.answered ? 1 : 0)) / SCENARIOS.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function checkAchievements() {
    if (appState.streak === 3) {
        achievementText.textContent = '🔥 3 in a row! Sharp judgment!';
        achievementDiv.classList.add('show');
        setTimeout(() => achievementDiv.classList.remove('show'), 3000);
    } else if (appState.streak === 5) {
        achievementText.textContent = '⭐ 5 streak! Ethics Expert!';
        achievementDiv.classList.add('show');
        setTimeout(() => achievementDiv.classList.remove('show'), 3000);
    } else if (appState.streak === 10) {
        achievementText.textContent = '🏆 10 streak! Master Judge!';
        achievementDiv.classList.add('show');
        setTimeout(() => achievementDiv.classList.remove('show'), 3000);
    } else if (appState.correctCount === SCENARIOS.length && appState.currentScenarioIndex === SCENARIOS.length - 1) {
        achievementText.textContent = '👑 Perfect Score! Ultimate AI Ethics Judge!';
        achievementDiv.classList.add('show');
        setTimeout(() => achievementDiv.classList.remove('show'), 3000);
    }
}

function showFinalScore() {
    const accuracy = Math.round((appState.correctCount / SCENARIOS.length) * 100);
    let message = '';

    if (accuracy === 100) {
        message = '👑 Perfect! You have excellent judgment about responsible AI use!';
    } else if (accuracy >= 85) {
        message = '⭐ Excellent! You understand responsible AI use very well.';
    } else if (accuracy >= 70) {
        message = '👍 Good work! You have a solid grasp of AI ethics.';
    } else if (accuracy >= 60) {
        message = '📚 Not bad! Review the lesson to strengthen your understanding.';
    } else {
        message = '💡 Review the lesson and try again. Understanding these nuances is important!';
    }

    alert(`Game Complete!\n\nFinal Score: ${appState.score}\nAccuracy: ${accuracy}%\nBest Streak: ${appState.bestStreak}\n\n${message}`);
    // Optionally reset or just leave it
}

init();
