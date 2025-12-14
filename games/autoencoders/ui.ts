
import {
    AutoencoderGameState, INITIAL_STATE,
    startNewImage, applyDenoising, setCompression
} from './engine.js';

// Global State
let appState: AutoencoderGameState = { ...INITIAL_STATE };

// DOM Elements
const noisyCanvas = document.getElementById('noisyCanvas') as HTMLCanvasElement;
const cleanCanvas = document.getElementById('cleanCanvas') as HTMLCanvasElement;
const noisyCtx = noisyCanvas.getContext('2d')!;
const cleanCtx = cleanCanvas.getContext('2d')!;

const processedEl = document.getElementById('processed')!;
const avgQualityEl = document.getElementById('avgQuality')!;
const bestScoreEl = document.getElementById('bestScore')!;
const scoreEl = document.getElementById('score')!;
const feedbackEl = document.getElementById('feedback')!;
const compressionSlider = document.getElementById('compressionSlider') as HTMLInputElement;
const compressionValue = document.getElementById('compressionValue')!;

// Constants
const CELL_size = 10;

// Rendering

function drawPattern(ctx: CanvasRenderingContext2D, pattern: number[][]) {
    // Fill background just in case
    ctx.clearRect(0, 0, 350, 350);

    if (pattern.length === 0) {
        // Placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 350, 350);
        return;
    }

    // pattern is GRID_SIZE x GRID_SIZE (35x35). 35 * 10 = 350.
    for (let y = 0; y < pattern.length; y++) {
        for (let x = 0; x < pattern[y].length; x++) {
            const value = Math.floor(pattern[y][x] * 255);
            ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
            ctx.fillRect(x * CELL_size, y * CELL_size, CELL_size, CELL_size);
        }
    }
}

function render() {
    // Draw canvases
    if (appState.noisyPattern.length === 0) {
        // Initial / Reset state
        drawPlaceholder(noisyCtx, 'Click "New Image" to start');
        drawPlaceholder(cleanCtx, 'Denoised output appears here');
    } else {
        drawPattern(noisyCtx, appState.noisyPattern);

        if (appState.denoisedPattern) {
            drawPattern(cleanCtx, appState.denoisedPattern);
        } else {
            drawPlaceholder(cleanCtx, 'Apply denoising to see result');
        }
    }

    // Update Stats
    processedEl.textContent = appState.processedCount.toString();
    const avg = appState.processedCount > 0
        ? Math.round(appState.totalQuality / appState.processedCount)
        : 0;
    avgQualityEl.textContent = avg + '%';
    bestScoreEl.textContent = appState.bestScore.toString();

    // Last Score logic
    if (appState.denoisedPattern) {
        scoreEl.textContent = appState.lastScore + '%';
        updateFeedback(appState.lastScore);
    } else {
        scoreEl.textContent = '0%';
        if (appState.noisyPattern.length > 0) {
            feedbackEl.textContent = 'Adjust compression and apply denoising!';
            feedbackEl.style.color = '#666';
        } else {
            feedbackEl.textContent = 'Click "New Image" to start denoising!';
            feedbackEl.style.color = '#666';
        }
    }

    // Update Slider Label
    const labels = ['Extreme', 'Very High', 'High', 'Medium-High', 'Medium',
        'Medium-Low', 'Low', 'Very Low', 'Minimal', 'None'];
    const label = labels[appState.compressionLevel - 1] || 'Unknown';
    compressionValue.textContent = `${label} (${appState.compressionLevel})`;

    // Sync slider value if not matching (e.g. reset)
    if (parseInt(compressionSlider.value) !== appState.compressionLevel) {
        compressionSlider.value = appState.compressionLevel.toString();
    }
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, text: string) {
    ctx.clearRect(0, 0, 350, 350);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 350, 350);
    ctx.fillStyle = '#999';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 350 / 2, 350 / 2);
}

function updateFeedback(quality: number) {
    let feedback = '';
    let color = '';

    if (quality >= 90) {
        feedback = '🏆 Excellent! Perfect denoising!';
        color = '#4CAF50';
    } else if (quality >= 75) {
        feedback = '👍 Good job! Nice balance!';
        color = '#2196F3';
    } else if (quality >= 60) {
        feedback = '🤔 Not bad, but try adjusting compression!';
        color = '#FF9800';
    } else {
        feedback = '❌ Too much distortion. Try different compression!';
        color = '#f44336';
    }

    feedbackEl.textContent = feedback + ` Quality: ${quality}%`;
    feedbackEl.style.color = color;
}

// Actions

function handleNewImage() {
    appState = startNewImage(appState);
    render();
}

function handleApply() {
    if (appState.noisyPattern.length === 0) {
        alert('Please generate a noisy image first!');
        return;
    }
    appState = applyDenoising(appState);
    render();
}

function handleReset() {
    appState = { ...INITIAL_STATE, bestScore: 0 }; // Full reset
    render();
}

function handleUpdateCompression() {
    const val = parseInt(compressionSlider.value);
    appState = setCompression(appState, val);
    render();
}

// Window Exports
(window as any).generateNoisyImage = handleNewImage;
(window as any).applyDenoising = handleApply;
(window as any).reset = handleReset;
(window as any).updateCompression = handleUpdateCompression;

// Init
render();
