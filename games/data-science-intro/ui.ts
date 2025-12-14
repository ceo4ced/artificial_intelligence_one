import {
    GameState, INITIAL_STATE, SCENARIOS,
    processAnswer, advanceScenario, getChartName, formatValue,
    Dataset
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let selectedChart: string | null = null;
let hasAnsweredCurrent = false;

// DOM Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const currentScenarioEl = document.getElementById('currentScenario')!;
const scoreEl = document.getElementById('score')!;
const correctEl = document.getElementById('correct')!;
const accuracyEl = document.getElementById('accuracy')!;
const progressBarEl = document.getElementById('progressBar')!;
const scenarioDescriptionEl = document.getElementById('scenarioDescription')!;
const currentViewEl = document.getElementById('currentView')!;
const feedbackBoxEl = document.getElementById('feedbackBox')!;
const feedbackTitleEl = document.getElementById('feedbackTitle')!;
const feedbackTextEl = document.getElementById('feedbackText')!;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
const chartBtns = document.querySelectorAll('.chart-btn');

// Initialization
function init() {
    renderScenario();
    updateStatsUI();
    drawInitialMessage();
}

function renderScenario() {
    if (appState.isGameComplete) return;

    const scenario = SCENARIOS[appState.currentScenarioIndex];
    hasAnsweredCurrent = false;
    selectedChart = null;

    currentScenarioEl.textContent = `${appState.currentScenarioIndex + 1} / ${SCENARIOS.length}`;
    scenarioDescriptionEl.textContent = scenario.description;

    // Reset UI
    chartBtns.forEach(btn => {
        btn.classList.remove('selected', 'correct', 'incorrect');
        (btn as HTMLButtonElement).disabled = false;
    });

    submitBtn.style.display = 'block';
    submitBtn.disabled = true;
    nextBtn.style.display = 'none';
    feedbackBoxEl.classList.remove('show');
    currentViewEl.textContent = 'Click a chart type to preview';

    drawInitialMessage();
    updateProgressUI();
}

function handleSelectChart(type: string) {
    if (hasAnsweredCurrent) return;

    selectedChart = type;
    chartBtns.forEach(btn => btn.classList.remove('selected'));

    // Find the button with the matching onclick handler or just by text/attribute if possible
    // Since we can't easily query by onclick, we'll assume the order or add data attributes in HTML
    // For now, let's rely on the passed 'type' being consistent
    // Approximate match helper logic moved to btnToSelect

    // Actually, better to modify HTML to have data-type, but I can't easily do that without rewriting HTML extensively.
    // In ui.ts, I can just rely on the event target passed if I attach listeners here.
    // FOR COMPATIBILITY with inline onclicks (which I'm removing), I'll exposing this function globally 
    // and querying buttons to update class.

    // Let's implement global export first, then query based on index or text

    // Helper to find button
    const typeMap: { [key: string]: string } = { 'bar': 'Bar', 'line': 'Line', 'pie': 'Pie', 'scatter': 'Scatter' };
    const btnToSelect = Array.from(chartBtns).find(b => b.textContent?.includes(typeMap[type]));
    if (btnToSelect) btnToSelect.classList.add('selected');

    submitBtn.disabled = false;
    currentViewEl.textContent = getChartName(type);
    drawChart(type);
}

function handleSubmitAnswer() {
    if (!selectedChart || hasAnsweredCurrent) return;

    const scenario = SCENARIOS[appState.currentScenarioIndex];
    const result = processAnswer(appState, selectedChart, scenario);

    appState = result.newState;
    hasAnsweredCurrent = true;
    const isCorrect = result.isCorrect;

    // Update buttons
    chartBtns.forEach(btn => {
        (btn as HTMLButtonElement).disabled = true;
        const btnText = btn.textContent?.toLowerCase() || '';

        let btnType = '';
        if (btnText.includes('bar')) btnType = 'bar';
        else if (btnText.includes('line')) btnType = 'line';
        else if (btnText.includes('pie')) btnType = 'pie';
        else if (btnText.includes('scatter')) btnType = 'scatter';

        if (btnType === scenario.correct) {
            btn.classList.add('correct');
        }
        if (btnType === selectedChart && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // Feedback
    feedbackBoxEl.className = 'feedback-box show ' + (isCorrect ? 'correct' : 'incorrect');
    feedbackTitleEl.textContent = isCorrect ? '✅ Correct!' : '❌ Incorrect';
    feedbackTextEl.textContent = isCorrect ? scenario.explanation : scenario.wrongExplanation + '\n\nCorrect answer: ' + getChartName(scenario.correct);

    submitBtn.style.display = 'none';
    nextBtn.style.display = appState.currentScenarioIndex < SCENARIOS.length - 1 ? 'block' : 'none';

    // Force draw correct chart
    if (!isCorrect) {
        drawChart(scenario.correct);
        currentViewEl.textContent = getChartName(scenario.correct);
    }

    updateStatsUI();

    if (appState.currentScenarioIndex >= SCENARIOS.length - 1) {
        // Just wait for them to click next? Or show final immediately?
        // The original code waited for next or showed immediately? 
        // It seems nextBtn hides if final scenario... let's check
        // "document.getElementById('nextBtn').style.display = currentScenarioIndex < scenarios.length - 1 ? 'block' : 'none';"
        // So if it's the last one, nextBtn is hidden. How do they see results?
        // Ah, they stay on the screen. Maybe we should show a "Finish" button?
        // The original code called showFinalScore inside nextScenario. But if nextBtn is hidden, they can't click it.
        // Wait, the original code had:
        // "if (currentScenarioIndex >= scenarios.length) { showFinalScore(); return; }" in nextScenario.
        // But nextBtn is hidden if index < length - 1 (which means LAST index is excluded).
        // `scenarios.length - 1` is the last index. So if index IS the last index, display is none.
        // So user cannot proceed. This looks like a bug or I misunderstood the original logic.
        // Re-reading original: "currentScenarioIndex < scenarios.length - 1 ? 'block' : 'none'"
        // Yes, for the last scenario (index 9 of 10), 9 < 9 is false -> none.
        // So the user sees result and that's it?
        // I'll add a "Finish" button behavior.

        if (SCENARIOS.length > 0 && appState.currentScenarioIndex === SCENARIOS.length - 1) {
            nextBtn.style.display = 'block';
            nextBtn.textContent = '🏁 Finish Game';
            nextBtn.onclick = showFinalScore;
        }
    }
}

function handleNextScenario() {
    if (appState.currentScenarioIndex < SCENARIOS.length - 1) {
        appState = advanceScenario(appState, SCENARIOS.length);
        renderScenario();
    } else {
        showFinalScore();
    }
}

function handleResetGame() {
    appState = { ...INITIAL_STATE };
    hasAnsweredCurrent = false;
    selectedChart = null;
    renderScenario();
    updateStatsUI();
}

function updateStatsUI() {
    scoreEl.textContent = appState.score.toString();
    correctEl.textContent = appState.correctCount.toString();

    const accuracy = appState.answeredScenarios > 0
        ? Math.round((appState.correctCount / appState.answeredScenarios) * 100)
        : 0;
    accuracyEl.textContent = `${accuracy}%`;
}

function updateProgressUI() {
    const progress = (appState.currentScenarioIndex / SCENARIOS.length) * 100;
    progressBarEl.style.width = `${progress}%`;
}

function drawInitialMessage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Select a chart type to preview', canvas.width / 2, canvas.height / 2);
}

function drawChart(type: string) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scenario = SCENARIOS[appState.currentScenarioIndex];
    const data = scenario.data;

    switch (type) {
        case 'bar': drawBarChart(scenario.title, data); break;
        case 'line': drawLineChart(scenario.title, data); break;
        case 'pie': drawPieChart(scenario.title, data); break;
        case 'scatter': drawScatterPlot(scenario.title, data); break;
    }
}


// Drawing Functions (Ported from original, type-safe)

function drawBarChart(title: string, data: Dataset) {
    if (!data.labels || !data.values) return;

    const chartArea = { x: 100, y: 80, width: 700, height: 340 };
    const barWidth = (chartArea.width / data.labels.length) - 20;
    const maxValue = Math.max(...data.values);

    // Title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 40);

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y);
    ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.stroke();

    // Y-axis grid and labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = Math.round(maxValue * i / 5);
        const y = chartArea.y + chartArea.height - (chartArea.height * i / 5);
        ctx.fillText(formatValue(value), chartArea.x - 10, y + 5);

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartArea.x, y);
        ctx.lineTo(chartArea.x + chartArea.width, y);
        ctx.stroke();
    }

    // Bars
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    data.labels.forEach((label, i) => {
        const x = chartArea.x + (i * (chartArea.width / data.labels!.length)) + 30;
        const barHeight = (data.values![i] / maxValue) * chartArea.height;
        const y = chartArea.y + chartArea.height - barHeight;

        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // X-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth / 2, chartArea.y + chartArea.height + 20);
    });
}

function drawLineChart(title: string, data: Dataset) {
    if (!data.labels || !data.values) return;

    const chartArea = { x: 100, y: 80, width: 700, height: 340 };
    const maxValue = Math.max(...data.values);

    // Title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 40);

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y);
    ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.stroke();

    // Grid and Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = Math.round(maxValue * i / 5);
        const y = chartArea.y + chartArea.height - (chartArea.height * i / 5);
        ctx.fillText(formatValue(value), chartArea.x - 10, y + 5);

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartArea.x, y);
        ctx.lineTo(chartArea.x + chartArea.width, y);
        ctx.stroke();
    }

    // Line
    const pointSpacing = chartArea.width / (data.labels.length - 1);

    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.values.forEach((value, i) => {
        const x = chartArea.x + (i * pointSpacing);
        const y = chartArea.y + chartArea.height - (value / maxValue * chartArea.height);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Points and labels
    data.values.forEach((value, i) => {
        const x = chartArea.x + (i * pointSpacing);
        const y = chartArea.y + chartArea.height - (value / maxValue * chartArea.height);

        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // X-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(data.labels![i], x, chartArea.y + chartArea.height + 20);
    });
}

function drawPieChart(title: string, data: Dataset) {
    if (!data.labels || !data.values) return;

    const centerX = canvas.width / 2;
    const centerY = 280;
    const radius = 150;

    // Title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 40);

    const total = data.values.reduce((sum, val) => sum + val, 0);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

    let currentAngle = -Math.PI / 2;

    data.values.forEach((value, i) => {
        const sliceAngle = (value / total) * 2 * Math.PI;

        // Draw slice
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Percentage labels
        const percentage = ((value / total) * 100).toFixed(1);
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(percentage + '%', labelX, labelY);

        currentAngle += sliceAngle;
    });

    // Legend
    const legendX = 80;
    const legendY = 100;

    data.labels.forEach((label, i) => {
        const y = legendY + i * 35;

        // Color box
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(legendX, y, 25, 25);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, y, 25, 25);

        // Label
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        const percentage = ((data.values![i] / total) * 100).toFixed(1);
        ctx.fillText(`${label} (${percentage}%)`, legendX + 35, y + 18);
    });
}

function drawScatterPlot(title: string, data: Dataset) {
    if (!data.points) return;

    const chartArea = { x: 100, y: 80, width: 700, height: 340 };

    // Title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 40);

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y);
    ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.stroke();

    // Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
        const y = chartArea.y + (chartArea.height * i / 5);
        ctx.beginPath();
        ctx.moveTo(chartArea.x, y);
        ctx.lineTo(chartArea.x + chartArea.width, y);
        ctx.stroke();

        const x = chartArea.x + (chartArea.width * i / 5);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.y);
        ctx.lineTo(x, chartArea.y + chartArea.height);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        const yValue = (5 - i) * 20;
        ctx.fillText(yValue.toString(), chartArea.x - 10, y + 5);

        ctx.textAlign = 'center';
        const xValue = i * 20;
        ctx.fillText(xValue.toString(), x, chartArea.y + chartArea.height + 20);
    }

    // Plot points
    data.points.forEach(point => {
        const x = chartArea.x + (point.x / 100) * chartArea.width;
        const y = chartArea.y + chartArea.height - (point.y / 100) * chartArea.height;

        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function showFinalScore() {
    const percentage = Math.round((appState.correctCount / SCENARIOS.length) * 100);
    let grade = '';

    if (percentage === 100) grade = 'Perfect! 🏆';
    else if (percentage >= 90) grade = 'Excellent! ⭐';
    else if (percentage >= 80) grade = 'Great Job! 👍';
    else if (percentage >= 70) grade = 'Good! 😊';
    else if (percentage >= 60) grade = 'Not Bad! 👌';
    else grade = 'Keep Practicing! 💪';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Complete!', canvas.width / 2, 120);

    ctx.font = '36px Arial';
    ctx.fillText(grade, canvas.width / 2, 180);

    ctx.font = 'bold 72px Arial';
    ctx.fillText(appState.score + ' points', canvas.width / 2, 280);

    ctx.font = '28px Arial';
    ctx.fillText(`${appState.correctCount} / ${SCENARIOS.length} correct (${percentage}%)`, canvas.width / 2, 340);

    ctx.font = '20px Arial';
    ctx.fillText('Click "Restart Game" to play again!', canvas.width / 2, 420);

    nextBtn.style.display = 'none';
    progressBarEl.style.width = '100%';
}

// Global Exports
(window as any).selectChart = handleSelectChart;
(window as any).submitAnswer = handleSubmitAnswer;
(window as any).nextScenario = handleNextScenario;
(window as any).resetGame = handleResetGame;

// Start
init();
