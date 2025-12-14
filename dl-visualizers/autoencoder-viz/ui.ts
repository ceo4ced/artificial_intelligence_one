
import {
    AutoencoderState, INITIAL_STATE, SAMPLES,
    updateStateWithSample, generateLatentPoints,
    SampleGrid, INPUT_SIZE
} from './engine.js';

// Global State
let appState: AutoencoderState = { ...INITIAL_STATE };

// DOM Elements
const canvasArch = document.getElementById('architectureCanvas') as HTMLCanvasElement;
const ctxArch = canvasArch.getContext('2d')!;
const canvasComp = document.getElementById('comparisonCanvas') as HTMLCanvasElement;
const ctxComp = canvasComp.getContext('2d')!;
const canvasLatent = document.getElementById('latentCanvas') as HTMLCanvasElement;
const ctxLatent = canvasLatent.getContext('2d')!;

const statusIndicator = document.getElementById('statusIndicator')!;
const latentDimValue = document.getElementById('latentDimValue')!;
const compressionValue = document.getElementById('compressionValue')!;
const lossValue = document.getElementById('lossValue')!;
const bottleneckSlider = document.getElementById('bottleneckSlider') as HTMLInputElement;
const bottleneckValue = document.getElementById('bottleneckValue')!;

// Colors from original code
const CATEGORY_COLORS: { [key: string]: string } = {
    digit: '#FF6B6B',
    shape: '#4ECDC4',
    pattern: '#45B7D1',
    complex: '#FFA07A'
};

// Render Functions

function drawArchitecture(state: AutoencoderState) {
    ctxArch.clearRect(0, 0, canvasArch.width, canvasArch.height);

    const layers = [64, 32, 16, 8, state.bottleneckSize, 8, 16, 32, 64];
    const layerSpacing = 100;
    const startX = 50;
    const centerY = canvasArch.height / 2;

    // Draw connections first
    for (let i = 0; i < layers.length - 1; i++) {
        const l1Size = layers[i];
        const l2Size = layers[i + 1];

        const x1 = startX + i * layerSpacing;
        const x2 = startX + (i + 1) * layerSpacing;

        const spacing1 = Math.max(3, 150 / l1Size);
        const totalH1 = l1Size * spacing1;
        const startY1 = centerY - totalH1 / 2;

        const spacing2 = Math.max(3, 150 / l2Size);
        const totalH2 = l2Size * spacing2;
        const startY2 = centerY - totalH2 / 2;

        // Optimize drawing: don't draw all N*M connections if too large
        const step1 = l1Size > 20 ? 4 : 1;
        const step2 = l2Size > 20 ? 4 : 1;

        ctxArch.strokeStyle = 'rgba(100, 100, 200, 0.05)';
        ctxArch.lineWidth = 1;
        ctxArch.beginPath();

        for (let n1 = 0; n1 < l1Size; n1 += step1) {
            for (let n2 = 0; n2 < l2Size; n2 += step2) {
                const y1 = startY1 + n1 * spacing1;
                const y2 = startY2 + n2 * spacing2;
                ctxArch.moveTo(x1, y1);
                ctxArch.lineTo(x2, y2);
            }
        }
        ctxArch.stroke();
    }

    // Draw active path if sample selected
    if (state.currentSample) {
        // Simple visualization: beam from left to right
        ctxArch.strokeStyle = '#4CAF50';
        ctxArch.lineWidth = 2;
        ctxArch.beginPath();
        ctxArch.moveTo(startX, centerY);
        ctxArch.lineTo(startX + (layers.length - 1) * layerSpacing, centerY);
        ctxArch.stroke();
    }

    // Draw nodes
    layers.forEach((size, i) => {
        const x = startX + i * layerSpacing;
        const spacing = Math.max(3, 150 / size);
        const totalHeight = size * spacing;
        const startY = centerY - totalHeight / 2;
        const nodeSize = Math.max(2, Math.min(6, 150 / size));

        // Color based on part of network
        if (i < 4) ctxArch.fillStyle = '#2196F3'; // Encoder
        else if (i === 4) ctxArch.fillStyle = '#9C27B0'; // Latent
        else ctxArch.fillStyle = '#4CAF50'; // Decoder

        for (let j = 0; j < size; j++) {
            const y = startY + j * spacing;
            ctxArch.beginPath();
            ctxArch.arc(x, y, nodeSize, 0, Math.PI * 2);
            ctxArch.fill();
        }

        // Labels
        ctxArch.fillStyle = '#2d3748';
        ctxArch.font = '12px Arial';
        ctxArch.textAlign = 'center';
        ctxArch.fillText(size.toString(), x, startY - 20);

        if (i === 0) ctxArch.fillText("Input", x, startY - 40);
        if (i === 4) ctxArch.fillText("Latent", x, startY - 40);
        if (i === 8) ctxArch.fillText("Output", x, startY - 40);
    });
}

function drawComparison(state: AutoencoderState) {
    if (!state.currentSample || !state.reconstructedSample) return;

    ctxComp.clearRect(0, 0, canvasComp.width, canvasComp.height);

    // Draw Input
    drawGrid(ctxComp, state.currentSample, 20, 40, 'Input (Original)');

    // Draw Arrow
    ctxComp.fillStyle = '#2d3748';
    ctxComp.font = '24px Arial';
    ctxComp.fillText('→', 190, 100);

    // Draw Output
    drawGrid(ctxComp, state.reconstructedSample, 240, 40, 'Output (Reconstructed)');
}

function drawGrid(ctx: CanvasRenderingContext2D, grid: SampleGrid, startX: number, startY: number, label: string) {
    const cellSize = 16;

    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, startX + (8 * cellSize) / 2, startY - 10);

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            const val = grid[i][j];
            const colorVal = Math.floor((1 - val) * 255);
            ctx.fillStyle = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
            ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize);
        }
    }
}

function drawLatentSpace(state: AutoencoderState) {
    ctxLatent.clearRect(0, 0, canvasLatent.width, canvasLatent.height);

    const centerX = canvasLatent.width / 2;
    const centerY = canvasLatent.height / 2;
    const scale = 80;

    // Draw axis
    ctxLatent.strokeStyle = '#eee';
    ctxLatent.beginPath();
    ctxLatent.moveTo(0, centerY);
    ctxLatent.lineTo(canvasLatent.width, centerY);
    ctxLatent.moveTo(centerX, 0);
    ctxLatent.lineTo(centerX, canvasLatent.height);
    ctxLatent.stroke();

    state.latentPoints.forEach(point => {
        const x = centerX + point.x * scale;
        const y = centerY + point.y * scale;

        ctxLatent.fillStyle = CATEGORY_COLORS[point.category];
        ctxLatent.beginPath();
        ctxLatent.arc(x, y, 5, 0, Math.PI * 2);
        ctxLatent.fill();

        // Highlight current
        if (state.currentCategory === point.category && state.currentIndex === point.index) {
            ctxLatent.strokeStyle = '#2d3748';
            ctxLatent.lineWidth = 2;
            ctxLatent.stroke();

            // Draw ring
            ctxLatent.beginPath();
            ctxLatent.arc(x, y, 8, 0, Math.PI * 2);
            ctxLatent.stroke();
        }
    });

    // Legend
    let legY = 20;
    for (const cat in CATEGORY_COLORS) {
        ctxLatent.fillStyle = CATEGORY_COLORS[cat];
        ctxLatent.beginPath();
        ctxLatent.arc(20, legY, 5, 0, Math.PI * 2);
        ctxLatent.fill();

        ctxLatent.fillStyle = '#666';
        ctxLatent.textAlign = 'left';
        ctxLatent.font = '12px Arial';
        ctxLatent.fillText(cat, 35, legY + 4);
        legY += 20;
    }
}

function render() {
    drawArchitecture(appState);
    drawComparison(appState);
    if (appState.latentPoints.length > 0) {
        drawLatentSpace(appState);
    }
    updateUIValues();
}

function updateUIValues() {
    latentDimValue.textContent = appState.bottleneckSize.toString();
    const ratio = Math.floor(INPUT_SIZE / appState.bottleneckSize);
    compressionValue.textContent = `${ratio}:1`;
    lossValue.textContent = appState.lossValue.toFixed(3);
    bottleneckValue.textContent = appState.bottleneckSize.toString();
}


// Actions

function handleSelectSample(category: string, index: number) {
    appState = updateStateWithSample(appState, category, index);

    statusIndicator.textContent = `Selected: ${category} sample ${index}`;
    statusIndicator.style.background = '#fff3cd';
    statusIndicator.style.color = '#856404';

    render();
}

function handleUpdateBottleneck() {
    const size = parseInt(bottleneckSlider.value);
    appState.bottleneckSize = size;

    if (appState.currentSample && appState.currentCategory) {
        // Re-process current sample with new bottleneck
        appState = updateStateWithSample(appState, appState.currentCategory, appState.currentIndex!);
    }

    render();
}

function handleTrain() {
    if (appState.isTraining) return;

    appState.isTraining = true;
    statusIndicator.textContent = 'Training...';
    statusIndicator.style.background = '#d4edda';
    statusIndicator.style.color = '#155724';

    let epoch = 0;
    const maxEpochs = 20;

    const interval = setInterval(() => {
        epoch++;
        appState.lossValue = 1.0 / (epoch + 1);
        updateUIValues(); // Just update values, no full redraw primarily

        if (epoch >= maxEpochs) {
            clearInterval(interval);
            appState.isTraining = false;
            statusIndicator.textContent = 'Training Complete!';

            if (appState.currentSample && appState.currentCategory) {
                appState = updateStateWithSample(appState, appState.currentCategory, appState.currentIndex!);
                render();
            }
        }
    }, 100);
}

function handleEncodeAll() {
    appState.latentPoints = generateLatentPoints(SAMPLES);
    statusIndicator.textContent = `Encoded ${appState.latentPoints.length} samples`;
    statusIndicator.style.background = '#d4edda';
    statusIndicator.style.color = '#155724';
    render();
}

function handleReset() {
    appState = { ...INITIAL_STATE, latentPoints: [] }; // Reset points too
    bottleneckSlider.value = '4';
    statusIndicator.textContent = 'Ready - Select a sample';
    statusIndicator.style.background = '#e3f2fd';
    statusIndicator.style.color = '#1565c0';
    ctxComp.clearRect(0, 0, canvasComp.width, canvasComp.height);
    ctxLatent.clearRect(0, 0, canvasLatent.width, canvasLatent.height);
    render();
}

// Window exports
(window as any).trainAutoencoder = handleTrain;
(window as any).encodeAll = handleEncodeAll;
(window as any).reset = handleReset;
(window as any).selectSample = handleSelectSample;
(window as any).updateBottleneck = handleUpdateBottleneck;

// Init
render();
