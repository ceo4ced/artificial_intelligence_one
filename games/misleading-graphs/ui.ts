
import {
    GameState, INITIAL_STATE, SCENARIOS, ALL_ISSUES, GraphScenario,
    checkAnswer, calculateAccuracy
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let selectedIssues = new Set<string>();

// DOM Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const progressBar = document.getElementById('progressBar')!;
const progressText = document.getElementById('progressText')!;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const analyzedEl = document.getElementById('analyzed')!;
const perfectEl = document.getElementById('perfect')!;
const accuracyEl = document.getElementById('accuracy')!;
const scoreEl = document.getElementById('score')!;
const displayScoreEl = document.getElementById('displayScore')!;
const graphTitleEl = document.getElementById('graphTitle')!;
const questionSectionEl = document.getElementById('questionSection')!;
const issuesGridEl = document.getElementById('issuesGrid')!;
const feedbackEl = document.getElementById('feedback')!;
const comparisonSectionEl = document.getElementById('comparisonSection')!;
const misleadingCanvas = document.getElementById('misleadingCanvas') as HTMLCanvasElement;
const honestCanvas = document.getElementById('honestCanvas') as HTMLCanvasElement;
const explanationEl = document.getElementById('explanation')!;

// Draw Function Mapping
const DRAW_MAP: { [key: string]: { draw: (c: HTMLCanvasElement, m: boolean) => void } } = {
    'sales-skyrocket': { draw: drawTruncatedSales },
    'stock-rising': { draw: drawCherryPickedStock },
    'ice-cream-drowning': { draw: drawDualAxisTrick },
    'market-share': { draw: draw3DPieDistortion },
    'climate-data': { draw: drawClimateData },
    'revenue-growth': { draw: drawInconsistentScale },
    'employment-stats': { draw: drawEmployment },
    'product-comparison': { draw: drawAreaDistortion },
    'medication-study': { draw: drawMedicationStudy },
    'crime-rate': { draw: drawCrimeRate }
};

function init() {
    updateStatsUI();
    drawWelcomeScreen();

    // Attach event listeners
    (window as any).startGame = startGame;
    (window as any).submitAnswer = handleSubmitAnswer;
    (window as any).nextGraph = handleNextGraph;
}

function startGame() {
    appState = { ...INITIAL_STATE, gameStarted: true };
    loadGraph();
}

function loadGraph() {
    if (appState.currentGraphIndex >= SCENARIOS.length) {
        endGame();
        return;
    }

    const scenario = SCENARIOS[appState.currentGraphIndex];
    selectedIssues.clear();

    graphTitleEl.textContent = scenario.title;
    questionSectionEl.style.display = 'block';
    comparisonSectionEl.classList.remove('show');
    feedbackEl.className = 'feedback';
    feedbackEl.style.display = 'none'; // Ensure hidden
    submitBtn.disabled = false;

    // Draw the misleading graph
    const renderer = DRAW_MAP[scenario.id];
    if (renderer) {
        renderer.draw(canvas, true);
    }

    // Create issue checkboxes
    issuesGridEl.innerHTML = '';
    ALL_ISSUES.forEach((issue, index) => {
        const div = document.createElement('div');
        div.className = 'issue-checkbox';
        div.id = `issue-${index}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${index}`;
        checkbox.value = issue;
        checkbox.onchange = () => toggleIssue(issue, div);

        const label = document.createElement('label');
        label.htmlFor = `checkbox-${index}`;
        label.textContent = issue;

        div.appendChild(checkbox);
        div.appendChild(label);
        div.onclick = (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                toggleIssue(issue, div);
            }
        };

        issuesGridEl.appendChild(div);
    });

    updateProgressUI();
}

function toggleIssue(issue: string, div: HTMLElement) {
    if (selectedIssues.has(issue)) {
        selectedIssues.delete(issue);
        div.classList.remove('selected');
    } else {
        selectedIssues.add(issue);
        div.classList.add('selected');
    }
}

function handleSubmitAnswer() {
    if (!appState.gameStarted) return;

    const scenario = SCENARIOS[appState.currentGraphIndex];
    const result = checkAnswer(appState, scenario, selectedIssues);
    appState = result.newState;

    // Show feedback
    feedbackEl.style.display = 'block';
    feedbackEl.className = result.isPerfect ? 'feedback correct show' : 'feedback incorrect show';

    if (result.isPerfect) {
        feedbackEl.innerHTML = `
            <strong>Perfect! +${result.pointsEarned} points</strong>
            You identified all ${result.correctIssues.size} issue(s) correctly!
        `;
    } else {
        const issuesText = Array.from(result.correctIssues).join(', ');
        feedbackEl.innerHTML = `
            <strong>${result.pointsEarned > 0 ? 'Partial Credit' : 'Incorrect'} - +${result.pointsEarned} points</strong>
            You found ${result.selectedCorrectCount} of ${result.correctIssues.size} issues.
            ${result.selectedIncorrectCount > 0 ? `You also selected ${result.selectedIncorrectCount} incorrect issue(s).` : ''}
            <br><br><strong>Correct issues:</strong> ${issuesText}
        `;
    }

    // Color code checkboxes
    ALL_ISSUES.forEach((issue, index) => {
        const div = document.getElementById(`issue-${index}`)!;
        const checkbox = document.getElementById(`checkbox-${index}`) as HTMLInputElement;
        checkbox.disabled = true;

        if (result.correctIssues.has(issue)) {
            div.classList.add('correct');
        } else if (selectedIssues.has(issue)) {
            div.classList.add('incorrect');
        }
    });

    showComparison(scenario);

    submitBtn.disabled = true;
    updateStatsUI();

    setTimeout(() => {
        if (appState.gameStarted && appState.currentGraphIndex < SCENARIOS.length) {
            handleNextGraph();
        }
    }, 8000);
}

function handleNextGraph() {
    if (!appState.gameStarted) {
        alert('Please start the game first!');
        return;
    }
    if (!submitBtn.disabled) {
        alert('Please submit your answer first!');
        return;
    }

    appState.currentGraphIndex++;
    loadGraph();
}

function showComparison(scenario: GraphScenario) {
    comparisonSectionEl.classList.add('show');

    const renderer = DRAW_MAP[scenario.id];
    if (renderer) {
        renderer.draw(misleadingCanvas, true);
        renderer.draw(honestCanvas, false);
    }

    explanationEl.textContent = scenario.explanation;
}

function updateStatsUI() {
    analyzedEl.textContent = appState.totalAnalyzed.toString();
    perfectEl.textContent = appState.totalPerfect.toString();
    const accuracy = calculateAccuracy(appState.totalPerfect, appState.totalAnalyzed);
    accuracyEl.textContent = `${accuracy}%`;
    scoreEl.textContent = appState.score.toString();
    displayScoreEl.textContent = appState.score.toString();
}

function updateProgressUI() {
    const progress = (appState.currentGraphIndex / SCENARIOS.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Graph ${appState.currentGraphIndex + 1} of ${SCENARIOS.length}`;
}

function endGame() {
    appState.gameStarted = false;
    const accuracy = calculateAccuracy(appState.totalPerfect, appState.totalAnalyzed);
    const maxScore = SCENARIOS.length * 100;

    let message = `Game Complete!\n\n`;
    message += `Final Score: ${appState.score} / ${maxScore}\n`;
    message += `Perfect Identifications: ${appState.totalPerfect} / ${appState.totalAnalyzed}\n`;
    message += `Accuracy: ${accuracy}%\n\n`;

    if (accuracy >= 80) {
        message += "Outstanding! You're a graph detective expert!";
    } else if (accuracy >= 60) {
        message += "Great work! You can spot most misleading graphs!";
    } else if (accuracy >= 40) {
        message += "Good progress! Keep practicing to sharpen your skills!";
    } else {
        message += "Keep learning! Review the lessons and try again.";
    }

    alert(message);
}

function drawWelcomeScreen() {
    ctx.fillStyle = '#999';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click "Start Game" to begin spotting sketchy graphs!', canvas.width / 2, canvas.height / 2);
}

// ==========================================
// DRAWING FUNCTIONS
// ==========================================

function drawTruncatedSales(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = [98, 98.5, 99, 99.5, 100, 100.5, 101];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

    const offsetX = 100;
    const offsetY = 60;
    // Removed unused chartWidth
    const chartHeight = 320;

    // Adjust for smaller canvas (comparison view)
    const scale = canvas.width < 500 ? 0.5 : 1;
    const adjustedOffsetX = offsetX * scale;
    const adjustedHeight = chartHeight * scale;
    const adjustedWidth = (canvas.width - adjustedOffsetX * 2);

    const minValue = misleading ? 95 : 0;
    const maxValue = misleading ? 102 : 110;
    const range = maxValue - minValue;

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(adjustedOffsetX, offsetY);
    ctx.lineTo(adjustedOffsetX, offsetY + adjustedHeight);
    ctx.lineTo(adjustedOffsetX + adjustedWidth, offsetY + adjustedHeight);
    ctx.stroke();

    if (scale === 1) {
        // Y-axis label
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.save();
        ctx.translate(30, offsetY + adjustedHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Sales ($1000s)', 0, 0);
        ctx.restore();
    }

    // Y-axis ticks
    ctx.font = `${12 * scale}px Arial`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = minValue + (range * i / 5);
        const y = offsetY + adjustedHeight - (i * adjustedHeight / 5);
        ctx.fillText(value.toFixed(0), adjustedOffsetX - 5, y + 4);

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(adjustedOffsetX, y);
        ctx.lineTo(adjustedOffsetX + adjustedWidth, y);
        ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = misleading ? '#d32f2f' : '#2196F3';
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();

    data.forEach((value, i) => {
        const x = adjustedOffsetX + (i * adjustedWidth / (data.length - 1));
        const y = offsetY + adjustedHeight - ((value - minValue) / range * adjustedHeight);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Points and labels
    ctx.textAlign = 'center';
    data.forEach((value, i) => {
        const x = adjustedOffsetX + (i * adjustedWidth / (data.length - 1));
        const y = offsetY + adjustedHeight - ((value - minValue) / range * adjustedHeight);

        ctx.fillStyle = misleading ? '#d32f2f' : '#2196F3';
        ctx.beginPath();
        ctx.arc(x, y, 6 * scale, 0, Math.PI * 2);
        ctx.fill();

        if (scale === 1) {
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(labels[i], x, offsetY + adjustedHeight + 25);
        }
    });

    // Title
    ctx.fillStyle = '#000';
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillText(misleading ? 'SALES SKYROCKETING!' : 'Monthly Sales (Full Scale)', canvas.width / 2, 35);
}

function drawCherryPickedStock(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fullData = [100, 105, 110, 108, 102, 95, 88, 82, 78, 80, 83, 85];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const displayData = misleading ? fullData.slice(0, 3) : fullData;
    const displayLabels = misleading ? labels.slice(0, 3) : labels;

    // Resizing logic for small canvases
    const scale = canvas.width < 500 ? 0.5 : 1;
    const offsetX = 100 * scale;
    const offsetY = 60;
    const chartHeight = 320 * scale;
    const chartWidth = canvas.width - (offsetX * 2);

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX, offsetY + chartHeight);
    ctx.lineTo(offsetX + chartWidth, offsetY + chartHeight);
    ctx.stroke();

    if (scale === 1) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.save();
        ctx.translate(30, offsetY + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(misleading ? 'Price' : 'Stock Price ($)', 0, 0);
        ctx.restore();
    }

    // Y-axis ticks
    ctx.font = `${12 * scale}px Arial`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = i * 25;
        const y = offsetY + chartHeight - (i * chartHeight / 5);
        ctx.fillText(misleading ? '' : '$' + value, offsetX - 5, y + 4);

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX + chartWidth, y);
        ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = misleading ? '#4CAF50' : '#d32f2f';
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();

    displayData.forEach((value, i) => {
        const x = offsetX + (i * chartWidth / (displayData.length - 1));
        const y = offsetY + chartHeight - (value / 125 * chartHeight);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Points and labels
    ctx.textAlign = 'center';
    displayData.forEach((value, i) => {
        const x = offsetX + (i * chartWidth / (displayData.length - 1));
        const y = offsetY + chartHeight - (value / 125 * chartHeight);

        ctx.fillStyle = misleading ? '#4CAF50' : '#d32f2f';
        ctx.beginPath();
        ctx.arc(x, y, 6 * scale, 0, Math.PI * 2);
        ctx.fill();

        if (scale === 1) {
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(displayLabels[i], x, offsetY + chartHeight + 25);
        }
    });

    // Title
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillText(
        misleading ? 'Stock Rising Fast!' : 'Full Year Stock Performance',
        canvas.width / 2, 35
    );
}

function drawDualAxisTrick(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const iceCream = [100, 120, 180, 250, 300, 280, 200, 150];
    const drownings = [2, 3, 4, 6, 7, 6, 5, 3];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

    const scale = canvas.width < 500 ? 0.6 : 1;
    const offsetX = 100 * scale;
    const offsetY = 60;
    const chartHeight = 320 * scale;
    const chartWidth = canvas.width - (offsetX * 2);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX, offsetY + chartHeight);
    ctx.lineTo(offsetX + chartWidth, offsetY + chartHeight);
    if (misleading) {
        ctx.moveTo(offsetX + chartWidth, offsetY);
        ctx.lineTo(offsetX + chartWidth, offsetY + chartHeight);
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#ff9800';
    ctx.font = `bold ${12 * scale}px Arial`;

    // Draw Ice Cream line
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    iceCream.forEach((value, i) => {
        const x = offsetX + (i * chartWidth / (iceCream.length - 1));
        const y = offsetY + chartHeight - (value / 300 * chartHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Drownings line
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    drownings.forEach((value, i) => {
        const x = offsetX + (i * chartWidth / (drownings.length - 1));
        const y = misleading ?
            offsetY + chartHeight - (value / 7 * chartHeight) :
            offsetY + chartHeight - (value / 300 * chartHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // X-axis labels (RESTORED)
    ctx.fillStyle = '#333';
    ctx.font = `${12 * scale}px Arial`;
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
        const x = offsetX + (i * chartWidth / (labels.length - 1));
        ctx.fillText(label, x, offsetY + chartHeight + 25);
    });

    ctx.fillStyle = '#000';
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(
        misleading ? 'Ice Cream Sales Cause Drowning!' : 'No Real Correlation (Same Scale)',
        canvas.width / 2, 35
    );
}

function shadeColor(color: string, percent: number) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

function draw3DPieDistortion(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = [35, 30, 20, 15];
    const labels = ['Product A', 'Product B', 'Product C', 'Product D'];
    const colors = ['#2196F3', '#4CAF50', '#ff9800', '#f44336'];

    if (misleading) {
        const scale = canvas.width < 500 ? 0.6 : 1;
        const centerX = canvas.width / 2;
        const centerY = 200 * scale;
        const radius = 140 * scale;
        const depth = 40 * scale;

        let startAngle = -0.5;
        data.forEach((value, i) => {
            const angle = (value / 100) * Math.PI * 2;
            ctx.fillStyle = shadeColor(colors[i], -30);
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + depth, radius, radius * 0.5, 0, startAngle, startAngle + angle);
            ctx.lineTo(centerX, centerY + depth);
            ctx.fill();
            startAngle += angle;
        });

        startAngle = -0.5;
        data.forEach((value, i) => {
            const angle = (value / 100) * Math.PI * 2;
            const distortion = i === 0 ? 1.4 : 1.0;
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radius * distortion, radius * 0.5, 0, startAngle, startAngle + angle);
            ctx.lineTo(centerX, centerY);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            startAngle += angle;
        });
    } else {
        const scale = canvas.width < 500 ? 0.6 : 1;
        const barWidth = 80 * scale;
        const maxHeight = 280 * scale;
        const offsetX = (canvas.width - (data.length * barWidth * 1.5)) / 2;
        const offsetY = canvas.height - 40;

        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY - maxHeight);
        ctx.lineTo(offsetX, offsetY);
        ctx.lineTo(canvas.width - offsetX, offsetY);
        ctx.stroke();

        data.forEach((value, i) => {
            const x = offsetX + i * barWidth * 1.5 + 20;
            const height = (value / 40) * maxHeight;
            const y = offsetY - height;

            ctx.fillStyle = colors[i];
            ctx.fillRect(x, y, barWidth, height);
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.fillText(value + '%', x + barWidth / 2, y - 5);

            // Labels restored
            ctx.font = '12px Arial';
            ctx.fillText(labels[i], x + barWidth / 2, offsetY + 25);
        });
    }

    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Market Share', canvas.width / 2, 30);
}

function drawClimateData(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fullData = misleading ?
        [58.2, 58.5, 58.8, 59.2, 59.8, 60.2] :
        [57.0, 57.2, 57.5, 57.8, 58.0, 58.2, 58.5, 58.8, 59.2, 59.8, 60.2];

    const offsetX = 50;
    const offsetY = 60;
    const chartHeight = 250;
    const chartWidth = canvas.width - 100;

    const minValue = misleading ? 58 : 0;
    const maxValue = misleading ? 61 : 70;

    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX, offsetY + chartHeight);
    ctx.lineTo(offsetX + chartWidth, offsetY + chartHeight);
    ctx.stroke();

    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    fullData.forEach((val, i) => {
        const x = offsetX + (i * chartWidth / (fullData.length - 1));
        const y = offsetY + chartHeight - ((val - minValue) / (maxValue - minValue) * chartHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(misleading ? 'CLIMATE CRISIS!' : 'Temperature (Full Scale)', canvas.width / 2, 30);
}

function drawInconsistentScale(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const data = [100, 150, 200, 250];
    const colors = ['#2196F3', '#4CAF50', '#ff9800', '#f44336'];

    const offsetX = 50;
    const offsetY = canvas.height - 50;
    const chartHeight = 200;
    const width = canvas.width - 100;

    if (misleading) {
        const widths = [width * 0.1, width * 0.15, width * 0.1, width * 0.2];
        const spacings = [0, width * 0.2, width * 0.4, width * 0.7];
        data.forEach((val, i) => {
            const x = offsetX + spacings[i];
            const h = (val / 250) * chartHeight;
            ctx.fillStyle = colors[i];
            ctx.fillRect(x, offsetY - h, widths[i], h);
        });
    } else {
        const barW = width / 4 - 20;
        data.forEach((val, i) => {
            const x = offsetX + i * (width / 4) + 10;
            const h = (val / 250) * chartHeight;
            ctx.fillStyle = colors[i];
            ctx.fillRect(x, offsetY - h, barW, h);
        });
    }

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(misleading ? 'Revenue (Inconsistent)' : 'Revenue (Consistent)', canvas.width / 2, 30);
}

function drawEmployment(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const data = [92, 92.5, 93, 93.5, 94];

    const min = misleading ? 90 : 0;
    const max = misleading ? 95 : 100;

    const offsetX = 50;
    const offsetY = 50;
    const h = canvas.height - 100;
    const w = canvas.width - 100;

    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX, offsetY + h);
    ctx.lineTo(offsetX + w, offsetY + h);
    ctx.stroke();

    const barW = w / data.length - 10;
    data.forEach((val, i) => {
        const x = offsetX + 5 + i * (w / data.length);
        const barH = (val - min) / (max - min) * h;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(x, offsetY + h - barH, barW, barH);

        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(val + '%', x + barW / 2, offsetY + h - barH - 5);
    });

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(misleading ? 'Massive Gains!' : 'Employment Rate', canvas.width / 2, 30);
}

function drawAreaDistortion(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Removed unused data array
    const offsetX = canvas.width / 4;
    const centerY = canvas.height / 2;

    if (misleading) {
        // Circles
        const r1 = 30;
        const r2 = 30 * (200 / 100); // 2x radius = 4x area!
        ctx.fillStyle = '#2196F3';
        ctx.beginPath(); ctx.arc(offsetX, centerY, r1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath(); ctx.arc(offsetX * 3, centerY, r2, 0, Math.PI * 2); ctx.fill();
    } else {
        // Bars
        const h1 = 100;
        const h2 = 200;
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(offsetX - 20, centerY + 50 - h1, 40, h1);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(offsetX * 3 - 20, centerY + 50 - h2, 40, h2);
    }

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(misleading ? 'Size Distortion' : 'Accurate Bar Chart', canvas.width / 2, 30);
}

function drawMedicationStudy(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Placeholder logic 
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(misleading ? 'Medication (Cherry Picked)' : 'Medication (Full)', canvas.width / 2, canvas.height / 2);
}

function drawCrimeRate(canvas: HTMLCanvasElement, misleading: boolean) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Placeholder logic
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(misleading ? 'Crime Spike!' : 'Crime Rate (Stable)', canvas.width / 2, canvas.height / 2);
}

init();
