
import {
    GameState, INITIAL_STATE,
    createLayer, addLayerToState, removeLayerFromState,
    calculateParameters, calculateTrainingStep, resetGame
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let trainingInterval: any = null;

// DOM Elements
const layerListEl = document.getElementById('layerList')!;
const layerCountEl = document.getElementById('layerCount')!;
const paramCountEl = document.getElementById('paramCount')!;
const trainingStatusEl = document.getElementById('trainingStatus')!;
const accuracyEl = document.getElementById('accuracy')!;
const scoreDisplayEl = document.getElementById('scoreDisplay')!;
const levelBadgeEl = document.getElementById('levelBadge')!;
const progressFillEl = document.getElementById('progressFill')!;
const trainingChartCanvas = document.getElementById('trainingChart') as HTMLCanvasElement;
const testImagesContainer = document.getElementById('testImages')!;

// Canvas Context
const ctx = trainingChartCanvas.getContext('2d')!;

function init() {
    // Expose global functions
    (window as any).addLayer = handleAddLayer;
    (window as any).removeLayer = handleRemoveLayer;
    (window as any).trainModel = handleTrainModel;
    (window as any).testModel = handleTestModel;
    (window as any).reset = handleReset;

    render();
}

function handleAddLayer(type: 'dense' | 'dropout', param: number) {
    if (appState.isTraining) return;
    const newLayer = createLayer(type, param);
    appState = addLayerToState(appState, newLayer);
    render();
}

function handleRemoveLayer(id: number) {
    if (appState.isTraining) return;
    appState = removeLayerFromState(appState, id);
    render();
}

function handleTrainModel() {
    if (appState.layers.length === 0) {
        alert('Add at least one hidden layer to your network!');
        return;
    }
    if (appState.isTraining) return;

    // Reset training state
    appState.isTraining = true;
    appState.isTrained = false;
    appState.currentEpoch = 0;
    appState.trainingHistory = [];
    appState.score = 0;

    render();

    if (trainingInterval) clearInterval(trainingInterval);

    trainingInterval = setInterval(() => {
        appState = calculateTrainingStep(appState);
        render();

        if (!appState.isTraining) {
            clearInterval(trainingInterval);
            finishTraining();
        }
    }, 100);
}

function finishTraining() {
    const finalAccuracy = appState.trainingHistory[appState.trainingHistory.length - 1];

    // Update badge (visual only, score is already in state)
    updateBadge(appState.score);

    alert(`Training complete! Final accuracy: ${finalAccuracy.toFixed(1)}%\nYour score: ${appState.score}`);
}

function updateBadge(score: number) {
    if (score >= 150) {
        levelBadgeEl.textContent = 'Expert 🏆';
        levelBadgeEl.style.background = '#FFD700';
        levelBadgeEl.style.color = '#000';
    } else if (score >= 110) {
        levelBadgeEl.textContent = 'Advanced 🌟';
        levelBadgeEl.style.background = '#9C27B0';
        levelBadgeEl.style.color = '#fff'; // reset color just in case
    } else if (score >= 90) {
        levelBadgeEl.textContent = 'Intermediate 📈';
        levelBadgeEl.style.background = '#2196F3';
        levelBadgeEl.style.color = '#fff';
    } else {
        levelBadgeEl.textContent = 'Beginner';
        levelBadgeEl.style.background = '#4CAF50';
        levelBadgeEl.style.color = '#fff';
    }
}

function handleTestModel() {
    if (!appState.isTrained) {
        alert('Please train your model first!');
        return;
    }

    const shapes = ['circle', 'square', 'triangle'];
    const finalAccuracy = appState.trainingHistory[appState.trainingHistory.length - 1] / 100;

    testImagesContainer.innerHTML = '';
    const testCount = 10;
    let correct = 0;

    for (let i = 0; i < testCount; i++) {
        const actualShape = shapes[Math.floor(Math.random() * shapes.length)];
        const isCorrect = Math.random() < finalAccuracy;
        const predictedShape = isCorrect ? actualShape : shapes[Math.floor(Math.random() * shapes.length)];

        if (isCorrect) correct++;

        const wrapper = document.createElement('div');
        wrapper.className = `test-image ${isCorrect ? 'correct' : 'incorrect'}`;

        const cvs = document.createElement('canvas');
        cvs.width = 100;
        cvs.height = 100;

        const label = document.createElement('div');
        label.className = 'prediction-label';
        label.textContent = `${isCorrect ? '✓' : '✗'} ${predictedShape}`;

        wrapper.appendChild(cvs);
        wrapper.appendChild(label);
        testImagesContainer.appendChild(wrapper);

        // Draw
        const tCtx = cvs.getContext('2d')!;
        tCtx.fillStyle = '#667eea';
        tCtx.strokeStyle = '#667eea';
        tCtx.lineWidth = 3;

        if (actualShape === 'circle') {
            tCtx.beginPath();
            tCtx.arc(50, 50, 30, 0, Math.PI * 2);
            tCtx.fill();
        } else if (actualShape === 'square') {
            tCtx.fillRect(20, 20, 60, 60);
        } else {
            tCtx.beginPath();
            tCtx.moveTo(50, 20);
            tCtx.lineTo(80, 70);
            tCtx.lineTo(20, 70);
            tCtx.closePath();
            tCtx.fill();
        }
    }

    alert(`Test Results: ${correct}/${testCount} correct (${(correct / testCount * 100).toFixed(0)}% accuracy)`);
}

function handleReset() {
    if (trainingInterval) clearInterval(trainingInterval);
    appState = resetGame();
    updateBadge(0);
    testImagesContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999;">Train your model first, then test it!</p>';
    render();
}

function render() {
    renderLayers();
    renderStats();
    drawTrainingChart();
}

function renderLayers() {
    let html = '<div class="layer-item"><span><strong>Input Layer</strong> (28×28 = 784 neurons)</span></div>';

    appState.layers.forEach(layer => {
        let layerText = '';
        if (layer.type === 'dense') {
            layerText = `<strong>Dense Layer</strong> (${layer.param} neurons)`;
        } else if (layer.type === 'dropout') {
            layerText = `<strong>Dropout Layer</strong> (${layer.param * 100}%)`;
        }

        html += `
            <div class="layer-item">
                <span>${layerText}</span>
                <button class="remove-btn" onclick="removeLayer(${layer.id})">Remove</button>
            </div>
        `;
    });

    html += '<div class="layer-item"><span><strong>Output Layer</strong> (3 classes: Circle, Square, Triangle)</span></div>';
    layerListEl.innerHTML = html;
}

function renderStats() {
    layerCountEl.textContent = (2 + appState.layers.length).toString();

    const params = calculateParameters(appState.layers);
    if (params > 1000000) {
        paramCountEl.textContent = (params / 1000000).toFixed(2) + 'M';
    } else if (params > 1000) {
        paramCountEl.textContent = (params / 1000).toFixed(1) + 'K';
    } else {
        paramCountEl.textContent = params.toString();
    }

    trainingStatusEl.textContent = appState.isTraining ? 'Training...' : (appState.isTrained ? 'Complete!' : 'Not Started');

    const currentAcc = appState.trainingHistory.length > 0
        ? appState.trainingHistory[appState.trainingHistory.length - 1].toFixed(1) + '%'
        : '0%';
    accuracyEl.textContent = currentAcc;
    scoreDisplayEl.textContent = appState.score.toString();

    // Progress bar
    const progress = (appState.currentEpoch / appState.totalEpochs) * 100;
    progressFillEl.style.width = progress + '%';
    progressFillEl.textContent = Math.round(progress) + '%';
}

function drawTrainingChart() {
    ctx.clearRect(0, 0, trainingChartCanvas.width, trainingChartCanvas.height);

    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 180);
    ctx.lineTo(850, 180); // X axis
    ctx.moveTo(50, 20);
    ctx.lineTo(50, 180);  // Y axis
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Epoch', 450, 198);
    ctx.save();
    ctx.translate(20, 100);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Accuracy (%)', 0, 0);
    ctx.restore();

    if (appState.trainingHistory.length === 0) return;

    // Draw line
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();

    appState.trainingHistory.forEach((acc, i) => {
        // Stick to original behavior of filling the width:
        // That creates a "growing" chart. Let's replicate that behavior.
        // Actually, if I want it to fill as we go, I should map x to totalEpochs if I want fixed scale, 
        // OR map to current length if I want responsive.
        // Original: `i / (trainingHistory.length - 1)` implies it always fills width.

        // Let's stick to original behavior:
        const len = appState.trainingHistory.length;
        const denominator = len > 1 ? len - 1 : 1;
        const xPos = 50 + (i / denominator) * 800;

        const y = 180 - ((acc / 100) * 160);

        if (i === 0) {
            ctx.moveTo(xPos, y);
        } else {
            ctx.lineTo(xPos, y);
        }
    });

    ctx.stroke();

    // Draw points
    appState.trainingHistory.forEach((acc, i) => {
        const len = appState.trainingHistory.length;
        const denominator = len > 1 ? len - 1 : 1;
        const x = 50 + (i / denominator) * 800;
        const y = 180 - ((acc / 100) * 160);

        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

init();
