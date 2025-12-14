import {
    LSTMState, EXAMPLE_TASKS, initializeLSTM,
    processStep, tokenize, vectorNorm
} from './engine.js';


// 🏠 State
let appState: LSTMState = initializeLSTM(8);
let animationInterval: number | null = null;
let animationSpeed = 250;

// 🖥️ UI References
const cellCanvas = document.getElementById('cellCanvas') as HTMLCanvasElement;
const cellCtx = cellCanvas.getContext('2d')!;
const heatmapCanvas = document.getElementById('heatmapCanvas') as HTMLCanvasElement;
const heatmapCtx = heatmapCanvas.getContext('2d')!;
const stateCanvas = document.getElementById('stateCanvas') as HTMLCanvasElement;
const stateCtx = stateCanvas.getContext('2d')!;

const sequenceInput = document.getElementById('sequenceInput') as HTMLInputElement;
const statusIndicator = document.getElementById('statusIndicator')!;

// 🎨 Rendering
function renderUI() {
    drawCellArchitecture();
    drawHeatmaps();
    drawStateEvolution();
    updateStats();
}

function updateStats() {
    const totalSteps = appState.sequence.length;
    document.getElementById('timestepValue')!.textContent = `${appState.currentStep} / ${totalSteps}`;
    document.getElementById('cellNormValue')!.textContent = vectorNorm(appState.cellState).toFixed(2);
    document.getElementById('hiddenNormValue')!.textContent = vectorNorm(appState.hiddenState).toFixed(2);

    let currentToken = '-';
    if (appState.currentStep > 0 && appState.currentStep <= appState.sequence.length) {
        currentToken = `"${appState.sequence[appState.currentStep - 1]}"`;
    }
    document.getElementById('currentTokenValue')!.textContent = currentToken;
}

// ... (Canvas Drawing Functions - Migrated from Original) ...
function drawCellArchitecture() {
    cellCtx.clearRect(0, 0, cellCanvas.width, cellCanvas.height);
    const w = cellCanvas.width;
    const h = cellCanvas.height;

    if (appState.currentStep === 0) {
        // Static Diagram
        cellCtx.fillStyle = '#4a5568';
        cellCtx.textAlign = 'center';
        cellCtx.font = 'bold 14px Arial';
        cellCtx.fillText('LSTM Cell Architecture', w / 2, 30);
        cellCtx.font = '12px Arial';
        cellCtx.fillText('(Start processing to see gate activations)', w / 2, 50);

        const centerY = h / 2;
        cellCtx.strokeStyle = '#9C27B0';
        cellCtx.lineWidth = 4;
        cellCtx.beginPath();
        cellCtx.moveTo(50, centerY - 80);
        cellCtx.lineTo(w - 50, centerY - 80);
        cellCtx.stroke();

        drawGate(cellCtx, 150, centerY - 80, '#ff9800', 'f_t', 'Forget Gate');
        drawGate(cellCtx, 300, centerY - 80, '#4CAF50', 'i_t', 'Input Gate');
        drawGate(cellCtx, 450, centerY, '#2196F3', 'o_t', 'Output Gate');
        return;
    }

    // Dynamic Bar Charts
    const step = appState.currentStep - 1;
    if (step < 0) return;

    // Title
    cellCtx.fillStyle = '#2d3748';
    cellCtx.font = 'bold 16px Arial';
    cellCtx.textAlign = 'center';
    cellCtx.fillText(`Timestep ${appState.currentStep}: "${appState.sequence[step]}"`, w / 2, 30);

    const forgetGate = appState.forgetGateHistory[step];
    const inputGate = appState.inputGateHistory[step];
    const outputGate = appState.outputGateHistory[step];

    const colWidth = w / 3;
    const startY = 80;
    const barWidth = Math.min(30, (colWidth - 40) / appState.cellStateSize);

    drawGateActivations(cellCtx, colWidth / 2, startY, forgetGate, barWidth, '#ff9800', 'Forget Gate');
    drawGateActivations(cellCtx, colWidth + colWidth / 2, startY, inputGate, barWidth, '#4CAF50', 'Input Gate');
    drawGateActivations(cellCtx, 2 * colWidth + colWidth / 2, startY, outputGate, barWidth, '#2196F3', 'Output Gate');
}

function drawGate(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, symbol: string, label: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x, y);

    ctx.fillStyle = '#2d3748';
    ctx.font = '11px Arial';
    ctx.fillText(label, x, y + 45);
}

function drawGateActivations(ctx: CanvasRenderingContext2D, centerX: number, startY: number, activations: number[], barWidth: number, color: string, label: string) {
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, centerX, startY - 10);

    const barHeight = 200;
    const spacing = 5;
    const totalWidth = activations.length * (barWidth + spacing);
    const startX = centerX - totalWidth / 2;

    activations.forEach((value, i) => {
        const x = startX + i * (barWidth + spacing);
        const h = value * barHeight;
        const y = startY + barHeight - h;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, h);
        ctx.strokeStyle = '#2d3748';
        ctx.strokeRect(x, y, barWidth, h);
    });

    // Axis line
    ctx.strokeStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(startX - 10, startY + barHeight);
    ctx.lineTo(startX + totalWidth + 10, startY + barHeight);
    ctx.stroke();
}

function drawHeatmaps() {
    heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
    if (appState.forgetGateHistory.length === 0) return;

    const w = heatmapCanvas.width;
    const h = heatmapCanvas.height;
    const heatmapHeight = (h - 60) / 3;

    drawSingleHeatmap(heatmapCtx, 10, 10, w - 20, heatmapHeight - 10, appState.forgetGateHistory, '#ff9800', 'Forget Gate');
    drawSingleHeatmap(heatmapCtx, 10, heatmapHeight + 20, w - 20, heatmapHeight - 10, appState.inputGateHistory, '#4CAF50', 'Input Gate');
    drawSingleHeatmap(heatmapCtx, 10, 2 * heatmapHeight + 30, w - 20, heatmapHeight - 10, appState.outputGateHistory, '#2196F3', 'Output Gate');
}

function drawSingleHeatmap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, history: number[][], color: string, label: string) {
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 5);

    const timesteps = history.length;
    const units = history[0].length;
    const cellWidth = Math.min(50, w / timesteps);
    const cellHeight = h / units;

    for (let t = 0; t < timesteps; t++) {
        for (let u = 0; u < units; u++) {
            const val = history[t][u];
            // Opacity based on value
            ctx.globalAlpha = val;
            ctx.fillStyle = color;
            ctx.fillRect(x + t * cellWidth, y + u * cellHeight, cellWidth, cellHeight);
            ctx.globalAlpha = 1;
        }
    }
}

function drawStateEvolution() {
    // Simplified version - drawing norms
    stateCtx.clearRect(0, 0, stateCanvas.width, stateCanvas.height);
    if (appState.currentStep === 0) return;

    const w = stateCanvas.width;
    const h = stateCanvas.height;
    const padding = 40;

    // Draw axes
    stateCtx.strokeStyle = '#ccc';
    stateCtx.beginPath();
    stateCtx.moveTo(padding, h - padding);
    stateCtx.lineTo(w - padding, h - padding); // X
    stateCtx.moveTo(padding, padding);
    stateCtx.lineTo(padding, h - padding); // Y
    stateCtx.stroke();

    const maxSteps = Math.max(10, appState.sequence.length);
    const xStep = (w - 2 * padding) / maxSteps;

    // Plot Cell Norm (Purple)
    plotLine(stateCtx, appState.cellStateHistory.map(vectorNorm), '#9C27B0', padding, h - padding, xStep);

    // Plot Hidden Norm (Blue)
    plotLine(stateCtx, appState.hiddenStateHistory.map(vectorNorm), '#00BCD4', padding, h - padding, xStep);
}

function plotLine(ctx: CanvasRenderingContext2D, data: number[], color: string, startX: number, startY: number, xStep: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((val, i) => {
        const x = startX + i * xStep;
        const y = startY - val * 20; // Scale factor
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}


// 🕹️ Interactions
(window as any).startProcessing = () => {
    const text = sequenceInput.value;
    if (!text) return alert("Enter text!");

    if (animationInterval) clearInterval(animationInterval);

    // Reset state but keep size
    const size = appState.cellStateSize;
    appState = initializeLSTM(size);
    appState.sequence = tokenize(text);
    appState.isProcessing = true;

    statusIndicator.textContent = "Processing...";
    renderUI();

    animationInterval = window.setInterval(stepForward, animationSpeed);
};

(window as any).pauseProcessing = () => {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
        statusIndicator.textContent = "Paused";
    }
};

function stepForward() {
    if (appState.currentStep >= appState.sequence.length) {
        (window as any).pauseProcessing();
        statusIndicator.textContent = "Done";
        return;
    }

    const token = appState.sequence[appState.currentStep];
    appState = processStep(appState, token);
    renderUI();
}
(window as any).stepForward = stepForward;

(window as any).resetLSTM = () => {
    (window as any).pauseProcessing();
    appState = initializeLSTM(appState.cellStateSize);
    renderUI();
    statusIndicator.textContent = "Ready";
};

(window as any).loadTask = (index: number) => {
    sequenceInput.value = EXAMPLE_TASKS[index];
    (window as any).resetLSTM();
};

(window as any).updateCellSize = () => {
    const slider = document.getElementById('cellSizeSlider') as HTMLInputElement;
    const val = parseInt(slider.value);
    document.getElementById('cellSizeValue')!.textContent = val + " units";
    appState = initializeLSTM(val);
    renderUI();
};

(window as any).updateSpeed = () => {
    const slider = document.getElementById('speedSlider') as HTMLInputElement;
    const val = parseInt(slider.value);
    const speeds = [500, 250, 100];
    animationSpeed = speeds[val - 1];

    const labels = ["Slow", "Medium", "Fast"];
    document.getElementById('speedValue')!.textContent = `${labels[val - 1]} (${animationSpeed}ms)`;

    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = window.setInterval(stepForward, animationSpeed);
    }
};

// Init
renderUI();
