
import {
    GameState, INITIAL_STATE, SCENARIOS, Scenario,
    checkAnswer
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };

// DOM Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scenarioTitleEl = document.getElementById('scenarioTitle')!;
const scenarioDescEl = document.getElementById('scenarioDesc')!;
const chartTitleEl = document.getElementById('chartTitle')!;
const questionSectionEl = document.getElementById('questionSection')!;
const questionTextEl = document.getElementById('questionText')!;
const answerOptionsEl = document.getElementById('answerOptions')!;
const feedbackEl = document.getElementById('feedback')!;
const hintBoxEl = document.getElementById('hintBox')!;
const hintTextEl = document.getElementById('hintText')!;
const answeredEl = document.getElementById('answered')!;
const correctEl = document.getElementById('correct')!;
const accuracyEl = document.getElementById('accuracy')!;
const scoreEl = document.getElementById('score')!;
const displayScoreEl = document.getElementById('displayScore')!;
const progressBar = document.getElementById('progressBar')!;
const progressText = document.getElementById('progressText')!;

function init() {
    drawWelcomeScreen();
    // Expose global functions
    (window as any).startGame = startGame;
    (window as any).nextQuestion = handleNextQuestion;
    (window as any).showHint = handleShowHint;
}

function startGame() {
    appState = { ...INITIAL_STATE, gameStarted: true };
    updateStatsUI();
    loadScenario();
}

function loadScenario() {
    if (appState.currentScenarioIndex >= SCENARIOS.length) {
        endGame();
        return;
    }

    const scenario = SCENARIOS[appState.currentScenarioIndex];
    appState.currentQuestionIndex = 0;

    scenarioTitleEl.textContent = scenario.title;
    scenarioDescEl.textContent = scenario.description;
    chartTitleEl.textContent = scenario.title;

    drawScatterplot(scenario);
    loadQuestion();
}

function loadQuestion() {
    const scenario = SCENARIOS[appState.currentScenarioIndex];
    const question = scenario.questions[appState.currentQuestionIndex];

    questionSectionEl.style.display = 'block';
    questionTextEl.textContent = question.question;
    hintBoxEl.style.display = 'none';
    hintTextEl.textContent = question.hint;

    answerOptionsEl.innerHTML = '';
    question.answers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer.text;
        btn.onclick = () => handleSelectAnswer(index);
        answerOptionsEl.appendChild(btn);
    });

    feedbackEl.className = 'feedback';
    feedbackEl.innerHTML = '';
    updateProgressUI();
}

function handleSelectAnswer(answerIndex: number) {
    const scenario = SCENARIOS[appState.currentScenarioIndex];
    const question = scenario.questions[appState.currentQuestionIndex];

    // Disable buttons
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn: any) => btn.disabled = true);
    buttons[answerIndex].classList.add('selected');

    const result = checkAnswer(appState, appState.currentScenarioIndex, appState.currentQuestionIndex, answerIndex);
    appState = result.newState;

    if (result.isCorrect) {
        buttons[answerIndex].classList.add('correct');
        feedbackEl.className = 'feedback correct show';
        feedbackEl.innerHTML = '<strong>Correct!</strong> ' + getPositiveFeedback();
    } else {
        buttons[answerIndex].classList.add('incorrect');
        const correctIndex = question.answers.findIndex(a => a.correct);
        buttons[correctIndex].classList.add('correct');
        feedbackEl.className = 'feedback incorrect show';
        feedbackEl.innerHTML = '<strong>Incorrect.</strong> The correct answer is: ' +
            question.answers[correctIndex].text;
    }

    updateStatsUI();

    setTimeout(() => {
        moveToNextQuestion();
    }, 3000);
}

function moveToNextQuestion() {
    if (!appState.gameStarted) return;

    const scenario = SCENARIOS[appState.currentScenarioIndex];
    appState.currentQuestionIndex++;

    if (appState.currentQuestionIndex >= scenario.questions.length) {
        appState.currentScenarioIndex++;
        loadScenario();
    } else {
        loadQuestion();
    }
}

function handleNextQuestion() {
    if (!appState.gameStarted) {
        alert('Please start the game first!');
        return;
    }
    // Logic: Skip current question? Original code calls moveToNextQuestion, which just advances.
    // If not answered, it counts as skipped? The original code didn't strictly force answering but buttons disabled after answer.
    // If user clicks next before answering, it skips.
    moveToNextQuestion();
}

function handleShowHint() {
    hintBoxEl.style.display = hintBoxEl.style.display === 'none' ? 'block' : 'none';
}

function drawScatterplot(scenario: Scenario) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = 100;
    const offsetY = 60;
    const chartWidth = 700;
    const chartHeight = 380;

    // Light gridlines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * chartHeight / 5);
        ctx.lineTo(offsetX + chartWidth, offsetY + i * chartHeight / 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(offsetX + i * chartWidth / 5, offsetY);
        ctx.lineTo(offsetX + i * chartWidth / 5, offsetY + chartHeight);
        ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX, offsetY + chartHeight);
    ctx.lineTo(offsetX + chartWidth, offsetY + chartHeight);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';

    // Y-axis label
    ctx.save();
    ctx.translate(30, offsetY + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(scenario.yLabel, 0, 0);
    ctx.restore();

    // X-axis label
    ctx.fillText(scenario.xLabel, offsetX + chartWidth / 2, offsetY + chartHeight + 40);

    // Find min/max for scaling
    // Use fallback if data is empty (though it shouldn't be)
    const xValues = scenario.data.map(d => d.x);
    const yValues = scenario.data.map(d => d.y);
    const xMin = xValues.length ? Math.min(...xValues) : 0;
    const xMax = xValues.length ? Math.max(...xValues) : 100;
    const yMin = yValues.length ? Math.min(...yValues) : 0;
    const yMax = yValues.length ? Math.max(...yValues) : 100;

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    // Draw data points
    scenario.data.forEach(point => {
        const x = offsetX + ((point.x - xMin) / xRange) * chartWidth;
        const y = offsetY + chartHeight - ((point.y - yMin) / yRange) * chartHeight;

        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Axis tick marks
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';

    for (let i = 0; i <= 5; i++) {
        const xVal = (xMin + (xRange * i / 5)).toFixed(0);
        const yVal = (yMin + (yRange * i / 5)).toFixed(0);

        ctx.fillText(xVal, offsetX + i * chartWidth / 5, offsetY + chartHeight + 20);
        ctx.textAlign = 'right';
        ctx.fillText(yVal, offsetX - 10, offsetY + chartHeight - i * chartHeight / 5 + 5);
        ctx.textAlign = 'center';
    }
}

function updateStatsUI() {
    answeredEl.textContent = appState.totalAnswered.toString();
    correctEl.textContent = appState.totalCorrect.toString();
    const acc = appState.totalAnswered > 0
        ? Math.round((appState.totalCorrect / appState.totalAnswered) * 100)
        : 0;
    accuracyEl.textContent = `${acc}%`;
    scoreEl.textContent = appState.score.toString();
    displayScoreEl.textContent = appState.score.toString();
}

function updateProgressUI() {
    const totalQuestions = SCENARIOS.reduce((sum, s) => sum + s.questions.length, 0);
    // Note: totalAnswered is cumulative.
    // If we want a progress bar of *current position vs total*, we should calculate:
    // (Previous scenarios questions) + currentQuestionIndex
    let questionsBefore = 0;
    for (let i = 0; i < appState.currentScenarioIndex; i++) {
        questionsBefore += SCENARIOS[i].questions.length;
    }
    const currentTotalIndex = questionsBefore + appState.currentQuestionIndex;

    const progress = (currentTotalIndex / totalQuestions) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Question ${currentTotalIndex + 1} of ${totalQuestions}`;
}

function endGame() {
    appState.gameStarted = false;
    const accuracy = appState.totalAnswered > 0
        ? Math.round((appState.totalCorrect / appState.totalAnswered) * 100)
        : 0;

    let message = `Game Complete!\n\n`;
    message += `Final Score: ${appState.score}\n`;
    message += `Accuracy: ${accuracy}%\n`;
    message += `Correct: ${appState.totalCorrect} / ${appState.totalAnswered}\n\n`;

    if (accuracy >= 90) {
        message += "Outstanding! You're a scatterplot expert!";
    } else if (accuracy >= 75) {
        message += "Great work! You have strong data interpretation skills!";
    } else if (accuracy >= 60) {
        message += "Good job! Keep practicing to improve!";
    } else {
        message += "Keep learning! Review the patterns and try again.";
    }

    alert(message);
}

function drawWelcomeScreen() {
    ctx.fillStyle = '#999';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click "Start Game" to begin!', canvas.width / 2, canvas.height / 2);
}

function getPositiveFeedback() {
    const messages = [
        "You're reading the data like a pro!",
        "Excellent interpretation!",
        "You've got a great eye for patterns!",
        "Perfect analysis!",
        "You understand scatterplots well!",
        "Great data detective work!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

init();
