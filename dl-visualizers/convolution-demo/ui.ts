
import {
    ConvolutionState, GRID_SIZE, initializeState,
    calculateNextStep, resetConvolutionState, updateFilter,
    updateImage, updateStride, applyConvolutionPatch
} from './engine.js';

// 🏠 State
let appState: ConvolutionState = initializeState('shapes');

// ⚙️ Animation
let isAnimating = false;
let animationInterval: number | null = null;
let animationSpeed = 100;
const CELL_SIZE = 20;

// 🖥️ UI References
const inputCanvas = document.getElementById('inputCanvas') as HTMLCanvasElement;
const processCanvas = document.getElementById('processCanvas') as HTMLCanvasElement;
const outputCanvas = document.getElementById('outputCanvas') as HTMLCanvasElement;
const inputCtx = inputCanvas.getContext('2d')!;
const processCtx = processCanvas.getContext('2d')!;
const outputCtx = outputCanvas.getContext('2d')!;

// 🎨 Rendering
function drawInputImage() {
    inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const value = appState.inputImage[i][j];
            inputCtx.fillStyle = `rgb(${value}, ${value}, ${value})`;
            inputCtx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            inputCtx.strokeStyle = '#ddd';
            inputCtx.lineWidth = 1;
            inputCtx.strokeRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

function drawProcessStep() {
    processCtx.clearRect(0, 0, processCanvas.width, processCanvas.height);

    // Draw input image faded
    processCtx.globalAlpha = 0.3;
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const value = appState.inputImage[i][j];
            processCtx.fillStyle = `rgb(${value}, ${value}, ${value})`;
            processCtx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
    processCtx.globalAlpha = 1;

    // Highlight current filter position
    const { currentRow, currentCol } = appState;
    if (!appState.isComplete) {
        processCtx.strokeStyle = '#ff9800';
        processCtx.lineWidth = 3;
        processCtx.strokeRect(currentCol * CELL_SIZE, currentRow * CELL_SIZE, 3 * CELL_SIZE, 3 * CELL_SIZE);

        // Show filter values overlay
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const imgRow = currentRow + i;
                const imgCol = currentCol + j;

                if (imgRow < GRID_SIZE && imgCol < GRID_SIZE) {
                    processCtx.fillStyle = 'rgba(102, 126, 234, 0.7)';
                    processCtx.fillRect(imgCol * CELL_SIZE, imgRow * CELL_SIZE, CELL_SIZE, CELL_SIZE);

                    processCtx.strokeStyle = '#2d3748';
                    processCtx.lineWidth = 1;
                    processCtx.strokeRect(imgCol * CELL_SIZE, imgRow * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }

    // Show computation text
    // The engine's state has the *next* position or the just calculated one? 
    // Usually calculating next step calculates for current position then moves pointer.
    // So if we just moved, we are pointing to a new spot.

    // Actually, calculateNextStep computes for (row, col) then increments.
    // So 'featureMap' has the result for the *previous* step's (row, col).
    // But for visualization, we want to see the calculation happening "now".
    // Let's recalculate the single patch for display purposes:
    const result = applyConvolutionPatch(appState.inputImage, appState.currentFilter, currentRow, currentCol);

    const info = document.getElementById('processInfo')!;
    if (appState.isComplete) {
        info.textContent = 'Convolution complete - Feature map generated!';
    } else {
        info.textContent = `Position (${currentRow}, ${currentCol}) → Output: ${result.toFixed(0)}`;
    }
}

function drawFeatureMap() {
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

    // featureMap size is smaller than GRID_SIZE
    const map = appState.featureMap;

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            const value = map[i][j];
            outputCtx.fillStyle = `rgb(${value}, ${value}, ${value})`;
            outputCtx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            outputCtx.strokeStyle = '#ddd';
            outputCtx.lineWidth = 1;
            outputCtx.strokeRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

function displayFilter() {
    const filterDisplay = document.getElementById('filterDisplay')!;
    filterDisplay.innerHTML = '';

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const cell = document.createElement('div');
            cell.className = 'filter-cell';
            const value = appState.currentFilter[i][j];
            cell.textContent = value.toFixed(1);
            cell.style.background = value > 0 ? '#c8e6c9' : value < 0 ? '#ffcdd2' : '#fff';
            filterDisplay.appendChild(cell);
        }
    }
}

// 🕹️ Animation Loop
function loop() {
    if (!isAnimating) return;

    appState = calculateNextStep(appState);

    drawProcessStep();
    drawFeatureMap();

    if (appState.isComplete) {
        pauseConvolution();
        updateStatus('Convolution Complete!', '#d4edda');
    }
}

function startConvolution() {
    if (isAnimating) return;
    if (appState.isComplete) {
        // Auto reset if starting from complete
        appState = resetConvolutionState(appState);
        drawFeatureMap();
    }

    isAnimating = true;
    updateStatus('Convolving...', '#d4edda', '#155724');

    if (animationInterval) clearInterval(animationInterval);
    animationInterval = window.setInterval(loop, animationSpeed);
}

function pauseConvolution() {
    isAnimating = false;
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    updateStatus('Paused', '#fff3cd', '#856404');
}

function resetConvolution() {
    pauseConvolution();
    appState = resetConvolutionState(appState);

    processCtx.clearRect(0, 0, processCanvas.width, processCanvas.height);
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    drawFeatureMap(); // Clear it

    updateStatus('Ready - Select a filter', '#e3f2fd', '#1565c0');
    document.getElementById('processInfo')!.textContent = 'Click "Start Convolution" to begin';
}

function updateStatus(text: string, bg: string, color?: string) {
    const el = document.getElementById('statusIndicator')!;
    el.textContent = text;
    el.style.background = bg;
    if (color) el.style.color = color;
}

// 🌐 Bindings
(window as any).changeFilter = () => {
    const name = (document.getElementById('filterSelect') as HTMLSelectElement).value;
    appState = updateFilter(appState, name);
    displayFilter();
    resetConvolution();
};

(window as any).updateStride = () => {
    const val = parseInt((document.getElementById('strideSlider') as HTMLInputElement).value);
    document.getElementById('strideValue')!.textContent = val.toString();
    appState = updateStride(appState, val);
    resetConvolution();
};

(window as any).updateSpeed = () => {
    const speed = parseInt((document.getElementById('speedSlider') as HTMLInputElement).value) as 1 | 2 | 3;
    const speeds = { 1: 'Slow', 2: 'Medium', 3: 'Fast' };
    const delays = { 1: 200, 2: 100, 3: 50 };

    document.getElementById('speedValue')!.textContent = speeds[speed];
    animationSpeed = delays[speed];

    // Restart interval if running
    if (isAnimating) {
        if (animationInterval) clearInterval(animationInterval);
        animationInterval = window.setInterval(loop, animationSpeed);
    }
};

(window as any).startConvolution = startConvolution;
(window as any).pauseConvolution = pauseConvolution;
(window as any).resetConvolution = resetConvolution;
(window as any).loadImage = (type: string) => {
    appState = updateImage(appState, type as any);
    drawInputImage();
    resetConvolution();
};

// Init
drawInputImage();
displayFilter();
