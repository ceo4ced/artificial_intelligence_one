
import {
    AttentionState, INITIAL_STATE,
    updateSentence
} from './engine.js';

// 🏠 State
let appState: AttentionState = { ...INITIAL_STATE };
// Initial calc
appState = updateSentence(appState, appState.sentence);

// 🖥️ UI References
const attentionCanvas = document.getElementById('attentionCanvas') as HTMLCanvasElement;
const attentionCtx = attentionCanvas.getContext('2d')!;
const matrixCanvas = document.getElementById('matrixCanvas') as HTMLCanvasElement;
const matrixCtx = matrixCanvas.getContext('2d')!;
const wordDisplay = document.getElementById('wordDisplay')!;
const sentenceInput = document.getElementById('sentenceInput') as HTMLTextAreaElement;
const statusIndicator = document.getElementById('statusIndicator')!;

// 🎨 Rendering
function renderUI() {
    renderWordList();
    drawAttentionVisualization();
    drawAttentionMatrix();
}

function renderWordList() {
    wordDisplay.innerHTML = '';
    appState.words.forEach((word, index) => {
        const box = document.createElement('div');
        box.className = 'word-box';
        if (index === appState.selectedWordIndex) box.classList.add('selected');
        box.textContent = word;
        box.onclick = () => {
            appState.selectedWordIndex = index;
            renderUI();
        };
        wordDisplay.appendChild(box);
    });
}

function drawAttentionVisualization() {
    attentionCtx.clearRect(0, 0, attentionCanvas.width, attentionCanvas.height);
    const n = appState.words.length;
    if (n === 0) return;

    const spacing = Math.min(attentionCanvas.width / (n + 1), 100);
    const y1 = 100;
    const y2 = 300;

    // Draw lines (if word selected)
    if (appState.selectedWordIndex >= 0) {
        const sourceX = spacing * (appState.selectedWordIndex + 1);

        for (let j = 0; j < n; j++) {
            const targetX = spacing * (j + 1);
            const attention = appState.attentionMatrix[appState.selectedWordIndex][j];

            // Visuals
            const opacity = Math.min(1, attention * 2); // Boost visibility
            const lineWidth = 1 + attention * 8;
            const color = attention > 0.3 ? '#4CAF50' : attention > 0.15 ? '#ff9800' : '#2196F3';

            attentionCtx.strokeStyle = color;
            attentionCtx.globalAlpha = opacity;
            attentionCtx.lineWidth = lineWidth;

            attentionCtx.beginPath();
            attentionCtx.moveTo(sourceX, y1 + 30);
            const midY = (y1 + y2) / 2;
            attentionCtx.bezierCurveTo(sourceX, midY, targetX, midY, targetX, y2 - 30);
            attentionCtx.stroke();

            // Label
            if (attention > 0.1) {
                attentionCtx.globalAlpha = 1;
                attentionCtx.fillStyle = '#2d3748';
                attentionCtx.font = '11px Arial';
                attentionCtx.textAlign = 'center';
                const labelY = midY + (j % 2 === 0 ? -10 : 20);
                attentionCtx.fillText((attention * 100).toFixed(0) + '%', (sourceX + targetX) / 2, labelY);
            }
        }
        attentionCtx.globalAlpha = 1;
    }

    // Draw nodes
    for (let i = 0; i < n; i++) {
        const x = spacing * (i + 1);

        // Top (Query)
        drawCircle(attentionCtx, x, y1, appState.words[i], i === appState.selectedWordIndex ? '#ff9800' : '#667eea');

        // Bottom (Key)
        const isTarget = appState.selectedWordIndex >= 0 && appState.attentionMatrix[appState.selectedWordIndex][i] > 0.1;
        drawCircle(attentionCtx, x, y2, appState.words[i], isTarget ? '#4CAF50' : '#764ba2');
    }
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.substring(0, 4), x, y);
}

function drawAttentionMatrix() {
    matrixCtx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    const n = appState.words.length;
    if (n === 0) return;

    const cellSize = Math.min(50, (matrixCanvas.width - 100) / n);
    const startX = 80;
    const startY = 50;

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const val = appState.attentionMatrix[i][j];
            const x = startX + j * cellSize;
            const y = startY + i * cellSize;

            // Heatmap color
            const intensity = Math.floor(val * 255);
            matrixCtx.fillStyle = `rgb(${255 - intensity}, ${intensity + 100}, 100)`;
            matrixCtx.fillRect(x, y, cellSize, cellSize);
            matrixCtx.strokeRect(x, y, cellSize, cellSize);

            matrixCtx.fillStyle = '#000';
            matrixCtx.font = '10px Arial';
            matrixCtx.textAlign = 'center';
            matrixCtx.textBaseline = 'middle';
            matrixCtx.fillText((val * 100).toFixed(0), x + cellSize / 2, y + cellSize / 2);
        }

        // Row Label
        matrixCtx.fillStyle = '#000';
        matrixCtx.textAlign = 'right';
        matrixCtx.fillText(appState.words[i], startX - 10, startY + i * cellSize + cellSize / 2);
    }

    // Col Labels
    matrixCtx.textAlign = 'center';
    for (let j = 0; j < n; j++) {
        const x = startX + j * cellSize + cellSize / 2;
        matrixCtx.save();
        matrixCtx.translate(x, startY - 10);
        matrixCtx.rotate(-Math.PI / 4);
        matrixCtx.fillText(appState.words[j], 0, 0);
        matrixCtx.restore();
    }
}

// 🕹️ Interactions
(window as any).processSentence = () => {
    const text = sentenceInput.value;
    if (!text.trim()) return;
    appState = updateSentence(appState, text);
    statusIndicator.textContent = 'Click on a word to see attention!';
    statusIndicator.style.background = '#d4edda';
    renderUI();
};

(window as any).loadSample = (text: string) => {
    sentenceInput.value = text;
    (window as any).processSentence();
};

// Init
sentenceInput.value = appState.sentence;
renderUI();
