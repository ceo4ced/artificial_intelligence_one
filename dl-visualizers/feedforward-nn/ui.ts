
import {
    createNetwork, trainStep, forwardPass,
    NetworkState, NetworkConfig, TrainingSample
} from './engine.js';

// 🏠 State
let appState: NetworkState;
let trainingData: TrainingSample[] = [];
let isTraining = false;
let trainingInterval: number | null = null;
let isAnimating = false;
let animationFrame = 0;
let animationInterval: number | null = null;

// 🖥️ UI References
const canvasNetwork = document.getElementById('networkCanvas') as HTMLCanvasElement;
const ctxNetwork = canvasNetwork.getContext('2d')!;
const canvasLoss = document.getElementById('lossCanvas') as HTMLCanvasElement;
const ctxLoss = canvasLoss.getContext('2d')!;

// 📊 Initial Config
const initialConfig: NetworkConfig = {
    architecture: [2, 4, 3, 1],
    learningRate: 0.1,
    activationFunction: 'relu'
};

// 💾 Datasets
const DATASETS = {
    xor: [
        { input: [0, 0], target: [0] },
        { input: [0, 1], target: [1] },
        { input: [1, 0], target: [1] },
        { input: [1, 1], target: [0] }
    ],
    // Simplified generators for others to keep UI file clean(er)
    linear: Array(20).fill(0).map(() => {
        const x = Math.random();
        return { input: [x, x * 0.5], target: [x * 2 + 0.3] };
    }),
    classification: Array(30).fill(0).map(() => {
        const x1 = Math.random();
        const x2 = Math.random();
        return { input: [x1, x2], target: [(x1 + x2 > 1) ? 1 : 0] };
    }),
    regression: Array(25).fill(0).map(() => {
        const x = Math.random() * 2 - 1;
        const y = x * x + (Math.random() - 0.5) * 0.1;
        return { input: [x, 0.5], target: [y] };
    })
};

// ⚙️ Initialization
function init() {
    appState = createNetwork(initialConfig);
    loadDataset('xor');
    render();
    bindEvents();
}

function loadDataset(name: string) {
    if (Object.keys(DATASETS).includes(name)) {
        trainingData = DATASETS[name as keyof typeof DATASETS];
        updateStatus(`Loaded ${name} dataset`, 'info');
    }
}

// 🎮 Actions
function startTraining() {
    if (isTraining) return;
    isTraining = true;
    updateStatus('Training in progress...', 'success');

    trainingInterval = window.setInterval(() => {
        appState = trainStep(appState, trainingData);
        render(); // Efficient enough for 100ms interval
    }, 100);
}

function stopTraining() {
    isTraining = false;
    if (trainingInterval) clearInterval(trainingInterval);
    updateStatus('Training stopped', 'warning');
}

function reset() {
    stopTraining();
    appState = createNetwork(appState.config); // Keep current config (arch etc)
    appState = { ...appState, epoch: 0, lossHistory: [] }; // Explicit reset of history
    render();
    updateStatus('Network reset', 'info');
}

// 🎨 Render Logic (Network Visualization)
function drawNetwork(state: NetworkState) {
    ctxNetwork.clearRect(0, 0, canvasNetwork.width, canvasNetwork.height);
    const { architecture } = state.config;
    const numLayers = architecture.length;
    const startX = 100;
    const layerSpacing = (canvasNetwork.width - 200) / (numLayers - 1);

    // Calc Positions
    const positions: { x: number, y: number }[][] = [];
    for (let l = 0; l < numLayers; l++) {
        const layerSize = architecture[l];
        const x = startX + l * layerSpacing;
        const spacing = Math.min(50, (canvasNetwork.height - 100) / (layerSize + 1));
        const totalHeight = spacing * layerSize;
        const startY = (canvasNetwork.height - totalHeight) / 2;

        positions[l] = [];
        for (let n = 0; n < layerSize; n++) {
            positions[l].push({ x, y: startY + spacing * (n + 0.5) });
        }
    }

    // Draw Connections
    for (let l = 0; l < numLayers - 1; l++) {
        for (let i = 0; i < architecture[l]; i++) {
            for (let j = 0; j < architecture[l + 1]; j++) {
                const from = positions[l][i];
                const to = positions[l + 1][j];
                const weight = state.weights[l][i][j];

                ctxNetwork.strokeStyle = weight > 0 ? `rgba(76, 175, 80, 0.3)` : `rgba(244, 67, 54, 0.3)`;
                ctxNetwork.lineWidth = Math.min(Math.abs(weight) * 2, 5) || 1;

                ctxNetwork.beginPath();
                ctxNetwork.moveTo(from.x, from.y);
                ctxNetwork.lineTo(to.x, to.y);
                ctxNetwork.stroke();
            }
        }
    }

    // Draw Neurons
    for (let l = 0; l < numLayers; l++) {
        for (let n = 0; n < architecture[l]; n++) {
            const pos = positions[l][n];
            const activation = state.lastActivations[l] ? state.lastActivations[l][n] : 0;

            // Visual flair based on activation
            const intensity = Math.min(1, Math.abs(activation));
            const r = activation > 0 ? Math.floor(76 + intensity * 100) : 200;
            const g = activation > 0 ? Math.floor(175 + intensity * 50) : 200;
            const b = activation > 0 ? 80 : 200;

            ctxNetwork.fillStyle = `rgb(${r},${g},${b})`;
            ctxNetwork.beginPath();
            ctxNetwork.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
            ctxNetwork.fill();
            ctxNetwork.stroke();
        }
    }
}

function drawLossChart(history: number[]) {
    ctxLoss.clearRect(0, 0, canvasLoss.width, canvasLoss.height);
    if (history.length < 2) return;

    // Background
    ctxLoss.fillStyle = '#fafafa';
    ctxLoss.fillRect(0, 0, canvasLoss.width, canvasLoss.height);

    const max = Math.max(...history, 1);
    const min = Math.min(...history);
    const w = canvasLoss.width - 20;
    const h = canvasLoss.height - 20;

    ctxLoss.strokeStyle = '#4CAF50';
    ctxLoss.lineWidth = 2;
    ctxLoss.beginPath();

    history.forEach((val, idx) => {
        const x = 10 + (idx / history.length) * w;
        const norm = (val - min) / (max - min || 1);
        const y = 10 + h - (norm * h);
        if (idx === 0) ctxLoss.moveTo(x, y);
        else ctxLoss.lineTo(x, y);
    });
    ctxLoss.stroke();
}

function render() {
    drawNetwork(appState);
    drawLossChart(appState.lossHistory);
    updateStatsUI();
}

function updateStatsUI() {
    const epochEl = document.getElementById('epochStat');
    const lossEl = document.getElementById('lossStat');
    if (epochEl) epochEl.textContent = appState.epoch.toString();
    if (lossEl) {
        const lastLoss = appState.lossHistory[appState.lossHistory.length - 1] || 0;
        lossEl.textContent = lastLoss.toFixed(4);
    }

    // Arch display
    const archDisplay = document.getElementById('archDisplay');
    if (archDisplay) archDisplay.textContent = JSON.stringify(appState.config.architecture);
}

function updateStatus(msg: string, type: string) {
    const el = document.getElementById('statusIndicator');
    if (!el) return;
    el.textContent = msg;
    // Simplified styling logic
    el.style.color = type === 'success' ? 'green' : type === 'warning' ? 'orange' : 'blue';
    setTimeout(() => el.textContent = 'Ready', 3000);
}

// 🔌 Bindings
function bindEvents() {
    // Buttons (using global delegation or direct ID binding if IDs are generic)
    // For this pilot, assuming specific IDs exist from original HTML
    document.querySelector('button[onclick="startTraining()"]')?.addEventListener('click', (e) => {
        e.preventDefault(); startTraining();
    });
    document.querySelector('button[onclick="stopTraining()"]')?.addEventListener('click', (e) => {
        e.preventDefault(); stopTraining();
    });
    document.querySelector('button[onclick="resetNetwork()"]')?.addEventListener('click', (e) => {
        e.preventDefault(); reset();
    });

    // Dataset Select
    document.getElementById('datasetSelect')?.addEventListener('change', (e) => {
        const val = (e.target as HTMLSelectElement).value;
        loadDataset(val);
    });

    // Architecture Buttons - Harder to wire without changing HTML onclick attributes
    // In a real app we'd querySelectorAll and bind.
    // For Pilot: We must attach to window because old HTML uses onclick="func()"
    (window as any).startTraining = startTraining;
    (window as any).stopTraining = stopTraining;
    (window as any).resetNetwork = reset;
    (window as any).loadDataset = () => loadDataset((document.getElementById('datasetSelect') as HTMLSelectElement).value);

    // Architecture Modification is tricky because it mutates config.
    // We didn't implement Mutable Config in Engine yet (CreateNetwork takes it).
    // Let's implement basic layer mod helpers in UI that create NEW network.
    (window as any).addLayer = () => {
        if (appState.config.architecture.length >= 5) return;
        const newArch = [...appState.config.architecture];
        newArch.splice(newArch.length - 1, 0, 3);
        appState = createNetwork({ ...appState.config, architecture: newArch });
        render();
    };
    (window as any).removeLayer = () => {
        if (appState.config.architecture.length <= 3) return;
        const newArch = [...appState.config.architecture];
        newArch.splice(newArch.length - 2, 1);
        appState = createNetwork({ ...appState.config, architecture: newArch });
        render();
    };

    (window as any).animateForward = animateForward; // Expose to window
}

function animateForward() {
    if (isAnimating || !trainingData.length) return;

    // Use first sample
    const sample = trainingData[0];
    // Run forward pass just to populate activations for viz, but 'forwardPass' is pure.
    // We need to UPDATE appState with result activations if we want drawNetwork to see them.
    // But 'forwardPass' returns number[][].
    const acts = forwardPass(appState, sample.input);
    appState = { ...appState, lastActivations: acts };

    isAnimating = true;
    animationFrame = 0;
    updateStatus('Forward propagation animation...', 'success');

    if (animationInterval) clearInterval(animationInterval);
    animationInterval = window.setInterval(() => {
        animationFrame += 3;
        render(); // drawNetwork handles animationFrame visualization logic if we port it

        if (animationFrame >= 100) {
            animationFrame = 0;
            if (animationInterval) clearInterval(animationInterval);
            isAnimating = false;
            updateStatus('Animation complete', 'info');
            render();
        }
    }, 50);
}

// Start
init();
