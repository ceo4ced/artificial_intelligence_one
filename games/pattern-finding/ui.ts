
import {
    Point, DatasetID, DATASETS, COLORS,
    generatePoints, computeKMeans, calculateSimilarityScore, Centroid
} from './engine.js';

// State
let k = 3;
let currentCluster = 0;
let dataPoints: Point[] = [];
let userAssignments: number[] = [];
let kmeansAssignments: number[] = [];
let kmeansCentroids: Centroid[] = [];
let currentDataset: DatasetID = 'customers';

// Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const userCanvas = document.getElementById('userCanvas') as HTMLCanvasElement;
const userCtx = userCanvas.getContext('2d')!;
const kmeansCanvas = document.getElementById('kmeansCanvas') as HTMLCanvasElement;
const kmeansCtx = kmeansCanvas.getContext('2d')!;

const datasetNameEl = document.getElementById('datasetName')!;
const pointCountEl = document.getElementById('pointCount')!;
const kValueEl = document.getElementById('kValue')!;
const clusteredCountEl = document.getElementById('clusteredCount')!;
const similarityEl = document.getElementById('similarity')!;
const colorSelectorEl = document.getElementById('colorSelector')!;
const legendEl = document.getElementById('legend')!;
const modeIndicatorEl = document.getElementById('modeIndicator')!;
const scoreValueEl = document.getElementById('scoreValue')!;
const scoreMessageEl = document.getElementById('scoreMessage')!;

// Init
function init() {
    generateData();
}

function handleSelectDataset(dataset: DatasetID) {
    currentDataset = dataset;
    document.querySelectorAll('.dataset-btn').forEach(btn => btn.classList.remove('active'));
    // Find button with specific text content or attribute - somewhat hacky in vanilla JS when `event` is passed vaguely.
    // We'll trust the button click sets the class logic in a real app, but here we can just rebuild UI.
    // Simulating DOM update for active class:
    const buttons = document.querySelectorAll('.dataset-btn');
    buttons.forEach(b => {
        if (b.textContent?.toLowerCase().includes(DATASETS[dataset].name.toLowerCase().split(' ')[0].toLowerCase())) {
            b.classList.add('active');
        }
    });

    k = DATASETS[dataset].clusters;
    handleSetK(k); // This calls generateData internally via flow if we want, but let's be explicit.
}

function handleSetK(newK: number) {
    k = newK;
    currentCluster = 0;
    kValueEl.textContent = k.toString();

    // Update active button visually
    document.querySelectorAll('.cluster-btn').forEach(btn => {
        if (btn.textContent === k.toString()) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });

    generateData();
}

function generateData() {
    dataPoints = generatePoints(k, canvas.width, canvas.height);
    userAssignments = new Array(dataPoints.length).fill(-1);
    kmeansAssignments = [];
    kmeansCentroids = [];

    datasetNameEl.textContent = DATASETS[currentDataset].name;
    pointCountEl.textContent = dataPoints.length.toString();

    updateColorSelector();
    updateLegend();
    updateClusteredCount();
    handleHideComparison(); // Reset view
    drawMainCanvas();
}

function updateColorSelector() {
    let html = '';
    for (let i = 0; i < k; i++) {
        html += `<button class="cluster-btn ${i === currentCluster ? 'selected' : ''}"
                 style="background: ${COLORS[i]}; color: #fff; border-color: ${COLORS[i]};"
                 onclick="window.selectCluster(${i})">
                 ${i + 1}
                 </button>`;
    }
    colorSelectorEl.innerHTML = html;
}

function handleSelectCluster(clusterIndex: number) {
    currentCluster = clusterIndex;
    updateColorSelector();
    modeIndicatorEl.textContent = `Assigning points to Cluster ${clusterIndex + 1} - Click points on the chart`;
}

function updateLegend() {
    const dataset = DATASETS[currentDataset];
    let html = `<div style="font-weight: 600; width: 100%; text-align: center; margin-bottom: 10px;">
             ${dataset.xLabel} (horizontal) vs ${dataset.yLabel} (vertical)
             </div>`;

    for (let i = 0; i < k; i++) {
        html += `<div class="legend-item">
                 <div class="legend-color" style="background: ${COLORS[i]};"></div>
                 <span>Cluster ${i + 1}</span>
                 </div>`;
    }
    legendEl.innerHTML = html;
}

function updateClusteredCount() {
    const clustered = userAssignments.filter(a => a >= 0).length;
    clusteredCountEl.textContent = `${clustered} / ${dataPoints.length}`;
}

function drawMainCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Points
    dataPoints.forEach((point, idx) => {
        const assignment = userAssignments[idx];
        if (assignment >= 0) {
            ctx.fillStyle = COLORS[assignment];
            ctx.globalAlpha = 0.8;
        } else {
            ctx.fillStyle = '#999';
            ctx.globalAlpha = 0.5;
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();

        if (assignment >= 0) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    ctx.globalAlpha = 1;

    // Axis Labels
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(DATASETS[currentDataset].xLabel, canvas.width / 2, canvas.height - 10);
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(DATASETS[currentDataset].yLabel, 0, 0);
    ctx.restore();
}

function handleCanvasClick(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let closestIdx = -1;
    let closestDist = 20; // Increased radius slightly for easier clicking

    dataPoints.forEach((point, idx) => {
        const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
        if (dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
        }
    });

    if (closestIdx >= 0) {
        userAssignments[closestIdx] = currentCluster;
        updateClusteredCount();
        drawMainCanvas();
    }
}

function handleCompareWithKMeans() {
    const clustered = userAssignments.filter(a => a >= 0).length;
    if (clustered < dataPoints.length) {
        alert(`Please cluster all points first! (${clustered}/${dataPoints.length} clustered)`);
        return;
    }

    const result = computeKMeans(dataPoints, k);
    kmeansAssignments = result.assignments;
    kmeansCentroids = result.centroids;

    showComparison();

    // Calculate Score
    const similarity = calculateSimilarityScore(userAssignments, kmeansAssignments);

    similarityEl.textContent = `${similarity}%`;
    scoreValueEl.textContent = `${similarity}%`;

    let message = '';
    if (similarity >= 90) message = 'Excellent! You matched K-means almost perfectly!';
    else if (similarity >= 80) message = 'Great job! Your clustering is very similar to K-means!';
    else if (similarity >= 70) message = 'Good work! Your clustering shows strong pattern recognition!';
    else if (similarity >= 60) message = 'Not bad! There are some differences in how you grouped the data.';
    else message = 'Your clustering differs significantly from K-means. Try to group nearby points!';

    scoreMessageEl.textContent = message;
}

function handleAutoCluster() {
    const result = computeKMeans(dataPoints, k);
    userAssignments = [...result.assignments];
    kmeansAssignments = result.assignments; // Keep tracked for comparison if needed

    updateClusteredCount();
    drawMainCanvas();
    modeIndicatorEl.textContent = 'K-Means solution loaded! Try comparing with your own clustering.';
}

function handleClearClustering() {
    userAssignments = new Array(dataPoints.length).fill(-1);
    updateClusteredCount();
    handleHideComparison();
    drawMainCanvas();
}

function handleHideComparison() {
    document.getElementById('singleView')!.style.display = 'block';
    document.getElementById('comparisonView')!.style.display = 'none';
    similarityEl.textContent = '--';
}

function showComparison() {
    document.getElementById('singleView')!.style.display = 'none';
    document.getElementById('comparisonView')!.style.display = 'block';

    drawComparisonCanvas(userCtx, userAssignments, null);
    drawComparisonCanvas(kmeansCtx, kmeansAssignments, kmeansCentroids);
}

function drawComparisonCanvas(context: CanvasRenderingContext2D, assignments: number[], centroids: Centroid[] | null) {
    const scaleX = context.canvas.width / canvas.width;
    const scaleY = context.canvas.height / canvas.height;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Grid
    context.strokeStyle = '#f0f0f0';
    context.lineWidth = 1;
    for (let i = 0; i < context.canvas.width; i += 50 * scaleX) {
        context.beginPath(); context.moveTo(i, 0); context.lineTo(i, context.canvas.height); context.stroke();
    }
    for (let i = 0; i < context.canvas.height; i += 50 * scaleY) {
        context.beginPath(); context.moveTo(0, i); context.lineTo(context.canvas.width, i); context.stroke();
    }

    // Points
    dataPoints.forEach((point, idx) => {
        const assignment = assignments[idx];
        context.fillStyle = assignment >= 0 ? COLORS[assignment] : '#999';
        context.globalAlpha = 0.8;

        context.beginPath();
        context.arc(point.x * scaleX, point.y * scaleY, 5, 0, Math.PI * 2);
        context.fill();

        if (assignment >= 0) {
            context.strokeStyle = '#fff';
            context.lineWidth = 1.5;
            context.stroke();
        }
    });

    // Centroids
    if (centroids) {
        centroids.forEach((centroid, i) => {
            context.fillStyle = COLORS[i];
            context.globalAlpha = 1;
            context.beginPath();
            context.arc(centroid.x * scaleX, centroid.y * scaleY, 8, 0, Math.PI * 2);
            context.fill();

            context.strokeStyle = '#fff';
            context.lineWidth = 3;
            context.stroke();
        });
    }

    context.globalAlpha = 1;
}

// Listeners
canvas.addEventListener('click', handleCanvasClick);

// Exports
(window as any).selectDataset = handleSelectDataset;
(window as any).setK = handleSetK;
(window as any).selectCluster = handleSelectCluster;
(window as any).compareWithKMeans = handleCompareWithKMeans;
(window as any).autoCluster = handleAutoCluster;
(window as any).clearClustering = handleClearClustering;
(window as any).newDataset = generateData;

// Start
init();
