
import {
    RNNState, INITIAL_STATE,
    startSequence, advanceStep
} from './engine.js';

// 🏠 State
let appState: RNNState = INITIAL_STATE;
let hiddenSize = 8;
let animationSpeed = 200;
let animationInterval: any = null;

// 🖥️ UI References
const unrolledCanvas = document.getElementById('unrolledCanvas') as HTMLCanvasElement;
const unrolledCtx = unrolledCanvas.getContext('2d')!;
const heatmapCanvas = document.getElementById('heatmapCanvas') as HTMLCanvasElement;
const heatmapCtx = heatmapCanvas.getContext('2d')!;

// 📊 Gradient Bars
function initGradientBars() {
    const container = document.getElementById('gradientBars');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const bar = document.createElement('div');
        bar.className = 'gradient-bar';
        bar.id = `gradient-bar-${i}`;
        container.appendChild(bar);
    }
}

function updateGradientBars(step: number) {
    for (let i = 0; i < 10; i++) {
        const bar = document.getElementById(`gradient-bar-${i}`);
        if (!bar) continue;

        // Simulate exponential decay of gradients
        const distance = Math.max(0, step - i);
        const gradient = Math.exp(-distance * 0.3);

        // Update bar height and opacity
        const opacity = 0.3 + gradient * 0.7;
        const height = gradient * 100;

        bar.style.opacity = opacity.toString();
        bar.style.height = height + '%';

        // Color based on gradient magnitude
        if (gradient > 0.7) {
            bar.style.background = '#4CAF50';
        } else if (gradient > 0.3) {
            bar.style.background = '#ff9800';
        } else {
            bar.style.background = '#f44336';
        }
    }
}

function drawUnrolledRNN() {
    unrolledCtx.clearRect(0, 0, unrolledCanvas.width, unrolledCanvas.height);

    if (appState.sequence.length === 0) return;

    // Show steps up to current
    // currentStep is index of *next* step processing.
    // If currentStep is 0, we have init state (t=0) but haven't processed input 0 yet?
    // Let's align with original:
    // Original: "steps = Math.min(currentStep + 1, sequence.length)" where currentStep starts at 0.

    // Wait, hiddenStates length is currentStep + 1.
    // If currentStep = 0, hiddenStates has [init].

    const steps = appState.hiddenStates.length;
    const cellWidth = Math.min(100, (unrolledCanvas.width - 100) / (appState.sequence.length + 1));
    const cellHeight = 60;
    const startX = 50;
    const rnnY = 200;
    const inputY = 320;
    const outputY = 80;

    for (let t = 0; t < steps; t++) {
        const x = startX + t * cellWidth;
        const isActive = t === appState.currentStep; // Logic check?
        const cellColor = isActive ? '#4CAF50' : '#667eea';

        // RNN Cell
        unrolledCtx.fillStyle = cellColor;
        unrolledCtx.fillRect(x - 30, rnnY - 30, cellWidth - 20, cellHeight);
        unrolledCtx.strokeStyle = '#2d3748';
        unrolledCtx.lineWidth = 2;
        unrolledCtx.strokeRect(x - 30, rnnY - 30, cellWidth - 20, cellHeight);

        unrolledCtx.fillStyle = '#fff';
        unrolledCtx.font = 'bold 14px Arial';
        unrolledCtx.textAlign = 'center';
        unrolledCtx.textBaseline = 'middle';
        unrolledCtx.fillText(`RNN`, x + (cellWidth - 50) / 2 - 30, rnnY);

        // Input (at t < sequence length)
        if (t < appState.sequence.length) { // Input for calculating h_{t+1}? 
            // In typical RNN: h_t = f(x_t, h_{t-1}).
            // In our array, hiddenStates[0] is h_0 (init).
            // Input x_0 produces h_1.
            // So at index t (0-based) of visualization:
            // If t=0 (first box), it's h_0. Input x_0 enters here ??
            // Standard diagram:
            // h_0 -> [Cell] -> h_1
            //        ^
            //        x_1

            // Let's follow original code visual style:
            // "if (t < sequence.length && t < steps)"

            // Input node
            unrolledCtx.fillStyle = '#2196F3';
            unrolledCtx.beginPath();
            unrolledCtx.arc(x + (cellWidth - 50) / 2 - 30, inputY, 20, 0, Math.PI * 2);
            unrolledCtx.fill();
            unrolledCtx.stroke();

            unrolledCtx.fillStyle = '#fff';
            unrolledCtx.font = 'bold 16px Arial';
            unrolledCtx.fillText(appState.sequence[t] || '?', x + (cellWidth - 50) / 2 - 30, inputY);

            drawArrow(unrolledCtx, x + (cellWidth - 50) / 2 - 30, inputY - 20, x + (cellWidth - 50) / 2 - 30, rnnY + 30, '#2196F3');
        }

        // Output (h_t)
        // Original: if (t > 0 ...)
        if (t > 0) {
            unrolledCtx.fillStyle = '#ff9800';
            unrolledCtx.beginPath();
            unrolledCtx.arc(x + (cellWidth - 50) / 2 - 30, outputY, 20, 0, Math.PI * 2);
            unrolledCtx.fill();
            unrolledCtx.stroke();

            unrolledCtx.fillStyle = '#fff';
            unrolledCtx.font = 'bold 12px Arial';
            unrolledCtx.fillText('h' + t, x + (cellWidth - 50) / 2 - 30, outputY);

            drawArrow(unrolledCtx, x + (cellWidth - 50) / 2 - 30, rnnY - 30, x + (cellWidth - 50) / 2 - 30, outputY + 20, '#ff9800');

            // Recurrent arrow
            const prevX = startX + (t - 1) * cellWidth;
            const curX = x;
            unrolledCtx.strokeStyle = '#4CAF50';
            unrolledCtx.lineWidth = 3;
            unrolledCtx.beginPath();

            // Fix curve pos
            unrolledCtx.moveTo(prevX + (cellWidth - 50) / 2 + 10, rnnY); // approximate from original
            const midY = rnnY - 50;
            // Naive curve
            unrolledCtx.bezierCurveTo(
                prevX + (cellWidth - 50) / 2 + 10, midY,
                curX + (cellWidth - 50) / 2 - 60, midY,
                curX + (cellWidth - 50) / 2 - 60, rnnY
            );
            unrolledCtx.stroke();
        }

        unrolledCtx.fillStyle = '#2d3748';
        unrolledCtx.font = 'bold 12px Arial';
        unrolledCtx.textAlign = 'center';
        unrolledCtx.fillText(`t=${t}`, x + (cellWidth - 50) / 2 - 30, inputY + 40);
    }
}

function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    drawArrowHead(toX, toY, angle, color);
}

function drawArrowHead(x: number, y: number, angle: number, color: string) {
    const headLength = 10;
    unrolledCtx.fillStyle = color;
    unrolledCtx.beginPath();
    unrolledCtx.moveTo(x, y);
    unrolledCtx.lineTo(
        x - headLength * Math.cos(angle - Math.PI / 6),
        y - headLength * Math.sin(angle - Math.PI / 6)
    );
    unrolledCtx.lineTo(
        x - headLength * Math.cos(angle + Math.PI / 6),
        y - headLength * Math.sin(angle + Math.PI / 6)
    );
    unrolledCtx.closePath();
    unrolledCtx.fill();
}


// 🎨 Rendering - Heatmap
function drawHeatmap() {
    heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);

    if (appState.hiddenStates.length === 0) return;

    const steps = appState.hiddenStates.length;
    // hiddenSize is global var
    const cellWidth = Math.min(50, (heatmapCanvas.width - 100) / steps);
    const cellHeight = Math.min(25, (heatmapCanvas.height - 80) / hiddenSize);
    const startX = 80;
    const startY = 40;

    for (let t = 0; t < steps; t++) {
        for (let h = 0; h < hiddenSize; h++) {
            const x = startX + t * cellWidth;
            const y = startY + h * cellHeight;
            const value = appState.hiddenStates[t][h]; // Value between -1 and 1

            const normalized = (value + 1) / 2;
            heatmapCtx.fillStyle = getHeatmapColor(normalized);
            heatmapCtx.fillRect(x, y, cellWidth, cellHeight);
            heatmapCtx.strokeStyle = '#ddd';
            heatmapCtx.strokeRect(x, y, cellWidth, cellHeight);
        }

        // Labels
        heatmapCtx.fillStyle = '#2d3748';
        heatmapCtx.font = 'bold 11px Arial';
        heatmapCtx.textAlign = 'center';
        const x = startX + t * cellWidth + cellWidth / 2;
        heatmapCtx.fillText(`t${t}`, x, startY + hiddenSize * cellHeight + 20);

        if (t > 0 && t <= appState.sequence.length) {
            heatmapCtx.fillStyle = '#2196F3';
            heatmapCtx.fillText(appState.sequence[t - 1], x, startY - 10);
        }
    }
}

function getHeatmapColor(value: number): string {
    // 0 = red, 0.5 = yellow, 1 = blue
    if (value < 0.5) {
        // Red to Yellow
        const r = 255;
        const g = Math.floor(value * 2 * 255);
        return `rgb(${r}, ${g}, 0)`;
    } else {
        // Yellow to Blue
        // R and G fade out, B fades in.
        const blueVal = Math.floor((value - 0.5) * 2 * 255);
        const yellowVal = Math.floor((1 - (value - 0.5) * 2) * 255);
        return `rgb(${yellowVal}, ${yellowVal}, ${blueVal})`;
    }
}


// 🕹️ Interactions

function updateStatus(msg: string, type: 'processing' | 'complete' | 'error' | '') {
    const el = document.getElementById('statusIndicator')!;
    el.textContent = msg;
    el.className = 'status-indicator ' + type;
}

function stopAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
}

function fullReset() {
    stopAnimation();
    appState = INITIAL_STATE;
    unrolledCtx.clearRect(0, 0, unrolledCanvas.width, unrolledCanvas.height);
    heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);

    (document.getElementById('processBtn') as HTMLButtonElement).disabled = false;
    (document.getElementById('stepBtn') as HTMLButtonElement).disabled = false;
    (document.getElementById('resetBtn') as HTMLButtonElement).disabled = true;
    updateStatus('Enter a sequence to begin', '');
    initGradientBars();
}

// Global functions
(window as any).processSequence = () => {
    const input = (document.getElementById('sequenceInput') as HTMLInputElement).value.trim().toUpperCase();
    if (!input) { updateStatus('Enter sequence', 'error'); return; }

    stopAnimation();
    appState = startSequence(input, hiddenSize);

    (document.getElementById('processBtn') as HTMLButtonElement).disabled = true;
    (document.getElementById('stepBtn') as HTMLButtonElement).disabled = true;
    (document.getElementById('resetBtn') as HTMLButtonElement).disabled = false;

    updateStatus(`Processing ${input}...`, 'processing');

    // Animation Loop
    animationInterval = setInterval(() => {
        if (appState.currentStep < appState.sequence.length) {
            appState = advanceStep(appState, hiddenSize);
            drawUnrolledRNN();
            drawHeatmap();
            updateGradientBars(appState.currentStep);
        } else {
            stopAnimation();
            updateStatus('Complete!', 'complete');
            (document.getElementById('processBtn') as HTMLButtonElement).disabled = false;
            (document.getElementById('stepBtn') as HTMLButtonElement).disabled = false;
        }
    }, animationSpeed);
};

(window as any).stepForward = () => {
    const input = (document.getElementById('sequenceInput') as HTMLInputElement).value.trim().toUpperCase();
    if (!appState.isProcessing && appState.sequence.length === 0) {
        if (!input) { updateStatus('Enter sequence', 'error'); return; }
        appState = startSequence(input, hiddenSize);
        updateStatus('Stepping started...', 'processing');
        drawUnrolledRNN();
        drawHeatmap();
        (document.getElementById('resetBtn') as HTMLButtonElement).disabled = false;
    } else {
        if (appState.currentStep < appState.sequence.length) {
            appState = advanceStep(appState, hiddenSize);
            drawUnrolledRNN();
            drawHeatmap();
            updateGradientBars(appState.currentStep);
            if (appState.currentStep >= appState.sequence.length) {
                updateStatus('Complete!', 'complete');
            }
        }
    }
};

(window as any).resetVisualization = fullReset;

(window as any).loadSample = (text: string) => {
    (document.getElementById('sequenceInput') as HTMLInputElement).value = text;
};

// Listeners
document.getElementById('hiddenSize')!.addEventListener('input', (e: any) => {
    hiddenSize = parseInt(e.target.value);
    document.getElementById('hiddenSizeValue')!.textContent = hiddenSize.toString();
});
document.getElementById('animationSpeed')!.addEventListener('input', (e: any) => {
    animationSpeed = parseInt(e.target.value);
    document.getElementById('speedValue')!.textContent = animationSpeed.toString();
});

// Init
fullReset();
