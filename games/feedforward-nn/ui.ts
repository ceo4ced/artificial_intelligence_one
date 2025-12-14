
import {
    GameState, INITIAL_STATE, DATASET_CONFIG, DatasetType,
    generateData, predictClass, calculateSimulationResult, calculateTestScore
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };

// DOM Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const challengeTextEl = document.getElementById('challengeText')!;
const layer1Input = document.getElementById('layer1') as HTMLInputElement;
const layer2Input = document.getElementById('layer2') as HTMLInputElement;
const totalNeuronsEl = document.getElementById('totalNeurons')!;
const epochsEl = document.getElementById('epochs')!;
const trainAccEl = document.getElementById('trainAcc')!;
const testAccEl = document.getElementById('testAcc')!;
const scoreEl = document.getElementById('score')!;

function init() {
    (window as any).selectDataset = handleSelectDataset;
    (window as any).updateArchitecture = handleUpdateArchitecture;
    (window as any).trainNetwork = handleTrainNetwork;
    (window as any).testNetwork = handleTestNetwork;
    (window as any).reset = handleReset;

    handleSelectDataset('xor'); // Initial load
}

function handleSelectDataset(dataset: DatasetType) {
    appState.currentDataset = dataset;

    // UI Update
    document.querySelectorAll('.dataset-btn').forEach(btn => btn.classList.remove('active'));
    // Note: The click event handler in HTML passes the string. We need to find the button.
    // Ideally we pass event, but for simplicity we can just search for the button with the right text/onclick?
    // Or just re-render buttons.
    // Let's rely on text content matching roughly or add IDs.
    // Simplest: just iterate buttons and check their onclick attribute text? No.
    // Let's just assume the user finds the button visual feedback handled by this function if I could.
    // Actually, I can use the event object if passed or find based on property.
    // I will iterate and simple-match.
    const buttons = document.querySelectorAll('.dataset-btn');
    buttons.forEach(btn => {
        if (btn.textContent?.toLowerCase().includes(dataset)) {
            btn.classList.add('active');
        }
    });

    challengeTextEl.textContent = DATASET_CONFIG[dataset].description;

    const { training, test } = generateData(dataset);
    appState.trainingData = training;
    appState.testData = test;
    appState.trained = false;
    appState.epochs = 0;
    appState.trainAccuracy = 0;
    appState.testAccuracy = 0;

    renderStats();
    drawCanvas();
}

function handleUpdateArchitecture() {
    const l1 = parseInt(layer1Input.value) || 2;
    const l2 = parseInt(layer2Input.value) || 0;

    appState.architecture = [2, l1];
    if (l2 > 0) appState.architecture.push(l2);
    appState.architecture.push(2);

    const total = appState.architecture.reduce((a, b) => a + b, 0);
    totalNeuronsEl.textContent = total.toString();

    appState.trained = false;
    drawCanvas();
}

function handleTrainNetwork() {
    const result = calculateSimulationResult(appState.currentDataset, appState.architecture);

    appState.epochs = result.epochs;
    appState.trainAccuracy = result.accuracy;
    appState.trained = true;

    epochsEl.textContent = appState.epochs.toString();
    trainAccEl.textContent = appState.trainAccuracy.toFixed(1) + '%';

    drawDecisionBoundary();

    alert(`Training complete! Achieved ${appState.trainAccuracy.toFixed(1)}% accuracy after ${appState.epochs} epochs.`);
}

function handleTestNetwork() {
    if (!appState.trained) {
        alert('Please train the network first!');
        return;
    }

    const result = calculateTestScore(appState.currentDataset, appState.architecture, appState.trainAccuracy);

    appState.testAccuracy = result.testAccuracy;
    testAccEl.textContent = appState.testAccuracy.toFixed(1) + '%';

    if (result.success) {
        appState.score += result.scoreIncrement;
        scoreEl.textContent = appState.score.toString();
        alert(`🎉 Challenge Complete! Test accuracy: ${appState.testAccuracy.toFixed(1)}%\n+${result.scoreIncrement} points!`);
    } else {
        const target = DATASET_CONFIG[appState.currentDataset].target;
        alert(`Almost there! Need ${target}% but got ${appState.testAccuracy.toFixed(1)}%.\nTry adjusting your architecture!`);
    }
}

function handleReset() {
    appState.trained = false;
    appState.epochs = 0;
    appState.trainAccuracy = 0;
    appState.testAccuracy = 0;

    renderStats();

    const { training, test } = generateData(appState.currentDataset);
    appState.trainingData = training;
    appState.testData = test;

    drawCanvas();
}

function renderStats() {
    epochsEl.textContent = appState.epochs.toString();
    trainAccEl.textContent = appState.trainAccuracy ? appState.trainAccuracy.toFixed(1) + '%' : '0%';
    testAccEl.textContent = appState.testAccuracy ? appState.testAccuracy.toFixed(1) + '%' : '0%';
}

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        const x = i * canvas.width / 10;
        const y = i * canvas.height / 10;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw training data
    appState.trainingData.forEach(point => {
        const x = (point.x + 1) * canvas.width / 2;
        const y = (point.y + 1) * canvas.height / 2;

        ctx.fillStyle = point.label === 0 ? 'rgba(33, 150, 243, 0.7)' : 'rgba(244, 67, 54, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawDecisionBoundary() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x += 2) {
        for (let y = 0; y < canvas.height; y += 2) {
            const normX = (x / canvas.width) * 2 - 1;
            const normY = (y / canvas.height) * 2 - 1;

            const prediction = predictClass(appState.currentDataset, normX, normY);

            const color = prediction === 0 ? [33, 150, 243, 30] : [244, 67, 54, 30];

            for (let dx = 0; dx < 2; dx++) {
                for (let dy = 0; dy < 2; dy++) {
                    const px = x + dx;
                    const py = y + dy;
                    if (px >= canvas.width || py >= canvas.height) continue;

                    const index = (py * canvas.width + px) * 4;
                    imageData.data[index] = color[0];
                    imageData.data[index + 1] = color[1];
                    imageData.data[index + 2] = color[2];
                    imageData.data[index + 3] = color[3];
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    drawCanvas(); // Redraw points on top
}

// Initial stats update
handleUpdateArchitecture();

init();
