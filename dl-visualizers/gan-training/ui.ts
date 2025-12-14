
import {
    GANState, TRAIN_CONFIG, trainStep, initializeGame
} from './engine.js';

// Global State
let appState: GANState = initializeGame();
let animationInterval: number | null = null;
let animationSpeed = TRAIN_CONFIG.DEFAULT_SPEED;

// DOM Elements
const canvasData = document.getElementById('dataCanvas') as HTMLCanvasElement;
const ctxData = canvasData.getContext('2d')!;
const canvasLoss = document.getElementById('lossCanvas') as HTMLCanvasElement;
const ctxLoss = canvasLoss.getContext('2d')!;
const canvasArch = document.getElementById('architectureCanvas') as HTMLCanvasElement;
const ctxArch = canvasArch.getContext('2d')!;

const statusIndicator = document.getElementById('statusIndicator')!;
const epochValue = document.getElementById('epochValue')!;
const genLossValue = document.getElementById('genLossValue')!;
const discLossValue = document.getElementById('discLossValue')!;
const discAccValue = document.getElementById('discAccValue')!;

const speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
const speedValue = document.getElementById('speedValue')!;
const genLrSlider = document.getElementById('genLrSlider') as HTMLInputElement;
const genLrValue = document.getElementById('genLrValue')!;
const discLrSlider = document.getElementById('discLrSlider') as HTMLInputElement;
const discLrValue = document.getElementById('discLrValue')!;

// Drawing Functions

function drawDataDistribution(state: GANState) {
    ctxData.clearRect(0, 0, canvasData.width, canvasData.height);

    const padding = 40;
    const width = canvasData.width - 2 * padding;
    const height = canvasData.height - 2 * padding;

    // Draw axes
    ctxData.strokeStyle = '#2d3748';
    ctxData.lineWidth = 2;
    ctxData.beginPath();
    ctxData.moveTo(padding, padding);
    ctxData.lineTo(padding, padding + height);
    ctxData.lineTo(padding + width, padding + height);
    ctxData.stroke();

    // Create histograms
    const bins = 30;
    const binWidth = 25 / bins;
    const realHist = new Array(bins).fill(0);
    const fakeHist = new Array(bins).fill(0);

    state.realData.forEach(val => {
        const bin = Math.floor(val / binWidth);
        if (bin >= 0 && bin < bins) realHist[bin]++;
    });

    state.generatedData.forEach(val => {
        const bin = Math.floor(val / binWidth);
        if (bin >= 0 && bin < bins) fakeHist[bin]++;
    });

    const maxCount = Math.max(...realHist, ...fakeHist);

    // Draw real data histogram
    ctxData.fillStyle = 'rgba(33, 150, 243, 0.5)';
    realHist.forEach((count, i) => {
        const x = padding + (i / bins) * width;
        const barHeight = (count / maxCount) * height;
        const y = padding + height - barHeight;
        ctxData.fillRect(x, y, width / bins - 1, barHeight);
    });

    // Draw fake data histogram
    ctxData.fillStyle = 'rgba(244, 67, 54, 0.5)';
    fakeHist.forEach((count, i) => {
        const x = padding + (i / bins) * width;
        const barHeight = (count / maxCount) * height;
        const y = padding + height - barHeight;
        ctxData.fillRect(x, y, width / bins - 1, barHeight);
    });

    // Labels
    ctxData.fillStyle = '#2d3748';
    ctxData.font = 'bold 12px Arial';
    ctxData.textAlign = 'center';
    ctxData.fillText('Value', padding + width / 2, padding + height + 30);

    ctxData.save();
    ctxData.translate(15, padding + height / 2);
    ctxData.rotate(-Math.PI / 2);
    ctxData.fillText('Frequency', 0, 0);
    ctxData.restore();
}

function drawLossChart(state: GANState) {
    ctxLoss.clearRect(0, 0, canvasLoss.width, canvasLoss.height);

    if (state.genLossHistory.length === 0) return;

    const padding = 40;
    const width = canvasLoss.width - 2 * padding;
    const height = canvasLoss.height - 2 * padding;

    // Draw axes
    ctxLoss.strokeStyle = '#2d3748';
    ctxLoss.lineWidth = 2;
    ctxLoss.beginPath();
    ctxLoss.moveTo(padding, padding);
    ctxLoss.lineTo(padding, padding + height);
    ctxLoss.lineTo(padding + width, padding + height);
    ctxLoss.stroke();

    const maxLoss = Math.max(...state.genLossHistory, ...state.discLossHistory, 5);

    // Draw generator loss
    ctxLoss.strokeStyle = '#4CAF50';
    ctxLoss.lineWidth = 3;
    ctxLoss.beginPath();

    state.genLossHistory.forEach((loss, i) => {
        const x = padding + (i / (state.genLossHistory.length - 1)) * width;
        const y = padding + height - (loss / maxLoss) * height;

        if (i === 0) ctxLoss.moveTo(x, y);
        else ctxLoss.lineTo(x, y);
    });
    ctxLoss.stroke();

    // Draw discriminator loss
    ctxLoss.strokeStyle = '#ff9800';
    ctxLoss.lineWidth = 3;
    ctxLoss.beginPath();

    state.discLossHistory.forEach((loss, i) => {
        const x = padding + (i / (state.discLossHistory.length - 1)) * width;
        const y = padding + height - (loss / maxLoss) * height;

        if (i === 0) ctxLoss.moveTo(x, y);
        else ctxLoss.lineTo(x, y);
    });
    ctxLoss.stroke();

    // Labels
    ctxLoss.fillStyle = '#2d3748';
    ctxLoss.font = 'bold 12px Arial';
    ctxLoss.textAlign = 'center';
    ctxLoss.fillText('Epoch', padding + width / 2, padding + height + 30);

    ctxLoss.save();
    ctxLoss.translate(15, padding + height / 2);
    ctxLoss.rotate(-Math.PI / 2);
    ctxLoss.fillText('Loss', 0, 0);
    ctxLoss.restore();
}

function drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, text: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = text.split('\n');
    lines.forEach((line, i) => {
        ctx.fillText(line, x + w / 2, y + h / 2 + (i - lines.length / 2 + 0.5) * 16);
    });
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    ctx.strokeStyle = '#2d3748';
    ctx.fillStyle = '#2d3748';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI / 6), y2 - 10 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI / 6), y2 - 10 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

function drawArchitecture() {
    ctxArch.clearRect(0, 0, canvasArch.width, canvasArch.height);

    const y = canvasArch.height / 2;

    // Noise input
    drawBox(ctxArch, 50, y - 40, 80, 80, '#9C27B0', 'Random\nNoise');

    // Arrow
    drawArrow(ctxArch, 130, y, 200, y);

    // Generator
    drawBox(ctxArch, 200, y - 50, 120, 100, '#4CAF50', 'Generator\nNetwork');

    // Arrow
    drawArrow(ctxArch, 320, y, 390, y);

    // Fake data
    drawBox(ctxArch, 390, y - 40, 80, 80, '#f44336', 'Fake\nData');

    // Real data
    drawBox(ctxArch, 390, y - 160, 80, 80, '#2196F3', 'Real\nData');

    // Arrows to discriminator
    drawArrow(ctxArch, 470, y, 540, y);
    drawArrow(ctxArch, 430, y - 120, 540, y - 40);

    // Discriminator
    drawBox(ctxArch, 540, y - 50, 120, 100, '#ff9800', 'Discriminator\nNetwork');

    // Arrow
    drawArrow(ctxArch, 660, y, 730, y);

    // Output
    drawBox(ctxArch, 730, y - 40, 100, 80, '#667eea', 'Real or\nFake?');

    // Feedback arrows
    ctxArch.strokeStyle = '#666';
    ctxArch.setLineDash([5, 5]);
    ctxArch.lineWidth = 2;

    // Generator feedback
    ctxArch.beginPath();
    ctxArch.moveTo(730, y + 50);
    ctxArch.lineTo(730, y + 80);
    ctxArch.lineTo(260, y + 80);
    ctxArch.lineTo(260, y + 50);
    ctxArch.stroke();

    ctxArch.fillStyle = '#666';
    ctxArch.font = '11px Arial';
    ctxArch.textAlign = 'center';
    ctxArch.fillText('Generator learns from discriminator feedback', 400, y + 95);

    ctxArch.setLineDash([]);
}

function render() {
    drawDataDistribution(appState);
    drawLossChart(appState);
    drawArchitecture();
    updateStatsUI();
}

function updateStatsUI() {
    epochValue.textContent = appState.epoch.toString();

    if (appState.genLossHistory.length > 0) {
        const genLoss = appState.genLossHistory[appState.genLossHistory.length - 1];
        const discLoss = appState.discLossHistory[appState.discLossHistory.length - 1];

        genLossValue.textContent = genLoss.toFixed(3);
        discLossValue.textContent = discLoss.toFixed(3);
        discAccValue.textContent = (appState.discAccuracy * 100).toFixed(1) + '%';
    }
}

// Interactions

function step() {
    appState = trainStep(appState);
    render();
}

function toggleTraining() {
    if (appState.isTraining) {
        // Pause
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        appState.isTraining = false;
        statusIndicator.textContent = 'Paused';
    } else {
        // Start
        appState.isTraining = true;
        statusIndicator.textContent = 'Training...';
        animationInterval = window.setInterval(step, animationSpeed);
    }
}

function resetGAN() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    appState = initializeGame();
    // Re-apply slider values to state
    appState.genLearningRate = parseFloat(genLrSlider.value);
    appState.discLearningRate = parseFloat(discLrSlider.value);

    statusIndicator.textContent = 'Ready to train';
    render();
}

function updateSpeed() {
    const speed = parseInt(speedSlider.value);
    // Cast strict type required for index access if strict
    const speedKey = speed as 1 | 2 | 3;
    const speeds = { 1: 'Slow', 2: 'Medium', 3: 'Fast' };

    speedValue.textContent = speeds[speedKey];
    animationSpeed = TRAIN_CONFIG.SPEEDS[speedKey];

    if (appState.isTraining && animationInterval) {
        clearInterval(animationInterval);
        animationInterval = window.setInterval(step, animationSpeed);
    }
}

function updateGenLr() {
    const val = parseFloat(genLrSlider.value);
    genLrValue.textContent = val.toString();
    appState.genLearningRate = val;
}

function updateDiscLr() {
    const val = parseFloat(discLrSlider.value);
    discLrValue.textContent = val.toString();
    appState.discLearningRate = val;
}

// Event Listeners
// Note: We need to attach things to window for the HTML buttons to work, 
// OR we replace HTML buttons with addEventListener. 
// Standard path: attaching to window is easiest for refactor without changing HTML structure deeply.
(window as any).startTraining = () => {
    if (!appState.isTraining) toggleTraining();
};
(window as any).pauseTraining = () => {
    if (appState.isTraining) toggleTraining();
};
(window as any).resetGAN = resetGAN;
(window as any).updateSpeed = updateSpeed;
(window as any).updateGenLr = updateGenLr;
(window as any).updateDiscLr = updateDiscLr;


// Init
render();
